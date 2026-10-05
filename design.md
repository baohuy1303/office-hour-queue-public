# Design guide

This is a calm, editorial look for small tools. Picture warm paper, serif headlines, black ink buttons and one terracotta accent. It comes from Pigeon's UI. Follow it for every screen, and don't bring in a component library.

**The feel:** a well-set notebook, not a SaaS dashboard. The layout is quiet, with thin hairlines, lots of room and very little color. Color carries meaning (selected, due, good, warn, bad) and is never decoration.

---

## 1. Principles

1. **One accent, used sparingly.** Terracotta marks where you are: the active tab, the selected row, focus rings, step numbers and anything overdue. Everything else is ink on paper.
2. **Primary buttons are ink, not accent.** The main action is a solid near-black button (it turns cream in dark mode). The accent never fills a button.
3. **Serif for voice, sans for work.** Georgia sets page titles, section titles, stat numbers and the wordmark. Inter or the system sans sets everything you read or click.
4. **Hairlines over boxes.** Use 1px `--line` borders and a very soft shadow. Avoid heavy borders, gradients and bright fills.
5. **Color says state.** Semantic colors (good, warn, bad, info) always come as a pair: a strong text color on its matching soft background.
6. **Panes scroll, the page doesn't.** On desktop the body is fixed. The rail and the main stage each scroll on their own, with hidden scrollbars.
7. **Plain words.** Headings are short sentences that end with a period ("Every contact."). Help text says what happens when you click.

---

## 2. Tokens

Put every color in a CSS custom property. Components never use raw hex values, except the fixed `#fff` for logo tiles.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f5f3ed` | `#181816` | page background (warm paper) |
| `--panel` | `#ffffff` | `#222220` | cards, rail, topbar, dialogs |
| `--ink` | `#191917` | `#f5f1e8` | main text, primary button fill |
| `--muted` | `#716f68` | `#aaa69d` | secondary text, inactive nav |
| `--faint` | `#9b9890` | `#7d7972` | labels, counts, timestamps |
| `--line` | `#ddd9cf` | `#3a3833` | every border and divider |
| `--soft` | `#ebe8df` | `#2c2a26` | neutral chips, meter tracks, hover |
| `--accent` | `#cf6540` | `#ed8058` | terracotta, the one accent |
| `--accent-soft` | `#f6e5dc` | `#462b21` | selected row, avatar fill |
| `--good` / `--good-soft` | `#356147` / `#e4efe8` | `#8fc7a2` / `#23362a` | success, replied, done |
| `--warn` / `--warn-soft` | `#85631c` / `#f4ecd6` | `#e1bd62` / `#3c321d` | needs review, held, notices |
| `--bad` / `--bad-soft` | `#a4433c` / `#f7e3e1` | `#ef8c83` / `#462724` | errors, bounced, over budget |
| `--info` / `--info-soft` | `#2f6fb2` / `#e3edf8` | `#7fb0e8` / `#22313f` | pending, external channel |
| `--shadow` | `0 12px 35px rgba(38,32,21,.07)` | `0 12px 35px rgba(0,0,0,.2)` | cards only |

Derived tints use `color-mix()`, never new hex values:
- focus ring: `0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)`
- nav hover: `color-mix(in srgb, var(--accent) 7%, transparent)`
- topbar: `color-mix(in srgb, var(--panel) 92%, transparent)`

### Radius

| Use | Radius |
|---|---|
| Keyboard hints | 5px |
| Inputs, buttons, notices | 9px |
| Logo tiles | 11px |
| Cards and tables | 13px |
| Dialogs | 15px |
| Chips, badges, filters, toast, meters | 999px (pill) |
| Avatars | 50% |

### Spacing

- The stage pads `30px clamp(24px, 5vw, 72px) 64px`.
- Page content is capped at **1080px**. A single-item focus view (an editor or composer) is capped at **900px**. Both are centered.
- Cards pad 18px. Rows pad about 10–14px. The gap between stacked cards is 18px.
- Gaps between controls are 6–9px. The gap between groups is 14–24px.

---

## 3. Typography

