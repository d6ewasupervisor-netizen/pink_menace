"use strict";

function cameraOf(card) {
  return card.image_brief && card.image_brief.camera;
}

function isLessonCamera(card) {
  return Boolean(card.image_brief && card.image_brief.camera_is_the_lesson);
}

function checkCameraLedger(cards, opts) {
  const errors = [];
  const windowSize = (opts && opts.windowSize) || 6;
  const windowMax = (opts && opts.windowMax) || 2;
  const cap = (opts && opts.cap) || 0.25;
  const cameras = {};
  const exemptIds = [];

  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const id = c.card_id || `(index ${i})`;
    const cam = cameraOf(c);
    if (!cam) {
      errors.push(`${id}: missing image_brief.camera`);
      continue;
    }
    cameras[cam] = (cameras[cam] || 0) + 1;
    if (isLessonCamera(c)) exemptIds.push(id);
    if (i > 0 && cam === cameraOf(cards[i - 1])) {
      errors.push(`${id}: camera twice in a row (${cam})`);
    }
    if (i >= windowSize - 1) {
      const counts = {};
      for (let j = i - windowSize + 1; j <= i; j++) {
        if (isLessonCamera(cards[j])) continue;
        const t = cameraOf(cards[j]);
        if (!t) continue;
        counts[t] = (counts[t] || 0) + 1;
      }
      for (const [token, n] of Object.entries(counts)) {
        if (n > windowMax) {
          const ids = cards
            .slice(i - windowSize + 1, i + 1)
            .map((x) => x.card_id)
            .join(",");
          errors.push(
            `${id}: ${token} used ${n} times in window of ${windowSize} (${ids}); lesson cameras omitted from the count`
          );
        }
      }
    }
  }

  const nonExempt = cards.filter((c) => !isLessonCamera(c));
  const denom = nonExempt.length;
  const nonExemptCounts = {};
  for (const c of nonExempt) {
    const cam = cameraOf(c);
    if (!cam) continue;
    nonExemptCounts[cam] = (nonExemptCounts[cam] || 0) + 1;
  }
  if (denom > 0) {
    for (const [token, n] of Object.entries(nonExemptCounts)) {
      const share = n / denom;
      if (share > cap + 1e-12) {
        errors.push(
          `${token}: ${n}/${denom} non-exempt (${(share * 100).toFixed(1)}%) exceeds ${(cap * 100).toFixed(0)}% cap`
        );
      }
    }
  }

  return {
    errors,
    cameras,
    exemptIds,
    nonExemptCounts,
    nonExemptDenom: denom,
  };
}

module.exports = { checkCameraLedger, cameraOf, isLessonCamera };
