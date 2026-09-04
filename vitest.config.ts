/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Fristående testkonfiguration (påverkar inte appens vite.config.ts).
 * Speglar projektets alias så komponenttester kan importera som appen gör.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      wouter: path.resolve(__dirname, "src/compat/wouter.tsx"),
      "@clerk/react/internal": path.resolve(__dirname, "src/compat/clerk.tsx"),
      "@clerk/react": path.resolve(__dirname, "src/compat/clerk.tsx"),
      "@clerk/themes": path.resolve(__dirname, "src/compat/clerk-themes.ts"),
      "@workspace/api-client-react": path.resolve(__dirname, "src/compat/api-client.ts"),
    },
  },
  define: {
    __MYFLOVE_BUILD_ID__: JSON.stringify("test"),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    // Komponenttester med fake timers blir flakiga på 5 s när hela sviten
    // körs parallellt – de passerar i isolering. Ger dem mer marginal.
    testTimeout: 20000,
  },
});
