# Liveline gallery banners

Banners for the Uno Platform Studio samples gallery, made from real captures of the Liveline sample (`liveline`, branch
`studio` at **`9de40e5`**, "fix(liveline): the live dot draws when XAML sets Momentum="True""). The sample is one page: a
real-time SkiaSharp line chart on a simulated random-walk feed. The app ran as a Release WebAssembly build in headless
Chromium. Nothing in a banner is redrawn. The line, the fill, the live dot, the badge, the labels and every colour come from
the running app. The styling sits around and on top of the captures only: CSS device frames, crops, perspective, falloff
masks, blur, light and backdrop.

The first version of this set was captured on `a2600e7`, where the live dot never drew. Every capture was retaken on
`9de40e5`, so the dot, its halo and its highlight now appear wherever the chart's live end shows.

## Finals

All files are in `finals/`. Every banner is at 1x (1200 × 630) and 2x (2400 × 1260). Two banners also have a hero at
1920 × 1080: `focus-badge` (a pick) and `stylized-seeds` (the next strongest). By the owner's brief change of 2026-11-09,
`stylized-split`, the other pick, has no hero.

| Banner | Family | What it shows | Source captures (state · theme · viewport · DPR) |
|---|---|---|---|
| `showcase-desk` | showcase | Desktop window (Light) between a landscape phone (Dark) and a phone (Dark), on a pale mint ground with ledger rules | feed at 140.33 · Light desktop 1120×640 (frame 547), Dark landscape 915×412 (549) and phone 390×844 (550) · DPR 3, stored 2x |
| `showcase-phones` | showcase | Four phones: Light portrait, the landscape layout in Dark and Light, Dark portrait, on the Dark palette | 140.33 · Light and Dark · 390×844 and 915×412 (frames 549–550) · DPR 3 |
| `showcase-daynight` | showcase | Two tablets turned towards each other: a pale-bodied Light tablet on the day ground, a graphite Dark one on the night ground | 140.33 · Light and Dark · 1180×820 (frame 548) · DPR 3 |
| `focus-badge` (+ hero) | focused | Macro of the chart's live end: the climb to a new high, the dashed tracking line, the live dot with its halo, the 140.33 badge and the 130.0/120.0 labels, at three times app size | 140.33 · Dark · 600×420 (frame 550) · **DPR 6**, crop 300×260 app px |
| `focus-easing` | focused | The easing caught mid-move. The badge already reads the new value (128.65) while it, the live dot and the line's end are still climbing past 114. The past goes soft to the left | frame 146, moments after a spike's tick · Dark · 1120×640 · DPR 3, card crop 519×358 |
| `focus-card` | focused | The control on its own: the Light card, turned slightly in space, on mint | 140.33 · Light · 760×420 (frame 551) · DPR 3 |
| `focus-line` | focused | The line and its gradient fill running to the live dot and badge, with no card and no time labels, dissolving into the plot's own Surface colour | 140.33 · Light · 760×420 (frame 550) · **DPR 5**, plot crop 692×313 |
| `stylized-split` | stylized | One chart, Light and Dark, cut on one diagonal. The page is the backdrop, and the line runs unbroken across the cut | 140.33 · Light and Dark · 1120×640 (frame 547) · DPR 3, page crop 880×520 |
| `stylized-seeds` (+ hero) | stylized | **Theming composition**: four builds that differ only in the brand seed (shipped green, then Blue, Deep Orange and Purple), Light and Dark alternating, on one feed and one value | 140.33 · green and orange Light, blue and purple Dark · 760×420 (frame 551) · DPR 3 |
| `stylized-motion` | stylized | Five moments of a spike, 0 to 928 ms: the badge takes each new value at once and glides to it, and the dot and the line follow. The row recedes so the latest moment is nearest | spike sequence, frames 146–204 · Dark · 1120×640 · DPR 3, plot-end crops 219×319 |
| `focus-badge-titled` | focused, titled (optional) | `focus-badge` with "Liveline" in Roboto Medium | as `focus-badge` |

