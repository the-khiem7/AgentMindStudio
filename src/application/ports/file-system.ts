export interface BoundedFileSystemPort {
  ensureDirectory(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readText(root: string, relativePath: string, maxBytes: number): Promise<string>;
  resolveWithin(root: string, relativePath: string): string;
}

