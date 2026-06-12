import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    strictPort: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      // WebLLM weight downloads 302-redirect from huggingface.co to its Xet CDN,
      // and that cross-origin redirect fails the browser CORS check. Routing through
      // this same-origin proxy (which follows the redirect server-side) avoids it.
      "/hf": {
        target: "https://huggingface.co",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/hf/, ""),
      },
    },
  },
});
