import { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

const launcher = resolve("build/dev-win-x64/AgentMindStudio-dev/bin/launcher.exe");
if (!existsSync(launcher)) {
  throw new Error("Packaged launcher is missing; run `bun run build` first");
}

const root = join(tmpdir(), `AgentMindStudio packaged ${randomUUID()} kiểm chứng`);
mkdirSync(root, { recursive: false });
const databasePath = join(root, "AgentMindStudio", "metadata.sqlite");

function cleanup(): void {
  const resolvedTemp = resolve(tmpdir());
  const resolvedRoot = resolve(root);
  const relation = relative(resolvedTemp, resolvedRoot);
  if (!relation || relation === ".." || relation.startsWith(`..${sep}`) || isAbsolute(relation)) {
    throw new Error("Refusing to remove an unverified packaged-test path");
  }
  rmSync(resolvedRoot, { recursive: true, force: true });
}

const child = Bun.spawn({
  cmd: [launcher],
  cwd: resolve("build/dev-win-x64/AgentMindStudio-dev"),
  env: { ...process.env, LOCALAPPDATA: root },
  stdin: "ignore",
  stdout: "ignore",
  stderr: "ignore",
  windowsHide: true,
});

try {
  const deadline = Date.now() + 15_000;
  while (!existsSync(databasePath) && Date.now() < deadline) {
    await Bun.sleep(100);
  }
  if (!existsSync(databasePath)) {
    throw new Error("Packaged application did not initialize the metadata database before timeout");
  }

  const database = new Database(databasePath, { readonly: true, strict: true });
  const migration = database.query("SELECT version, name FROM schema_migrations").get();
  database.close();
  if (JSON.stringify(migration) !== JSON.stringify({ version: 1, name: "metadata" })) {
    throw new Error(`Unexpected packaged migration state: ${JSON.stringify(migration)}`);
  }

  process.stdout.write(`${JSON.stringify({ status: "pass", migration, launcher }, null, 2)}\n`);
} finally {
  const exit = await Promise.race([
    child.exited.then((code) => ({ exited: true, code })),
    Bun.sleep(1_000).then(() => ({ exited: false, code: null })),
  ]);
  if (!exit.exited) {
    Bun.spawnSync({
      cmd: ["taskkill.exe", "/PID", String(child.pid), "/T", "/F"],
      stdin: "ignore",
      stdout: "ignore",
      stderr: "ignore",
      windowsHide: true,
    });
  }
  cleanup();
}

