# About Family Photo Collage Design

**Date:** 2026-08-26

**Status:** Approved for implementation planning

**Scope:** Add two family travel photos to the existing About section without changing the site's academic focus.

## 1. Goal

Add `assets/daughter.png` and `assets/son.jpg` to the homepage as a small, personal visual signature under the professor's existing Lab profile. The photos should humanize the professor profile while remaining clearly secondary to the biography, research, publications, and lab-member content.

Success means:

- both photos are publicly visible and explicitly identified as photos with the professor's daughter and son;
- the current About information hierarchy remains dominant;
- the addition causes little extra page height, especially on mobile;
- only optimized, metadata-free derivatives are deployed;
- the module remains usable with reduced motion, missing data, or an image-load failure.

## 2. Approved Content

The module uses the following copy:

- Eyebrow: `Beyond the Lab`
- Heading: `Family journeys keep curiosity close.`
- Supporting line: `A personal glimpse beyond research.`
- Tokyo caption: `With my daughter in Tokyo`
- Dubai caption: `With my son in Dubai`

The user explicitly approved public display of the people, their family relationships, and the location captions.

Required alternative text:

- Tokyo: `Professor Daehee Kim and his daughter viewed from behind beside the illuminated Tokyo Skytree at night.`
- Dubai: `Professor Daehee Kim standing with his son in front of the Burj Khalifa in Dubai.`

Captions remain visible rather than appearing only on hover. The alternative text describes the visual scene; the caption supplies the concise relationship and location label.

## 3. Placement and Visual Hierarchy

### 3.1 Existing About structure

The current About section has a two-column `.about-grid`:

1. professor name, role, Korean name, and biography;
2. the Lab profile card.

The design keeps that structure. The right side becomes an `.about-aside` containing:

1. the existing `.lab-profile` card;
2. a new `.personal-journeys` module below it.

No new top-level section or navigation item is added.

### 3.2 Desktop presentation

At widths above the existing `1080px` About breakpoint:

- the biography stays in the left column;
- the Lab profile remains first in the right column;
- `Beyond the Lab` appears below the Lab profile;
- the two cards form a centered, slightly overlapping postcard stack;
- each displayed photo is capped at `132 × 176px`;
- the Tokyo card rotates about `-2deg` and sits slightly lower;
- the Dubai card rotates about `2deg` and sits slightly higher;
- the stack adds no more than about `200px` of vertical content after its heading and supporting line.

This is the smallest of the reviewed visual variants. The photos read as a personal signature rather than a third primary content block.

### 3.3 Tablet and mobile presentation

At the existing `1080px` breakpoint, `.about-grid` becomes one column. To prevent unnecessary height:

- the biography remains first;
- from `1080px` down to `621px`, `.about-aside` places the Lab profile and personal module in two equal columns;
- at `620px` and below, `.about-aside` stacks the Lab profile and personal module in one column;
- within the mobile personal module, the copy occupies the left side and a compact postcard stack occupies the right side;
- mobile photo cards are approximately `92 × 123px` each;
- the compact stack is capped at roughly `166px` wide and `140px` high;
- at `340px` and below, the stack moves below the copy and remains centered.

The module must not create horizontal overflow at `320px`, `360px`, or `390px` viewports.

## 4. Component and Data Design

### 4.1 Content data

Add a `personalMoments` object under `window.LAB_DATA.professor` in `content.js`. It contains the eyebrow, heading, supporting line, and an ordered `moments` array. Each moment provides:

- optimized image path;
- descriptive alternative text;
- visible caption;
- stable `tokyo` or `dubai` key for class names and deterministic ordering.

The Tokyo moment comes first in source order, followed by Dubai. Visual positioning may overlap them, but DOM and reading order stay logical.

### 4.2 Markup boundary

In `index.html`:

- wrap the existing Lab profile in `.about-aside`;
- add an initially hidden `.personal-journeys` container after the Lab profile;
- give the module heading a stable ID and connect the container with `aria-labelledby`.

In `script.js`, add a focused `renderPersonalMoments()` function. The function:

1. reads `data.professor.personalMoments`;
2. validates the text fields and `moments` array;
3. filters out entries missing a source, alternative text, or caption;
4. builds the heading, supporting line, figures, images, and captions with the existing `make()` helper and a document fragment;
5. reveals the initially hidden container only after at least one valid card has rendered.

The renderer remains independent from publication, member, and research rendering. A missing personal-data object must not prevent any existing content from rendering.

### 4.3 DOM outline

```html
<div class="about-aside">
  <div class="lab-profile">...</div>
  <section class="personal-journeys" aria-labelledby="personal-journeys-title" hidden>
    <p class="section-kicker">Beyond the Lab</p>
    <h3 id="personal-journeys-title">Family journeys keep curiosity close.</h3>
    <p>A personal glimpse beyond research.</p>
    <div class="personal-postcard-stack">
      <figure class="personal-postcard personal-postcard-tokyo">...</figure>
      <figure class="personal-postcard personal-postcard-dubai">...</figure>
    </div>
  </section>
</div>
```

The exact generated markup may vary, but the semantic section, heading, ordered figures, visible captions, and hidden-until-valid behavior are required.

## 5. Image Pipeline and Privacy

The source files are not production assets:

- `assets/daughter.png` is approximately 24MB at `4284 × 5712`;
- `assets/son.jpg` is approximately 330KB at `1280 × 1676`.

Implementation creates these production derivatives:

