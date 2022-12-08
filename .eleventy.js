module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('css')

  return {
    dir: {
      input: "src",
      output: "public"
    },
    templateFormats: [ "md", "njk", "html", ],
    passthroughFileCopy: true
  }
}
