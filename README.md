# healthystart

## Future Tweaks

Optional changes we may implement later for additional polish and resilience:

- Brand no-wrap: Keep brand text on one line with ellipsis to avoid mid-width wrapping.
- Viewport type scale: Use `clamp()` on nav/CTA font-size so text shrinks slightly before wrapping.
- Wider container: Increase `.container` to `width: min(1280px, 92%)` to give the nav more room on large screens.
- Dropdown grouping: Move longer/less-used links under a "Solutions" dropdown to keep 4–5 top-level items.
- Auto-short labels: Swap to shorter nav labels under ~1250px via JS (use `data-short` attributes).
- CTA no-wrap hardening: `flex-wrap: nowrap` on `.header-cta`; buttons with `white-space: nowrap; min-width: max-content;`.
- Earlier collapse tuning: Adjust the nav collapse breakpoint (currently 1200px) up/down after real-world review.
- Resize/close behavior: Auto-close the mobile menu when resizing above the collapse breakpoint (JS polish).
- Active link automation: Set `.active` based on current URL in JS to avoid manual per-page edits.
- DRY header/footer: Extract repeated header/footer into partials (templating/build step) to prevent drift across pages.

These are not required now; we can implement them incrementally as needs arise.

## Optional Tweaks & Verification

- Shorten CTA label: If any browser still clips the white pill in the blue CTA bar, change the label from "Book Online" to "Book Ride".
  - Where: header CTA bar in each page (search for `Book Online`).
  - Example: in `index.html`, replace `Book Online` in the header CTA bar button.

- Cross-browser checks: Verify key interactions and breakpoints in Chrome and Safari (desktop + responsive mode).
  - Breakpoints: 1200px (nav collapses), 1100px (estimator actions wrap), 900px (stacked hero/layout), 640px (buttons stretch).
  - Nav: ensure labels don’t wrap at desktop; hamburger appears at ≤1200px; Resources dropdown opens/closes, Esc closes, outside click closes.
  - CTA bar: confirm white pill text remains visible and doesn’t clip; call link remains clickable.
  - Estimator banner: at ~1100px, actions wrap neatly; at ≤640px, buttons stretch and align.
  - Images: noncritical images lazy-load; no unexpected layout shift.

- Tuning knobs (if needed):
  - Collapse breakpoint: adjust in `assets/css/styles.css` under `@media (max-width: 1200px)`.
  - Spacing: tweak `.nav-menu { gap: ... }` and `.header-cta .btn { padding: ... }` in `assets/css/styles.css`.
  - Dropdown label: change "Resources" text in each page’s header button.

## Testing Locally

- Python 3 (recommended):
  - `python3 -m http.server 5173 --bind 127.0.0.1`
  - Open `http://127.0.0.1:5173/index.html`

- Node (if installed):
  - `npx http-server -p 5173 .`
  - Open `http://127.0.0.1:5173/index.html`

- Ruby (built-in on macOS):
  - `ruby -run -e httpd . -p 5173`
  - Open `http://127.0.0.1:5173/index.html`
