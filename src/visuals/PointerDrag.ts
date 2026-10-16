/** Pointer-owned dragging shared by mouse, pen and touch. Tap selection remains
 * available. Invalid/cancelled drops return without changing puzzle progress. */
export function pointerDrag(
  piece: HTMLElement,
  select: () => boolean,
  targets: () => HTMLElement[],
  drop: (target: HTMLElement) => void,
): void {
  let owner: number | undefined;
  let x = 0, y = 0, moved = false, original = '';
  piece.style.touchAction = 'none';
  piece.onpointerdown = event => {
    if (owner !== undefined || !select()) return;
    owner = event.pointerId;
    x = event.clientX; y = event.clientY; moved = false;
    original = piece.style.transform;
    piece.setPointerCapture(owner);
  };
  const reset = () => {
    owner = undefined;
    piece.style.transform = original;
    piece.classList.remove('pointer-lift');
  };
  piece.onpointermove = event => {
    if (event.pointerId !== owner) return;
    const dx = event.clientX - x, dy = event.clientY - y;
    if (Math.hypot(dx, dy) < 7 && !moved) return;
    moved = true;
    piece.classList.add('pointer-lift');
    piece.style.transform = `translate(${dx}px,${dy}px) ${original}`;
  };
  piece.onpointerup = event => {
    if (event.pointerId !== owner) return;
    const target = moved ? targets().find(target => {
      const r = target.getBoundingClientRect();
      return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    }) : undefined;
    reset();
    if (target) drop(target);
  };
  piece.onpointercancel = reset;
  // A drag must not also dispatch the tap action after dropping.
  piece.addEventListener('click', event => {
    if (moved) { event.preventDefault(); event.stopImmediatePropagation(); moved = false; }
  }, true);
}
