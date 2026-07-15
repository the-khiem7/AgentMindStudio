export type ApplicationPaths = Readonly<{
  dataRoot: string;
  metadataDatabase: string;
  snapshotRoot: string;
}>;

export interface ApplicationPathsPort {
  resolve(): ApplicationPaths;
}

