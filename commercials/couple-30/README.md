# Couple — :30 spot

Empty-nester seller spot. Eight shots, 30.0s on the nose, built to run as a
CTV/OTT pre-roll or mid-roll.

| File | What it is |
|------|------------|
| `storyboard.md` | Shot list, timing map, VO script, on-screen text, shot-generation prompts |
| `couple_30_template.json` | Creatomate source — same shape as `6_scene_template.json` and `netlify/functions/templates/real_estate.js` |
| `modifications.example.json` | Every replaceable field, filled in with example values |
| `render.js` | Posts the template to Creatomate and polls until the mp4 is ready |

## Render it

```bash
# Timing check against the Creatomate demo clips — no footage needed
node commercials/couple-30/render.js

# With real footage and a real agent
node commercials/couple-30/render.js commercials/couple-30/modifications.example.json
```

Reads `CREATOMATE_API_KEY` from the repo root `.env`, same as the `test-*.js`
scripts.

## Replaceable fields

Creatomate keys modifications by element name, so anything below can be
swapped per agent without touching the template.

- `Video-1.source` … `Video-8.source` — the eight shots, in storyboard order
- `Music.source` — bed track
- `Voiceover.text` — full read (`Voiceover.voice` to change the voice)
- `Market-Stat.text` — the one factual claim in the spot
- `Endcard-Headline.text`, `Endcard-Contact.text`

To drop the market stat when there's no current MLS number for the farm area,
send `"Market-Stat.text": ""` rather than leaving a stale figure on screen.

## Notes on the build

- Raw scene durations total 34.2s and the seven 0.6s transitions overlap, so
  the finished spot is exactly 30.0s. Changing any scene duration means
  rebalancing the rest — the timing map in `storyboard.md` has the arithmetic.
- Motion is limited to 5–8% slow scales and one pan. This spot is carried by
  the cut and the VO, so the kinetic sweep overlay used in the other templates
  is deliberately absent — it reads as a sales gimmick against this material.
- The endcard holds over the final shot instead of cutting to a card, which
  keeps the phone number on screen for 3.2s while the story is still resolving.
- The `text-to-speech` voice is a placeholder for pacing. Book a real read for
  anything that goes to air; this audience hears synthetic VO immediately.
