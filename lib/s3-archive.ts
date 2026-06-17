import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { decryptSecret } from "@/lib/crypto";
import type { OssProfile } from "@/lib/types";
import { uploadStreamMultipart } from "@/lib/s3-multipart";
import { createStoredZipStream, sanitizeZipEntryName } from "@/lib/zip";

interface SigningProfile {
  readonly endpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly forcePathStyle: boolean;
  readonly accessKeyId: string;
  readonly encryptedSecretAccessKey: string;
  readonly encryptedSessionToken: string | null;
}

function createNodeClient(profile: SigningProfile) {
  const secretAccessKey = decryptSecret(profile.encryptedSecretAccessKey);
  if (!secretAccessKey) {
    throw new Error("OSS profile secret is unavailable");
  }

  const sessionToken = decryptSecret(profile.encryptedSessionToken);

  return new S3Client({
    region: profile.region,
    endpoint: profile.endpoint,
    forcePathStyle: profile.forcePathStyle,
    credentials: {
      accessKeyId: profile.accessKeyId,
      secretAccessKey,
      sessionToken,
    },
  });
}

export async function createArchiveObject(
  profile: OssProfile,
  archiveKey: string,
  objectKeys: readonly string[]
) {
  const client = createNodeClient(profile);
  const zip = createStoredZipStream(
    objectKeys.map((objectKey) => ({
      name: sanitizeZipEntryName(objectKey),
      body: async () => getObjectBody(client, profile.bucket, objectKey),
    }))
  );

  await uploadStreamMultipart(
    client,
    {
      bucket: profile.bucket,
      key: archiveKey,
      contentType: "application/zip",
    },
    zip
  );
}

async function getObjectBody(
  client: S3Client,
  bucket: string,
  key: string
): Promise<Readable> {
  const result = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
  if (!result.Body) {
    throw new Error(`Object body is empty: ${key}`);
  }

  if (isReadable(result.Body)) {
    return result.Body;
  }

  throw new Error(`Object body is not a Node stream: ${key}`);
}

function isReadable(value: unknown): value is Readable {
  return value instanceof Readable;
}
