# Patent Status Badges Design

## Goal

Make patent registration and application records distinguishable at a glance while preserving every original citation string.

## User Experience

Each patent item will keep its existing `Patents` type label. A compact Korean status badge will appear immediately beside it:

- `등록` for citations containing `등록번호`
- `출원` for citations containing `출원번호`
- `등록` or `출원` from an explicit status override when an international citation does not contain either Korean marker

The `등록` badge will use a soft blue treatment and the `출원` badge a soft gold treatment. The visible text remains the primary status indicator, so the distinction does not depend on color alone. On narrow screens, the label row may wrap without overlapping the citation.

Journal and conference items will remain unchanged.

## Data and Rendering

The existing citation strings in `content.js` remain unchanged. A `patentStatusOverrides` object beside the patent list will provide explicit status metadata for citations whose original text does not contain a Korean status marker. The initial override maps `US9042339` to `registered`.

`script.js` will derive a patent status while rendering each item:

1. A citation containing `등록번호` maps to the registered status and the label `등록`.
2. A citation containing `출원번호` maps to the application status and the label `출원`.
3. A citation containing neither marker is matched against `patentStatusOverrides` by patent identifier.
4. A citation without a recognized marker or valid override receives no status badge, allowing incomplete or future formats to render safely.

The renderer will place the existing publication type and optional patent badge in a small metadata row above the citation. Search, publication filters, item ordering, year extraction, and statistics will continue to use their existing logic.

## Styling

`styles.css` will add styles for the metadata row, the shared status badge shape, and the two status variants. Badges will be visually secondary to the citation, use the site's existing palette, and retain readable contrast in desktop and mobile layouts.

## Error Handling

Status detection will be deterministic and use the citation text plus the optional override metadata. Unknown identifiers and unsupported override values will fall back to the current `Patents` label without throwing an error or suppressing the item.

## Verification

- Run `node --check script.js` and `node --check content.js`.
- Confirm every current patent containing `등록번호` displays `등록`.
- Confirm every current patent containing `출원번호` displays `출원`.
- Confirm the unchanged `US9042339` citation displays `등록` through its explicit override.
- Confirm the current totals are 18 registered badges and 18 application badges, with no unclassified patent items.
- Confirm journals and conferences do not display patent status badges.
- Confirm search and all publication filters still work.
- Check the metadata row and badge wrapping at desktop and mobile widths.
