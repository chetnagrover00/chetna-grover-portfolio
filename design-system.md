# The Design System

The rules the paper keeps to itself: a tight palette, three working typefaces, and a set of parts meant to be reused rather than reinvented.

**Three voices · Two accents · One paper.** All tokens live in `:root` in `prophet.css`.

---

## 01 · Colour

Two paper tones, three inks that form a single text hierarchy, one rule line, and exactly two accents. Gold is ornament; red is the only signal colour — it marks the **AI**, the wax seal and the primary call to action, and nothing else.

### Surfaces
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#ECE4CE` | Base newsprint |
| `--paper-lit` | `#F5EFDB` | Lifted paper, insets, QR |
| `--paper-edge` | `#D6CAA6` | Stained torn edge |

### Ink — one hierarchy
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#1C1811` | Primary — headlines, key text |
| `--ink-2` | `#3A3225` | Secondary — body copy |
| `--ink-3` | `#6B5D42` | Tertiary — captions, meta |
| `--rule` | `#262016` | Every hairline & border |

### Accents — only two
| Token | Hex | Use |
|---|---|---|
| `--gold` | `#C0983A` | Ornament: crest, stars, dividers |
| `--red` | `#7C1F1A` | Signal: the AI, wax seal, CTA |

---

## 02 · Typography

Three working voices carry every page. Two more faces are reserved as *marks* — used in exactly one role each, never for running text.

### Working voices
| Role | Face | Token | Where it's used |
|---|---|---|---|
| Display | **Anton** | `--f-display` | Every large word — hero lines, section headlines, inline navigation words. Condensed, high-impact, always uppercase. |
| Serif | **Old Standard TT** | `--f-serif` | Body copy, taglines (italic), drop-caps and emphasis. The reading voice. |
| Label | **Oswald** | `--f-label` | Small uppercase furniture: kickers, nav, captions, buttons. Tracked out. |

### Reserved marks
| Role | Face | Token | Where it's used |
|---|---|---|---|
| Wordmark | **Pirata One** | `--f-wordmark` | The masthead name only — a blackletter brand lockup. Never body text. |
| Script | **Tiro Devanagari** | `--f-deva` | Hindi text only — a script extension of the serif so bilingual lines sit together. |

### Display scale (Anton)
| Level | Size |
|---|---|
| Hero | 52px |
| Headline | 38px |
| Nav word | 28px |
| Sub | 20px |

---

## 03 · Components

The parts every page is assembled from. Build with these rather than restyling from scratch — the look stays consistent because the part is shared.

- **Moving Photograph** — `figure.photo > .frame > img.living`
  Any image dropped in is treated the same: black-and-white film grade, faint scanlines, and a slow living sway that speeds up on hover. Never style images loose.

- **Section Head** — `.kicker + .exhead`
  A tracked Oswald kicker over an Anton title. The kicker names the section; the title carries it.

- **Inline Navigation Word** — `a.huge`
  Navigation hidden inside prose as printed ink — no underline, no colour shift; on hover the ink presses into the paper. Reserved for real links to other pages.

- **Button / Call to Action** — `.owlbtn`
  Solid ink block, Oswald caps. One button style everywhere; hover fills with the red signal colour.

- **Rules & Dividers** — `.rule` / `.rule.thick` / `.fleuron`
  Hairline, thick, and the gold fleuron ornament (`✦ ❦ ✦`). Structure the page with rules before reaching for boxes.

- **Footer** — `.indexbar + .colophon`
  The same index bar (gold `✦` separators, Oswald caps) and single signed colophon line close every page.

---

## Page-specific interactions

Beyond the shared parts, several pages carry one signature interaction (all in `prophet.js`, gated on a page-specific id):

- **Work / `projects.html`** — the Pensieve (`#pensieve`): drag a newspaper clipping into the basin to enter a project memory.
- **Experience / `experience.html`** — footprints (`#path`) that walk in on scroll or hover.
- **Skills / `skills.html`** — the hat atelier (`#atelier`): click a hat to wear it on the illustrated figure and read the lesson.
- **AI / `ai.html`** — the Enchanted Lens (`#lensroom`): drag a brass magnifier to reveal hidden ink.
- **Contact / `contact.html`** — the letter that folds, sinks and seals with a wax `CG`.
