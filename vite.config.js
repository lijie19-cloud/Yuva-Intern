import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Keep the framework in a stable, cacheable file while Vite continues to
  // split the lazily loaded application screens into route chunks.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/node_modules\/(react|react-dom|scheduler|react-router|@remix-run)\//.test(id)) {
              return "framework";
            }
          }
        },
      },
    },
  },
  test: { environment: "jsdom", setupFiles: "./src/testSetup.js" },
});