| Role | Spec |
|---|---|
| Body | `14px/1.45 var(--sans)`, antialiased |
| Page title (h1) | `700 clamp(29px,4vw,42px)/1.05 var(--serif)`, a short sentence ending in a period |
| Focus title (the item's name) | `700 clamp(25px,3vw,34px)/1.1 var(--serif)` |
| Section / card title | `700 19–21px var(--serif)` |
| Dialog title | `700 23px var(--serif)` |
| Wordmark | `700 23px var(--serif)` |
| Stat number | `700 21px var(--serif)` |
| Page subtitle | `--muted`, `max-width: 65ch` |
| Help text | 12px, `--muted` |
| Group label / table header | 10px, weight 750, `letter-spacing: .08–.11em`, UPPERCASE, `--faint` |
| Status word | 11px, weight 750, `letter-spacing: .05em`, UPPERCASE, semantic color, no background |
| UI weights | 650–720 for nav, buttons and names (Inter is variable, so odd weights work) |
| Editable long text | `14px/1.7 var(--mono)` (drafts and templates read like a typewriter) |
| Code / commands | `12px/1.5 var(--mono)`, `user-select: all` for copyable commands |

The fonts are Georgia plus Inter, falling back to the system sans, and nothing needs downloading.

---

## 4. Layout shell

```
┌───────────────────────────────────────────────────────────────┐
│ [mark] Wordmark      ☰ Tab  ⌕ Tab  ⋮ Tab                  [☾] │  60px topbar
├──────────────────┬────────────────────────────────────────────┤
│ [ search ]       │                                            │
│ GROUP LABEL · 3  │   Big serif title.                         │
│ ▌[logo] Item     │   muted subtitle, 65ch max                 │
│  [logo] Item     │                                            │
│ GROUP LABEL · 2  │   ┌── card ─────────────────────────────┐  │
│  [logo] Item     │   │                                     │  │
│                  │   └─────────────────────────────────────┘  │
│  330px rail      │   [■ Primary] [ Secondary ]  ghost action  │
└──────────────────┴────────────────────────────────────────────┘
```

- **Topbar:** a 3-column grid `var(--rail-w) 1fr auto`. The first column is exactly as wide as the rail, so the tabs line up with the content edge. The brand sits on the left, text tabs in the middle, and icon buttons (the theme toggle) on the right.
- **Brand:** a single-color SVG mark in `--accent` next to the serif wordmark. On hover the mark tilts slightly: `rotate(-4deg) translateY(-1px)`.
- **Tabs:** text buttons with a 17px line icon, colored `--muted`. The active tab is `--ink` with a **2px accent bottom border** running the full topbar height. A count can follow in `--faint` at 12px.
- **Rail (330px, `--panel`):** a sticky search box at the top, then items under uppercase group labels ("FOLLOW UP · 3"). The selected item gets `--accent-soft` plus a **3px accent left border**. On hover an item nudges `translateX(2px)`.
- **Stage:** the main scrolling area on `--bg`. Pages that don't need the list hide the rail (`.layout.full`).
- The views switch in place with a 0.2s fade-up. There is no routing library.

---

## 5. Components

**Buttons**
- **Default:** `--panel` background with a `--line` border, 9px radius, `10px 14px` padding, weight 680. On hover the border turns `--accent`.
- **Primary:** `--ink` background, `--ink` border, text in `--bg`. On hover the opacity drops to .9. Use one per view.
- **Ghost:** transparent, `--muted` text. Use it for secondary actions such as "Mark sent".
- **Small:** `7px 10px` padding at 12px. Use it in rows and toolbars.
- **Active:** press with `translateY(1px) scale(.985)`. **Disabled:** opacity .45 with a `not-allowed` cursor.
- **Busy:** the label changes to "Checking…" and the button disables. Put a line icon before the label, with a 7px gap.
- **Icon button:** 36×36 with a `--line` border and 9px radius. On hover it lifts 1px and its border turns accent.

**Inputs**
- Inputs use a `--bg` fill when they sit on a panel, or `--panel` when they sit on the page. They take a `--line` border and a 9–10px radius.
- On focus the border turns accent and the 15% accent ring appears. Keep `outline: 0`.
- Checkboxes use `accent-color: var(--accent)`, or `var(--good)` when the check means "confirmed".

**Card (`.card`)**
- `--panel` background, a 1px `--line` border, 13px radius, 18px padding and `--shadow`.
- Stacked cards sit 18px apart.

**Stepped sections**
- For a multi-step flow on one page, each card gets a heading row made of a **24px circle** (`--accent-soft` fill, `--accent` number, sans 800 at 12px) and a serif 19px title.
- Under the heading goes one line of 12px muted help text.

**Chips and filters**
- These are pill-shaped, with a `--line` border, 12px text and `5–6px 10–11px` padding.
- An active filter is **ink-filled** (`--ink` background, text in `--bg`). It is never accent-filled.
- Label filter groups with a 10px caps label, for example "STATUS".

**Badges**
- These are tiny pills at 10px, weight 750 and `3px 7px` padding.
- Neutral badges are `--soft` with `--muted` text. Colored variants pair a soft background with strong text (`.badge.good`, `.warn`, `.bad`, `.info`).

**Status text**
- An uppercase colored word with no background, for example SENT (muted), REPLIED (good), BOUNCED (bad), HELD (warn), QUEUED (accent), PENDING (info).

**Stat tiles**
- A small panel card with a 10px radius and `10px 13px` padding.
- A serif 21px number sits on top of a muted 12px label.
- Tiles go in a wrapping row just under the page head.

**Table**
- The table is one card with `overflow: hidden`. Each row is a CSS grid, not a `<table>`, so the columns can collapse at breakpoints.
- The header row uses 10px faint caps. Rows are separated by `--line`, and a hovered row gets a `--bg` background.
- Status changes happen inline with a compact `<select>`: 7px radius and `4px 6px` padding.

**Identity**
- **Logo tile:** 42px with an 11px radius, a `--logo-bg` fill (`#eceae4` light, `#2c2c29` dark), a faint border and `0 2px 8px rgba(0,0,0,.06)`. The image uses `object-fit: contain` with 4px padding.
- **Avatar:** a circle filled `--accent-soft` with `--accent` initials at weight 800. A photo covers it when there is one.
- **Tooltip:** a CSS `::after` that reads a `data-` attribute. It is an ink pill with `--bg` text at 11px and fades in over 0.14s.

**Notices**
- `.notice` is a `--warn-soft` block with `--warn` text, 9px radius and `11px 13px` padding. Use it for soft warnings.
- `.blocker` uses the same shape in bad colors, for things that stop the action.

**Meter**
- An 8px pill track in `--soft` with an `--accent` fill that animates its width over 0.3s. The fill turns `--bad` when full.
- Lay it out as a row: label, meter, then "12 / 50" in muted text.

**Dialog**
- Use the native `<dialog>` with `showModal()`. Width is `min(620px, 100% - 28px)` with a 15px radius, and the shadow is `0 28px 80px rgba(0,0,0,.3)`.
- The backdrop is `rgba(20,18,14,.45)` with `backdrop-filter: blur(2px)`.
- The head holds the serif title and an × icon button, over a hairline. Details go in a `dl` grid with 120px muted `dt`s.

**Toast**
- A single ink pill fixed at the bottom center, with text in `--bg`. It slides up 16px while fading in over 0.18s and hides after about 1.8s.
- Every action confirms with one: what happened, then what comes next ("Marked sent · follow-up in 5 days").

**Keyboard hints**
- A `.kbd` is a small bordered box with a 5px radius, for example "J next / K previous".
- Put hints in a muted footer under a hairline. Hide them on mobile.

**Empty state**
- Center a small, playful illustration (a single-color line drawing in the accent), then a serif line and a muted hint.
- Example: "All checked. Not a crumb left." with "New items land here." under it.

---

## 6. Icons

- Draw icons inline as SVG on a `0 0 24 24` viewBox, stroked with `currentColor`: `stroke-width: 1.8`, round caps and joins, no fill. There is no icon font or package.
- Render them at 17px in nav and buttons, and 13–14px inline.
- Keep a tiny `iconPaths` map in JS and use `icon(name)` to return the SVG string.
- Mark decorative icons `aria-hidden="true"`, and give icon-only buttons an `aria-label`.
- External links end in `↗`. Separators are ` · `, a middle dot with spaces.

---

## 7. Motion

- Transitions run 0.13–0.2s with `ease`, on color, background, border-color and transform only.
- Hover lifts are 1px (`translateY(-1px)`). List rows nudge 2px to the right.
- Button presses use `translateY(1px) scale(.985)`.
- View switches fade up from 3px over 0.2s.
- Always honor reduced motion:
  `@media (prefers-reduced-motion: reduce) { * { animation-duration:.01ms!important; transition-duration:.01ms!important } }`

---

## 8. Theme

- The theme is set with `data-theme="light|dark"` on `<html>`, kept in `localStorage`, and switched with a moon/sun icon button at the top right.
- Dark mode only redefines the tokens, so components never check the theme themselves.
- Dark mode is warm charcoal, never pure black. The accent brightens to `#ed8058` so it keeps its contrast.
- The primary button inverts on its own, because it is `--ink` on `--bg`.

---

## 9. Responsive

- **≤ 820px:** the rail narrows to 270px, nav padding tightens, and less important table columns hide (`display: none` on those cells, with the grid columns redefined).
- **≤ 620px:** the body scrolls normally. The topbar wraps and the tabs become a full-width row of equal buttons without icons. The rail stacks on top (`max-height: 310px`). Page heads stack, input rows go vertical, detail grids go to one column, and keyboard hints and tooltips hide.

---

## 10. Voice

- **Page titles** are 2–4 words ending in a period: "Every contact.", "Scout the right people.", "LinkedIn, in batches."
- **Subtitles** are one or two plain sentences saying what the page is for and what the tool does or doesn't do for you.
- **Buttons** are verb-first and specific: "Open in Gmail", "Copy draft", "Mark follow-up sent", "+ Add company".
- **Toasts** state the result and the next step. They never just say "Success".
- **Counts** go inline in faint text: "Queue 8", "FOLLOW UP · 3", "All · 13".
- Use sentence case everywhere. The only caps are the tiny labels and status words, and those are done with CSS.

---

## 11. Don'ts

- Don't use accent-filled buttons, gradients, or colored page backgrounds.
- Don't use more than one primary button per view.
- Don't use pure `#000` or `#fff` for page surfaces. Use the warm tokens.
- Don't use drop shadows on anything except cards, dialogs, the toast and logo tiles.
- Don't show visible scrollbars on the shell panes.
- Don't use icon fonts, UI kits or CSS frameworks. Plain CSS variables and plain HTML are enough.
- Don't use Title Case headings or exclamation marks.

---

## 12. Starter kit

### HTML shell

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>App</title>
  <link rel="stylesheet" href="/ui.css">
</head>
<body>
<header class="topbar">
  <div class="brand"><svg class="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14"/></svg><span class="wordmark">App</span></div>
  <nav class="topnav" aria-label="Primary">
    <button class="navbtn on" data-page="inbox"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h10M4 19h7"/></svg><span>Inbox</span><span class="count">8</span></button>
    <button class="navbtn" data-page="all"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16M8 3v18"/></svg><span>All</span></button>
  </nav>
  <div class="topmeta"><button class="iconbtn" id="themeBtn" aria-label="Toggle theme"></button></div>
</header>

<div class="layout" id="layout">
  <aside class="rail">
    <div class="railtools"><input class="search" type="search" placeholder="Search" aria-label="Search"></div>
    <div class="group-title">FOLLOW UP · 2</div>
    <button class="row on"><span class="logo">AC</span><span class="row-name">Selected item</span></button>
    <button class="row"><span class="logo">BX</span><span class="row-name">Another item</span></button>
  </aside>

  <section class="stage">
    <div class="view on page">
      <div class="pagehead">
        <div><h1>Every item.</h1><p>One plain sentence about what this page is for.</p></div>
        <input class="search page-search" type="search" placeholder="Search all">
      </div>
      <div class="stats"><div class="stat"><strong>13</strong>items</div><div class="stat"><strong>5</strong>new</div></div>
      <section class="card">
        <h2 class="step"><span class="step-n">1</span>First step</h2>
        <p class="help">What happens when you click the button below.</p>
        <div class="actions"><button class="btn primary">Do the thing</button><button class="btn">Secondary</button><button class="btn ghost">Skip</button></div>
      </section>
    </div>
  </section>
</div>

<dialog id="dlg"><div class="dialog-head"><h2>Details</h2><button class="iconbtn" aria-label="Close">×</button></div><div class="dialog-body"></div></dialog>
<div class="toast" id="toast"></div>
<script src="/ui.js"></script>
</body>
</html>
```

### CSS

```css
/* Tokens */
:root{
  color-scheme:light;
  --bg:#f5f3ed;--panel:#fff;--ink:#191917;--muted:#716f68;--faint:#9b9890;
  --line:#ddd9cf;--soft:#ebe8df;--logo-bg:#eceae4;
  --accent:#cf6540;--accent-soft:#f6e5dc;
  --good:#356147;--good-soft:#e4efe8;
  --warn:#85631c;--warn-soft:#f4ecd6;
  --bad:#a4433c;--bad-soft:#f7e3e1;
  --info:#2f6fb2;--info-soft:#e3edf8;
  --shadow:0 12px 35px rgba(38,32,21,.07);
  --serif:Georgia,"Times New Roman",serif;
  --sans:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:ui-monospace,SFMono-Regular,Consolas,monospace;
  --rail-w:330px;
}
[data-theme=dark]{
  color-scheme:dark;
  --bg:#181816;--panel:#222220;--ink:#f5f1e8;--muted:#aaa69d;--faint:#7d7972;
  --line:#3a3833;--soft:#2c2a26;--logo-bg:#2c2c29;
  --accent:#ed8058;--accent-soft:#462b21;
  --good:#8fc7a2;--good-soft:#23362a;
  --warn:#e1bd62;--warn-soft:#3c321d;
  --bad:#ef8c83;--bad-soft:#462724;
  --info:#7fb0e8;--info-soft:#22313f;
  --shadow:0 12px 35px rgba(0,0,0,.2);
}

/* Base */
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 var(--sans);-webkit-font-smoothing:antialiased;overflow:hidden}
button,input,textarea,select{font:inherit;color:inherit}
button{cursor:pointer}
a{color:inherit;text-underline-offset:3px}
[hidden]{display:none!important}
.ico,.navbtn svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