**The two strongest are `focus-badge` and `stylized-split`**, the same picks as before the fix. The dot makes the macro
stronger.
- **`focus-badge`**: the latest value is the one thing a live chart is for, and the macro makes it the subject: the line
  arrives at the live dot, the halo and the badge together, at native pixels (DPR 6: 3 CSS px per app px, so 6 device px
  at 2x). It is crisp at full size and reads at thumbnail size.
- **`stylized-split`**: it states the sample's point in one image. It is one frame of one feed in both themes, and the line,
  the tracking line, the dot and the card run straight across the cut, because every colour comes from the theme.

`stylized-seeds` is the next strongest, and it carries the second hero. It shows the theming claim as four builds: one
feed and one value (140.33, dot and all) in four palettes, Light and Dark alternating.

## Studio info-file screenshots

`studiolive/chart-desktop.png` (1280 × 800) and `studiolive/chart-phone.png` (390 × 844) were taken at `deviceScaleFactor`
1, in Light, at frames 550 and 551 of one session. The feed is at 140.33: the badge sits at its value above the 130.0
label, the line ends on the live dot, and the axis labels agree. They are full-viewport captures with nothing composed.

## How the captures were made

All the tools are in `src/tools/`:
- `drive.js` keeps one page open and takes steps over a local port, adapted from PAC's driver;
- `crop.py` crops the raw captures into `cap/`, downscaling only;
- `match.py` compares line masks;
- `render.js` and `render-all.sh` render the compositions;
- `sessions/` holds the step lists.

- **The page clock is controlled, and the app is not.** Playwright's `page.clock` was installed at 10:41:00 UTC and
  paused before the app loaded. The app was started with the same thirty 20 ms clock steps in every session (600 ms in
  all). After that, time moved only one 16 ms animation frame at a time, and each step waited until the app had finished
  the frame it was given. The canvas is never behind what the UI says: every badge sits at its value on the axis, except in
  the deliberate mid-move frames. "Canvas lag" (a badge reading 86.88 while it sits at 71) appears only in free-running
  headless captures, and none of those is used.
- **One feed for every capture.** The sample's `Random()` is unseeded. `drive.js` replaces `crypto.getRandomValues` with a
  seeded generator (seed 2026), so the app's own random walk takes the same path in every session and every build. The
  walk itself is the app's code. The feed reads 140.33 for frames 544 to 552. The device shots fall inside that tick:
  desktop 547, tablet 548, landscape 549, phone 550, card 551. So every capture shows the same data, the same value and
  the same time labels: 41:03 to 41:11 on the wide layouts; 41:03, 41:08 and 41:12 on the narrow phone.
- **Cheap stepping.** The ~545 frames before a shot ran at a 160×120 viewport. The easing state is in value space, so it
  does not depend on the canvas size. Each shot then resized to its real viewport and rendered one or two frames there.
  This is how the DPR 5 and DPR 6 captures were affordable.
- **Theming builds.** These are allowed for this sample, and the brief caps them at three. The three extra builds came from a
  `git archive` export of `9de40e5`. The only change was `PrimarySeed` in `Liveline.Demo/App.xaml`: `#2196F3` (Blue 500),
  `#FF5722` (Deep Orange 500) and `#9C27B0` (Purple 500). They were built one at a time: Release `net10.0-browserwasm`,
  `bin` and `obj` deleted at once, each publish deleted after capturing. The shipped build used is the coordinator's
  Release publish of `9de40e5`. The repository was not touched. Each build ran a 14-frame card sequence (frames 542 to
  555). The frames used are those whose line matches the green build's frame 551 (line-mask overlap 0.97 to 0.99).

## Palette

Liveline has no palette file. `App.xaml` gives Material one seed, `PrimarySeed="#4CAF50"`, and Uno.Themes generates the
roles. The values below are those generated roles as the app draws them, sampled from flat areas of the captures. They are
listed in `src/frames.css`.

