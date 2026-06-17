import { NextResponse } from "next/server";
import { HttpError, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mapLink, mapProfile, query, withTransaction } from "@/lib/db";
import { publicLink } from "@/lib/serializers";
import { deleteObject } from "@/lib/s3";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const result = await query(
      `SELECT l.*, p.disabled_at AS profile_disabled_at
       FROM download_links l
       JOIN oss_profiles p ON p.id = l.oss_profile_id
       WHERE l.id = $1 AND l.owner_sub = $2 AND l.deleted_at IS NULL`,
      [id, user.id]
    );
    if (result.rowCount === 0) {
      throw new HttpError(404, "Download link not found");
    }

    return NextResponse.json({
      link: publicLink(mapLink(result.rows[0]), result.rows[0].profile_disabled_at),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    await withTransaction(async (client) => {
      const rowResult = await client.query(
        `SELECT id, archive_object_key, archive_deleted_at, oss_profile_id
         FROM download_links
         WHERE id = $1 AND owner_sub = $2 AND deleted_at IS NULL
         FOR UPDATE`,
        [id, user.id]
      );
      if (rowResult.rowCount === 0) {
        throw new HttpError(404, "Download link not found");
      }

      const row = rowResult.rows[0];
      if (row.archive_object_key && !row.archive_deleted_at) {
        const profileResult = await client.query(
          "SELECT * FROM oss_profiles WHERE id = $1 AND owner_sub = $2",
          [row.oss_profile_id, user.id]
        );
        if (profileResult.rowCount === 0) {
          throw new HttpError(404, "OSS profile not found");
        }
        await deleteObject(mapProfile(profileResult.rows[0]), row.archive_object_key);
        await client.query(
          "UPDATE download_links SET archive_deleted_at = now() WHERE id = $1",
          [row.id]
        );
      }

      await client.query(
        "UPDATE download_links SET deleted_at = COALESCE(deleted_at, now()) WHERE id = $1",
        [row.id]
      );
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
