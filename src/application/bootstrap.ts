import type { ApplicationPathsPort } from "./ports/application-paths";
import type { BoundedFileSystemPort } from "./ports/file-system";
import { closeMetadataDatabase, openMetadataDatabase } from "../infrastructure/persistence/sqlite/metadata-database";

export type ApplicationRuntime = Readonly<{
  dispose(): void;
}>;

export async function bootstrapApplication(
  pathsPort: ApplicationPathsPort,
  fileSystem: BoundedFileSystemPort,
): Promise<ApplicationRuntime> {
  const paths = pathsPort.resolve();
  await fileSystem.ensureDirectory(paths.dataRoot);
  await fileSystem.ensureDirectory(paths.snapshotRoot);
  const database = openMetadataDatabase(paths.metadataDatabase);

  return {
    dispose: () => closeMetadataDatabase(database),
  };
}

