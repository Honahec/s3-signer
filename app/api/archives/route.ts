import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { HttpError, jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mapLink, mapProfile, query } from "@/lib/db";
import { toJsonbParam } from "@/lib/db-json";
import { buildDownloadUrl } from "@/lib/env";
import { publicLink } from "@/lib/serializers";
import { createArchiveObject } from "@/lib/s3-archive";
import { deleteObject } from "@/lib/s3";
import { createArchiveSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const payload = createArchiveSchema.parse(await request.json());
    const profileResult = await query(
      "SELECT * FROM oss_profiles WHERE id = $1 AND owner_sub = $2 AND disabled_at IS NULL",
      [payload.profileId, user.id]
    );
    if (profileResult.rowCount === 0) {
      throw new HttpError(404, "OSS profile not found");
    }

    const profile = mapProfile(profileResult.rows[0]);
    const linkId = randomUUID();
    const archiveKey = `s3-signer-archives/${user.id}/${linkId}.zip`;
    const downloadFilename = payload.downloadFilename ?? `${linkId}.zip`;

    await createArchiveObject(profile, archiveKey, payload.objectKeys);

    try {
      const validUntil =
        payload.validForSeconds === null
          ? null
          : new Date(Date.now() + payload.validForSeconds * 1000);
      const result = await query(
        `INSERT INTO download_links (
          id, owner_sub, oss_profile_id, profile_snapshot, object_key,
          source_object_keys, archive_object_key, valid_until, max_downloads,
          download_filename
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          linkId,
          user.id,
          profile.id,
          toJsonbParam({
            name: profile.name,
            endpoint: profile.endpoint,
            region: profile.region,
            bucket: profile.bucket,
            forcePathStyle: profile.forcePathStyle,
          }),
          archiveKey,
          toJsonbParam(payload.objectKeys),
          archiveKey,
          validUntil,
          payload.maxDownloads ?? null,
          downloadFilename,
        ]
      );
      const link = mapLink(result.rows[0]);

      return NextResponse.json(
        { link: publicLink(link), url: buildDownloadUrl(link.id) },
        { status: 201 }
      );
    } catch (error) {
      await deleteObject(profile, archiveKey);
      throw error;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError(new HttpError(400, "Invalid JSON"));
    }
    return jsonError(error);
  }
}
