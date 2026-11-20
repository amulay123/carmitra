import { defineConfig } from "vitest/config"

const emulatorEnv = {
  FIREBASE_PROJECT_ID: "demo-carmitra",
  PUBLIC_URL: "https://carmitra.test",
  WEB_ORIGINS: "https://carmitra.test",
}

export default defineConfig({
  test: {
    projects: [
      { test: { name: "shared", root: "shared", include: ["src/**/*.test.ts"] } },
      { test: { name: "web", root: "web", include: ["src/**/*.test.ts"] } },
      {
        test: {
          name: "api",
          root: "api",
          include: ["test/**/*.test.ts"],
          env: emulatorEnv,
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
      {
        test: {
          name: "rules",
          root: "firebase",
          include: ["test/**/*.test.ts"],
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
    ],
  },
})
