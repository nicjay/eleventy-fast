import { terser } from "rollup-plugin-terser";

export default {
  input: "main.js",
  output: [
    {
      file: "js/min.js",
      format: "iife",
      sourcemap: true,
      plugins: [terser()],
    },
  ],
};
