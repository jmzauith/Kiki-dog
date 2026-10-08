# Husky quality gates

The Husky level is the reference world for future breeds. Its build must
protect both gameplay and the new painterly art pipeline.

## Automated checks

Run `npm ci && npm run test && npm run validate:art && npm run build`.

- **Vitest** covers map, math, race, and (after integration) McCartney's
  pacing, non-math interaction, and telemetry contracts.
- **Art validation** scans all SVGs under `public/assets`. For embedded
  PNG/WebP art, it checks base64 encoding, image signatures, and end-of-file
  integrity. This catches a common failure mode of text-uploaded illustration
  assets before a player sees a missing character or landmark.
- **Build** checks TypeScript and Vite output.

The same gates run on every pull request; a passing build alone is not enough.

## Manual acceptance (not implied by green CI)

Play **both safe and challenge routes** in a real browser and on a Chromebook.
Count required math questions (target 5–6), time active gameplay separately
from idle time, and confirm at least 10 meaningful non-math interactions are
available. Inspect the race in motion: gait, ear/head/body reactions, paw/sled
contact, terrain response, foreground parallax, and snow FX. Ensure Kiki and
Bolt do not appear to slide as static images. Check optional igloo/bone-cache
discoveries, save/resume, reward, and sticker album.

A 10–15-minute child-paced adventure is a **playtest target**, not a verified
duration until real sessions have been timed. No automatic test can certify
animation feel.
