import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const production = mode === "production";

  return {
    plugins: [react(), tailwindcss()],
    build: {
      sourcemap: false,
      target: "es2020",
      cssCodeSplit: true,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;

            if (id.includes("appwrite")) return "appwrite";
            if (
              id.includes("framer-motion") ||
              id.includes("motion-dom") ||
              id.includes("motion-utils")
            ) {
              return "motion";
            }
            if (
              id.includes("@reduxjs") ||
              id.includes("react-redux") ||
              id.includes("redux")
            ) {
              return "state";
            }
            if (
              id.includes("react-router") ||
              id.includes("react-dom") ||
              id.includes("node_modules/react/")
            ) {
              return "react";
            }

            return "vendor";
          },
        },
      },
    },
    esbuild: production ? { drop: ["console", "debugger"] } : undefined,
    server: {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
    preview: {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  };
});
