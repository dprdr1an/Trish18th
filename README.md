# Tricia’s 18th Birthday — Celestial Invitation

An interactive, animated invitation website for **Tricia’s 18th Birthday Celebration**
Saturday, December 19, 2026 · 6:00 PM – 11:00 PM (Philippine Time)
City Garden Grand Hotel, Makati City

Plain HTML, CSS and JavaScript. No frameworks, no build step, no internet connection needed to view it (fonts are bundled).

---

## 1. Opening the website

**On your computer:** unzip the folder and double-click `index.html`. It opens in your browser and everything works, including the countdown, calendar buttons and animations.

**To share it with guests** it needs to be online. The easiest free options:

- **Netlify Drop** – go to <https://app.netlify.com/drop> and drag the whole `tricia-invitation` folder onto the page. You get a link like `https://something.netlify.app` within seconds.
- **GitHub Pages** – upload the folder to a repository and turn on Pages in the repository settings.

After it is online, open `index.html` and replace `assets/og-image.jpg` in the `og:image` line with the **full** address (for example `https://something.netlify.app/assets/og-image.jpg`) so Messenger and Viber show the preview picture.

---

## 2. Project structure

```
tricia-invitation/
├── index.html          Page structure (9 sections)
├── styles.css          All styling, organised into 10 labelled sections
├── script.js           EVENT_CONFIG (edit here!) + all interactions
├── README.md           This file
└── assets/
    ├── favicon.svg            Browser tab icon
    ├── apple-touch-icon.png   Home-screen icon
    ├── og-image.jpg           Link-preview picture for Messenger/Viber/WhatsApp
    └── fonts/                 Cormorant Garamond + DM Sans (SIL Open Font License)
```

---

## 3. Changing the event details

Open **`script.js`**. The very first thing in the file is `EVENT_CONFIG`. This is the single source of truth: every section, the countdown, the Google Calendar link, the `.ics` file, the map buttons, the parking cards and the RSVP buttons read from it.

| What you want to change | Field in `EVENT_CONFIG` |
|---|---|
| Celebrant’s name | `celebrantName` |
| Event title (calendar, footer, SMS) | `eventTitle` – `{name}` is replaced automatically |
| “Her 18th Birthday” line | `occasionLine` |
| Date | `date` (format `YYYY-MM-DD`) |
| Start / end time | `startTime`, `endTime` (24-hour, e.g. `"18:00"`) |
| Time zone | `timeZone` (keep `"Asia/Manila"`) |
| Venue name / address / city | `venueName`, `venueAddress`, `city` |
| What the map buttons search for | `mapQuery` |
| Calendar description | `calendarDescription` |
| RSVP phone number | `rsvpPhone` (write it the local way, e.g. `"09666347306"`) |
| Pre-filled SMS text | `rsvpMessage` – `{title}` and `{date}` are filled in |
| RSVP deadline | `rsvpDeadline` |
| Dress code / colour motif | `dressCode`, `colorMotif`, `attireNote` |
| Final colour palette swatches | `colorMotifSwatches` (see below) |
| Recommended arrival time | `arrivalTime` |
| Parking options | `parkingOptions` (see below) |

**Placeholders:** any value written inside square brackets, such as `"[TO BE ANNOUNCED]"`, appears on the page as *To Be Announced*. Replace it with real text when you know it, for example `rsvpDeadline: "December 5, 2026"`.

### Replacing the celebrant’s name

The site already uses **Tricia**. To use a different name, change one line:

```js
celebrantName: "Tricia",
```

That updates the hero, envelope, seal initial, celebration card, farewell, footer, calendar event and SMS text.

**One extra step:** link previews (Messenger, Viber, WhatsApp) are read without running JavaScript, so the `<title>` and the three `<meta>` lines at the top of `index.html` are written out in full. If you change the name or date, update those lines too. They are marked **✎ LINK-PREVIEW TEXT**. If you want the preview picture to match, take a new screenshot of the hero at 1200 × 630 pixels and save it as `assets/og-image.jpg`.

### Dress code and colour palette

When the final dress code is decided:

```js
dressCode: "Formal — Gowns & Suits",
colorMotif: "Navy, Silver & Champagne",
attireNote: "We’d love to see you in shades of the night sky. ✦",
colorMotifSwatches: [
  { name: "Navy",      hex: "#0B1D49" },
  { name: "Silver",    hex: "#C7D1EA" },
  { name: "Champagne", hex: "#D9BD83" }
],
```

(These are only examples.) While `colorMotifSwatches` is empty, the page shows the website’s own colours, clearly labelled **“Website Theme Preview — Not the Final Guest Dress Code.”** As soon as you add swatches, they replace the preview and the label changes to “Celebration Palette”.

### Parking options

Each parking card is one entry in `parkingOptions`:

```js
{
  name: "Century City Mall Parking",
  type: "alternative",        // "venue" or "alternative"
  icon: "mall",               // "hotel", "parking" or "mall"
  tag: "Alternative option",
  details: "Another alternative parking option for guests.",
  note: "Independent facility, not affiliated with the event or the hotel. …",
  mapQuery: "Century City Mall Makati",
  buttonLabel: "View Parking Location"
}
```

Add, remove or reorder entries and the cards update automatically. The **View Parking Location** buttons open a Google Maps search for `mapQuery`.

### Wording that isn’t event data

