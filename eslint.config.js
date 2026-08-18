import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Genererade filer formateras om av verktygskedjan – lintas inte.
    ignores: ["dist", ".output", ".vinxi", "src/routes/mcp.ts", "src/routes/[.mcp]/**", "src/routes/[.well-known]/**"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // shadcn/ui, Remotion-scener och kompatibilitetslager exporterar med flit
    // både komponenter och varianter/hjälpare – Fast Refresh-regeln gäller inte här.
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/compat/**/*.{ts,tsx}",
      "remotion/**/*.{ts,tsx}",
      "src/components/myflove/motion.tsx",
      "src/components/flow-item-actions.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  eslintPluginPrettier,
);
