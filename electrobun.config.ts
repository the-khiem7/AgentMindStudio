import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "AgentMindStudio",
    identifier: "studio.agentmind.desktop",
    version: "0.1.0",
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    win: {
      bundleCEF: false,
    },
  },
} satisfies ElectrobunConfig;