| Role (what uses it) | Light | Dark |
|---|---|---|
| Primary (line, fill, live dot and halo, badge) | `#4CAF50` (the seed itself) | `#78DC77` |
| Background (page) | `#FCFDF6` | `#1A1C19` |
| Surface (card, plot) | `#FCFDF6` | `#2F312D` |
| OutlineVariant (card edge, backdrop rules) | `#C2C9BD` | `#424940` |
| OnSurfaceVariant (axis labels; the title's colour) | `#424940` | `#C2C9BD` |
| OnPrimary (badge text, the dot's highlight) | `#000000` | `#00390A` |

The seed builds draw these: Deep Orange Light Primary `#FF5722` on Surface `#FCFCFC`; Blue Dark Primary `#9ECAFF` on
`#2F3033`; Purple Dark Primary `#F9ABFF` on `#332F32`.

The backdrops, hazes, title bars, bezels (graphite, and the pale "silver" day tablet) and floors use only these roles,
mixed or at reduced alpha. The motif belongs to Liveline: **ledger rules**, the horizontal hairlines of a value axis drawn in
OutlineVariant and fading towards the edges.

The titled banner uses Roboto Medium, the Material theme's face, which the app ships through `Uno.Fonts.Roboto`. It is in
`src/fonts/` with its OFL licence. The app itself shows no display text.

## Rules kept

- **Real pixels.** Every screen and crop is a capture of the running app. Nothing is retouched. Masks, blur and perspective
  are applied to whole captures.
- **No enlarging.** Captures are taken at DPR 3, 5 or 6 and stored at or below that. Every composition shows them at or
  below native pixels in the 2x export, nearest edge included: perspective planes pivot on their nearest edge.
  - `focus-badge`: 3.0 CSS px per app px (6 device px at 2x) from DPR 6.
  - `stylized-split`: 1.45 (2.9 device px at 2x) from DPR 3.
  - `focus-easing`: 1.45 (2.9 device px at 2x) from DPR 3.
  - `focus-line`: 1.53 (3.1 device px at 2x) from DPR 5.
  - Heroes: `focus-badge` 4.3 from DPR 6; `stylized-seeds` 1.44 from the cards stored at 2x.
- **Clean states.** No loading state (the sample's breathing loading line lasts 3 s and is long gone by frame 544), no
  pointer, no scroll indicators, no Studio toolbar. The page has no interactive chrome.
- **Generic frames.** CSS bodies with no notch, camera, buttons or logo.
- **Safe area.** The key content of every banner sits inside the central 90%.
- **No third-party brands.** The sample shows only numbers and times, so there was nothing to avoid.

## Rebuild

From `src/`, with `NODE_PATH` reaching `playwright`, run `sh tools/render-all.sh` to render all finals. One composition at
a time is `node tools/render.js <html> <out.png> <W> <H> <scale>`.

## Uncertain, and known limits

- **Easing phase between sessions.** Sessions agree on the data, but a session's start-up can land one 20 ms clock step
  later. That moves the feed's ticks by about a frame against its frames, so its line is a frame further into the same
  tick.
  - Light and Dark desktops: same phase (line-mask overlap 0.91 across the themes). The split crosses the line on the flat
    41:07–41:08 stretch anyway, and at 2x the line runs through unbroken.
  - Seed runs: matched by mask. The Deep Orange run was one frame off, so its index 008 is used.
  - Resizes add a few easing steps: the `focus-card` card, shot after four resizes, matches a fresh run about two frames
    later. The value and labels are the same.
- **The back cards' time-label rows fade out** in `stylized-seeds`. This is a deliberate depth fade that keeps the deck
  quiet; nothing there disagrees.
- **Mid-move frames are meant to "disagree".** In `focus-easing` and `stylized-motion` the badge text runs ahead of its
  position. That is the control's designed easing (the text updates at once and the badge, dot and line glide), stepped
  frame by frame, not canvas lag.
- **Small text.**
  - The showcase banners carry axis labels of about 4 to 7 px at 1x, as whole-screen banners do.
  - In `stylized-motion` the two farthest frames' labels are about 8 to 9 px, with their badges near 10 px.
  - Readable text is in the focused banners: `focus-badge` (36 px badge text), `focus-card`, `focus-easing` and
    `focus-line`.
- **Sparse screens.** The chart is one card, so the portrait phones and the 1180×820 tablets show it small, in a lot of
  page Background. That is the app's real layout. For the same reason, the desktop captures use a 1120×640 window rather
  than 1440×900.
- **The picks are dark-led.** `focus-badge` is Dark, so the titled variant is Dark too.
