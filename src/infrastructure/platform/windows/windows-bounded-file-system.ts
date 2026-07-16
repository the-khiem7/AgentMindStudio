import { mkdir, open, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { BoundedFileSystemPort } from "../../../application/ports/file-system";

const MAX_TEXT_READ_BYTES = 16 * 1024 * 1024;

export class WindowsBoundedFileSystem implements BoundedFileSystemPort {
  public async ensureDirectory(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  public async exists(path: string): Promise<boolean> {
    return Bun.file(path).exists();
  }

  public resolveWithin(root: string, relativePath: string): string {
    const resolvedRoot = resolve(root);
    const candidate = resolve(resolvedRoot, relativePath);
    this.assertWithin(resolvedRoot, candidate, "Path escapes its declared root");
    return candidate;
  }

  private assertWithin(root: string, candidate: string, message: string): void {
    const relation = relative(root, candidate);
    if (relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
      throw new Error(message);
    }
  }

  private async resolveExistingWithin(root: string, candidate: string): Promise<string> {
    const [resolvedRoot, resolvedCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
    this.assertWithin(resolvedRoot, resolvedCandidate, "Resolved path escapes its declared root");
    return resolvedCandidate;
  }

  public async readText(root: string, relativePath: string, maxBytes: number): Promise<string> {
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || maxBytes > MAX_TEXT_READ_BYTES) {
      throw new Error(`Read limit must be between 1 and ${MAX_TEXT_READ_BYTES} bytes`);
    }
    const candidate = this.resolveWithin(root, relativePath);
    const handle = await open(await this.resolveExistingWithin(root, candidate), "r");
    try {
      const buffer = Buffer.allocUnsafe(maxBytes + 1);
      let totalBytesRead = 0;
      while (totalBytesRead < buffer.byteLength) {
        const { bytesRead } = await handle.read(
          buffer,
          totalBytesRead,
          buffer.byteLength - totalBytesRead,
          totalBytesRead,
        );
        if (bytesRead === 0) break;
        totalBytesRead += bytesRead;
      }
      if (totalBytesRead > maxBytes) throw new Error("File exceeds the configured byte limit");
      return new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, totalBytesRead));
    } finally {
      await handle.close();
    }
  }
}

