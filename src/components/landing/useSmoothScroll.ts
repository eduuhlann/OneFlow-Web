import { useEffect } from 'react';

type LandingScrollOptions = { immediate?: boolean };
type LandingScrollRequest = LandingScrollOptions & { top: number };

const SCROLL_REQUEST = 'oneflow:landing-scroll-to';
const DAMPING_TIME = 165;
const SETTLE_TIME = 720;
const SCROLL_TOLERANCE = 1.5;

function scrollLimit() {
  const root = document.scrollingElement ?? document.documentElement;
  return Math.max(0, root.scrollHeight - window.innerHeight);
}

function clampScroll(top: number) {
  return Math.max(0, Math.min(top, scrollLimit()));
}

/** Uses the landing's easing controller when mounted, or the browser otherwise. */
export function scrollLandingTo(top: number, options: LandingScrollOptions = {}) {
  if (typeof window === 'undefined' || !Number.isFinite(top)) return;

  const request = new CustomEvent<LandingScrollRequest>(SCROLL_REQUEST, {
    cancelable: true,
    detail: { top: clampScroll(top), ...options },
  });

  if (!window.dispatchEvent(request)) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({
    top: request.detail.top,
    behavior: options.immediate || reducedMotion ? 'instant' : 'smooth',
  });
}

function nestedScrollerCanConsume(event: WheelEvent, delta: number) {
  for (const node of event.composedPath()) {
    if (node === document.body || node === document.documentElement) break;
    if (!(node instanceof HTMLElement)) continue;

    const style = window.getComputedStyle(node);
    if (!/^(auto|scroll|overlay)$/.test(style.overflowY)) continue;

    const distance = node.scrollHeight - node.clientHeight;
    if (distance <= 1) continue;

    const hasRoom = delta > 0
      ? node.scrollTop < distance - 1
      : node.scrollTop > 1;

    // Preserve a nested region's explicit scroll containment at its boundaries.
    if (hasRoom || /^(contain|none)$/.test(style.overscrollBehaviorY)) return true;
  }

  return false;
}

/** Smooths wheel input while retaining the real window scroll for sticky sections. */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number | null = null;
    let animating = false;
    let position = window.scrollY;
    let target = position;
    let origin = position;
    let lastWritten = position;
    let startedAt = 0;

    const sync = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      animating = false;
      position = window.scrollY;
      target = position;
      origin = position;
      lastWritten = position;
    };

    const tick = (now: number) => {
      frame = null;
      if (!animating) return;

      // A native or external scroll takes ownership immediately.
      if (Math.abs(window.scrollY - lastWritten) > SCROLL_TOLERANCE) {
        sync();
        return;
      }

      target = clampScroll(target);
      const elapsed = Math.max(0, now - startedAt);
      const progress = elapsed >= SETTLE_TIME
        ? 1
        : (1 - Math.exp(-elapsed / DAMPING_TIME))
          / (1 - Math.exp(-SETTLE_TIME / DAMPING_TIME));

      position = clampScroll(origin + (target - origin) * progress);
      // An instant write prevents CSS/native smooth scrolling from adding a
      // second easing layer. Keep subpixel position to avoid low-speed stalls.
      window.scrollTo({ top: position, behavior: 'instant' });
      lastWritten = window.scrollY;

      if (progress === 1 || Math.abs(target - position) < 0.25) {
        window.scrollTo({ top: target, behavior: 'instant' });
        lastWritten = window.scrollY;
        position = lastWritten;
        target = lastWritten;
        animating = false;
        return;
      }

      frame = window.requestAnimationFrame(tick);
    };

    const animateTo = (nextTarget: number) => {
      if (!animating) {
        position = window.scrollY;
        lastWritten = position;
      }

      const clamped = clampScroll(nextTarget);
      if (animating && Math.abs(clamped - target) < 0.01) return;

      origin = position;
      target = clamped;
      startedAt = performance.now();
      animating = true;
      if (frame === null) frame = window.requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey
        || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
        sync();
        return;
      }

      let delta = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
      if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= window.innerHeight;

      if (!Number.isFinite(delta) || delta === 0 || nestedScrollerCanConsume(event, delta)) {
        sync();
        return;
      }

      if (Math.abs(window.scrollY - lastWritten) > SCROLL_TOLERANCE) sync();

      const limit = scrollLimit();
      const atBoundary = delta > 0
        ? window.scrollY >= limit - 0.5
        : window.scrollY <= 0.5;

      if (atBoundary) {
        sync();
        return;
      }

      event.preventDefault();
      // Reversing the wheel should reverse immediately instead of first paying
      // off an accumulated destination in the opposite direction.
      const reversing = animating && delta * (target - position) < 0;
      const base = animating && !reversing ? target : window.scrollY;
      animateTo(base + delta);
    };

    const onScroll = () => {
      if (!animating || Math.abs(window.scrollY - lastWritten) > SCROLL_TOLERANCE) sync();
    };

    const onRequest = (event: Event) => {
      const request = event as CustomEvent<LandingScrollRequest>;
      if (!request.detail || !Number.isFinite(request.detail.top)) return;
      request.preventDefault();

      if (request.detail.immediate) {
        sync();
        window.scrollTo({ top: clampScroll(request.detail.top), behavior: 'instant' });
        sync();
      } else {
        if (Math.abs(window.scrollY - lastWritten) > SCROLL_TOLERANCE) sync();
        animateTo(request.detail.top);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown',
        'Home', 'End', ' ', 'Spacebar'].includes(event.key)) sync();
    };

    const onResize = () => {
      if (Math.abs(window.scrollY - lastWritten) > SCROLL_TOLERANCE) {
        sync();
      } else if (animating) {
        animateTo(clampScroll(target));
      } else {
        sync();
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) sync();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', sync, { passive: true });
    window.addEventListener('touchstart', sync, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener(SCROLL_REQUEST, onRequest);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      sync();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', sync);
      window.removeEventListener('touchstart', sync);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener(SCROLL_REQUEST, onRequest);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled]);
}
