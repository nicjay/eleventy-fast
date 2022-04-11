const Image = require("@11ty/eleventy-img");
const path = require("path");
const outdent = require("outdent");

const ImageWidths = {
  ORIGINAL: null,
  PLACEHOLDER: 24,
};

/**
 * Generates metadata like width/height/srcset for each image
 * Outputs to optimized web formats (webp/avif)
 * Sets blurry placeholder before final image lazy load
 * Adapted from https://www.aleksandrhovhannisyan.com/blog/eleventy-image-lazy-loading/
 */
const processImage = async (
  relativeSrc,
  alt,
  className,
  widths = [400, 800, 1280],
  baseFormat = 'jpeg',
  optimizedFormats = ['webp'], // Add avif when better supported
  sizes = '100vw'
) => {
  const { dir: imgDir } = path.parse(relativeSrc);
  let fullSrc = '';
  if (/^(https?\:\/\/|\/\/)/i.test(relativeSrc)) {
    fullSrc = relativeSrc;
  } else {
    fullSrc = path.join('src', relativeSrc);
  }
  const imageMetadata = await Image(fullSrc, {
    widths: [ImageWidths.ORIGINAL, ImageWidths.PLACEHOLDER, ...widths],
    formats: [...optimizedFormats, baseFormat],
    outputDir: path.join('_site', imgDir),
    urlPath: imgDir,
  });

  // Map each unique format (e.g., jpeg, webp) to its smallest and largest images
  const formatSizes = Object.entries(imageMetadata).reduce((formatSizes, [format, images]) => {
    if (!formatSizes[format]) {
      const placeholder = images.find((image) => image.width === ImageWidths.PLACEHOLDER);
      // 11ty sorts the sizes in ascending order under the hood
      const largestVariant = images[images.length - 1];

      formatSizes[format] = {
        placeholder, //Low-Quality Image Placeholder
        largest: largestVariant,
      };
    }
    return formatSizes;
  }, {});

  const picture = `<picture class="lazy-picture">
  ${Object.values(imageMetadata)
    // Map each format to the source HTML markup
    .map((formatEntries) => {
      // The first entry is representative of all the others since they each have the same shape
      const { format: formatName, sourceType } = formatEntries[0];

      const placeholderSrcset = formatSizes[formatName].placeholder.url;
      const actualSrcset = formatEntries
        // We don't need the placeholder image in the srcset
        .filter((image) => image.width !== ImageWidths.PLACEHOLDER)
        // All non-placeholder images get mapped to their srcset
        .map((image) => image.srcset)
        .join(', ');

      return `<source type="${sourceType}" srcset="${placeholderSrcset}" data-srcset="${actualSrcset}" data-sizes="${sizes}">`;
    })
  .join('\n')}
    <img
      src="${formatSizes[baseFormat].placeholder.url}"
      data-src="${formatSizes[baseFormat].largest.url}"
      width="${formatSizes[baseFormat].largest.width}"
      height="${formatSizes[baseFormat].largest.height}"
      alt="${alt}"
      class="lazy-img"
      loading="lazy"
      decoding="async">
  </picture>`;

  return outdent`${picture}`;

}

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addShortcode('image',  processImage);
    eleventyConfig.addNunjucksAsyncShortcode('imageNjk',  processImage)
  },
};
