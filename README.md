# Fleet console

Working prototype for the case study *Metal in the oil*: an operator console for twenty wind
turbines, where a failure model hands the operator a number and the console shows what the
number is made of, so a person can disagree when the reason is thin.

Live: the GitHub Pages URL of this repository. Case study: [wioletawojcik.com](https://wioletawojcik.com).

## What is real

- **Every event on every lane** comes from the SCADA event logs of the Kelmarsh and Penmanshiel
  wind farms (Cubico Sustainable Investments, CC-BY-4.0, Zenodo records 16807551 and 16807304).
- **The clock** is frozen at 10 February 2023, 12:00 UTC, the day Kelmarsh 4's gearbox episode
  ends in a forced outage, 31 days after its first metal-particle alarm. Nineteen lanes show
  their own logs in the six weeks before that moment. **PEN-15 replays** its March–April 2024
  episode (the one that ends with *Particle sensor defect*) on the same clock; the legend says so.
- **The base sentence** (51 episodes, 22 outages within six weeks, median warning 21 days) is
  counted from nine years of logs (`tools/base_rate.py` in the working folder).
- **The confidence number is not a model.** It is a transparent, counted rule, printed in
  `src/data/fleet.json` under `scoring`, so every number on screen can be defended at a whiteboard.
- **Measurement channels** (power, gear-oil temperature, particle rate, vibration) are 10-minute
  SCADA rows streamed out of the Zenodo archives for the same window. Where a channel was not
  fetched, the screen says *no data*; it never fills in a zero.

## Token chain

Figma variables → `theme.css` (generated, never edited by hand) → Tailwind 4 `@theme` →
component classes named after the Figma components (`.lane`, `.severity-tag`, `.confidence`).
shadcn/ui primitives (Button, Input, Radio, Textarea) are re-bound to the same tokens in
`src/shadcn.css`; everything above the primitives is custom.

## Run

```bash
npm install
npm run dev
```

`npm run build` writes `dist/`; the Pages workflow deploys it on every push to `main`.
Data files are rebuilt from the working folder with `python3 tools/build_fleet.py` and
`python3 tools/build_signals.py`.
