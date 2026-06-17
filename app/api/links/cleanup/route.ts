import { NextResponse } from "next/server";
import { HttpError, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteObject } from "@/lib/s3";
import { mapProfile, withTransaction } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await withTransaction(async (client) => {
      const rows = await client.query(
        `SELECT id, archive_object_key, archive_deleted_at, oss_profile_id
         FROM download_links
         WHERE owner_sub = $1
           AND deleted_at IS NULL
           AND (
             valid_until <= now()
             OR (max_downloads IS NOT NULL AND downloads_served >= max_downloads)
           )
         FOR UPDATE`,
        [user.id]
      );

      for (const row of rows.rows) {
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
      }

      const deletion = await client.query(
        `UPDATE download_links
         SET deleted_at = COALESCE(deleted_at, now())
         WHERE owner_sub = $1
           AND deleted_at IS NULL
           AND (
             valid_until <= now()
             OR (max_downloads IS NOT NULL AND downloads_served >= max_downloads)
           )`,
        [user.id]
      );

      return deletion;
    });

    return NextResponse.json({ deletedCount: result.rowCount ?? 0 });
  } catch (error) {
    return jsonError(error);
  }
}
