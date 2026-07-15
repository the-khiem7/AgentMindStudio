import { randomUUID } from "node:crypto";
import {
	closeSync,
	existsSync,
	fsyncSync,
	mkdirSync,
	openSync,
	readFileSync,
	renameSync,
	rmSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { Database } from "bun:sqlite";

type CheckResult = {
	name: string;
	status: "pass" | "fail";
	durationMs: number;
	details?: Record<string, unknown>;
	error?: string;
};

type ProbeResult = {
	status: "pass" | "fail";
	mode: string;
	timestamp: string;
	runtime: {
		platform: NodeJS.Platform;
		arch: string;
		bun: string;
		electrobun: string;
		sqlite: string | null;
	};
	checks: CheckResult[];
};

const ELECTROBUN_VERSION = "1.18.1";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function resolveUnderRoot(root: string, ...segments: string[]): string {
	const resolvedRoot = resolve(root);
	const candidate = resolve(resolvedRoot, ...segments);
	const rel = relative(resolvedRoot, candidate);
	if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
		throw new Error(`Path escapes declared root: ${candidate}`);
	}
	return candidate;
}

function safeRemoveTempRoot(root: string): void {
	const resolvedTemp = resolve(tmpdir());
	const resolvedRoot = resolve(root);
	const rel = relative(resolvedTemp, resolvedRoot);
	if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
		throw new Error(`Refusing recursive cleanup outside a verified temp child: ${resolvedRoot}`);
	}
	rmSync(resolvedRoot, { recursive: true, force: true });
}

async function runCheck(
	name: string,
	check: () => Promise<Record<string, unknown>> | Record<string, unknown>,
): Promise<CheckResult> {
	const started = performance.now();
	try {
		const details = await check();
		return {
			name,
			status: "pass",
			durationMs: Math.round(performance.now() - started),
			details,
		};
	} catch (error) {
		return {
			name,
			status: "fail",
			durationMs: Math.round(performance.now() - started),
			error: errorMessage(error),
		};
	}
}

async function checkFilesystem(): Promise<Record<string, unknown>> {
	const root = join(tmpdir(), `AgentMindStudio TG001 ${randomUUID()} kiểm chứng`);
	mkdirSync(root, { recursive: false });

	try {
		const nested = resolveUnderRoot(root, "thư mục có khoảng trắng", "dữ liệu.txt");
		mkdirSync(resolveUnderRoot(root, "thư mục có khoảng trắng"));
		writeFileSync(nested, "nội dung kiểm chứng", "utf8");
		assert(readFileSync(nested, "utf8") === "nội dung kiểm chứng", "Unicode file round-trip failed");

		let traversalRejected = false;
		try {
			resolveUnderRoot(root, "..", "outside.txt");
		} catch {
			traversalRejected = true;
		}
		assert(traversalRejected, "Traversal outside the declared root was not rejected");

		const target = resolveUnderRoot(root, "atomic target.txt");
		const temporary = resolveUnderRoot(root, ".atomic target.tmp");
		writeFileSync(target, "old", "utf8");
		const temporaryFd = openSync(temporary, "wx");
		try {
			writeFileSync(temporaryFd, "new", "utf8");
			fsyncSync(temporaryFd);
		} finally {
			closeSync(temporaryFd);
		}
		renameSync(temporary, target);
		assert(readFileSync(target, "utf8") === "new", "Atomic replacement did not expose the new content");
		assert(!existsSync(temporary), "Atomic replacement left its temporary file behind");

		const lockPath = resolveUnderRoot(root, "exclusive.lock");
		const firstLock = openSync(lockPath, "wx");
		let secondLockError = "";
		try {
			openSync(lockPath, "wx");
		} catch (error) {
			secondLockError = errorMessage(error);
		} finally {
			closeSync(firstLock);
		}
		assert(secondLockError.includes("EEXIST"), `Expected EEXIST for lock contention, got: ${secondLockError}`);
		unlinkSync(lockPath);
		const reacquiredLock = openSync(lockPath, "wx");
		closeSync(reacquiredLock);
		unlinkSync(lockPath);

		safeRemoveTempRoot(root);
		assert(!existsSync(root), "Verified temp root still exists after cleanup");
		return {
			unicodeAndSpaces: true,
			boundedTraversalRejected: true,
			atomicReplacement: true,
			lockContentionError: "EEXIST",
			cleanup: true,
		};
	} finally {
		if (existsSync(root)) safeRemoveTempRoot(root);
	}
}

