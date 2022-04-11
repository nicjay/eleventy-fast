const Image = require("@11ty/eleventy-img");
const path = require("path");

/**
 * Generates width, height, srcset
 * Outputs in specified widths and formats
 * Sets native lazy loading
 * Sets native async decoding
 */

const processImage = async (src, alt, isLazy = true, sizes = '100vw') => {

  const imageSource = isRemote(src) ? src : path.join('src', src);

  const imageMetadata = await Image(imageSource , {
    widths: [400, 800],
    formats: ['webp', 'jpeg'],
    outputDir: '_site/assets/img/',
    urlPath: '/assets/img/',
  });

  const imageAttributes = {
    alt,
    sizes,
    loading: isLazy ? "lazy" : "eager", // Avoid lazy-loading images that are in the first visible viewport
    decoding: "async",
  };

  return Image.generateHTML(imageMetadata, imageAttributes, {
    whitespaceMode: "inline" // Required for Markdown files
  });
}

const isRemote = (src) => {
  return /^(https?\:\/\/|\/\/)/i.test(src) ? true : false;
}

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addNunjucksAsyncShortcode('image',  processImage)
    eleventyConfig.addLiquidShortcode("image", processImage);
  },
};
