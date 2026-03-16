import { createWriteStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import type { Readable } from "node:stream";

/** Allowed file extensions for 3D/model uploads (per data-model validation rules). */
export const ALLOWED_EXTENSIONS = new Set([
  "stl",
  "obj",
  "3mf",
  "amf",
  "ply",
  "wrl",
  "vrml",
  "glb",
  "gltf",
  "usd",
  "usdz",
  "usda",
  "usdc",
  "zip"
]);

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const DEFAULT_UPLOAD_DIR = "storage/uploads";

function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR ?? DEFAULT_UPLOAD_DIR;
  return path.resolve(process.cwd(), dir);
}

function getMaxBytes(): number {
  const raw = process.env.MAX_UPLOAD_BYTES;
  if (raw == null) return DEFAULT_MAX_BYTES;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n <= 0 ? DEFAULT_MAX_BYTES : n;
}

/**
 * Thrown when upload validation fails (extension, MIME, size, or path safety).
 */
export class UploadValidationError extends Error {
  constructor(
    message: string,
    public readonly code: "EXTENSION" | "MIME" | "SIZE" | "PATH"
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

/**
 * Returns the file extension from a filename (lowercase, no leading dot).
 * Rejects empty or invalid (e.g. multiple dots only take last).
 */
export function getExtension(filename: string): string {
  const base = path.basename(filename);
  const ext = path.extname(base).toLowerCase();
  return ext.startsWith(".") ? ext.slice(1) : ext;
}

/**
 * Validate that the filename has an allowed extension and no path traversal.
 * Use only the basename so that ".." or absolute paths are rejected.
 */
export function validateFilename(filename: string): { ext: string } {
  const base = path.basename(filename);
  if (base !== filename) {
    throw new UploadValidationError(
      "Filename must not contain path segments",
      "PATH"
    );
  }
  const ext = getExtension(base);
  if (!ext) {
    throw new UploadValidationError(
      "File must have an extension",
      "EXTENSION"
    );
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new UploadValidationError(
      `Extension .${ext} is not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`,
      "EXTENSION"
    );
  }
  return { ext };
}

/**
 * Validate content size (e.g. from Content-Length or stream).
 */
export function validateSize(bytes: number): void {
  const max = getMaxBytes();
  if (bytes > max) {
    throw new UploadValidationError(
      `File size ${bytes} exceeds maximum ${max} bytes`,
      "SIZE"
    );
  }
}

/**
 * Produce a safe storage key for a file: no path traversal, unique, extension preserved.
 * Returned key is suitable for storing in DB (e.g. Model.fileKey) and for resolving to disk path later.
 */
export function createStorageKey(originalFilename: string): string {
  const { ext } = validateFilename(originalFilename);
  return `${randomUUID()}.${ext}`;
}

/**
 * Resolve a storage key to an absolute file path under the upload directory.
 * Throws if key contains path traversal or invalid characters.
 */
export function resolveStoragePath(fileKey: string): string {
  const base = path.basename(fileKey);
  if (base !== fileKey || fileKey.includes("..")) {
    throw new UploadValidationError(
      "Invalid file key: path traversal not allowed",
      "PATH"
    );
  }
  const uploadDir = getUploadDir();
  const resolved = path.resolve(uploadDir, base);
  if (!resolved.startsWith(path.resolve(uploadDir))) {
    throw new UploadValidationError(
      "Invalid file key: resolved path outside upload directory",
      "PATH"
    );
  }
  return resolved;
}

/**
 * Ensure the upload directory exists (and its parents).
 */
export async function ensureUploadDir(): Promise<string> {
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

export interface SaveUploadResult {
  /** Storage key to store in DB (e.g. Model.fileKey). */
  fileKey: string;
  /** Absolute path on disk (for local storage). */
  absolutePath: string;
  /** Bytes written. */
  bytesWritten: number;
}

/**
 * Save an upload stream to disk with validation (extension, size), path safety, and no path traversal.
 * Uses a UUID-based filename with the original extension.
 */
export async function saveUpload(
  stream: Readable,
  originalFilename: string,
  contentLength?: number
): Promise<SaveUploadResult> {
  const fileKey = createStorageKey(originalFilename);
  const uploadDir = await ensureUploadDir();
  const absolutePath = path.resolve(uploadDir, fileKey);

  if (contentLength != null) {
    validateSize(contentLength);
  }

  return new Promise((resolve, reject) => {
    const out = createWriteStream(absolutePath);
    let bytesWritten = 0;

    stream.on("data", (chunk: Buffer) => {
      bytesWritten += chunk.length;
      const max = getMaxBytes();
      if (bytesWritten > max) {
        stream.destroy();
        out.destroy();
        reject(
          new UploadValidationError(
            `Stream size exceeds maximum ${max} bytes`,
            "SIZE"
          )
        );
      }
    });

    stream.pipe(out);
    out.on("finish", () => {
      if (contentLength != null && bytesWritten !== contentLength) {
        reject(
          new UploadValidationError(
            `Size mismatch: expected ${contentLength}, got ${bytesWritten}`,
            "SIZE"
          )
        );
      }
      resolve({ fileKey, absolutePath, bytesWritten });
    });
    out.on("error", reject);
    stream.on("error", reject);
  });
}
