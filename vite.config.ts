// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import path from "path";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    // mcpPlugin() crashes on Windows due to path separator handling (\ vs /),
    // so it's disabled there while remaining active for Linux/macOS collaborators.
    plugins: [...(process.platform !== "win32" ? [mcpPlugin()] : [])],
    // Unikt id per build – används för cache-busting av gamla bundles/service workers.
    define: {
      __MYFLOVE_BUILD_ID__: JSON.stringify(Date.now().toString(36)),
    },
    resolve: {
      alias: {
        wouter: path.resolve(__dirname, "src/compat/wouter.tsx"),
        "@clerk/react/internal": path.resolve(__dirname, "src/compat/clerk.tsx"),
        "@clerk/react": path.resolve(__dirname, "src/compat/clerk.tsx"),
        "@clerk/themes": path.resolve(__dirname, "src/compat/clerk-themes.ts"),
        "@workspace/api-client-react": path.resolve(__dirname, "src/compat/api-client.ts"),
      },
    },
  },
});
