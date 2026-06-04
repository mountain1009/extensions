Drop listing screenshots here. Each must be a **PNG, exactly 1600×1000
(16:10), ≤3 MB**. 1–6 files. The manifest references
`screenshots/screenshot-1.png`; add more by listing them in
`package.json` → `muxy.marketplace.screenshots`.

Vite copies `public/` into `dist/` on build, so these resolve as
`dist/screenshots/*.png` at validation time.
