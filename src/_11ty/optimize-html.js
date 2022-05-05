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

    let cssMain = require("fs").readFileSync("src/assets/css/main.css", { encoding: "utf-8" });
    let cssTailwind = require("fs").readFileSync("src/assets/css/tailwind.css", { encoding: "utf-8" });

    const processMain = postcss([
        atImport,
        purgecss({
            content: [{ raw: content, extension: "html" }],
            css: [{ raw: cssMain }],
          }),
        autoprefixer,
        cssnano({ preset: "default" })
    ]).process(cssMain, { from: "src/assets/css/main.css" });

    //Process Tailwind separately to avoid PurgeCSS issues
    const processTailwind = postcss([
        tailwindcss({
            // Shallow copy config, merging 11ty raw content.
            // https://tailwindcss.com/docs/content-configuration#configuring-raw-content
            ...tailwindConfig,
            content: [{ raw: content, extension: "html" }] }),
        autoprefixer,
        cssnano({ preset: "default" })
    ]).process(cssTailwind, { from: "src/assets/css/tailwind.css" });;

    await Promise.all([processMain, processTailwind]).then((values) => {
        const css = values.map(value => value.css).join('');
        content = content.replace("</head>", `<style>${css}</style></head>`); // Add inline style
    })

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
