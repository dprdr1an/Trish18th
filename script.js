/* ==========================================================================
   Tricia’s 18th Birthday — Celestial Invitation
   script.js
   ========================================================================== */

/* ==========================================================================
   ✎  EVENT CONFIGURATION — EDIT EVERYTHING HERE
   --------------------------------------------------------------------------
   This is the single source of truth for the invitation. The name, date,
   time, venue, RSVP number, dress code, colour motif and parking options
   below fill every section, the countdown, the calendar events, the map
   links and the RSVP buttons automatically.

   Tokens you can use inside text:
     {name}  → celebrantName        {venue} → venueName
     {title} → eventTitle (filled)  {date}  → e.g. "December 19, 2026"

   Values written in [SQUARE BRACKETS] are treated as placeholders and are
   shown on the page as “To Be Announced”.
   ========================================================================== */
const EVENT_CONFIG = {
  // — The celebrant —
  celebrantName: "Tricia",
  eventTitle: "{name}’s 18th Birthday Celebration",
  occasionLine: "Her 18th Birthday",

  // — Date & time (24-hour clock, in the event's own time zone) —
  date: "2026-12-19",          // YYYY-MM-DD
  startTime: "18:00",          // 6:00 PM
  endTime: "23:00",            // 11:00 PM
  timeZone: "Asia/Manila",     // Philippine Standard Time (UTC+8)
  timeZoneLabel: "Philippine Time",
  utcOffsetFallback: "+08:00", // only used by very old browsers without time-zone support

  // — Venue —
  venueName: "City Garden Grand Hotel",
  venueShortLine: "{venue} · Makati",
  venueAddress: "8008 Makati Avenue corner Kalayaan Avenue, Poblacion",
  city: "Makati City, Philippines",
  mapQuery: "City Garden Grand Hotel, 8008 Makati Avenue, Makati City",

  // — Calendar event text —
  calendarDescription: "Join us for an unforgettable evening celebrating {name}’s 18th birthday at {venue}, Makati City.",

  // — RSVP —
  rsvpPhone: "09666347306",
  countryCode: "63",
  rsvpMessage: "Hello! I would like to RSVP for {title} on {date}.",
  rsvpDeadline: "[TO BE ANNOUNCED]",

  // — Attire —
  dressCode: "To Be Announced",
  colorMotif: "To Be Announced",
  attireNote: "Stay tuned for the final attire guidelines and celebration palette. ✦",
  // When the palette is final, list it here and it replaces the theme preview, e.g.
  // colorMotifSwatches: [{ name: "Navy", hex: "#0B1D49" }, { name: "Silver", hex: "#C7D1EA" }],
  colorMotifSwatches: [],

  // — Arrival & parking —
  arrivalTime: "[TO BE ANNOUNCED]",
  parkingReminder: "Parking is subject to availability. We encourage guests to plan their arrival ahead of time.",
  parkingOptions: [
    {
      name: "City Garden Grand Hotel Parking",
      type: "venue",              // "venue" or "alternative"
      icon: "hotel",              // "hotel", "parking" or "mall"
      tag: "At the venue",
      details: "On-site parking is available at City Garden Grand Hotel, subject to availability. We recommend arriving early to allow sufficient time for parking.",
      note: "",
      mapQuery: "City Garden Grand Hotel Makati",
      buttonLabel: "View Parking Location"
    },
    {
      name: "Mercedes Steel Parking",
      type: "alternative",
      icon: "parking",
      tag: "Alternative option",
      details: "An alternative parking option for guests.",
      note: "Independent facility, not affiliated with the event or the hotel. Please check current rates, hours and availability before arriving.",
      mapQuery: "Mercedes Steel Parking Makati",
      buttonLabel: "View Parking Location"
    },
    {
      name: "Century City Mall Parking",
      type: "alternative",
      icon: "mall",
      tag: "Alternative option",
      details: "Another alternative parking option for guests.",
      note: "Independent facility, not affiliated with the event or the hotel. Please check the latest parking information before arriving.",
      mapQuery: "Century City Mall Makati",
      buttonLabel: "View Parking Location"
    }
  ]
};