function sanitizedChildEnvironment(): Record<string, string> {
	const env: Record<string, string> = {
		AMS_ALLOWED: "visible",
	};
	for (const key of ["PATH", "SystemRoot", "WINDIR", "TEMP", "TMP", "ComSpec", "PATHEXT"]) {
		const value = process.env[key];
		if (value) env[key] = value;
	}
	return env;
}

async function readProcessOutput(process: Bun.Subprocess<"ignore", "pipe", "pipe">) {
	const [exitCode, stdout, stderr] = await Promise.all([
		process.exited,
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
	]);
	return { exitCode, stdout, stderr };
}

async function checkProcesses(): Promise<Record<string, unknown>> {
	process.env.AMS_SECRET_SENTINEL = "must-not-leak";
	const childProgram = [
		"console.log(JSON.stringify({argv: process.argv, allowed: process.env.AMS_ALLOWED ?? null, secret: process.env.AMS_SECRET_SENTINEL ?? null}));",
		"console.error('stderr-marker');",
		"process.exit(7);",
	].join("");
	const child = Bun.spawn({
		cmd: [process.execPath, "--eval", childProgram, "value with spaces", "kiểm chứng"],
		cwd: tmpdir(),
		env: sanitizedChildEnvironment(),
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
		windowsHide: true,
	});
	const normal = await readProcessOutput(child);
	assert(normal.exitCode === 7, `Expected child exit code 7, got ${normal.exitCode}`);
	assert(normal.stderr.trim() === "stderr-marker", `stderr was not captured separately: ${normal.stderr}`);
	const childPayload = JSON.parse(normal.stdout.trim()) as {
		argv: string[];
		allowed: string | null;
		secret: string | null;
	};
	assert(childPayload.argv.includes("value with spaces"), "Argument containing spaces was not preserved");
	assert(childPayload.argv.includes("kiểm chứng"), "Unicode argument was not preserved");
	assert(childPayload.allowed === "visible", "Allowlisted environment value was not passed");
	assert(childPayload.secret === null, "Non-allowlisted environment value leaked to the child");

	const timeoutStarted = performance.now();
	const timed = Bun.spawn({
		cmd: [process.execPath, "--eval", "await Bun.sleep(10000)"],
		timeout: 250,
		killSignal: "SIGKILL",
		stdin: "ignore",
		stdout: "ignore",
		stderr: "ignore",
		windowsHide: true,
	});
	const timeoutExit = await timed.exited;
	const timeoutMs = Math.round(performance.now() - timeoutStarted);
	assert(timeoutMs < 5_000, `Timed child exceeded the guard: ${timeoutMs}ms`);
	assert(timeoutExit !== 0, `Timed child unexpectedly returned success: ${timeoutExit}`);

	const controller = new AbortController();
	const cancelStarted = performance.now();
	const cancellable = Bun.spawn({
		cmd: [process.execPath, "--eval", "await Bun.sleep(10000)"],
		signal: controller.signal,
		killSignal: "SIGKILL",
		stdin: "ignore",
		stdout: "ignore",
		stderr: "ignore",
		windowsHide: true,
	});
	setTimeout(() => controller.abort(), 250);
	const cancelExit = await cancellable.exited;
	const cancelMs = Math.round(performance.now() - cancelStarted);
	assert(cancelMs < 5_000, `Cancelled child exceeded the guard: ${cancelMs}ms`);
	assert(cancelExit !== 0, `Cancelled child unexpectedly returned success: ${cancelExit}`);

	return {
		argumentArrayPreserved: true,
		separateStdoutStderr: true,
		exitCode: normal.exitCode,
		sanitizedEnvironment: true,
		timeout: { exitCode: timeoutExit, durationMs: timeoutMs },
		cancellation: { exitCode: cancelExit, durationMs: cancelMs },
	};
}

