# Visual Reset — Environment Direction

**Status:** concept / approval sprint. Mockups only — nothing is implemented
in the game yet. These must be approved by João, Aurora and Olivia first.

**Mockups:** `docs/visual-reset/harrison/`
- `snowy-peaks-exploration.svg` — Screen 1: exploration
- `bridge-encounter.svg` — Screen 2: environmental math encounter
- `husky-sled-race.svg` — Screen 3: the sled race, rethought

**Goal:** keep the much-improved Phaser gameplay mechanics, but replace
almost the entire visual layer so the game feels like the original HTML
prototype the girls loved — prettier, more charming, more illustrated, more
colorful, cleaner, more like a real children's game — while aiming to
surpass it.

---

## 1. What changed from the current Phaser art

- **From icon-on-background to illustrated place.** The current style places
  individual SVG props on flat gradient backgrounds with lots of empty
  space. The new direction composes complete scenes first: sky, mountains,
  forest bands, hills, and foreground framing are all painted as one
  continuous environment.
- **From primitive geometry to storybook shapes.** Circles-and-lines nodes,
  flat vector icons, and technical-looking markers are gone. Interactables
  are part of the world: a wooden sign carries the math question, answer
  choices are stones on the ground, the race is a real side-scrolling scene.
- **From tiny Kiki to hero Kiki.** Kiki was a small icon crossing a giant
  map. She is now large, expressive, and emotionally present — the camera's
  subject, not a token.
- **From generic to specific.** Snowy Peaks now has a visual identity:
  layered blue mountains, snowy pine clusters, winding trails with paw
  prints, a glowing ice palace on the horizon. It looks like *somewhere*,
  not like a template.
- **UI becomes part of the world.** No white worksheet panels, no floating
  generic buttons. The math prompt hangs from a wooden signpost; answers
  are tappable stones; race choices are bold game banners anchored to the
  scene. Educational components feel like gameplay.

## 2. What was preserved from the original HTML feeling

- **Charm and polish over realism.** Soft rounded forms, expressive
  character faces (big eyes, blush, happy tongue), gentle gradients.
- **Rich, controlled color.** Saturated but harmonious — the HTML version's
  confident color is kept, disciplined into a per-world palette.
- **Intentional composition.** Every screen has a clear subject, a clear
  path for the eye, and a destination that creates longing (the ice palace
  glowing on the horizon).
- **Clean readability.** Despite the richness, interactables are always
  obvious: the broken bridge, the glowing answer stone, the two race
  choices. Nothing important hides in decoration.
- **Kiki's appeal.** The corgi design keeps what the girls loved — big
  ears, white blaze, happy expression — refined into a consistent,
  animatable construction.

## 3. Palette (Snowy Peaks)

- **Sky:** `#5ea9e6 → #a5d4f5 → #d8ecfb` — bright, optimistic, never gloomy.
- **Mountains far → near:** `#b9cdea → #8ba9d4` — atmospheric perspective
  does the depth work, not fog overlays.
- **Snow:** `#ffffff → #d9e9fa` — cool white with blue shadows.
- **Pines:** `#3d7a52 / #356b46` with `#ffffff` snow — deep storybook green.
- **Trail:** `#f0dfb2` with `#c9a86a` edge — warm sand against cool snow.
- **Wood:** `#b07a3e → #7a4f2a` — warm, hand-crafted.
- **Accents:** `#ffd24d` (gold, for magic/important), `#e2574c` (red, for
  energy/flags), `#4c8de2` (blue, for choices/UI).
- **Kiki:** `#e8963f` orange, `#fff6ea` cream, `#f2a0a0` inner ear/blush.

## 4. Lighting

- **Bright, friendly daylight.** The HTML version's warmth is kept; Snowy
  Peaks is reframed from "cold and stark" to "crisp winter morning."
- **One sun, soft glow.** A warm sun disc with a radial glow; no harsh
  shadows. Characters get a soft blue ellipse shadow that grounds them.
- **Glow = meaning.** Golden glow marks the important: the distant palace,
  the repair preview on the bridge, the correct-feeling answer stone.
  Glow is a language, not decoration.
- **Atmospheric perspective** (paler with distance) instead of fog banks.

## 5. Terrain treatment

- **Rolling snowfields**, not flat planes — overlapping hill shapes with
  soft blue shadows create the ground.
