import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/** eslint-config-next v16 ships flat configs directly — no FlatCompat bridge needed. */
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default eslintConfig;
