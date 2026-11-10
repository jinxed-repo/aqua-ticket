# Aqua Ticket

A one-screen web app for Mumbai Metro Line 3 (the Aqua Line). The user speaks a trip ("BKC", "चर्चगेट वरून घरी", "do log worli se cuffe parade"). The app works out the two stations and the number of people, then opens ixigo's metro booking page with everything filled in. The user only taps Proceed to Pay and pays with PhonePe.

**Read `HANDOFF.md` first if it exists.** It has the user's context, what has been decided, and the next steps. It is gitignored on purpose, so it stays out of the public repo.

## Files

- `index.html`: the whole app. Plain HTML, CSS and JS, with no build step and no dependencies.
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`: these let the app be added to a phone's home screen.
- `tests/engine-test.cjs`: run `node tests/engine-test.cjs`. It prints how sample phrases are understood.

## How index.html is organised

- **`Engine`**, between `/*ENGINE-START*/` and `/*ENGINE-END*/`: the station list (ids 1–27, north to south) and the speech-to-stations logic.
  - `interpret(text, {home, origin, dest})` returns `{ok, origin, dest, ask}`. `ask` is set when the phrase is ambiguous ("bandra", "airport").
  - `ixigoUrl(o, d, pc)` builds the hand-off link.
  - Each station has `lat` (romanised) and `dev` (Devanagari) aliases. Direction words decide which station is the start and which is the end: se/hun/वरून/पासून/से mean "from", la/tak/ला/पर्यंत mean "to". "home/ghar/घरी" means the user's saved home station.
  - Misheard romanised names are matched fuzzily (80% similarity).
- **`Extra`**: station coordinates, used to pick the nearest station from GPS within 1.5 km, and spoken passenger counts ("2 jan", "do log", "दोन जण").
- **UI**: one big talk button.
  - It uses the browser's speech recognition (`webkitSpeechRecognition`) when available. Otherwise it shows a text box.
  - `?q=<text>` in the URL skips listening and handles that text directly. The iPhone Shortcut uses this.
  - After it understands, a 1.8 s progress bar runs, then it opens ixigo. The user can stop it with "Change". This can be switched off in Settings.
  - Settings (home station, voice language, auto-listen, use GPS, auto-go) are kept in `localStorage` under keys starting `aqt.`.

## ixigo hand-off link (found by testing, not officially documented)

`https://www.ixigo.com/book-metro-ticket/?cCode=std:022&rb=preFill&origin=<name>&dest=<name>&pc=<1-6>`

- `rb=preFill` is required.
- `origin` and `dest` are search text that ixigo matches against its station names and aliases. The station *codes* (`oc`/`dc`) are unreliable: Aqua Line codes 1–27 clash with Line 1/2A/7 codes, and ixigo resolves a code to the first station it finds with that code, which is often wrong.
- Every Aqua station was tested in Oct 2026 and resolves correctly using the `q` value in `Engine.S`, except **Marol Naka**. Its name also exists on Line 1, and ixigo picks the wrong one, so the app leaves it blank and shows a note telling the user to pick it.
- ixigo's station list: `GET https://www.ixigo.com/ondc/v1/metro/stations?cityCode=std%3A022`. The Aqua Line's provider code is `MMRCL`.

## Constraints

- The app cannot pay and must never try to. Payment happens in ixigo, then PhonePe, with the user's UPI PIN (the PIN for India's bank-to-bank payment system).
- Hosting must be https, otherwise the microphone and GPS are blocked. claude.ai artifact pages block the microphone, which is why the app lives on GitHub Pages.
- Keep it to a single file with no build step, so it stays easy to edit and host.