- **The trail is a ribbon**, drawn with varying width and a darker edge,
  with paw prints baked in. It winds through the composition and *breaks*
  where the world needs the player (the gorge).
- **Gorges and crossings are events**, not obstacles drawn as icons — the
  chasm is a jagged crack in the snowfield with snow lips and depth shards.
- **Water** (where it appears) is painted with soft highlights, not
  geometric waves.

## 6. Visual hierarchy

1. **Kiki** — largest character, warmest color, always the focal point.
2. **The current objective** — the broken bridge, the race choice — high
   contrast, centered or on the eye's path.
3. **The destination** — palace, checkered flag — glowing, on the horizon,
   creating forward pull.
4. **The path** — leads the eye from Kiki to the objective to the
   destination.
5. **Decoration** — pines, clouds, birds — frames the scene, never
   competes.

## 7. UI integration philosophy

**The world is the interface.** Every UI element should be justifiable as
something that exists in Kiki's world:

- Math question → a wooden signpost (carved/painted, hanging from a post).
- Answers → stones on the ground (tappable, with a glow on hover/selection).
- Choices (Steady/Turbo) → bold banners anchored low in the frame, styled
  like game signage, not system dialogs.
- Progress → the world itself (trail traveled, palace getting closer),
  plus minimal chrome (title plaque, settings).
- Feedback → environmental: ghost planks preview the repaired bridge;
  snow spray and speed lines sell the race; Kiki's face reacts (worried,
  determined, joyful).

**Never:** white modal panels, worksheet layouts, floating generic buttons,
technical node graphs, progress bars that look like loading screens.

## 8. Parallax / depth plan (for the Phaser rebuild)

The mockups are composed in explicit depth layers that map directly to
Phaser parallax:

| Layer | Scroll factor | Content |
|---|---|---|
| Sky | 0 | Gradient, sun, clouds (slow drift) |
| Far | 0.15 | Pale mountain silhouettes |
| Mid | 0.35 | Saturated mountains, ice palace, pine bands |
| World | 1.0 | Hills, trail, Kiki, bridge, interactables |
| Foreground | 1.0 (depth 14+) | Snowbanks, pine boughs, speed streaks |

Foreground framing (boughs top-left, snowbank bottom) gives the
"looking into a world" feeling the HTML version had. Speed is sold with
foreground streaks + background motion, not with UI.

## 9. From mockup to modular Phaser assets

The mockups are compositions, but they are built from repeatable pieces —
that is deliberate. The production path:

1. **Extract the vocabulary:** pine cluster (3 sizes), mountain silhouette
   (2 palettes), snow hill, trail ribbon segment, wooden plank, stone,
   signpost, Kiki (shared rig with facial variants), husky, sled.
2. **Keep the painterly feel in vector:** the mockups use layered flat
   shapes with soft gradients — this translates directly to SVG/texture
   work without losing charm. No raster painting required.
3. **Kiki as a proper character rig:** one body construction, swappable
   faces (happy / worried / determined / proud), attachable props (scarf).
   Ringo's animation pass builds on this, not on the old icon.
4. **Scenes compose, not decorate:** the future Snowy Peaks scene is built
   by laying down the same layers as the mockup (sky → far → mid →
   world → foreground), then placing encounters on the trail.

## 10. The same language for Golden Retriever and future worlds

The art language is **structural, not paletted**. Every world uses:

- Illustrated continuous environments (never props on blank backgrounds)
- Hero-scale Kiki with expressive faces
- World-as-interface (signs, stones, banners — never modals)
- Explicit depth layers with foreground framing
- A glowing destination on the horizon
- Glow = meaning, warmth = welcome

What changes per world is the **content vocabulary and palette**:

| | Snowy Peaks | Golden Bay (future) |
|---|---|---|
| Palette | Cool blues, white, deep green | Warm greens, turquoise, sand gold |
| Silhouettes | Pines, peaks, ice | Willows, oaks, reeds, water |
| Destination | Ice palace | Retriever club / bay |
| Challenge | Sled race | Rescue relay |
| Kiki's mood | Determined explorer | Joyful swimmer |

Same grammar, different story. A player should feel "this is Kiki's
world" in every breed world, and "this place is completely different"
at the same time.

---

*These three mockups are the bar. If the girls don't prefer them to both
the current Phaser graphics and the old HTML version, the direction is
wrong and we iterate — we don't proceed to production.*
