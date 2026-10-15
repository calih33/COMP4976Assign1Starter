// theme-ai.js: the page side of AI theming. This file comes ready-made in the starter.
// It shows the prompt box, lets you Alt-click (Option-click on Mac) parts of the page,
// checks every AI answer, and restyles the page. The AI itself lives in ai.js.

// ===== 1. The palette, the prompt box, and loading the AI =====
import { loadModel, askForColours } from "./ai.js";

// The palette the AI chooses from. Each colour: name, colour code, and a description,
// so the AI knows what each one looks like.
const PALETTE = `navy #1f3a5f deep navy blue, sky #8ecae6 light sky blue, teal #2a9d8f blue-green teal,
  forest #2d5a3d dark forest green, mint #b7e4c7 pale mint green, olive #6b705c muted olive green,
  cream #f8f1e5 warm off-white cream, sand #e9d8a6 soft sandy beige, mustard #e0a526 golden mustard yellow,
  mocha #6f4e37 medium coffee brown, chocolate #3e2723 dark chocolate brown,
  coral #f07167 warm coral pink-orange, terracotta #b04a33 earthy red-orange, burgundy #6d1a36 deep wine red,
  blush #f4c2c2 soft pastel pink, lavender #b8a9d9 soft lavender purple, plum #4a2545 dark plum purple,
  charcoal #2b2d31 near-black charcoal grey, slate #708090 cool blue-grey, white #ffffff pure white`;

// Turn "name #hex description, ..." into a map of name to hex, plus a list like "navy (deep navy blue)" for the AI.
function readColours(text) {
  const colours = {};
  const list = [];
  for (const part of text.split(",")) {
    const [name, hex, ...words] = part.trim().split(/\s+/);
    if (name && /^#[0-9a-f]{6}$/i.test(hex ?? "")) {
      colours[name.toLowerCase()] = hex;
      list.push(words.length ? `${name.toLowerCase()} (${words.join(" ")})` : name.toLowerCase());
    }
  }
  return { colours, list };
}

const { colours, list: colourList } = readColours(PALETTE);
const colourNames = Object.keys(colours);

// The box lives in a shadow root, so the page's own CSS can't change how it looks.
const host = document.createElement("div");
document.body.append(host);
const box = host.attachShadow({ mode: "open" });
box.innerHTML = `
  <style>
    form { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; width: 360px;
           font: 14px system-ui, sans-serif; background: #1f2229; color: #e9ebf0;
           padding: 12px; border-radius: 10px; display: grid; gap: 8px; }
    p { margin: 0; color: #b9bfcc; font-size: 13px; }
    input { font: inherit; padding: 8px 10px; border: 0; border-radius: 6px; }
    input:disabled { opacity: 0.5; }
  </style>
  <form>
    <p id="status">Loading AI…</p>
    <input placeholder="Describe a look, like ocean theme" aria-label="Describe a look" disabled />
    <p>Alt-click (Option-click) parts to pick them. Nothing picked = whole page.</p>
  </form>`;
const status = box.querySelector("#status");
const input = box.querySelector("input");

loadModel((p) => {
  if (p.status === "progress") status.textContent = `Loading AI… ${Math.round(p.progress)}%`;
})
  .then((device) => {
    const where = device === "webgpu" ? "graphics card" : "CPU, slower";
    status.textContent = `Ready (${where}) · ${colourNames.length} colours`;
    input.disabled = false;
  })
  .catch((error) => (status.textContent = `Couldn't load the AI: ${error.message}`));

// ===== 2. Alt-click to pick parts of the page =====
const picked = new Set();