function checkSqlite(): Record<string, unknown> {
	const root = join(tmpdir(), `AgentMindStudio TG001 SQLite ${randomUUID()} kiểm chứng`);
	mkdirSync(root, { recursive: false });
	const databasePath = resolveUnderRoot(root, "metadata có khoảng trắng.sqlite");
	const malformedPath = resolveUnderRoot(root, "malformed.sqlite");
	let sqliteVersion = "";

	try {
		const database = new Database(databasePath, { create: true, strict: true });
		sqliteVersion = (database.query("select sqlite_version() as version").get() as { version: string }).version;
		database.run("CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY NOT NULL)");
		database.run("INSERT INTO schema_migrations(version) VALUES (1)");
		database.run("CREATE TABLE assets (id INTEGER PRIMARY KEY, name TEXT NOT NULL)");

		const rolledBack = database.transaction(() => {
			database.run("INSERT INTO assets(name) VALUES (?)", ["must roll back"]);
			throw new Error("intentional rollback");
		});
		let rollbackObserved = false;
		try {
			rolledBack();
		} catch (error) {
			rollbackObserved = errorMessage(error).includes("intentional rollback");
		}
		assert(rollbackObserved, "Intentional transaction failure was not reported");
		const beforeClose = database.query("SELECT count(*) AS count FROM assets").get() as { count: number };
		assert(Number(beforeClose.count) === 0, "Transaction did not roll back its inserted row");
		database.close();

		const reopened = new Database(databasePath, { readonly: true, strict: true });
		const migration = reopened.query("SELECT version FROM schema_migrations").get() as { version: number };
		const afterReopen = reopened.query("SELECT count(*) AS count FROM assets").get() as { count: number };
		assert(Number(migration.version) === 1, "Migration state was not durable after reopen");
		assert(Number(afterReopen.count) === 0, "Rolled-back row appeared after reopen");
		reopened.close();

		writeFileSync(malformedPath, "not a sqlite database", "utf8");
		let malformedError = "";
		let malformed: Database | undefined;
		try {
			malformed = new Database(malformedPath, { readonly: true, strict: true });
			malformed.query("PRAGMA schema_version").get();
		} catch (error) {
			malformedError = errorMessage(error);
		} finally {
			malformed?.close(false);
		}
		assert(malformedError.length > 0, "Malformed SQLite file was accepted without an error");

		safeRemoveTempRoot(root);
		assert(!existsSync(root), "SQLite temp root still exists after cleanup");
		return {
			sqliteVersion,
			migration: true,
			transactionRollback: true,
			closeAndReopen: true,
			malformedDatabaseRejected: true,
			cleanup: true,
		};
	} finally {
		if (existsSync(root)) safeRemoveTempRoot(root);
	}
}

async function checkElevation(): Promise<Record<string, unknown>> {
	const powershell = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
	const command = "$p=[Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent();[Console]::Write($p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))";
	const child = Bun.spawn({
		cmd: [powershell, "-NoProfile", "-NonInteractive", "-Command", command],
		env: sanitizedChildEnvironment(),
		stdin: "ignore",
		stdout: "pipe",
		stderr: "pipe",
		windowsHide: true,
	});
	const output = await readProcessOutput(child);
	assert(output.exitCode === 0, `Elevation probe failed: ${output.stderr}`);
	const elevated = output.stdout.trim().toLowerCase() === "true";
	assert(!elevated, "Probe is elevated; this run cannot prove the no-elevation condition");
	return { elevated: false };
}

async function main(): Promise<void> {
	let sqliteVersion: string | null = null;
	try {
		const runtimeDatabase = new Database(":memory:");
		sqliteVersion = (runtimeDatabase.query("select sqlite_version() as version").get() as { version: string }).version;
		runtimeDatabase.close();
	} catch {
		// The SQLite check below records the actionable failure.
	}

	const checks = [
		await runCheck("bounded filesystem, atomic replace, lock, cleanup", checkFilesystem),
		await runCheck("argument-array process execution, timeout, cancellation, sanitized environment", checkProcesses),
		await runCheck("SQLite migration, rollback, reopen, and failure behavior", checkSqlite),
		await runCheck("non-elevated execution", checkElevation),
	];
	const result: ProbeResult = {
		status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
		mode: process.env.AMS_TG001_MODE ?? "unspecified",
		timestamp: new Date().toISOString(),
		runtime: {
			platform: process.platform,
			arch: process.arch,
			bun: Bun.version,
			electrobun: ELECTROBUN_VERSION,
			sqlite: sqliteVersion,
		},
		checks,
	};

	const serialized = `${JSON.stringify(result, null, 2)}\n`;
	const outputPath = process.env.AMS_TG001_OUTPUT;
	if (outputPath) {
		writeFileSync(outputPath, serialized, "utf8");
	} else {
		process.stdout.write(serialized);
	}
	// ElectroBun's launcher supervises the bundled Bun process. This headless
	// probe has no application window to close, so terminate explicitly after
	// the synchronous result write instead of relying on an empty event loop.
	process.exit(result.status === "pass" ? 0 : 1);
}

await main();
