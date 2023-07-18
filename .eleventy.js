const eleventyVue = require("@11ty/eleventy-plugin-vue"); // import the plugin

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('src/css')
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPlugin(eleventyVue);

  return {
    dir: {
      input: "src",
      output: "public"
    },
    templateFormats: [ "md", "njk", "html", ],
    passthroughFileCopy: true
  }
}