// Walk up from what was clicked to the nearest "box" with its own background, like a whole card.
function boxOf(el) {
  while (el.parentElement && el !== document.body) {
    const bg = getComputedStyle(el).backgroundColor;
    if (bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") return el;
    el = el.parentElement;
  }
  return el;
}

document.addEventListener(
  "click",
  (e) => {
    if (!e.altKey || e.composedPath().includes(host)) return;
    e.preventDefault();
    e.stopPropagation();
    const el = boxOf(e.target);
    if (picked.has(el)) {
      picked.delete(el);
      el.style.outline = "";
    } else {
      picked.add(el);
      el.style.outline = "3px dashed #2f62d9";
    }
  },
  true,
);

// ===== 3. The checks (normal code, no AI) =====

// Small models sometimes add a word, like "sky blue" instead of "sky", or answer with a plain colour
// word like "green". Accept those too; anything else is rejected.
function toPaletteName(value) {
  const text = String(value ?? "").toLowerCase().trim();
  if (colours[text]) return text;
  const found = colourNames.filter((name) => new RegExp(`\\b${name}\\b`).test(text));
  if (found.length === 1) return found[0];
  return COLOUR_WORDS[text.replace(/s$/, "")] ?? null; // a plain word like "green" becomes forest
}

// Pull the JSON out of the AI's answer. Both colours must be names from the palette.
function parseChoice(answer) {
  const match = String(answer).match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON in the answer");
  const data = JSON.parse(match[0]);
  const background = toPaletteName(data.background);
  const accent = toPaletteName(data.accent);
  if (!background) throw new Error("not colours from the palette");
  // If the accent is missing or the same as the background, the code picks one (see buildTheme).
  const shade = ["lighter", "darker"].includes(data.shade) ? data.shade : "normal";
  const vary = data.vary === true;
  const cards = toPaletteName(data.cards); // optional: a colour just for the cards
  return {
    background,
    cards: cards && cards !== background ? cards : null,
    accent: accent && accent !== background ? accent : bestAccentFor(background),
    shade,
    vary,
    reason: String(data.reason ?? "").slice(0, 120),
  };
}

// WCAG brightness maths, used to pick black or white text, whichever reads better.
function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
function readableOn(hex) {
  const l = luminance(hex);
  return (l + 0.05) / (luminance("#111111") + 0.05) >= 1.05 / (l + 0.05) ? "#111111" : "#ffffff";
}

// Blend two colours: amount 0 = all of a, 1 = all of b. Used for "lighter" and "darker".
function mix(a, b, amount) {
  const ch = (hex, i) => parseInt(hex.slice(i, i + 2), 16);
  return "#" + [1, 3, 5]
    .map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * amount).toString(16).padStart(2, "0"))
    .join("");
}

// Pick the palette colour that stands out most against a background (for buttons).
function bestAccentFor(background) {
  return colourNames
    .filter((name) => name !== background && name !== "white" && name !== "charcoal")
    .sort((a, b) => contrastRatio(colours[b], colours[background]) - contrastRatio(colours[a], colours[background]))[0];
}

// Everyday colour words, mapped to the closest palette colour. Two-word names are checked first.
const COLOUR_WORDS = {
  "light blue": "sky", "baby blue": "sky", "dark blue": "navy", "navy blue": "navy", "royal blue": "navy",
  "light green": "mint", "dark green": "forest", "olive green": "olive", "sage green": "olive",
  "light pink": "blush", "hot pink": "coral", "dark red": "burgundy", "light purple": "lavender",
  "dark purple": "plum", "light brown": "sand", "dark brown": "chocolate", "dark grey": "charcoal",
  "dark gray": "charcoal", "off white": "cream",
  green: "forest", blue: "navy", red: "coral", maroon: "burgundy", wine: "burgundy", pink: "blush",
  peach: "coral", purple: "plum", violet: "lavender", lilac: "lavender", yellow: "mustard", gold: "mustard",
  orange: "terracotta", brown: "mocha", coffee: "mocha", tan: "sand", beige: "sand", grey: "slate",
  gray: "slate", black: "charcoal", turquoise: "teal", aqua: "teal",
};
const LIGHTER_WORDS = ["light", "pale", "soft", "pastel", "airy"];
const DARKER_WORDS = ["dark", "deep", "rich"];
// Words that don't change the meaning of a colour request.
const FILLER = new Set(["make", "it", "the", "a", "an", "my", "please", "with", "and", "use", "set", "change",
  "turn", "to", "in", "of", "i", "want", "would", "like", "some", "colour", "color", "colours", "colors",
  "background", "backgrounds", "button", "buttons", "accent", "page", "for", "on", "all", "into", "be", "card", "cards"]);

