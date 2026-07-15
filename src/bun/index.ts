import { bootstrapApplication } from "../application/bootstrap";
import { WindowsApplicationPaths } from "../infrastructure/platform/windows/windows-application-paths";
import { WindowsBoundedFileSystem } from "../infrastructure/platform/windows/windows-bounded-file-system";

const runtime = await bootstrapApplication(
  new WindowsApplicationPaths(),
  new WindowsBoundedFileSystem(),
);

// TG-007 owns the production window/UI contract. The foundation entrypoint only
// proves composition, application-data initialization, and clean persistence shutdown.
runtime.dispose();

