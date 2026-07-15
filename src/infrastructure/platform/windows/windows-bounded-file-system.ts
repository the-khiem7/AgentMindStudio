import { mkdir, readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { BoundedFileSystemPort } from "../../../application/ports/file-system";

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
    const relation = relative(resolvedRoot, candidate);
    if (relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
      throw new Error("Path escapes its declared root");
    }
    return candidate;
  }

  public async readText(root: string, relativePath: string): Promise<string> {
    return readFile(this.resolveWithin(root, relativePath), "utf8");
  }
}

