> **Documentation status — current implementation report; classified 16 October 2026.** [Current-build index](HUSKY_CURRENT_BUILD.md) · [Reconciled remaining work](HUSKY_REMAINING_WORK.md). 9b5d451: focused recovery/practice checks, not a fresh full-route acceptance.

# Math feedback and competitive race recovery

- First wrong answer: visible retry text and counting hint, one attempt remains.
- Second wrong answer: worked multiplication answer using repeated addition, followed by a new problem.
- Race: two misses forfeit that turn, Kiki stays stationary, Bolt advances one of five spaces. Continued failed turns can produce a Bolt victory. Defeat awards no completion or sticker, and Race again resets only race progress.
- One miss then a correct answer still earns the chosen movement. Successful math stages continue the existing three-stage race structure.
- World encounters use the same explanation and fresh-question recovery without losing adventure progress.
- Checkpoints include all attempted turns and accept a defeated rival position. Victory totals include failed turns. Retry questions do not repeat the exact failed prompt.
- Development-only `?racepractice=1` starts the actual race against an ephemeral memory store; it does not select or change player saves.

## Validation

484 tests, TypeScript and production build passed. Existing Vite bundle-size warning remains.

Browser: first miss feedback; two misses explanation; five consecutive forfeited turns; different replacement questions; stationary Kiki and Bolt advancing; Bolt defeat screen; rematch; one miss then correct; all three correct stages and final celebration to Kiki victory. Separately tested normal adventure bridge: two wrong answers, explanation, fresh problem, correct answer resumes physical bridge repair.

Race recovery was tested in the isolated practice mode, not via fabricated browser state. The bridge test used a newly created Math Recovery QA profile. Existing family profiles were not changed. Screenshots: `docs/qa/playful-games/math-explanation.jpg`, `bolt-wins.jpg`, `rematch-win.jpg`.