- `assets/beyond-lab-tokyo.webp`
- `assets/beyond-lab-dubai.webp`

Requirements for both derivatives:

- exact portrait `3:4` output at `480 × 640px`;
- visually preserve the landmark and people;
- start at WebP quality `82`; if a file exceeds the size budget, reduce quality in two-point increments, stopping at `74`, and visually verify the landmark, night gradients, and faces after every reduction;
- target no more than `150KB` per file and `300KB` total;
- strip EXIF, GPS, device, timestamp, and other ancillary metadata;
- verify dimensions, format, byte size, and metadata before staging.

Add exact ignore rules for `assets/daughter.png` and `assets/son.jpg` so the originals cannot be committed accidentally. Only the two optimized derivatives are referenced and committed. Because the Pages workflow copies the tracked `assets` directory, keeping the originals untracked and ignored also keeps them out of the deployed artifact.

Rendered `<img>` elements use:

- intrinsic `width="480"` and `height="640"` values;
- `loading="lazy"`;
- `decoding="async"`;
- `object-fit: cover` with per-image object positioning only when required by the final crop.

## 6. Motion and Interaction

Motion remains deliberately restrained:

- register the personal copy and two cards with the existing reveal system after `script.js` has rendered them;
- reveal the copy at `0ms`, the Tokyo card at `80ms`, and the Dubai card at `160ms`;
- initial travel must remain at or below `12px` and must not override the cards' base postcard rotations;
- on hover-capable precise pointers, a card rises by `2px` with a small shadow increase;
- do not add parallax, pointer-following tilt, modal viewing, autoplay, or caption-on-hover behavior;
- touch devices receive the static layout without hover-only meaning;
- under `prefers-reduced-motion: reduce`, the module appears immediately and all photo transitions are disabled.

The visible caption and all information remain available without hover or JavaScript animation.

## 7. Failure Handling

- If `personalMoments` is absent, malformed, or has no valid entries, leave the container hidden and preserve the existing About layout.
- If only one moment is valid, render a centered single-card variant rather than leaving an empty slot.
- If an image request fails, add an `.is-image-missing` state that keeps the image and alternative text in the DOM, preserves card dimensions and the visible caption, and displays a neutral `Photo unavailable` visual fallback.
- Rendering errors in this optional module must be caught locally and must not interrupt statistics, publications, members, or navigation initialization.
- If `assets/motion.js` fails or motion is unsupported, the module remains statically visible after content rendering.

## 8. Accessibility

- Use a real section heading (`h3`) beneath the About section's existing `h2`.
- Keep figures in Tokyo-then-Dubai DOM order.
- Provide descriptive, non-empty `alt` text and visible `figcaption` elements.
- Do not make non-actionable photos keyboard-focusable.
- Maintain readable caption contrast over both bright and dark image regions by using a dark translucent caption surface.
- Ensure captions do not rely on color alone and remain legible at browser zoom up to `200%`.
- Honor reduced-motion preferences and preserve content when CSS or motion JavaScript is unavailable.

## 9. Performance Budget

- Combined new image transfer: at most `300KB`.
- No new third-party library, font, network request, canvas, WebGL, or animation dependency.
- Reserve image space with intrinsic dimensions to avoid layout shift.
- Lazy-load both images because the About module begins below the hero and quick statistics.
- Existing publication filtering, counts, and journey geometry must remain unchanged except for the expected increased About height, which the current resize and geometry observers must recalculate.

## 10. Verification

### Static checks

- `node --check content.js`
- `node --check script.js`
- `node --check assets/motion.js`
- `git diff --check`
- confirm only intended code, optimized derivatives, ignore rules, and documentation are staged;
- confirm neither source image is tracked or present in the Pages artifact.

### Content and behavior

- both captions and both descriptive alternative texts render;
- Lab profile remains above the photo module;
- missing data hides the module without affecting the page;
- a single valid entry uses the single-card layout;
- image failure preserves dimensions and caption;
- publication totals remain journals `51`, conferences `11`, patents `35`, total `97`;
- reduced-motion mode has no entry or hover animation.

### Responsive and visual checks

- inspect at `1440px`, `1080px`, `820px`, `620px`, `390px`, and `320px` widths;
- verify no horizontal overflow;
- verify the desktop cards stay at or below `132 × 176px`;
- verify compact mobile cards render at `92 × 123px` and do not dominate the biography;
- verify important people and landmarks remain visible in both crops;
- verify captions are readable against the photographs;
- verify existing scene geometry, navigation highlighting, and console state remain correct.

## 11. Non-Goals

- Do not replace the hero image or use either family photo as a full-width background.
- Do not add a gallery, carousel, lightbox, download link, or navigation item.
- Do not add family member names, ages, social links, or additional personal details.
- Do not deploy or link to the original source files.
- Do not redesign the professor card in Members or move the photos into the Members section.
- Do not introduce unrelated refactoring.

## 12. Expected Files for Implementation

- `.gitignore` — ignore the two source originals exactly.
- `content.js` — add approved copy and moment data.
- `index.html` — add the About aside and hidden semantic module host.
- `script.js` — render and validate the optional module.
- `styles.css` — add desktop, tablet, mobile, failure, and reduced-motion styles.
- `assets/motion.js` — register the module with the existing restrained reveal behavior.
- `assets/beyond-lab-tokyo.webp` — optimized, metadata-free derivative.
- `assets/beyond-lab-dubai.webp` — optimized, metadata-free derivative.

No other production files are in scope.
