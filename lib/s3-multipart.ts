import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

const DEFAULT_PART_SIZE = 8 * 1024 * 1024;
const MAX_MULTIPART_PARTS = 10_000;

export interface MultipartUploadTarget {
  readonly bucket: string;
  readonly key: string;
  readonly contentType: string;
}

interface S3MultipartClient {
  send(command: CreateMultipartUploadCommand): Promise<unknown>;
  send(command: UploadPartCommand): Promise<unknown>;
  send(command: CompleteMultipartUploadCommand): Promise<unknown>;
  send(command: AbortMultipartUploadCommand): Promise<unknown>;
}

export async function uploadStreamMultipart(
  client: S3MultipartClient,
  target: MultipartUploadTarget,
  body: Readable,
  partSize = DEFAULT_PART_SIZE
) {
  const created = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: target.bucket,
      Key: target.key,
      ContentType: target.contentType,
    })
  );
  const uploadId = uploadIdFrom(created);
  if (!uploadId) {
    throw new Error("Multipart upload did not return an upload id");
  }

  const parts: CompletedPart[] = [];

  try {
    let pending = Buffer.alloc(0);
    for await (const chunk of body) {
      pending = Buffer.concat([
        pending,
        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
      ]);

      while (pending.byteLength >= partSize) {
        const part = pending.subarray(0, partSize);
        pending = pending.subarray(partSize);
        parts.push(await uploadPart(client, target, uploadId, parts.length + 1, part));
      }
    }

    if (pending.byteLength > 0 || parts.length === 0) {
      parts.push(await uploadPart(client, target, uploadId, parts.length + 1, pending));
    }

    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: target.bucket,
        Key: target.key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
    );
  } catch (error) {
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: target.bucket,
        Key: target.key,
        UploadId: uploadId,
      })
    );
    throw error;
  }
}

async function uploadPart(
  client: S3MultipartClient,
  target: MultipartUploadTarget,
  uploadId: string,
  partNumber: number,
  body: Buffer
) {
  if (partNumber > MAX_MULTIPART_PARTS) {
    throw new Error("Multipart upload has too many parts");
  }

  const result = await client.send(
    new UploadPartCommand({
      Bucket: target.bucket,
      Key: target.key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
      ContentLength: body.byteLength,
    })
  );
  const eTag = eTagFrom(result);
  if (!eTag) {
    throw new Error("Multipart upload part did not return an ETag");
  }

  return {
    ETag: eTag,
    PartNumber: partNumber,
  };
}

function uploadIdFrom(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "UploadId" in value &&
    typeof value.UploadId === "string"
  ) {
    return value.UploadId;
  }

  return undefined;
}

function eTagFrom(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "ETag" in value &&
    typeof value.ETag === "string"
  ) {
    return value.ETag;
  }

  return undefined;
}