// Read a request that only names colours, like "forest greens", "navy with gold buttons"
// or "dark background with light blue buttons". Returns a choice, or null if it's not
// just colours (then the AI handles it).
function colourRequest(request) {
  let words = request.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith("s") && !FILLER.has(w) ? w.slice(0, -1) : w)); // greens -> green
  const found = []; // { name, role }
  let shade = "normal";
  for (let i = 0; i < words.length; i++) {
    const pair = `${words[i]} ${words[i + 1] ?? ""}`;
    const name = COLOUR_WORDS[pair] ?? (colours[words[i]] ? words[i] : COLOUR_WORDS[words[i]]);
    if (!name) {
      if (LIGHTER_WORDS.includes(words[i])) shade = "lighter";
      else if (DARKER_WORDS.includes(words[i])) shade = "darker";
      else if (!FILLER.has(words[i])) return null; // something other than colours: let the AI handle it
      continue;
    }
    if (COLOUR_WORDS[pair]) i++; // skip the second word of a two-word name
    const next = words.slice(i + 1, i + 3).join(" ");
    const role = /\b(button|accent)/.test(next) ? "accent" : /\b(background|page)/.test(next) ? "background"
      : /\bcard/.test(next) ? "cards" : null;
    if (!found.some((f) => f.name === name)) found.push({ name, role });
  }
  if (!found.length && shade === "normal") return null;

  let background = found.find((f) => f.role === "background")?.name;
  let accent = found.find((f) => f.role === "accent")?.name;
  let cards = found.find((f) => f.role === "cards")?.name ?? null;
  const rest = found.filter((f) => !f.role).map((f) => f.name);
  if (!background) background = rest.shift() ?? (shade === "darker" ? "charcoal" : "cream"); // "dark background with gold buttons"
  if (!accent) accent = rest.shift();
  if (!accent || accent === background) accent = bestAccentFor(background);
  if (!cards && rest.length) cards = rest.shift(); // a third colour named goes on the cards
  if (cards === background) cards = null;
  // A shade word like "dark" in "dark background" chose the colour, so don't darken it again.
  if (!found.some((f) => f.name === background)) shade = "normal";
  const cardWords = cards ? `, ${cards} cards` : "";
  return { background, accent, cards, shade, vary: false, reason: `${background}${cardWords} and ${accent} buttons, as you asked` };
}

// Backup when the AI's answer can't be used: the first colour named in the request, or null.
function colourFromRequest(request) {
  const words = request.toLowerCase().match(/[a-z]+/g) ?? [];
  for (const word of words) {
    const w = word.replace(/s$/, "");
    const name = colours[word] ? word : colours[w] ? w : COLOUR_WORDS[w];
    if (name) return name;
  }
  return null;
}

// Turn the AI's choice into real colours. The code picks the text colours, so text is always readable.
function buildTheme(choice) {
  // Lighter or darker, but back off if the result would land in a middle tone where text is hard to read.
  const base = colours[choice.background];
  const target = choice.shade === "lighter" ? "#ffffff" : "#000000";
  const amounts = choice.shade === "normal" ? [0] : [0.35, 0.25, 0.15, 0];
  const background =
    amounts.map((amount) => mix(base, target, amount)).find((c) => contrastRatio(readableOn(c), c) >= 4.5) ?? base;
  // Make buttons stand out: try nudging the accent lighter or darker until it has at least 3:1 contrast
  // with the background (the guideline for buttons), while its own text stays readable (4.5:1).
  const toward = luminance(background) < 0.2 ? "#ffffff" : "#000000";
  const options = [0, 1, 2, 3, 4, 5, 6].map((step) => mix(colours[choice.accent], toward, step * 0.12));
  const readable = options.filter((c) => contrastRatio(readableOn(c), c) >= 4.5);
  const accent =
    readable.find((c) => contrastRatio(c, background) >= 3) ?? // best: stands out and readable
    readable.sort((a, b) => contrastRatio(b, background) - contrastRatio(a, background))[0] ?? // next best
    colours[choice.accent];
  // Cards: the colour that was asked for, or else a slightly lighter or darker shade of the background,
  // so cards stand out from the page but still match it.
  const cards = choice.cards ? colours[choice.cards] : readableShade(mix(background, toward, 0.12), background);
  return {
    background, accent, cards,
    text: readableOn(background), onAccent: readableOn(accent), cardText: readableOn(cards),
    reason: choice.reason,
  };
}

// If a colour would make text hard to read, pull it back toward a safe colour until it's readable.
function readableShade(colour, safe) {
  for (let t = 0.8; contrastRatio(readableOn(colour), colour) < 4.5 && t > 0; t -= 0.2) {
    colour = mix(safe, colour, t);
  }
  return colour;
}

// One of several different shades of a colour, for "mix it up". Dark colours mostly get lighter,
// light colours mostly get darker, so every shade looks different and text stays readable.
function shadeFor(base, i, count) {
  const l = luminance(base);
  const [from, to] = l < 0.15 ? [-0.6, 0.1] : l > 0.6 ? [-0.1, 0.6] : [-0.4, 0.4];
  const amount = from + ((to - from) * i) / (count - 1); // below 0 = lighter, above 0 = darker
  return readableShade(amount < 0 ? mix(base, "#ffffff", -amount) : mix(base, "#000000", amount), base);
}

// ===== 4. Press Enter: read the request, ask the AI if needed, restyle the page =====
let lastChoice = null; // remembered so "make it warmer" can adjust it

