module.exports = async function (eleventyConfig) {
  // The RSS plugin ships as ESM only, so it has to be imported rather than
  // required from this CommonJS config.
  const { feedPlugin } = await import("@11ty/eleventy-plugin-rss");

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/llms.txt");
  eleventyConfig.addPassthroughCopy("CNAME");

  // Half-written drafts. They have never been published; keep them out of the
  // build until they're finished.
  eleventyConfig.ignores.add("src/blog/**");
  eleventyConfig.ignores.add("src/portfolio/**");

  // Anything with `draft: true` in its front matter is skipped entirely: no
  // output file, and nothing in any collection.
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft) {
      return false;
    }
  });

  // Essays open with the month and year they were written, e.g. "November 2026".
  eleventyConfig.addFilter("monthYear", (date) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date)
  );

  // Field Notes: one Markdown file per essay, newest first.
  eleventyConfig.addCollection("fieldnotes", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/field-notes/*.md")
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addPlugin(feedPlugin, {
    type: "rss",
    outputPath: "/feed.xml",
    collection: {
      name: "fieldnotes",
      limit: 0,
      sort: "descending",
    },
    metadata: {
      language: "en",
      title: "Andrew Lum · Field Notes",
      subtitle: "Notes on technical leadership",
      base: "https://andlum.com/",
      author: {
        name: "Andrew Lum",
      },
    },
  });

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
