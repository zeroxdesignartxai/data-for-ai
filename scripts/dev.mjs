import { spawn } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  spawn(npmCmd, ["run", "dev", "--workspace", "apps/desktop"], {
    stdio: "inherit"
  }),
  spawn(npmCmd, ["run", "dev", "--workspace", "services/local-ai"], {
    stdio: "inherit"
  })
];

const shutdown = (code = 0) => {
  for (const proc of processes) {
    if (!proc.killed) {
      proc.kill();
    }
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

for (const proc of processes) {
  proc.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });
}
