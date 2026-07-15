import { join, resolve } from "node:path";
import type { ApplicationPaths, ApplicationPathsPort } from "../../../application/ports/application-paths";

export class WindowsApplicationPaths implements ApplicationPathsPort {
  public constructor(private readonly environment: Readonly<Record<string, string | undefined>> = process.env) {}

  public resolve(): ApplicationPaths {
    const localAppData = this.environment.LOCALAPPDATA;
    if (!localAppData) {
      throw new Error("LOCALAPPDATA is required to resolve AgentMindStudio application storage");
    }

    const dataRoot = resolve(localAppData, "AgentMindStudio");
    return {
      dataRoot,
      metadataDatabase: join(dataRoot, "metadata.sqlite"),
      snapshotRoot: join(dataRoot, "snapshots"),
    };
  }
}

