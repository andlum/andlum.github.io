const fs = require("fs");
const crypto = require("crypto");

// Short content hash of the stylesheet, used as a cache-busting query string in
// the layout. GitHub Pages serves /css/styles.css with a four-hour max-age, so
// without this a deploy can leave the CDN handing out the previous stylesheet
// against the new HTML. The hash only changes when the CSS actually changes.
module.exports = () => {
  const css = fs.readFileSync("src/css/styles.css");
  return {
    cssHash: crypto.createHash("sha1").update(css).digest("hex").slice(0, 8),
  };
};
