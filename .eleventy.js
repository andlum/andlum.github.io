module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/llms.txt");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Half-written drafts. They have never been published; keep them out of the
  // build until they're finished.
  eleventyConfig.ignores.add("src/blog/**");
  eleventyConfig.ignores.add("src/portfolio/**");

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
    },
    templateFormats: ["md", "njk", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