Decorative lines (“Under a Sky Full of Stars”, “Until the Stars Align”, the farewell lines, etc.) are written directly in `index.html`. Search for **✎ EDIT WORDING** to find the hero and closing lines.

---

## 4. Testing the countdown and calendar

### Countdown

The countdown is calculated against **December 19, 2026, 6:00 PM in Asia/Manila (UTC+8)**, so it shows the same time remaining whether the guest is in Manila, Dubai or Toronto.

To preview the different states without waiting, add `?now=` to the address:

| Preview | Add to the end of the address |
|---|---|
| One minute before | `?now=2026-12-19T17:59:00%2B08:00` |
| During the party | `?now=2026-12-19T20:00:00%2B08:00` |
| After the party | `?now=2026-12-20T00:30:00%2B08:00` |

Example: `index.html?now=2026-12-19T17:59:00%2B08:00` (`%2B` is the `+` sign).
Remove `?now=…` to go back to the real time. Guests never see this unless they type it.

### Calendar

1. Scroll to **A Night to Remember** and tap **Add to Calendar ✦**.
2. **Google Calendar** opens a pre-filled event. Check it shows *Tricia’s 18th Birthday Celebration*, Sat Dec 19 2026, 6:00 PM – 11:00 PM (Philippine time; Google shows it in your own time zone if you are elsewhere), and the hotel address. Google asks you to press **Save**.
3. **Apple Calendar / Other** downloads `tricia-18th-birthday.ics` (on iPhone it usually opens as a calendar preview with an Add option instead). Open it and confirm the same details.

The `.ics` file uses UTC times (10:00–15:00 UTC = 6:00–11:00 PM Manila), so it never lands on the wrong day. It includes the required `VCALENDAR`/`VEVENT` fields, escapes commas and semicolons, and folds long lines to 75 bytes as the iCalendar standard requires.

Note: some in-app browsers (Messenger, Instagram) block file downloads. In that case the menu tells guests to open the invitation in Safari or Chrome. The Google Calendar option still works there.

### RSVP

- **RSVP via SMS** opens the messaging app with *“Hello! I would like to RSVP for Tricia’s 18th Birthday Celebration on December 19, 2026.”* addressed to +63 966 634 7306.
- **RSVP via Call** dials +63 966 634 7306.
- **Copy number** copies *0966 634 7306* (useful on computers that can’t send texts).

There is no web form, so nothing pretends to “submit”. Replies go straight to the RSVP number.

---

## 5. Features at a glance

- **Opening envelope**: the seal lifts, the flap opens, the card rises and a wave of starlight reveals the invitation. *Skip intro* or the Escape key enters immediately. Linking straight to a section (for example `…/index.html#rsvp`) skips the envelope.
- **Living sky**: a canvas star field in three parallax layers, with gentle twinkling and an occasional shooting star.
- **Ballroom hero**: draped strands of light gathered at a candlelit chandelier, small mirror balls and a crescent moon, inspired by the two reference photos.
- **Countdown**: live days, hours, minutes and seconds, with graceful “happening now” and “thank you” messages.
- **Sagittarius**: the constellation’s stars light up, its lines draw themselves, a golden bow and arrow appear, a point of light flies along the arrow, then a shooting star crosses and the figure glows. Tap or hover any star to see its name. The star layout is an artistic interpretation based on approximate positions of Sagittarius’s main stars; the bow and arrow are a stylised overlay.
- **Details, venue and parking**, with map, directions and calendar buttons.
- **Dress code** placeholders, **RSVP** card and a closing farewell section.
- **Optional music**: off by default. The note button turns on a soft ambient tone generated in the browser (no audio files, nothing copyrighted).
- **Accessibility**: keyboard friendly, visible focus rings, screen-reader labels, and **reduced-motion support** (animations are switched off for visitors who ask for less motion in their phone or computer settings).

---

## 6. Details still to confirm

These are shown as tasteful placeholders until you fill them in:

1. **Dress code** (`dressCode`) — currently *To Be Announced*
2. **Colour motif / palette** (`colorMotif`, `colorMotifSwatches`) — currently *To Be Announced*
3. **RSVP deadline** (`rsvpDeadline`) — currently *To Be Announced*
4. **Recommended arrival time** (`arrivalTime`) — currently *To Be Announced*
5. **Hotel parking details**: the site only says on-site parking is available *subject to availability*. Some third-party travel listings mention free on-site parking and valet service, but those weren’t confirmed with the hotel, so they’re not shown. Ask the hotel’s events team if you’d like to add rates, valet or reserved guest parking.
6. **Mercedes Steel Parking**: I couldn’t verify an exact address or business listing, so its button opens a Google Maps *search* rather than a specific pin. Please check the search result points to the right place before sending the invitation.
7. **Venue address**: *8008 Makati Avenue corner Kalayaan Avenue, Poblacion, Makati City* is used, which matches multiple hotel listings. (Don’t confuse it with the sister property, City Garden Hotel Makati, at 7870 Makati Avenue.) Confirm with your hotel booking.
8. **Link-preview image address**: update `og:image` once the site is hosted (see section 1).

---

## 7. Browser support

Tested in Chromium at phone (390 × 844) and desktop (1440 × 900) sizes: no console errors, no sideways scrolling, countdown, calendar file, map, SMS and call links verified. Designed for current Safari (iPhone), Chrome (Android), and desktop Chrome, Edge, Firefox and Safari.