/* ==========================================================================
   Nothing below this line needs editing for ordinary changes.
   ========================================================================== */

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => reducedMotionQuery.matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;

  /* ------------------------------------------------------------------------
     1. TIME HELPERS (event time zone, independent of the visitor's location)
     ------------------------------------------------------------------------ */

  /** Offset in minutes between UTC and `timeZone` at the given instant. */
  function tzOffsetMinutes(date, timeZone) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    const p = {};
    dtf.formatToParts(date).forEach(({ type, value }) => { p[type] = value; });
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
    return Math.round((asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  }

  /** Converts a wall-clock date/time in `timeZone` to a real Date (UTC instant). */
  function zonedTimeToDate(dateStr, timeStr, timeZone, fallbackOffset) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    const naive = Date.UTC(y, m - 1, d, hh, mm, 0);
    try {
      const off1 = tzOffsetMinutes(new Date(naive), timeZone);
      let ts = naive - off1 * 60000;
      const off2 = tzOffsetMinutes(new Date(ts), timeZone);
      if (off2 !== off1) ts = naive - off2 * 60000;
      return new Date(ts);
    } catch (err) {
      const sign = fallbackOffset.trim()[0] === "-" ? -1 : 1;
      const [oh, om] = fallbackOffset.replace(/[+-]/, "").split(":").map(Number);
      return new Date(naive - sign * (oh * 60 + (om || 0)) * 60000);
    }
  }

  function formatInZone(date, options) {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: EVENT_CONFIG.timeZone, ...options }).format(date);
    } catch (err) {
      return new Intl.DateTimeFormat("en-US", options).format(date);
    }
  }

  /** "20261219T100000Z" */
  function toICalUTC(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  /* Testing aid: add ?now=2026-12-19T17:59:30+08:00 to the URL to pretend it is that moment. */
  const simulatedOffset = (() => {
    const param = new URLSearchParams(window.location.search).get("now");
    if (!param) return 0;
    const t = Date.parse(param);
    if (isNaN(t)) { console.warn("Ignoring invalid ?now= value:", param); return 0; }
    return t - Date.now();
  })();
  const now = () => Date.now() + simulatedOffset;

  /* ------------------------------------------------------------------------
     2. DERIVED EVENT DATA (built once from EVENT_CONFIG)
     ------------------------------------------------------------------------ */
  function isPlaceholder(value) {
    return !value || /^\s*\[.*\]\s*$/.test(String(value));
  }
  function displayValue(value) {
    if (!value) return "To Be Announced";
    if (isPlaceholder(value)) {
      const inner = String(value).trim().slice(1, -1).trim();
      return /to be announced|tba/i.test(inner) ? "To Be Announced" : inner;
    }
    return String(value);
  }

  function buildEvent(cfg) {
    const start = zonedTimeToDate(cfg.date, cfg.startTime, cfg.timeZone, cfg.utcOffsetFallback);
    let end = zonedTimeToDate(cfg.date, cfg.endTime, cfg.timeZone, cfg.utcOffsetFallback);
    if (end <= start) end = new Date(end.getTime() + 86400000); // party past midnight

    const fill = (text, extra = {}) => String(text || "")
      .replace(/\{name\}/g, cfg.celebrantName)
      .replace(/\{venue\}/g, cfg.venueName)
      .replace(/\{title\}/g, extra.title || "")
      .replace(/\{date\}/g, extra.date || "");

    const title = fill(cfg.eventTitle);
    const dateLong = formatInZone(start, { month: "long", day: "numeric", year: "numeric" });
    const weekday = formatInZone(start, { weekday: "long" });
    const timeOpts = { hour: "numeric", minute: "2-digit" };
    const startTimeText = formatInZone(start, timeOpts);
    const endTimeText = formatInZone(end, timeOpts);
    const numericParts = {};
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: cfg.timeZone, month: "2-digit", day: "2-digit", year: "numeric" })
        .formatToParts(start).forEach(({ type, value }) => { numericParts[type] = value; });
    } catch (err) { /* ignore */ }
    const dateShort = numericParts.month ? `${numericParts.month}.${numericParts.day}.${numericParts.year}` : cfg.date;

    // Phone numbers
    const digits = String(cfg.rsvpPhone).replace(/\D/g, "");
    let phoneIntl;
    if (String(cfg.rsvpPhone).trim().startsWith("+")) phoneIntl = "+" + digits;
    else if (digits.startsWith("0")) phoneIntl = "+" + cfg.countryCode + digits.slice(1);
    else if (digits.startsWith(cfg.countryCode)) phoneIntl = "+" + digits;
    else phoneIntl = "+" + cfg.countryCode + digits;
    const phoneDisplay = cfg.rsvpPhoneDisplay ||
      (digits.length === 11 && digits.startsWith("0")
        ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
        : String(cfg.rsvpPhone));

    const venueAddressShown = isPlaceholder(cfg.venueAddress) ? "" : cfg.venueAddress;
    const location = [cfg.venueName, venueAddressShown, cfg.city].filter(Boolean).join(", ");
    const mapQuery = cfg.mapQuery || location;
    const description = fill(cfg.calendarDescription);
    const smsBody = fill(cfg.rsvpMessage, { title, date: dateLong });

    const enc = encodeURIComponent;
    return {
      start, end, title, dateLong, weekday, dateShort, startTimeText, endTimeText,
      location, description, phoneIntl, phoneDisplay,
      telHref: `tel:${phoneIntl}`,
      // "?&body=" is understood by both iOS and Android messaging apps
      smsHref: `sms:${phoneIntl}?&body=${enc(smsBody)}`,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${enc(mapQuery)}`,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${enc(mapQuery)}`,
      googleCalUrl: "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        `&text=${enc(title)}` +
        `&dates=${toICalUTC(start)}/${toICalUTC(end)}` +
        `&details=${enc(description)}` +
        `&location=${enc(location)}` +
        `&ctz=${enc(cfg.timeZone)}`,
      slug: (cfg.celebrantName + "-18th-birthday").toLowerCase().normalize("NFD")
        .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      bind: {
        celebrantName: cfg.celebrantName,
        celebrantInitial: cfg.celebrantName.trim().charAt(0).toUpperCase(),
        eventTitle: title,
        occasionLine: cfg.occasionLine,
        heroDateLine: `${dateLong} · ${startTimeText}`,
        venueShortLine: fill(cfg.venueShortLine),
        dateLong, weekday, dateShort,
        timeRange: `${startTimeText} – ${endTimeText}`,
        venueName: cfg.venueName,
        venueAddress: displayValue(cfg.venueAddress),
        city: cfg.city,
        celebrationLine: `An evening celebrating ${cfg.celebrantName}’s 18th birthday`,
        countdownTarget: `${weekday}, ${dateLong} · ${startTimeText} ${cfg.timeZoneLabel}`,
        dressCode: displayValue(cfg.dressCode),
        colorMotif: displayValue(cfg.colorMotif),
        attireNote: cfg.attireNote,
        rsvpPhoneDisplay: phoneDisplay,
        rsvpDeadline: displayValue(cfg.rsvpDeadline),
        arrivalTime: displayValue(cfg.arrivalTime),
        parkingReminder: cfg.parkingReminder
      }
    };
  }

  const EVENT = buildEvent(EVENT_CONFIG);

  /* ------------------------------------------------------------------------
     3. POPULATE THE PAGE FROM THE CONFIG
     ------------------------------------------------------------------------ */
  function populate() {
    $$("[data-bind]").forEach((el) => {
      const key = el.dataset.bind;
      const value = EVENT.bind[key];
      if (value === undefined || value === null) return;
      el.textContent = value;
      const raw = EVENT_CONFIG[key];
      el.classList.toggle("is-placeholder", typeof raw === "string" && (isPlaceholder(raw) || /to be announced/i.test(raw)));
    });

    const links = { map: EVENT.mapUrl, directions: EVENT.directionsUrl, sms: EVENT.smsHref, tel: EVENT.telHref };
    $$("[data-link]").forEach((el) => {
      const href = links[el.dataset.link];
      if (href) el.setAttribute("href", href);
    });
    $$('[data-link="tel"]').forEach((el) => el.setAttribute("aria-label", el.textContent.trim().startsWith("RSVP")
      ? `RSVP by calling ${EVENT.phoneDisplay}` : `Call ${EVENT.phoneDisplay}`));
    $$('[data-link="sms"]').forEach((el) => el.setAttribute("aria-label", `RSVP by text message to ${EVENT.phoneDisplay}`));

    const google = $("#cal-google");
    if (google) google.href = EVENT.googleCalUrl;

    document.title = `${EVENT.title} · ${EVENT.dateLong}`;
  }

  /* Parking cards */
  const PARKING_ICONS = { hotel: "i-hotel", parking: "i-parking", mall: "i-mall" };
  function renderParking() {
    const list = $("#parking-list");
    if (!list) return;
    const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    list.innerHTML = EVENT_CONFIG.parkingOptions.map((opt, i) => {
      const variant = opt.type === "venue" ? "venue" : (opt.icon === "mall" ? "mall" : "alt");
      const icon = PARKING_ICONS[opt.icon] || "i-parking";
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opt.mapQuery || opt.name)}`;
      return `
        <li class="card park-card park-card--${variant} reveal" style="--d:${i * 130}ms">
          <div class="park-card__top">
            <span class="park-card__icon" aria-hidden="true"><svg><use href="#${icon}"/></svg></span>
            <div>
              ${opt.tag ? `<span class="park-card__tag">${esc(opt.tag)}</span>` : ""}
              <h4 class="park-card__name">${esc(opt.name)}</h4>
            </div>
          </div>
          <p class="park-card__details">${esc(opt.details)}</p>
          ${opt.note ? `<p class="park-card__note">${esc(opt.note)}</p>` : ""}
          <span class="park-card__spacer"></span>
          <a class="btn btn--luminous" href="${url}" target="_blank" rel="noopener"
             aria-label="${esc(opt.buttonLabel || "View parking location")}: ${esc(opt.name)} on Google Maps">
            <svg aria-hidden="true"><use href="#i-map"/></svg><span>${esc(opt.buttonLabel || "View Parking Location")}</span>
          </a>
        </li>`;
    }).join("");
  }

  /* Swatches: final palette if provided, otherwise a clearly labelled theme preview */
  const THEME_SWATCHES = [
    { name: "Midnight", hex: "#050817" }, { name: "Deep Navy", hex: "#08152F" },
    { name: "Midnight Blue", hex: "#0B1D49" }, { name: "Royal Blue", hex: "#244BCE" },
    { name: "Celestial", hex: "#6D8FFF" }, { name: "Moonlight", hex: "#C7D1EA" },
    { name: "Champagne", hex: "#D9BD83" }, { name: "Violet", hex: "#8275D6" }
  ];
  function renderSwatches() {
    const row = $("#swatch-row");
    const label = $("#swatch-label");
    if (!row) return;
    const final = Array.isArray(EVENT_CONFIG.colorMotifSwatches) && EVENT_CONFIG.colorMotifSwatches.length > 0;
    const swatches = final ? EVENT_CONFIG.colorMotifSwatches : THEME_SWATCHES;
    row.innerHTML = swatches.map((s) => `
      <li class="swatch">
        <span class="swatch__dot" style="background:${s.hex}"></span>
        <span class="swatch__name">${String(s.name).replace(/</g, "&lt;")}</span>
      </li>`).join("");
    if (final && label) label.textContent = "Celebration Palette";
    row.setAttribute("aria-label", final ? "Celebration colour palette" : "Website theme colours (not the guest dress code)");
  }

  /* Keep long names on one line on narrow screens */
  function fitNames() {
    $$(".hero__name, .farewell__name").forEach((el) => {
      el.style.fontSize = "";
      const section = el.closest("section");
      const styles = getComputedStyle(section);
      const available = section.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      const needed = el.scrollWidth;
      if (needed > available && available > 0) {
        const current = parseFloat(getComputedStyle(el).fontSize);
        el.style.fontSize = Math.floor(current * (available / needed) * 0.98) + "px";
      }
    });
  }

  /* ------------------------------------------------------------------------
     4. HERO CANOPY (draped strands of light, inspired by the ballroom ceiling)
     ------------------------------------------------------------------------ */
  function buildCanopy() {
    const host = $("#canopy");
    if (!host) return;
    const cx = 600, cy = 58, strands = isSmallScreen ? 12 : 16;
    const glow = [], a = [], b = [], c = [];
    for (let i = 0; i <= strands; i++) {
      const x = -140 + i * (1480 / strands);
      const sag = 175 + Math.abs(x - cx) * 0.18;
      const d = `M${x.toFixed(1)} -6 Q${((x + cx) / 2).toFixed(1)} ${sag.toFixed(1)} ${cx} ${cy}`;
      glow.push(d);
      (i % 2 ? a : b).push(d);
      c.push(d);
      if (i < strands) {
        const x2 = -140 + (i + 1) * (1480 / strands);
        b.push(`M${x.toFixed(1)} -6 Q${((x + x2) / 2).toFixed(1)} 70 ${x2.toFixed(1)} -6`);
      }
    }
    host.innerHTML = `
      <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMin slice" focusable="false">
        <path class="canopy-glow" d="${glow.join(" ")}"/>
        <path class="canopy-lights canopy-lights--a" d="${a.join(" ")}"/>
        <path class="canopy-lights canopy-lights--b" d="${b.join(" ")}"/>
        <path class="canopy-lights canopy-lights--c" d="${c.join(" ")}"/>
      </svg>`;
  }

  /* ------------------------------------------------------------------------
     5. SAGITTARIUS CONSTELLATION DATA
     An artistic interpretation based on approximate positions of the main
     stars of Sagittarius (the "Teapot" plus the archer's head and bow tips),
     drawn as seen in the sky with east on the left. The bow and arrow are a
     stylised overlay, not part of the star chart.
     ------------------------------------------------------------------------ */
  const CONSTELLATION = {
    viewBox: "140 30 620 530",
    stars: {
      eps:   { x: 480, y: 447, r: 4.4, name: "Kaus Australis", greek: "ε" },
      sigma: { x: 297, y: 231, r: 4.1, name: "Nunki", greek: "σ" },
      zeta:  { x: 255, y: 326, r: 3.4, name: "Ascella", greek: "ζ" },
      delta: { x: 499, y: 325, r: 3.3, name: "Kaus Media", greek: "δ" },
      lam:   { x: 458, y: 207, r: 3.1, name: "Kaus Borealis", greek: "λ" },
      pi:    { x: 212, y: 90,  r: 3.0, name: "Albaldah", greek: "π" },
      gamma: { x: 588, y: 341, r: 2.9, name: "Alnasl", greek: "γ" },
      eta:   { x: 518, y: 510, r: 2.8, name: "Eta Sagittarii", greek: "η" },
      phi:   { x: 354, y: 249, r: 2.7, name: "Phi Sagittarii", greek: "φ" },
      tau:   { x: 229, y: 267, r: 2.5, name: "Tau Sagittarii", greek: "τ" },
      xi:    { x: 283, y: 92,  r: 2.3, name: "Xi Sagittarii", greek: "ξ" },
      mu:    { x: 541, y: 91,  r: 2.2, name: "Polis", greek: "μ" },
      omi:   { x: 242, y: 109, r: 2.0, name: "Omicron Sagittarii", greek: "ο" }
    },
    // Order the stars wake up in, then the lines in drawing order
    wakeOrder: ["delta", "eps", "gamma", "lam", "phi", "sigma", "zeta", "tau", "mu", "eta", "xi", "omi", "pi"],
    lines: [
      ["gamma", "delta"], ["gamma", "eps"], ["delta", "eps"], ["delta", "lam"], ["lam", "phi"],
      ["delta", "phi"], ["eps", "zeta"], ["zeta", "phi"], ["phi", "sigma"], ["sigma", "tau"],
      ["tau", "zeta"], ["lam", "mu"], ["eps", "eta"], ["sigma", "xi"], ["xi", "omi"], ["omi", "pi"]
    ],
    bow: {
      stave: "M440 172 C520 232 525 400 470 478",
      tips: "M440 172 C436 164 438 157 447 153 M470 478 C469 488 474 494 484 494",
      string: "M440 172 L392 305 L470 478",
      arrow: "M362 300 L650 352",
      head: "M633 356 L650 352 L635.5 342.3",
      fletch: "M355.8 306 L365.9 300.7 L358.3 292.2 M363.7 307.4 L373.8 302.1 L366.2 293.6"
    },
    travel: { from: [392, 305], to: [650, 352], beyond: [780, 375] }
  };

  function buildConstellationSVG(mode) {
    const main = mode === "main";
    const S = CONSTELLATION.stars;
    const lineEls = CONSTELLATION.lines.map(([a, b], i) => {
      const delay = 700 + i * 110;
      return `<path class="c-line" pathLength="1" d="M${S[a].x} ${S[a].y} L${S[b].x} ${S[b].y}" style="--d:${delay}ms"/>`;
    }).join("");

    const starEls = CONSTELLATION.wakeOrder.map((key, i) => {
      const s = S[key];
      const core = (s.r * 1.35).toFixed(2);
      const halo = (s.r * 6).toFixed(1);
      const label = s.name.includes("Sagittarii") ? s.name : `${s.name} (${s.greek} Sagittarii)`;
      const interactive = main ? ` tabindex="0" role="button" aria-label="Star: ${label}"` : "";
      return `<g class="c-star" data-key="${key}"${interactive} style="--d:${i * 110}ms">
          ${main ? `<circle class="c-hit" cx="${s.x}" cy="${s.y}" r="22"/>` : ""}
          <circle class="c-halo" cx="${s.x}" cy="${s.y}" r="${halo}"/>
          ${main ? `<circle class="c-ring" cx="${s.x}" cy="${s.y}" r="${(s.r * 2.6 + 5).toFixed(1)}"/>` : ""}
          <circle class="c-core" cx="${s.x}" cy="${s.y}" r="${core}"/>
        </g>`;
    }).join("");

    const B = CONSTELLATION.bow;
    const bowEls = main ? `
      <g class="c-bow" aria-hidden="true">
        <path class="c-stave" pathLength="1" d="${B.stave}" style="--d:2500ms"/>
        <path class="c-tips" pathLength="1" d="${B.tips}" style="--d:3200ms"/>
        <path class="c-string" pathLength="1" d="${B.string}" style="--d:2900ms"/>
        <path class="c-arrow" pathLength="1" d="${B.arrow}" style="--d:3200ms"/>
        <path class="c-arrow" pathLength="1" d="${B.head}" style="--d:4100ms"/>
        <path class="c-arrow" pathLength="1" d="${B.fletch}" style="--d:4100ms"/>
      </g>
      <circle class="c-traveler" r="3.4" cx="${CONSTELLATION.travel.from[0]}" cy="${CONSTELLATION.travel.from[1]}"/>` : "";

    return `<svg class="${main ? "sgr-svg" : "c-bg"}" viewBox="${CONSTELLATION.viewBox}" xmlns="http://www.w3.org/2000/svg"
      ${main ? 'role="group" aria-label="The Sagittarius constellation, drawn as an archer with bow and arrow"' : 'aria-hidden="true" focusable="false"'}>
      <g class="c-lines">${lineEls}</g>${bowEls}<g class="c-stars">${starEls}</g></svg>`;
  }

  function buildConstellations() {
    $$("[data-constellation]").forEach((host) => {
      host.innerHTML = buildConstellationSVG(host.dataset.constellation);
    });
  }

  /* ------------------------------------------------------------------------
     6. STAR FIELD (canvas, three parallax layers + rare shooting stars)
     ------------------------------------------------------------------------ */
  function createStarfield(canvas) {
    if (!canvas || !canvas.getContext) return { start() {}, boost() {}, shoot() {} };
    const ctx = canvas.getContext("2d");
    const TAU = Math.PI * 2;
    const rand = (a, b) => a + Math.random() * (b - a);
    let w = 0, h = 0, layers = [], rafId = 0, running = false;
    let shooting = null, nextShoot = performance.now() + rand(4000, 8000);
    let boostFrom = 1, boostStart = 0;
    const COLORS = ["245,245,255", "245,245,255", "245,245,255", "214,224,255", "199,214,255", "255,236,200", "196,186,255"];

    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    (() => {
      const g = sprite.getContext("2d");
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.15, "rgba(200,215,255,0.65)");
      grad.addColorStop(0.45, "rgba(109,143,255,0.18)");
      grad.addColorStop(1, "rgba(109,143,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    })();

    function build() {
      const total = Math.max(200, Math.min(isSmallScreen ? 360 : 760, Math.round((w * h) / 2300)));
      const defs = [
        { share: 0.56, speed: 0.035, min: 0.3, max: 0.85 },
        { share: 0.31, speed: 0.1, min: 0.55, max: 1.25 },
        { share: 0.13, speed: 0.2, min: 0.9, max: 1.85 }
      ];
      layers = defs.map((d) => ({
        speed: d.speed,
        stars: Array.from({ length: Math.round(total * d.share) }, () => {
          const r = rand(d.min, d.max);
          return {
            x: Math.random() * w, y: Math.random() * h, r,
            a: rand(0.35, 1),
            tw: rand(0.4, 1.7),
            ph: rand(0, TAU),
            amp: Math.random() < 0.35 ? rand(0.3, 0.65) : rand(0.04, 0.15),
            c: COLORS[(Math.random() * COLORS.length) | 0],
            glow: r > 1.25 && Math.random() < 0.55
          };
        })
      }));
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1.5 : 2);
      const nw = canvas.clientWidth || window.innerWidth;
      const nh = canvas.clientHeight || window.innerHeight;
      if (nw === w && Math.abs(nh - h) < 2) return;
      w = nw; h = nh;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (!running) draw(performance.now());
    }

    function boostValue(t) {
      if (!boostStart) return 1;
      const p = Math.min(1, (t - boostStart) / 2600);
      return boostFrom + (1.12 - boostFrom) * (1 - Math.pow(1 - p, 3));
    }

    function drawShooting(t, dt) {
      if (!shooting) return;
      shooting.life += dt;
      const p = shooting.life / shooting.dur;
      if (p >= 1) { shooting = null; return; }
      const dist = shooting.speed * shooting.life;
      const hx = shooting.x + shooting.dx * dist;
      const hy = shooting.y + shooting.dy * dist;
      const len = shooting.len * Math.min(1, p * 3);
      const tx = hx - shooting.dx * len;
      const ty = hy - shooting.dy * len;
      const alpha = Math.sin(Math.PI * p);
      const grad = ctx.createLinearGradient(tx, ty, hx, hy);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, `rgba(235,241,255,${0.9 * alpha})`);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite, hx - 9, hy - 9, 18, 18);
    }

    function spawnShooting() {
      const angle = rand(148, 166) * Math.PI / 180;
      shooting = {
        x: rand(w * 0.3, w * 1.05), y: rand(-10, h * 0.42),
        dx: Math.cos(angle), dy: Math.sin(angle),
        len: rand(110, 200), speed: rand(0.7, 1.05),
        life: 0, dur: rand(750, 1150)
      };
    }

    let last = performance.now();
    function draw(t) {
      const dt = Math.min(64, t - last);
      last = t;
      ctx.clearRect(0, 0, w, h);
      const scroll = prefersReducedMotion() ? 0 : window.scrollY;
      const boost = boostValue(t);
      const animate = running;
      for (const layer of layers) {
        const offset = (scroll * layer.speed) % h;
        for (const s of layer.stars) {
          let y = s.y - offset;
          if (y < 0) y += h;
          const twinkle = animate ? 1 - s.amp + s.amp * Math.sin(t * 0.001 * s.tw + s.ph) : 1 - s.amp / 2;
          const alpha = Math.min(1, s.a * twinkle * boost);
          if (s.glow) {
            ctx.globalAlpha = alpha * 0.5;
            const g = s.r * 7;
            ctx.drawImage(sprite, s.x - g / 2, y - g / 2, g, g);
          }
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `rgb(${s.c})`;
          if (s.r < 0.9) {
            ctx.fillRect(s.x - s.r, y - s.r, s.r * 2, s.r * 2);
          } else {
            ctx.beginPath();
            ctx.arc(s.x, y, s.r, 0, TAU);
            ctx.fill();
          }
        }
      }
      if (animate) {
        if (!shooting && t > nextShoot) {
          spawnShooting();
          nextShoot = t + (isSmallScreen ? rand(11000, 20000) : rand(7000, 15000));
        }
        drawShooting(t, dt);
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running || prefersReducedMotion()) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
      draw(performance.now());
    }

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 160);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { running && (cancelAnimationFrame(rafId), running = false); }
      else start();
    });
    reducedMotionQuery.addEventListener && reducedMotionQuery.addEventListener("change", () => {
      prefersReducedMotion() ? stop() : start();
    });
    resize();
    return {
      start,
      boost() { boostFrom = 1.9; boostStart = performance.now(); if (!running) draw(performance.now()); },
      shoot() { if (running && !shooting) spawnShooting(); }
    };
  }

  /* ------------------------------------------------------------------------
     7. SCROLL: progress line + parallax (one rAF per scroll burst)
     ------------------------------------------------------------------------ */
  function initScrollEffects() {
    const bar = $(".progress__bar");
    const parallaxEls = $$("[data-parallax]").map((el) => ({ el, speed: parseFloat(el.dataset.parallax) || 0, top: 0, height: 0 }));
    let ticking = false;

    function measure() {
      parallaxEls.forEach((p) => {
        const section = p.el.closest("section") || p.el.parentElement;
        const rect = section.getBoundingClientRect();
        p.top = rect.top + window.scrollY;
        p.height = rect.height;
      });
    }

    function update() {
      ticking = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (prefersReducedMotion()) return;
      const vh = window.innerHeight;
      parallaxEls.forEach((p) => {
        if (y + vh < p.top - 200 || y > p.top + p.height + 200) return; // off-screen
        p.el.style.setProperty("--py", `${((y - p.top) * p.speed).toFixed(1)}px`);
      });
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { measure(); onScroll(); });
    window.addEventListener("load", () => { measure(); onScroll(); });
  }

  /* ------------------------------------------------------------------------
     8. SCROLL-TRIGGERED REVEALS
     ------------------------------------------------------------------------ */
  function initReveals() {
    const items = $$(".reveal");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------------
     9. OPENING ENVELOPE
     ------------------------------------------------------------------------ */
  function initOpener(sky) {
    const opener = $("#opener");
    const body = document.body;
    const main = $("#main");
    const controls = $(".controls");
    const skipLink = $(".skip-link");
    const heroHeading = $("#hero-name");
    let busy = false;

    const lockPage = (lock) => {
      body.classList.toggle("is-locked", lock);
      [main, controls, skipLink].forEach((el) => { if (el) el.inert = lock; });
    };

    function finish(fromSkip) {
      if (!opener || opener.classList.contains("is-done")) return;
      opener.classList.add("is-done");
      lockPage(false);
      body.classList.add("is-revealed");
      sky.boost();
      setTimeout(() => sky.shoot(), fromSkip ? 600 : 1200);
      setTimeout(() => { opener.hidden = true; }, 900);
      if (heroHeading) {
        heroHeading.setAttribute("tabindex", "-1");
        heroHeading.focus({ preventScroll: true });
      }
      document.removeEventListener("keydown", onKey);
    }

    function open() {
      if (busy) return;
      busy = true;
      if (prefersReducedMotion()) { finish(true); return; }
      opener.classList.add("is-opening");
      setTimeout(() => opener.classList.add("is-revealing"), 1150);
      setTimeout(() => finish(false), 2000);
    }

    function onKey(e) {
      if (e.key === "Escape") finish(true);
      if (e.key === "Tab") { // keep focus inside the opening screen
        const focusables = $$("button", opener);
        const first = focusables[0], lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    }

    // No opener (or a deep link like #rsvp): show the page straight away
    const deepLink = window.location.hash.length > 1 && document.getElementById(window.location.hash.slice(1));
    if (!opener || deepLink) {
      if (opener) opener.hidden = true;
      body.classList.add("is-revealed");
      if (deepLink) {
        const jump = () => deepLink.scrollIntoView({ behavior: "auto", block: "start" });
        requestAnimationFrame(jump);
        window.addEventListener("load", jump, { once: true });
      }
      return;
    }

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    lockPage(true);
    $("#open-invite").addEventListener("click", open);
    $("#skip-intro").addEventListener("click", () => finish(true));
    document.addEventListener("keydown", onKey);
  }

  /* ------------------------------------------------------------------------
     10. COUNTDOWN (target computed in the event time zone)
     ------------------------------------------------------------------------ */
  function initCountdown() {
    const wrap = $("#countdown-clock");
    if (!wrap) return;
    const statusEl = $("#countdown-status");
    const els = {};
    ["days", "hours", "minutes", "seconds"].forEach((u) => { els[u] = $(`[data-unit="${u}"]`, wrap); });
    const prev = {};
    let timer = 0;
    let lastLabelMinute = -1;

    function set(unit, value) {
      if (prev[unit] === value) return;
      const el = els[unit];
      el.textContent = value;
      if (prev[unit] !== undefined && !prefersReducedMotion()) {
        el.classList.remove("tick");
        void el.offsetWidth; // restart the animation
        el.classList.add("tick");
      }
      prev[unit] = value;
    }

    function showStatus(text) {
      wrap.classList.add("is-over");
      ["days", "hours", "minutes", "seconds"].forEach((u) => set(u, "00"));
      statusEl.hidden = false;
      if (statusEl.textContent !== text) statusEl.textContent = text;
      wrap.setAttribute("aria-label", text);
    }

    function tick() {
      const t = now();
      const diff = EVENT.start.getTime() - t;
      if (t >= EVENT.end.getTime()) {
        showStatus(`Thank you for celebrating with ${EVENT_CONFIG.celebrantName}. What a magical night it was ✦`);
        return; // stop ticking
      }
      if (diff <= 0) {
        showStatus("The stars have aligned — the celebration is happening now ✦");
      } else {
        const total = Math.floor(diff / 1000);
        const d = Math.floor(total / 86400);
        const h = Math.floor((total % 86400) / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        set("days", String(d).padStart(2, "0"));
        set("hours", String(h).padStart(2, "0"));
        set("minutes", String(m).padStart(2, "0"));
        set("seconds", String(s).padStart(2, "0"));
        if (m !== lastLabelMinute) {
          lastLabelMinute = m;
          wrap.setAttribute("aria-label", `${d} days, ${h} hours and ${m} minutes until the celebration`);
        }
      }
      timer = setTimeout(tick, 1000 - (now() % 1000) + 15);
    }

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) { clearTimeout(timer); tick(); }
    });
    tick();
  }

  /* ------------------------------------------------------------------------
     11. SAGITTARIUS ANIMATION & INTERACTION
     ------------------------------------------------------------------------ */
  function initConstellation() {
    const stage = $("#sgr-stage");
    const svg = $(".sgr-svg");
    const nameEl = $("#sgr-starname");
    const parallax = $("#sgr-parallax");
    if (!stage || !svg) return;
    const traveler = $(".c-traveler", svg);
    let played = false;
    let nameTimer = 0;

    function animateTraveler(onDone) {
      const { from, to, beyond } = CONSTELLATION.travel;
      const duration = 1500;
      const startT = performance.now();
      const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
      function frame(t) {
        const p = Math.min(1, (t - startT) / duration);
        let x, y;
        if (p < 0.72) {
          const q = ease(p / 0.72);
          x = from[0] + (to[0] - from[0]) * q;
          y = from[1] + (to[1] - from[1]) * q;
        } else {
          const q = (p - 0.72) / 0.28;
          x = to[0] + (beyond[0] - to[0]) * q;
          y = to[1] + (beyond[1] - to[1]) * q;
        }
        traveler.setAttribute("cx", x.toFixed(1));
        traveler.setAttribute("cy", y.toFixed(1));
        traveler.style.opacity = p < 0.08 ? p / 0.08 : p > 0.72 ? Math.max(0, 1 - (p - 0.72) / 0.28) : 1;
        if (p < 1) requestAnimationFrame(frame);
        else onDone && onDone();
      }
      requestAnimationFrame(frame);
    }

    function play() {
      if (played) return;
      played = true;
      svg.classList.add("is-awake");
      if (prefersReducedMotion()) { svg.classList.add("is-complete"); return; }
      setTimeout(() => animateTraveler(), 4500);
      setTimeout(() => stage.classList.add("has-shot"), 5200);
      setTimeout(() => svg.classList.add("is-complete"), 6200);
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { play(); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(stage);
    } else {
      play();
    }

    // Star highlight + name
    function showStar(g) {
      $$(".c-star.is-active", svg).forEach((el) => el !== g && el.classList.remove("is-active"));
      g.classList.add("is-active");
      const s = CONSTELLATION.stars[g.dataset.key];
      nameEl.textContent = s.name.includes("Sagittarii") ? s.name : `${s.name} · ${s.greek} Sagittarii`;
      nameEl.classList.add("is-shown");
      clearTimeout(nameTimer);
      nameTimer = setTimeout(() => {
        nameEl.classList.remove("is-shown");
        g.classList.remove("is-active");
      }, 2600);
    }

    function sparkleAt(clientX, clientY) {
      if (prefersReducedMotion()) return;
      const rect = stage.getBoundingClientRect();
      const x = clientX - rect.left, y = clientY - rect.top;
      for (let i = 0; i < 9; i++) {
        const sp = document.createElement("span");
        sp.className = "sgr-sparkle";
        const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 18 + Math.random() * 26;
        sp.style.left = `${x}px`;
        sp.style.top = `${y}px`;
        sp.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
        sp.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
        stage.appendChild(sp);
        sp.addEventListener("animationend", () => sp.remove(), { once: true });
      }
    }

    function starCenter(g) {
      const r = $(".c-core", g).getBoundingClientRect();
      return [r.left + r.width / 2, r.top + r.height / 2];
    }

    svg.addEventListener("pointerover", (e) => {
      const g = e.target.closest(".c-star");
      if (g && e.pointerType === "mouse") showStar(g);
    });
    stage.addEventListener("click", (e) => {
      const g = e.target.closest(".c-star");
      if (g) { showStar(g); const [cx, cy] = starCenter(g); sparkleAt(cx, cy); }
      else sparkleAt(e.clientX, e.clientY);
    });
    svg.addEventListener("focusin", (e) => {
      const g = e.target.closest(".c-star");
      if (g) showStar(g);
    });
    svg.addEventListener("keydown", (e) => {
      const g = e.target.closest(".c-star");
      if (g && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        showStar(g);
        const [cx, cy] = starCenter(g);
        sparkleAt(cx, cy);
      }
    });

    // Subtle cursor parallax on desktop
    if (finePointer && parallax && !prefersReducedMotion()) {
      let raf = 0, tx = 0, ty = 0;
      stage.addEventListener("pointermove", (e) => {
        const r = stage.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!raf) raf = requestAnimationFrame(() => {
          raf = 0;
          parallax.style.transform = `translate3d(${(tx * 12).toFixed(1)}px, ${(ty * 9).toFixed(1)}px, 0) rotate(${(tx * 0.8).toFixed(2)}deg)`;
        });
      });
      stage.addEventListener("pointerleave", () => { parallax.style.transform = ""; });
    }
  }

  /* ------------------------------------------------------------------------
     12. ADD TO CALENDAR (Google Calendar link + downloadable .ics file)
     ------------------------------------------------------------------------ */
  function icsEscape(text) {
    return String(text)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  /** Folds a content line to 75 octets (RFC 5545 §3.1), never splitting a UTF-8 character. */
  function icsFold(line) {
    const encoder = new TextEncoder();
    const out = [];
    let current = "", bytes = 0, limit = 75;
    for (const ch of line) {
      const size = encoder.encode(ch).length;
      if (bytes + size > limit) {
        out.push(current);
        current = " " + ch;
        bytes = 1 + size;
      } else {
        current += ch;
        bytes += size;
      }
    }
    out.push(current);
    return out.join("\r\n");
  }

  function buildIcs() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Celestial Invitation//Birthday Invitation//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${EVENT.slug}-${toICalUTC(EVENT.start)}@celestial-invitation`,
      `DTSTAMP:${toICalUTC(new Date())}`,
      `DTSTART:${toICalUTC(EVENT.start)}`,
      `DTEND:${toICalUTC(EVENT.end)}`,
      `SUMMARY:${icsEscape(EVENT.title)}`,
      `LOCATION:${icsEscape(EVENT.location)}`,
      `DESCRIPTION:${icsEscape(EVENT.description)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return lines.map(icsFold).join("\r\n") + "\r\n";
  }

  function downloadIcs() {
    const ics = buildIcs();
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const a = document.createElement("a");
    a.href = url;
    if (!isIOS) a.download = `${EVENT.slug}.ics`; // iOS opens the file and offers "Add to Calendar"
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), isIOS ? 60000 : 4000);
    toast(isIOS ? "Opening the calendar file — tap “Add” to save it." : "Calendar file downloaded — open it to add the event.");
  }

  function initCalendar() {
    const toggle = $("#calendar-toggle");
    const menu = $("#calendar-menu");
    if (!toggle || !menu) return;
    const wrapper = toggle.closest(".calendar");

    if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|Messenger|MicroMessenger/i.test(navigator.userAgent)) {
      const note = $(".calendar__note", menu);
      if (note) note.textContent += " If nothing happens, open this invitation in Safari or Chrome.";
    }

    const setOpen = (open) => {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) $(".calendar__option", menu).focus({ preventScroll: true });
    };
    toggle.addEventListener("click", () => setOpen(menu.hidden));
    document.addEventListener("pointerdown", (e) => { if (!menu.hidden && !wrapper.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { setOpen(false); toggle.focus(); }
    });
    $("#cal-google").addEventListener("click", () => setTimeout(() => setOpen(false), 100));
    $("#cal-ics").addEventListener("click", () => { downloadIcs(); setOpen(false); });
  }

  /* ------------------------------------------------------------------------
     13. RSVP helpers, toast
     ------------------------------------------------------------------------ */
  let toastTimer = 0;
  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-shown"), 3400);
  }

  function initRsvp() {
    const btn = $("#copy-number");
    const label = $("#copy-number-label");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const text = EVENT.phoneDisplay;
      let ok = false;
      try {
        if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; }
      } catch (err) { ok = false; }
      if (!ok) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        ta.remove();
      }
      label.textContent = ok ? "Copied ✦" : text;
      toast(ok ? `Number copied: ${text}` : `RSVP number: ${text}`);
      setTimeout(() => { label.textContent = "Copy number"; }, 2200);
    });
  }

  /* ------------------------------------------------------------------------
     14. FLOATING MENU
     ------------------------------------------------------------------------ */
  function initMenu() {
    const toggle = $("#menu-toggle");
    const menu = $("#site-menu");
    const close = $("#menu-close");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      menu.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
      if (open) $("a", menu).focus();
      else toggle.focus({ preventScroll: true });
    };
    toggle.addEventListener("click", () => setOpen(menu.hidden));
    close.addEventListener("click", () => setOpen(false));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => {
      menu.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }));
    menu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const f = $$("a, button", menu);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ------------------------------------------------------------------------
     15. OPTIONAL AMBIENT MUSIC
     A soft pad generated live in the browser (no audio files, nothing
     copyrighted). Off by default; only starts when the guest taps the toggle.
     ------------------------------------------------------------------------ */
  function initMusic() {
    const btn = $("#music-toggle");
    if (!btn) return;
    const stateEl = $(".control-btn__state", btn);
    let ctx = null, master = null, wet = null, chimeTimer = 0, on = false;

    function setup() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 1300;
      const delay = ctx.createDelay(2);
      delay.delayTime.value = 0.48;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.38;
      wet = ctx.createGain();
      wet.gain.value = 0.5;
      delay.connect(feedback); feedback.connect(delay);
      wet.connect(delay); delay.connect(master);
      lowpass.connect(master);
      master.connect(ctx.destination);

      // Cmaj9 pad: C3 G3 B3 D4 E4
      [130.81, 196.0, 246.94, 293.66, 329.63].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = i < 2 ? "sine" : "triangle";
        osc.frequency.value = freq;
        osc.detune.value = i % 2 ? 5 : -5;
        const gain = ctx.createGain();
        const level = i < 2 ? 0.14 : 0.05;
        gain.gain.value = level;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.04 + i * 0.021;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = level * 0.7;
        lfo.connect(lfoGain); lfoGain.connect(gain.gain);
        osc.connect(gain); gain.connect(lowpass);
        osc.start(); lfo.start();
      });
      return true;
    }

    function chime() {
      if (!on || !ctx) return;
      const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = notes[(Math.random() * notes.length) | 0];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
      osc.connect(g); g.connect(master); g.connect(wet);
      osc.start(t); osc.stop(t + 3.8);
      chimeTimer = setTimeout(chime, 3200 + Math.random() * 5200);
    }

    function render() {
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Background music is on. Turn music off" : "Background music is off. Turn music on");
      stateEl.textContent = on ? "On" : "Off";
    }

    btn.addEventListener("click", () => {
      if (!on) {
        if (!ctx && !setup()) { toast("Music isn’t supported in this browser."); return; }
        ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0.32, ctx.currentTime, 1.4);
        on = true;
        clearTimeout(chimeTimer);
        chimeTimer = setTimeout(chime, 1800);
      } else {
        on = false;
        clearTimeout(chimeTimer);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.35);
        setTimeout(() => { if (!on && ctx) ctx.suspend(); }, 1500);
      }
      render();
    });

    document.addEventListener("visibilitychange", () => {
      if (!ctx || !on) return;
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });
    render();
  }

  /* ------------------------------------------------------------------------
     16. START
     ------------------------------------------------------------------------ */
  function init() {
    populate();
    buildCanopy();
    buildConstellations();
    renderParking();
    renderSwatches();

    const sky = createStarfield($("#sky"));
    sky.start();

    initOpener(sky);
    initReveals();
    initScrollEffects();
    initCountdown();
    initConstellation();
    initCalendar();
    initRsvp();
    initMenu();
    initMusic();

    fitNames();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);
    let fitTimer = 0;
    window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitNames, 150); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Exposed for testing in the browser console: InvitationDebug.buildIcs(), InvitationDebug.event
  window.InvitationDebug = { event: EVENT, buildIcs, config: EVENT_CONFIG };
})();
