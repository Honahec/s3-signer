import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { crc32 } from "node:zlib";

interface ZipEntryInput {
  readonly name: string;
  readonly body: () => Promise<Readable>;
}

interface CentralDirectoryEntry {
  readonly name: Buffer;
  readonly crc: number;
  readonly size: number;
  readonly offset: number;
}

const ZIP_VERSION = 20;
const GENERAL_PURPOSE_DATA_DESCRIPTOR = 0x08;
const METHOD_STORE = 0;
const UNIX_FILE_MODE = (0o100644 << 16) >>> 0;
const DOS_DATE = 0x0021;
const DOS_TIME = 0;
const ZIP32_MAX = 0xffffffff;
const ZIP32_MAX_ENTRIES = 0xffff;

export function sanitizeZipEntryName(name: string) {
  const cleaned = name
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");

  return cleaned || `object-${randomUUID()}`;
}

export function createStoredZipStream(entries: readonly ZipEntryInput[]) {
  if (entries.length > ZIP32_MAX_ENTRIES) {
    throw new Error("ZIP archive has too many entries");
  }

  return Readable.from(writeZip(entries));
}

async function* writeZip(entries: readonly ZipEntryInput[]) {
  const centralDirectory: CentralDirectoryEntry[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(sanitizeZipEntryName(entry.name), "utf8");
    const header = localHeader(name);
    yield header;
    offset += header.length;

    const entryOffset = offset - header.length;
    let crc = 0;
    let size = 0;
    const body = await entry.body();
    for await (const chunk of body) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      crc = crc32(buffer, crc);
      size += buffer.byteLength;
      if (size > ZIP32_MAX) {
        throw new Error("ZIP entry is too large");
      }
      offset += buffer.byteLength;
      yield buffer;
    }

    const descriptor = dataDescriptor(crc, size);
    yield descriptor;
    offset += descriptor.length;
    centralDirectory.push({ name, crc, size, offset: entryOffset });
  }

  const directoryStart = offset;
  for (const entry of centralDirectory) {
    const directoryEntry = centralHeader(entry);
    yield directoryEntry;
    offset += directoryEntry.length;
  }

  yield endOfCentralDirectory(
    centralDirectory.length,
    checkedZip32(offset - directoryStart),
    checkedZip32(directoryStart)
  );
}

function localHeader(name: Buffer) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(ZIP_VERSION, 4);
  header.writeUInt16LE(GENERAL_PURPOSE_DATA_DESCRIPTOR, 6);
  header.writeUInt16LE(METHOD_STORE, 8);
  header.writeUInt16LE(DOS_TIME, 10);
  header.writeUInt16LE(DOS_DATE, 12);
  header.writeUInt16LE(name.length, 26);
  return Buffer.concat([header, name]);
}

function dataDescriptor(crc: number, size: number) {
  const descriptor = Buffer.alloc(16);
  descriptor.writeUInt32LE(0x08074b50, 0);
  descriptor.writeUInt32LE(crc, 4);
  descriptor.writeUInt32LE(size, 8);
  descriptor.writeUInt32LE(size, 12);
  return descriptor;
}

function centralHeader(entry: CentralDirectoryEntry) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(ZIP_VERSION, 4);
  header.writeUInt16LE(ZIP_VERSION, 6);
  header.writeUInt16LE(GENERAL_PURPOSE_DATA_DESCRIPTOR, 8);
  header.writeUInt16LE(METHOD_STORE, 10);
  header.writeUInt16LE(DOS_TIME, 12);
  header.writeUInt16LE(DOS_DATE, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.size, 20);
  header.writeUInt32LE(entry.size, 24);
  header.writeUInt16LE(entry.name.length, 28);
  header.writeUInt32LE(UNIX_FILE_MODE, 38);
  header.writeUInt32LE(checkedZip32(entry.offset), 42);
  return Buffer.concat([header, entry.name]);
}

function endOfCentralDirectory(count: number, directorySize: number, directoryStart: number) {
  const header = Buffer.alloc(22);
  header.writeUInt32LE(0x06054b50, 0);
  header.writeUInt16LE(count, 8);
  header.writeUInt16LE(count, 10);
  header.writeUInt32LE(directorySize, 12);
  header.writeUInt32LE(directoryStart, 16);
  return header;
}

function checkedZip32(value: number) {
  if (value > ZIP32_MAX) {
    throw new Error("ZIP archive is too large");
  }

  return value;
}
