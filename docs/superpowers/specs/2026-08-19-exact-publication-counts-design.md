# Exact Publication Counts Design

## Goal

Show exact homepage statistics without a trailing `+`.

## Design

Keep the existing data-driven count calculation in `renderStats`. Render every calculated value with `String(value)` so journals, conferences, patents, and research tracks remain synchronized with their source arrays while displaying exact numbers.

No publication data, labels, filters, or list rendering will change.

## Verification

- Confirm the rendered values are `51`, `11`, `34`, and `4` for the current data.
- Confirm `script.js` contains no remaining logic that appends `+` to statistics.
- Run a JavaScript syntax check.