/* Shell */
.topbar{height:60px;display:grid;grid-template-columns:var(--rail-w) minmax(0,1fr) auto;align-items:center;padding:0 14px 0 10px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--panel) 92%,transparent);position:relative;z-index:4}
.brand{display:flex;align-items:center;gap:9px;padding-left:6px}
.brand-mark{width:34px;height:34px;fill:var(--accent);transition:transform .2s ease}
.brand:hover .brand-mark{transform:rotate(-4deg) translateY(-1px)}
.wordmark{font:700 23px var(--serif)}
.topnav{display:flex;align-self:stretch;gap:2px}
.navbtn{display:flex;align-items:center;gap:7px;padding:0 14px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--muted);font-weight:650;transition:color .16s ease,background .16s ease,border-color .16s ease}
.navbtn:hover{color:var(--ink);background:color-mix(in srgb,var(--accent) 7%,transparent)}
.navbtn.on{color:var(--ink);border-bottom-color:var(--accent)}
.navbtn .count{color:var(--faint);font-size:12px}
.topmeta{display:flex;align-items:center;gap:8px}
.iconbtn{width:36px;height:36px;border:1px solid var(--line);border-radius:9px;background:var(--panel);display:grid;place-items:center;transition:transform .16s ease,border-color .16s ease}
.iconbtn:hover{border-color:var(--accent);transform:translateY(-1px)}

