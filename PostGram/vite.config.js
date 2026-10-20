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
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            state: ["@reduxjs/toolkit", "react-redux"],
            motion: ["framer-motion"],
            appwrite: ["appwrite"],
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
