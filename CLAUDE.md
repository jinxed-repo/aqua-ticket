# Aqua Ticket

A one-screen web app for Mumbai Metro Line 3 (the Aqua Line). The user speaks a trip ("two tickets to CSMT", "BKC return", "चर्चगेट वरून घरी", "do log worli se cuffe parade"). The app works out the two stations, the number of tickets and single or return, and shows them on a confirm screen where each part can be corrected. The user then taps one of two pay buttons: ixigo with the trip filled in, or the official WhatsApp ticket bot. Payment happens there, in the user's own UPI app.

**Read `HANDOFF.md` first if it exists.** It has the user's context, what has been decided, what was tested, and the next steps. It is gitignored on purpose, so it stays out of the public repo.

## Files

- `index.html`: the whole app. Plain HTML, CSS and JS, with no build step and no dependencies.
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png`: these let the app be added to a phone's home screen.
- `tests/engine-test.cjs`: run `node tests/engine-test.cjs`. It checks about 65 phrases and exits 1 if any is understood wrongly. Pass a phrase as an argument to see how that one phrase is understood. Add a check whenever a real phrase is misunderstood.

## How index.html is organised

- **`Engine`**, between `/*ENGINE-START*/` and `/*ENGINE-END*/`: the station list (ids 1–27, north to south) and all the phrase understanding. The test file loads only this block, so it must stay self-contained.
  - `interpret(text, {home, origin, dest})` returns `{ok, origin, dest, ask, said, count, over, ret, score}`.
    - `ask` is set when a name is ambiguous ("bandra", "airport").
    - `said` tells which ends of the trip the speaker named. The other end was filled in from the context.
    - `count` is the number of tickets (1–6), or null when not said. `over` means they asked for more than 6.
    - `ret` is true for a return ticket, false for an explicit single, null when not said.
    - `score` lets the UI pick the best of several speech alternatives.
  - Each station has `lat` (romanised names, landmarks and likely mishearings) and `dev` (Devanagari) aliases. Direction words decide which station is the start and which is the end: se/hun/वरून/पासून/से mean "from", la/tak/ला/पर्यंत mean "to". "home/ghar/घरी" means the user's saved home station.
  - Station names are matched in three passes, in `findMentions`: exact alias, then names that arrived in pieces or spelled out ("sid hi vinayak", "see SMT", "be kay see"), then close spelling or same sound (80% similarity, or an equal `pkey`).
  - `details` reads the ticket count and trip type from the words that are not station names. "return" counts as a ticket type in "two return tickets" and "Dadar return", but not in "return to Dadar" or "return home".
  - `ixigoUrl(o, d, pc)` and `waUrl()` build the two hand-off links.
- **`Extra`**: station coordinates, used to pick the nearest station from GPS within 1.5 km.
- **UI**: a talk button, then a ticket card (`#confirm`).
  - It uses the browser's speech recognition (`webkitSpeechRecognition`) when available. Otherwise it shows a text box.
  - `?q=<text>` in the URL skips listening and handles that text directly. The iPhone Shortcut uses this.
  - The first phrase creates the trip. Anything said or typed while the card is showing changes only the parts that were said ("three tickets", "from Dadar", "make it return").
  - On the card, From and To are native pickers hidden under the station name, tickets is a stepper, and trip is Single or Return. Nothing opens until the user taps a pay button.
  - After a pay button is tapped, the trip is saved as `aqt.last`, and the start screen offers "Trip back" and "Again" chips.
  - Settings (home station, voice language, auto-listen, use GPS) are kept in `localStorage` under keys starting `aqt.`.

## Hand-off links

### ixigo (found by testing, not officially documented)

`https://www.ixigo.com/book-metro-ticket/?cCode=std:022&rb=preFill&origin=<name>&dest=<name>&pc=<1-6>`

- `rb=preFill` is required.
- `origin` and `dest` are search text that ixigo matches against its station names and aliases. The station *codes* (`oc`/`dc`) are unreliable: Aqua Line codes 1–27 clash with Line 1/2A/7 codes, and ixigo resolves a code to the first station it finds with that code, which is often wrong.
- Every Aqua station was tested in Oct 2026 and resolves correctly using the `q` value in `Engine.S`, except **Marol Naka**. Its name also exists on Line 1, and ixigo picks the wrong one, so the app leaves it blank and shows a note telling the user to pick it.
- ixigo sells single-journey tickets only, and it needs a logged-in account at the payment step. Its servers refuse calls that do not come from its own site, so the app can only open the page, never call ixigo in the background.

### Official WhatsApp bot

`https://wa.me/919873016836?text=Hi` opens the chat with "Hi" typed. The bot replies with a Buy Ticket link to a page on `transit.pelocal.net`. That link is issued per session and expires, and the page takes no trip details from its address, so the user picks the stations again there. It needs no login.

## Constraints

- The app cannot pay and must never try to. Payment happens in ixigo or on the official WhatsApp page, in the user's UPI app, with the user's UPI PIN (the PIN for India's bank-to-bank payment system).
- Do not call ixigo's or the WhatsApp page's private booking or payment systems from the app. Open their pages for the user instead. Booking through our own back end is only possible for a registered ticket seller on ONDC (the government's open network for ticket sellers).
- Hosting must be https, otherwise the microphone and GPS are blocked. claude.ai artifact pages block the microphone, which is why the app lives on GitHub Pages at `https://jinxed-repo.github.io/aqua-ticket/`.
- Keep it to a single file with no build step, so it stays easy to edit and host.
