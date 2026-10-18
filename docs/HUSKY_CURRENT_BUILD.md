# Husky current-build index

> **Current implementation report / entry point — 17 October 2026.** [Astra final refinement, exact browser evidence and Roady handoff](HUSKY_FINAL_REFINEMENT.md). Frozen for independent QA and family review, not final production acceptance.

## Baseline and deployment

| Identity | Current value |
|---|---|
| Candidate branch | `feature/husky-final-refinement` |
| Frozen gameplay SHA | [`7a9f741fe705f919f06c29e291718c6c443aa892`](https://github.com/jmzauith/Kiki-dog/commit/7a9f741fe705f919f06c29e291718c6c443aa892) |
| Local equivalent | `60a9913c1f1d498e6f1949399065255b85335ee6` |
| Exact shared tree | `6241586687bd534792645e47abd959c9ea9d8ccd` |
| Start | Local `8a7eab8367ee39941aff4622856efb9a9dbe5fd1`, identical tree to published `49d54e426dcd2d15dafb4ae0ad744a84c8b1bf6b` |
| Integration / last recorded Pages build | `integration/husky-premium-polish` at `6411c6fa36ff827465be15aeef96119237990378`; [recorded deployment](https://github.com/jmzauith/Kiki-dog/actions/runs/38778839637). Not freshly redeployed or browser retested |
| Deployment configuration | [deploy.yml](../.github/workflows/deploy.yml) still targets integration. Unchanged; this candidate is not deployed by it |
| Local environment | `http://127.0.0.1:5177/?playtest=1`, while Vite runs; durable profile-scoped saves |

Following documentation/evidence commits do not change the frozen code identity. Connector publication produces different local/GitHub metadata; exact trees were compared. Main was not merged.

## Authoritative references

- [Refinement report, minigame audit and Roady instructions](HUSKY_FINAL_REFINEMENT.md)
- [Current screenshot/telemetry index](qa/final-refinement/README.md)
- [Gameplay and reward rules](HUSKY_REWARD_RULES.md)
- [Live finale versus generic quiz](BREED_FACTS_QUIZ_SYSTEM.md)
- [Storage, replay and migration](PLAYER_PROFILES_AVATARS_AND_SAVES.md)
- [Canonical direction, active art and depth](HUSKY_ART_AND_DEPTH_STATUS.md)
- [Family requests and delivery ledger](HUSKY_DELIVERY_EVIDENCE.md)
- [Single prioritized backlog](HUSKY_REMAINING_WORK.md)
- [Document classifications](HUSKY_DOCUMENT_REGISTER.md)

## Implemented and integrated

Profile selection; continuous Snowy Peaks; adaptive fading paw guidance and first-profile packing tutorial; map; live three-slot bridge; painted five differences; Safe lake/path/tree or Challenge enterable cave with friendly Yeti; marker memory; optional igloo/six-pair memory/bonus and Golden Bone; **Lantern Trail Memory 3/4/5** replacing Lights-Out; camp strategy/packing; Bolt race with four physical activities, explanations, defeat/rematch; breed reading/three-question quiz; animated natural-color gold-framed Husky album.

Math supports addition, subtraction, multiplication and occasional exact division, equation/story/missing-number/grouping/sharing formats, bridge warm-up and harder Challenge/Turbo bounds. Profile-scoped `math:history:v1` suppresses recent facts across reload/replay. Clean successful routes still use six required questions; Yeti's optional three correct practice questions and failed attempts add presentations only when chosen/needed.

Golden Husky requires adventure/race completion plus three correct fixed breed-finale answers, retries allowed. Eight mastery points are obsolete. Replay retains quiz, sticker, Bone, tutorial and math history; resets adventure/race/run activities. Complete-body frames render exploration; articulated rigs are not re-exposed. Most puzzles remain boards, and depth integration remains partial despite all 14 images / 13 JSON being present.

## Browser validation and limitations

Astra completed an initial Safe route with optional Bone/igloo on intermediate checkpoints, a new-profile Challenge route including Yeti, loss/rematch, quiz retry/partial reload, album and reward reload, then a complete final-code Safe replay and reward reload. Challenge's only mid-run change was Yeti CSS framing; Safe replay traversal ran entirely on the frozen code. [Exact scope](HUSKY_FINAL_REFINEMENT.md#final-combined-build-browser-validation). These are not two brand-new runs begun after the SHA freeze. Independent Roady QA, physical touch, new-child navigation, final-art approval and production-template acceptance remain pending.

**498 tests / 34 files, TypeScript and production build pass on frozen code.** Existing bundle warning remains. Final Safe: six math, 18 interactions, 0 new discoveries, 3 turns / 4 beats; 9m28 active, total contaminated by an earlier idle pause. Challenge: 16 presentations including optional practice and intentional misses, 17 interactions, 0 discoveries, 8 race turns including 5 forfeits; 13m39 active. These are QA timings, not adult fast-play measurements. Telemetry ends before finale/album.
