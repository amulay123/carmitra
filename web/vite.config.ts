import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    // Firebase is one large library shared by every page, so it gets its own cached file.
    chunkSizeWarningLimit: 700,
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: "firebase", test: /node_modules[\\/]@?firebase/ }] } } },
  },
})