.layout{height:calc(100% - 60px);display:grid;grid-template-columns:var(--rail-w) minmax(0,1fr)}
.layout.full{grid-template-columns:1fr}
.layout.full .rail{display:none}
.rail{background:var(--panel);border-right:1px solid var(--line);overflow:auto}
.stage{overflow:auto;padding:30px clamp(24px,5vw,72px) 64px}
.rail,.stage,.dialog-body{scrollbar-width:none;scrollbar-gutter:stable}
.rail::-webkit-scrollbar,.stage::-webkit-scrollbar,.dialog-body::-webkit-scrollbar{width:0;height:0}
.page{max-width:1080px;margin:0 auto}
.page.narrow{max-width:900px}
.view{display:none}
.view.on{display:block;animation:view-in .2s ease both}
@keyframes view-in{from{opacity:.25;transform:translateY(3px)}to{opacity:1;transform:none}}

/* Rail list */
.railtools{position:sticky;top:0;z-index:2;background:var(--panel);padding:8px}
.group-title{padding:13px 11px 5px;color:var(--faint);font-size:10px;font-weight:750;letter-spacing:.11em}
.row{width:100%;display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:11px;border:0;border-left:3px solid transparent;background:transparent;text-align:left;padding:9px 10px 9px 8px;transition:background .15s ease,transform .15s ease}
.row:hover{background:var(--bg);transform:translateX(2px)}
.row.on{background:var(--accent-soft);border-left-color:var(--accent)}
.row-name{font-weight:690;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row-meta{display:block;color:var(--muted);font-size:12px}
.logo{width:42px;height:42px;border-radius:11px;border:1px solid color-mix(in srgb,var(--line) 70%,transparent);background:var(--logo-bg);box-shadow:0 2px 8px rgba(0,0,0,.06);display:grid;place-items:center;overflow:hidden;color:var(--muted);font-weight:800;font-size:12px}
.logo img{width:100%;height:100%;object-fit:contain;padding:4px}
.avatar{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:var(--accent-soft);color:var(--accent);font-weight:800}
.avatar img{width:100%;height:100%;object-fit:cover}

/* Page head */
.pagehead{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
.pagehead h1{font:700 clamp(29px,4vw,42px)/1.05 var(--serif);margin:0}
.pagehead p{margin:7px 0 0;color:var(--muted);max-width:65ch}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin:-8px 0 20px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 13px;color:var(--muted);font-size:12px}
.stat strong{display:block;color:var(--ink);font:700 21px var(--serif)}

/* Cards and steps */
.card{background:var(--panel);border:1px solid var(--line);border-radius:13px;padding:18px;box-shadow:var(--shadow)}
.card+.card{margin-top:18px}
.step{display:flex;align-items:center;gap:10px;margin:0 0 6px;font:700 19px var(--serif)}
.step-n{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font:800 12px var(--sans)}
.help{margin:0 0 14px;color:var(--muted);font-size:12px}

/* Controls */
.search{width:100%;border:1px solid var(--line);background:var(--panel);border-radius:10px;padding:11px 12px;outline:0}
.card .search,.card input,.card textarea{background:var(--bg)}
.page-search{width:min(280px,100%)}
.search:focus,.card input:focus,.card textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 15%,transparent)}
input[type=checkbox],input[type=radio]{accent-color:var(--accent)}
.actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:13px}
.btn{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);background:var(--panel);border-radius:9px;padding:10px 14px;font-weight:680;text-decoration:none;transition:transform .13s ease,border-color .13s ease,background .13s ease}
.btn:hover:not(:disabled){border-color:var(--accent)}
.btn:active{transform:translateY(1px) scale(.985)}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn.primary{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.btn.primary:hover:not(:disabled){border-color:var(--ink);opacity:.9}
.btn.ghost{border-color:transparent;background:transparent;color:var(--muted)}
.btn.small{padding:7px 10px;font-size:12px}
.row-select{border:1px solid var(--line);background:var(--panel);border-radius:7px;padding:4px 6px}

/* Chips, filters, badges, status */
.chip,.filter{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:6px 11px;font-size:12px}
.chip:hover,.filter:hover{border-color:var(--accent)}
.filter.on{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.filters{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:16px}
.badge{border-radius:999px;padding:3px 7px;font-size:10px;font-weight:750;background:var(--soft);color:var(--muted)}
.badge.good{background:var(--good-soft);color:var(--good)}
.badge.warn{background:var(--warn-soft);color:var(--warn)}
.badge.bad{background:var(--bad-soft);color:var(--bad)}
.badge.info{background:var(--info-soft);color:var(--info)}
.status{font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.status.good{color:var(--good)}.status.warn{color:var(--warn)}.status.bad{color:var(--bad)}.status.info{color:var(--info)}.status.accent{color:var(--accent)}

/* Table */
.table{background:var(--panel);border:1px solid var(--line);border-radius:13px;overflow:hidden}
.table-head,.table-row{display:grid;grid-template-columns:44px minmax(150px,1.2fr) minmax(120px,1fr) 110px 100px;gap:12px;align-items:center;padding:11px 14px;border-bottom:1px solid var(--line)}
.table-head{padding:9px 14px;color:var(--faint);font-size:10px;font-weight:750;letter-spacing:.08em}
.table-row{cursor:pointer}
.table-row:last-child{border-bottom:0}
.table-row:hover{background:var(--bg)}

/* Feedback */
.notice{margin-top:14px;padding:11px 13px;border-radius:9px;background:var(--warn-soft);color:var(--warn)}
.blocker{margin-top:14px;padding:10px 12px;border-radius:9px;background:var(--bad-soft);color:var(--bad)}
.meter{height:8px;border-radius:999px;background:var(--soft);overflow:hidden}
.meter>span{display:block;height:100%;background:var(--accent);transition:width .3s ease}
.meter.full>span{background:var(--bad)}
.kbd{border:1px solid var(--line);background:var(--panel);border-radius:5px;padding:1px 5px}
.toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,16px);background:var(--ink);color:var(--bg);border-radius:999px;padding:9px 15px;opacity:0;pointer-events:none;transition:.18s;z-index:20}
.toast.on{opacity:1;transform:translate(-50%,0)}
.cmd{display:block;font:12px/1.5 var(--mono);overflow-wrap:anywhere;user-select:all}

/* Dialog */
dialog{width:min(620px,calc(100% - 28px));max-height:calc(100% - 40px);border:1px solid var(--line);border-radius:15px;background:var(--panel);color:var(--ink);padding:0;box-shadow:0 28px 80px rgba(0,0,0,.3)}
dialog::backdrop{background:rgba(20,18,14,.45);backdrop-filter:blur(2px)}
.dialog-head{display:flex;align-items:center;padding:17px 18px;border-bottom:1px solid var(--line)}
.dialog-head h2{font:700 23px var(--serif);margin:0}
.dialog-head button{margin-left:auto}
.dialog-body{padding:18px;overflow:auto}
.detail-grid{display:grid;grid-template-columns:120px 1fr;gap:10px 15px}
.detail-grid dt{color:var(--muted)}
.detail-grid dd{margin:0;overflow-wrap:anywhere}

/* Motion and responsive */
@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
@media(max-width:820px){
  :root{--rail-w:270px}
  .navbtn{padding:0 10px}
  .stage{padding:24px 20px 50px}
}
@media(max-width:620px){
  body{overflow:auto}
  .topbar{display:flex;flex-wrap:wrap;height:auto;padding:10px 12px;gap:8px}
  .topnav{order:3;width:100%;height:38px}
  .navbtn{flex:1;justify-content:center}
  .navbtn svg{display:none}
  .topmeta{margin-left:auto}
  .layout{display:block;height:auto}
  .rail{border-right:0;border-bottom:1px solid var(--line);max-height:310px}
  .stage{overflow:visible}
  .pagehead{flex-direction:column;align-items:flex-start}
  .detail-grid{grid-template-columns:1fr}
  .kbd{display:none}
}
```

### JS helpers

```js
const $ = id => document.getElementById(id);

const iconPaths = {
  moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};
const icon = name => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || ''}</svg>`;

function toast(message) {
  $('toast').textContent = message;
  $('toast').classList.add('on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('toast').classList.remove('on'), 1800);
}

// Theme: tokens only, stored per browser.
const THEME_KEY = 'app-theme';
function renderThemeIcon() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('themeBtn').innerHTML = icon(dark ? 'sun' : 'moon');
  $('themeBtn').setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
}
$('themeBtn').onclick = () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch {}
  renderThemeIcon();
};
try { document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || 'light'; } catch {}
renderThemeIcon();

// J / K moves through the rail list when focus is not in a field.
document.addEventListener('keydown', e => {
  if (e.target.matches('input,textarea,select')) return;
  const rows = [...document.querySelectorAll('.rail .row')];
  const i = rows.findIndex(r => r.classList.contains('on'));
  const next = e.key.toLowerCase() === 'j' ? rows[i + 1] : e.key.toLowerCase() === 'k' ? rows[i - 1] : null;
  if (next) next.click();
});
```
