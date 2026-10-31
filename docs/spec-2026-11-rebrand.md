# andlum.com: engineering leader who builds

Spec for the November 2026 update. Written 2026-10-31 after a grilling
session. Copy below is a draft for Andrew's review; nothing here is built yet.

Companion spec: `~/Dev/satsuma-site/docs/spec-2026-11-rebrand.md`.

## Goal

Reposition andlum.com from "Director of Engineering at Findigs" to an
engineering leader who left to build, and who treats teams and software as
the same kind of work. The site must say, without a job title to lean on,
that Andrew leads engineering teams, still ships, and is glad to talk about
leadership roles.

**Primary reader:** people recruiting engineering leaders. Everything on the
page is written for them first. Friends and peers are served along the way.

## Decisions (from the grilling session)

| Topic | Decision |
|---|---|
| Current status | Building under Studio Satsuma; quietly open. Findigs in past tense, ended end of August 2026. |
| How open | One soft clause: "I'm always glad to talk about engineering leadership roles." No "available" language. |
| Tagline | "I build software, and the teams that build it." |
| Essays section | **Field Notes**, chosen 2026-10-31. Subtitle always "Notes on technical leadership." |
| Essay format | Paul Graham model: bare title list newest first, no dates or summaries in the list; each essay opens with month and year, then prose, no images by default. |
| Essay launch | Section built now. Homepage link renders only when at least one essay exists. First essays are being written the week of 2026-11-02. |
| RSS | Yes, `/feed.xml`. |
| Link to Satsuma | Yes, one-way. andlum.com links to satsuma.works; satsuma.works never names Andrew. |
| Contact | LinkedIn only. No email on the page (scrapers). |
| Old drafts | `src/blog/` and `src/portfolio/` stay ignored. Not deleted, not published. |
| Analytics | None, as today. |
| `llms.txt` | Updated to match the page. |

## Homepage copy (for review)

Structure stays: letterhead, greeting, prose, a link row, footer. One new
conditional section for the Field Notes. Copy in full:

---

**Hi, I'm Andrew** 👋

*I build software, and the teams that build it.*

Most recently I was Director of Engineering at Findigs, where I led product
engineering on a platform that made renting an apartment faster and fairer.
These days I'm building [Studio Satsuma](https://satsuma.works), a small
studio for the apps I've wanted to exist. I'm always glad to talk about
engineering leadership roles.

Outside of work, I love to move. You'll usually find me climbing, cooking,
running, dancing, or practicing handstands in the park. Most of the time, in
Brooklyn.

**Field Notes** · notes on technical leadership
*(renders only when the collection has at least one essay)*
- Why I went back to building
- How I evaluate engineers
- *All notes →*

**If you'd like to know more**
- **Studio Satsuma** · the studio where I build and ship small apps
- **Sik Fan Lah** · dinner party menus, and the recipes behind them
- **GitHub** · side projects, in varying states of repair
- **LinkedIn** · the professional-shaped version of me, with the full work history. The best place to reach me.

Last tended November 2026
No analytics, no cookies, nothing following you out the door.

---

Notes on the copy:

