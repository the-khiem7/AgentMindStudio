import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "AgentMindStudio TG001 Probe",
		identifier: "studio.agentmind.tg001-probe",
		version: "0.0.0",
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
