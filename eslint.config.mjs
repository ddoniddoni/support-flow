import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "JSXOpeningElement[name.name='select']",
        message: "기본 <select> 대신 @/components/ui/app-select의 AppSelect를 사용하세요. 폼은 Controller로 연결하세요.",
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