- The middle paragraph ("I don't think leading and building are different
  jobs...") was cut on 2026-10-31. It read as explanation rather than
  delight. A replacement, if any, should be short and built around: "I got
  into technology because I loved the delight when something just works."

- The tagline replaces "Welcome to my little corner of the web." Two
  one-liners under the name read as clutter. The welcome survives in the meta
  description ("Come in, sit down."). Restore it as the first sentence of the
  Now paragraph if the page feels cold without it.
- "I left at the end of August 2026 to build again" was cut on 2026-10-31.
  The footer date is now the only staleness guard on the page; llms.txt
  still carries the dates.
- No year counts ("thirteen years") in the copy; they go stale annually.
- The two Field Notes titles are planned, not written. The list is driven by
  the collection, so these appear only once the files exist.
- Meta description: "Andrew Lum builds software, and the teams that build it.
  Engineering leader in Brooklyn, New York. Come in, sit down."
- Page title stays "Andrew Lum — welcome".

## Field Notes: structure

Name settled. URL uses a hyphen, not an underscore, matching web convention
and the rest of both repos.

- **Source:** `src/field-notes/*.md`, one file per essay.
- **Collection:** `fieldnotes`, sorted by `date` descending. Drafts carry
  `draft: true` and are excluded from the collection and the build (same
  mechanism satsuma.works uses for Kata).
- **Index:** `/field-notes/`. Heading "Field Notes", subtitle "Notes on
  technical leadership", then a bare list of titles, newest first. No dates,
  no summaries, no images. One line of context above the list is allowed:
  "Essays on leading engineering teams, written while building."
- **Essay layout:** `src/_includes/essay.html`, extending the site layout.
  Title, then month and year in the label style, then prose. Same column
  width and typography as the homepage. Footnotes allowed, images allowed
  but not expected.
- **Essay front matter:**
  ```yaml
  ---
  title: Why I went back to building
  date: 2026-11-05
  description: One sentence, used for meta and the feed.
  layout: essay.html
  draft: false
  ---
  ```
- **Homepage section:** wrapped in `{% if collections.fieldnotes.length %}`.
  Shows up to five newest titles and an "All notes" link to the index.
- **RSS:** `@11ty/eleventy-plugin-rss`, output `/feed.xml`, title "Andrew Lum
  · Field Notes", linked from the index page and as `<link rel="alternate">`
  in the site layout.
- **Eleventy config:** add `fieldnotes` collection, the RSS plugin, and a
  `draft` filter. Keep the existing `src/blog/**` and `src/portfolio/**`
  ignores.

## `llms.txt` updates

Mirror the page. Specifically:

- Header line: "Engineering leader in Brooklyn, New York. Builds software,
  and the teams that build it."
- **Now:** building under Studio Satsuma (https://satsuma.works) since
  September 2026; glad to talk about engineering leadership roles.
- **Before:** add "Findigs — Director of Engineering, product engineering,
  through August 2026" to the top of the list.
- **Elsewhere:** add Studio Satsuma and the Field Notes index.
- Add a **Writing** section pointing at `/field-notes/` and `/feed.xml`.
- "Accurate as of" date updated when shipped.

## Technical notes

- No stack change. Eleventy 3, Nunjucks, GitHub Pages via the existing
  `build.yml` workflow and content-hashed stylesheet.
- CSS additions: an `.essay` body style (slightly larger measure for long
  prose), a `.notes` list style for the homepage section, and the index list.
  Reuse existing tokens; no new colors or fonts.
- Keep the page under one screen of prose. If the Field Notes section pushes
  the links below the fold on a laptop, cap the homepage list at three.

## Open items

- [x] Essays section named Field Notes, URL `/field-notes/`.
- [ ] First essay written (Andrew, week of 2026-11-02). Section is invisible until then.
- [ ] Portrait photo for the letterhead slot (carried over, still open).
- [ ] Confirm the Findigs sentence; it can shrink to "Most recently I was Director of Engineering at Findigs" if the platform clause feels like marketing.

## Build plan

One session, in this repo, on a branch:

1. Add the `fieldnotes` collection, `essay.html` layout, index page, RSS feed,
   and draft filter. Verify an example essay (deleted before merge) renders at
   `/field-notes/<slug>/` and appears in the homepage list and the feed.
2. Replace the homepage copy with the draft above as approved. Update meta
   description, link row, footer date.
3. Update `llms.txt`.
4. Build, preview, check the homepage with the collection empty (no Field
   Notes section) and non-empty.
5. Open a PR. Deploy follows the existing workflow on merge.

Done looks like: homepage reads as approved, `/field-notes/` and `/feed.xml`
build, the homepage section appears only with content, and `llms.txt`
matches.
