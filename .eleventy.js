module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('css')
  eleventyConfig.addPassthroughCopy("CNAME");

  return {
    dir: {
      input: "src",
      output: "public"
    },
    templateFormats: [ "md", "njk", "html", ],
    passthroughFileCopy: true
  }
}
