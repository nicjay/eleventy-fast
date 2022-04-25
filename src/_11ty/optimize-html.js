const minify = require("html-minifier").minify;
const postcss = require("postcss");
const purgecss = require("@fullhuman/postcss-purgecss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const tailwindcss = require("tailwindcss");
const atImport = require("postcss-import");
const tailwindConfig = require("../../tailwind.config.js");

/**
 * Purges/minifies/inlines CSS.
 * Minifies HTML
 */

const optimizeCss = async (rawContent, outputPath) => {
  let content = rawContent;
  if (outputPath && outputPath.endsWith(".html") && !/data-style-override/.test(content)) {
    let css = require("fs").readFileSync("src/assets/css/main.css", { encoding: "utf-8" });

    const processor = postcss([
          atImport,
          tailwindcss({
            // Shallow copy config, merging 11ty raw content.
            // https://tailwindcss.com/docs/content-configuration#configuring-raw-content
            ...tailwindConfig,
            content: [{ raw: content, extension: "html" }] }),
          // purgecss({
          //   content: [{ raw: content, extension: "html" }],
          //   css: [{ raw: css }],
          //   safelist: [/^prose/, /^hover/, /^dark/] // Play nice with Tailwind typography and dark mode, but kind of hacky
          // }),
          autoprefixer,
          cssnano({ preset: "default" })
        ]);

    await processor
      .process(css, { from: "src/assets/css/main.css" })
      .then((processed) => {
        content = content.replace("</head>", `<style>${processed.css}</style></head>`); // Add inline style
    });
  }

  return content;
};

const minifyHtml = (rawContent, outputPath) => {
  let content = rawContent;
  if (outputPath && outputPath.endsWith(".html")) {
    content = minify(content, {
      removeAttributeQuotes: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      removeComments: true,
      sortClassName: true,
      sortAttributes: true,
      html5: true,
      decodeEntities: true,
      removeOptionalTags: true,
    });
  }
  return content;
};

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("optimizeCss", optimizeCss);
    eleventyConfig.addTransform("minifyHtml", minifyHtml);
  },
};
