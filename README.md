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
