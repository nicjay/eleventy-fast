let config = {
  content: [],
  theme: {
    fontFamily: {
      sans: ["Graphik", "sans-serif"],
      serif: ["Merriweather", "serif"],
    },
    extend: {},
  },
  plugins: [],
};

// Pass in raw content from 11ty at build time
// https://tailwindcss.com/docs/content-configuration#configuring-raw-content
config.dynamicContent = (content) => ({ ...config, content });

module.exports = config;
