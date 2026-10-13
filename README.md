# For Nisha — a birthday experience ♡

A private, secret-letter style birthday site: a black date gate, a warm editorial
birthday letter, an interactive 3D cake that splits in two, and a final thank-you.

**Stack:** React 18 · Vite 5 · Three.js via React Three Fiber + Drei · Framer Motion · Lucide · custom CSS

---

## Run it (VS Code)

1. Install **Node.js 18 or newer** (https://nodejs.org).
2. Open VS Code → **File → Open Folder…** → choose the `nisha-birthday` folder.
3. Open the terminal (**Terminal → New Terminal**) and run:

```bash
npm install
npm run dev
```

4. Open the address it prints (usually http://localhost:5173).

**Phone on the same Wi-Fi?** Run `npm run dev -- --host` and open the "Network" address.

### Build for hosting

```bash
npm run build      # outputs the site into /dist
npm run preview    # test the production build locally
```

Upload the `dist` folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

---

## Project structure

```
nisha-birthday/
├─ index.html
├─ package.json
├─ vite.config.js
├─ scripts/make-hash.mjs        # prints the digest for a new date
├─ public/favicon.svg
└─ src/
   ├─ main.jsx                  # entry + fonts + global CSS
   ├─ App.jsx                   # gate -> lazy-loads the birthday page
   ├─ content.js                # ALL visible text lives here
   ├─ lib/
   │  ├─ sha256.js              # tiny SHA-256 (works on any connection)
   │  ├─ gate.js                # date parsing + validation
   │  └─ webgl.js               # WebGL detection
   ├─ components/
   │  ├─ Gate.jsx               # Page One (black cover)
   │  ├─ SentenceReveal.jsx     # gradual sentence-by-sentence reveal
   │  ├─ FloatingHearts.jsx     # soft hearts + twinkles
   │  ├─ MusicToggle.jsx        # appears only if you add a music file
   │  └─ ErrorBoundary.jsx
   ├─ pages/Birthday.jsx        # Page Two + Three + Final wrapper
   ├─ sections/
   │  ├─ Hero.jsx               # heading, quote label, quote, message
   │  ├─ CakeSection.jsx        # interaction timeline (pulse -> split -> text -> celebrate -> replay)
   │  ├─ Cake3D.jsx             # the 3D cake (two real halves)
   │  ├─ CakeCSS.jsx            # no-WebGL fallback (also splits)
   │  ├─ Celebration.jsx        # tiny hearts + sparkles
   │  └─ Final.jsx              # thank-you + closing note
   └─ styles/ base.css · gate.css · birthday.css
```

---

## How the date gate works (and what it can't do)

* The accepted date is **not** stored in plain text. Only a salted, 1500-round
  SHA-256 digest is in `src/lib/gate.js`.
* Input is auto-formatted as `DD.MM.YYYY`. `25/10/2006`, `25-10-2006` and
  `25102006` are normalised, then checked as a **real calendar date**.
* The birthday page is in a separate JavaScript chunk that is **only requested
  after** the correct date. Before that it is not loaded and not in the DOM, so
  nothing can flash behind the black cover. There is no router and nothing is
  saved, so reloading always returns to the gate.
* **Honest limit:** this is a romantic interactive effect, not real security.
  Anyone who opens the browser's developer tools can still find the page's
  files, and a date has few possible values, so a determined person could
  guess it. For true secrecy, check the date on a server and only send the
  letter's content after it passes.

### Change the date

```bash
npm run hash -- 25.10.2006
```

Paste the printed digest into `GATE_DIGEST` in `src/lib/gate.js`.

---

## Edit the words

Everything visible is in **`src/content.js`**.

## Optional music

Drop a legitimate audio file you have the rights to (`.mp3`, `.ogg`, `.wav`, `.m4a`)
into `src/assets/music/`. A small music button then appears on Page Two. Music is
**off by default** and never autoplays. With no file, no button is shown.

---

## Verification checklist

Run `npm run dev` and tick each item:

- [ ] **Gate:** page is fully black, shows exactly `enter your date to view if u are deserved or not`, with a pink glowing heart and a date field.
- [ ] **Wrong date** (e.g. `24.10.2006`, `31.02.2006`, blank): the input shakes, the message "Not quite… some doors open only with the right date. ❤️" appears, and Page Two does not appear.
- [ ] **View source / Elements tab** while gated: no "Happy Birthday" text exists in the DOM.
- [ ] **Correct date** (`25.10.2006` or `25/10/2006`): heart glows brighter, black fades, Page Two reveals.
- [ ] **Page Two:** beige background, "Happy Birthday, Nisha ♡", `quote for u my love`, the exact quote, and the message revealing sentence by sentence.
- [ ] **"A little surprise for you ↓"** smooth-scrolls to the cake.
- [ ] **Cake (idle):** whole cake visible with a clear centre cut, gently floating; below it "A little surprise, just for you…" and "Tap the cake to open your surprise ♡".
- [ ] **Tap / click / Enter / Space on the cake:** candles flicker + glow + sparkle ring, then the two halves move in opposite directions with a slight turn, and **"i love u"** appears between them.
- [ ] Hearts and sparkles drift out, then **"Replay the surprise ♡"** closes the cake and lets you run it again without reloading.
- [ ] **"One more thing ↓"** scrolls to the final section: `thanks for everything, Nisha` / `you make my final year more beautiful ♡`, the closing note, a pink heart and "Made with love, just for you."
- [ ] **Phone-width screen (~390px):** no sideways scrolling; both halves stay on screen.
- [ ] **No WebGL:** the CSS cake appears and also splits.
- [ ] **Reduced motion** (OS setting): animations are gentle and short.