// "Theme from my bio": read the profile's bio and interests from the page (anything marked
// data-theme-ai-bio) and ask for a theme that fits the person. The bio never leaves this device.
const BIO_REQUEST = /\b(bio|about me)\b/i;
function bioText() {
  return [...document.querySelectorAll("[data-theme-ai-bio]")]
    .map((el) => el.innerText.trim())
    .join(". ")
    .slice(0, 300);
}

box.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  let request = input.value.trim();
  if (!request) return;
  if (BIO_REQUEST.test(request) && bioText()) {
    request = `a theme that fits this person: ${bioText()}`;
  }

  const targets = picked.size ? [...picked] : [document.body];
  input.disabled = true;
  status.textContent = request.startsWith("a theme that fits this person")
    ? "Reading the bio (it stays on this device)…"
    : "Thinking…";

  // If the request only names colours, the code handles it directly. No AI needed, so it always works.
  let choice = colourRequest(request);
  if (choice) console.log("Colours named directly, no AI needed:", choice);

  // Otherwise ask the AI. Small models sometimes answer badly, so try twice, then use a backup.
  for (let attempt = 0; attempt < 2 && !choice; attempt++) {
    try {
      const answer = await askForColours(request, colourList, lastChoice);
      console.log("AI answered:", answer);
      choice = parseChoice(answer);
    } catch (error) {
      console.warn("Unusable answer:", error.message);
    }
  }
  // Backup: a colour named in the request (like "forest" or "green"), otherwise cream with mocha.
  const named = colourFromRequest(request);
  const backup = named
    ? { background: named, accent: bestAccentFor(named), shade: "normal", vary: false, reason: `${named}, from your request` }
    : { background: "cream", accent: "mocha", shade: "normal", vary: false, reason: "" };
  const theme = buildTheme(choice ?? backup);
  if (choice) lastChoice = choice;

  // Variety: the AI says if the person wants it ("mix it up", "different shades"...),
  // and the code spreads the colour from lighter to darker across the parts.
  const wantsVariety = choice?.vary || /\b(shades|different|each|vary|variety|gradient)\b/i.test(request);

  if (!picked.size) {
    // Whole page: the page gets the background, every card-like box gets the card colour
    // (or its own shade for "mix it up"), and every button gets the accent.
    applyLook(document.body, theme);
    const boxes = surfaces();
    boxes.forEach((el, i) => {
      const cards = wantsVariety && boxes.length > 1 ? shadeFor(theme.cards, i, boxes.length) : theme.cards;
      applyLook(el, { ...theme, background: cards, text: readableOn(cards) });
    });
  } else {
    // Just the picked parts.
    targets.forEach((el, i) => {
      const background = wantsVariety && targets.length > 1 ? shadeFor(theme.background, i, targets.length) : theme.background;
      applyLook(el, { ...theme, background, text: readableOn(background) });
    });
  }
  picked.clear();

  status.textContent = choice
    ? `${theme.reason} (${choice.background}${choice.cards ? ` + ${choice.cards} cards` : ""} + ${choice.accent} buttons)`
    : named
      ? `Couldn't use the AI's answer, so I used ${named} from your request.`
      : "Couldn't use the AI's answer, so a safe default was applied.";
  input.disabled = false;
  input.select();
});

// Put a look on one part of the page.
function applyLook(el, look) {
  // "important" so the colours win over Bootstrap's own styles.
  el.style.setProperty("background-color", look.background, "important");
  el.style.setProperty("color", look.text, "important");
  el.style.outline = "";

  // Bootstrap tables and cards paint their own backgrounds, so let them show the new colour.
  el.style.setProperty("--bs-table-bg", "transparent");
  el.style.setProperty("--bs-table-color", look.text);
  el.style.setProperty("--bs-card-bg", "transparent");
  for (const text of el.querySelectorAll("a:not(.btn), .text-muted, .text-dark, .card-footer")) {
    text.style.setProperty("color", look.text, "important");
  }
  for (const button of el.querySelectorAll("button, .btn, .badge")) {
    button.style.setProperty("background-color", look.accent, "important");
    button.style.setProperty("border-color", look.accent, "important");
    button.style.setProperty("color", look.onAccent, "important");
  }
}

// Card-like boxes for a whole-page theme: cards, the navigation bar, and light panels.
// Only the outermost ones, so a card inside a panel isn't painted twice.
function surfaces() {
  const all = [...document.querySelectorAll(".card, .navbar, .bg-light, .bg-white")].filter((el) => !host.contains(el));
  return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
}
