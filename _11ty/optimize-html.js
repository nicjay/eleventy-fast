/**
 * Copyright (c) 2020 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const minify = require("html-minifier").minify;
const AmpOptimizer = require("@ampproject/toolbox-optimizer");
const ampOptimizer = AmpOptimizer.create({
  blurredPlaceholders: true,
  imageBasePath: "./_site/",
  //verbose: true,
});

const postcss = require("postcss");
const purgecss = require("@fullhuman/postcss-purgecss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const tailwindcss = require("tailwindcss");
const tailwindConfig = require("../tailwind.config.js");

/**
 * Inlines the CSS.
 * Makes font display display-optional
 * Minifies and optimizes the JS
 * Optimizes HTML
 * Optimizes AMP
 */

const optimizeCss = async (rawContent, outputPath) => {
  let content = rawContent;
  if (outputPath && outputPath.endsWith(".html") && !isAmp(content) && !/data-style-override/.test(content)) {
    let css = require("fs").readFileSync("css/main.css", { encoding: "utf-8" });
    css = css.replace(/@font-face {/g, "@font-face {font-display:optional;");

    /**
     * Shallow copy Tailwind's config, merging 11ty raw content
     * See: https://tailwindcss.com/docs/content-configuration#configuring-raw-content
     * TODO: Consider adding PurgeCSS plugin - has bugs with Tailwind and purge ignore comments not working...
     */
    const postcssPlugins = [
      tailwindcss({ ...tailwindConfig, content: [{ raw: content, extension: "html" }] }),
      autoprefixer,
      cssnano({ preset: "default" }), //Minify CSS
    ];

    await postcss(postcssPlugins)
      .process(css, { from: "css/main.css" })
      .then((processed) => {
        content = content.replace("</head>", `<style>${processed.css}</style></head>`); //Add inline style
      });
  }

  return content;
};

const minifyHtml = (rawContent, outputPath) => {
  let content = rawContent;
  if (outputPath && outputPath.endsWith(".html") && !isAmp(content)) {
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

const optimizeAmp = async (rawContent, outputPath) => {
  let content = rawContent;
  if (outputPath && outputPath.endsWith(".html") && isAmp(content)) {
    content = await ampOptimizer.transformHtml(content);
  }
  return content;
};

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("optimizeCss", optimizeCss);
    eleventyConfig.addTransform("minifyHtml", minifyHtml);
    eleventyConfig.addTransform("optimizeAmp", optimizeAmp);
  },
};

function isAmp(content) {
  return /\<html amp/i.test(content);
}
