import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { uploadStreamMultipart } from "@/lib/s3-multipart";

interface SentCommand {
  readonly name: string;
  readonly input: unknown;
}

class FakeS3Client {
  readonly sent: SentCommand[] = [];
  failUploadPart = false;

  async send(command: object) {
    const name = command.constructor.name;
    const input = "input" in command ? command.input : {};
    this.sent.push({ name, input });

    if (command instanceof CreateMultipartUploadCommand) {
      return { UploadId: "upload-id" };
    }

    if (command instanceof UploadPartCommand) {
      if (this.failUploadPart) {
        throw new Error("upload failed");
      }
      const partNumber = partNumberFromInput(input);
      return { ETag: `"etag-${partNumber}"` };
    }

    if (command instanceof CompleteMultipartUploadCommand) {
      return {};
    }

    if (command instanceof AbortMultipartUploadCommand) {
      return {};
    }

    throw new Error(`Unexpected command: ${name}`);
  }
}

describe("s3 multipart upload", () => {
  it("uploads stream chunks as ordered multipart parts", async () => {
    const client = new FakeS3Client();

    await uploadStreamMultipart(
      client,
      {
        bucket: "bucket",
        key: "archive.zip",
        contentType: "application/zip",
      },
      Readable.from([Buffer.from("ab"), Buffer.from("cdef"), Buffer.from("g")]),
      3
    );

    expect(client.sent.map((item) => item.name)).toEqual([
      "CreateMultipartUploadCommand",
      "UploadPartCommand",
      "UploadPartCommand",
      "UploadPartCommand",
      "CompleteMultipartUploadCommand",
    ]);
    expect(uploadBody(client.sent[1]?.input)).toBe("abc");
    expect(uploadBody(client.sent[2]?.input)).toBe("def");
    expect(uploadBody(client.sent[3]?.input)).toBe("g");
  });

  it("aborts multipart uploads when a part upload fails", async () => {
    const client = new FakeS3Client();
    client.failUploadPart = true;

    await expect(
      uploadStreamMultipart(
        client,
        {
          bucket: "bucket",
          key: "archive.zip",
          contentType: "application/zip",
        },
        Readable.from([Buffer.from("abc")]),
        3
      )
    ).rejects.toThrow("upload failed");

    expect(client.sent.map((item) => item.name)).toEqual([
      "CreateMultipartUploadCommand",
      "UploadPartCommand",
      "AbortMultipartUploadCommand",
    ]);
  });
});

function partNumberFromInput(input: unknown) {
  if (
    typeof input === "object" &&
    input !== null &&
    "PartNumber" in input &&
    typeof input.PartNumber === "number"
  ) {
    return input.PartNumber;
  }

  throw new Error("Upload part input is missing PartNumber");
}

function uploadBody(input: unknown) {
  if (
    typeof input === "object" &&
    input !== null &&
    "Body" in input &&
    Buffer.isBuffer(input.Body)
  ) {
    return input.Body.toString("utf8");
  }

  throw new Error("Upload part input is missing Body");
}
