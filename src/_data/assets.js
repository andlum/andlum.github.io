const fs = require("fs");
const crypto = require("crypto");

// Short content hashes of the stylesheet and the field script, used as
// cache-busting query strings. GitHub Pages serves /css/styles.css with a four-hour max-age, so
// without this a deploy can leave the CDN handing out the previous stylesheet
// against the new HTML. The hash only changes when the CSS actually changes.
module.exports = () => {
  const hash = (path) =>
    crypto.createHash("sha1").update(fs.readFileSync(path)).digest("hex").slice(0, 8);
  return {
    cssHash: hash("src/css/styles.css"),
    jsHash: hash("src/js/field.js"),
  };
};
