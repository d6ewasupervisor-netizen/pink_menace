/**
 * The portrait cockpit's budgets, as arithmetic that a test can fail.
 *
 * `cockpit/spec.ts` is the single source for where every band sits. This file pins it
 * at the five shapes the plan names (390x844, 412x915, 440x956, 844x390, 1280x800),
 * with and without safe-area insets, and asserts the two promises the rebuild makes:
 *
 *   - the world band is at least 55 % of a portrait viewport (it measured 26 % at
 *     390x844 in `docs/cockpit/BEFORE.md`, which is the complaint);
 *   - nothing the player touches leaves the screen or its own band: the sticks are
 *     110–120 px inside the control corners, the lights/horn pair is 44 px inside the
 *     same band, and the dialogue box cannot reach the controls.
 */
import { describe, expect, it } from "vitest";
import {
  BUDGET,
  buttonOrigin,
  cockpitSpec,
  shapeFor,
  stickFor,
  stickOrigin,
  worldFraction,
} from "../src/components/Game3D/cockpit/spec";

const SHAPES = [
  { name: "portrait-390x844", w: 390, h: 844 },
  { name: "android-412x915", w: 412, h: 915 },
  { name: "iphone-440x956", w: 440, h: 956 },
  { name: "landscape-844x390", w: 844, h: 390 },
  { name: "desktop-1280x800", w: 1280, h: 800 },
] as const;

describe("the shape a viewport is", () => {
  it("names portrait, landscape and desktop the way the plan does", () => {
    expect(shapeFor(390, 844)).toBe("portrait");
    expect(shapeFor(440, 956)).toBe("portrait");
    expect(shapeFor(844, 390)).toBe("landscape");
    expect(shapeFor(1280, 800)).toBe("desktop");
    expect(shapeFor(1024, 800)).toBe("desktop");
    expect(shapeFor(844, 844)).toBe("portrait"); // square is portrait, not landscape
  });
});

describe("the bands stack without a gap or an overlap at every shipped shape", () => {
  for (const s of SHAPES) {
    it(`${s.name}: bands tile the viewport exactly`, () => {
      const spec = cockpitSpec(s.w, s.h);
      expect(spec.rail.y).toBe(0);
      expect(spec.noise.y).toBe(spec.rail.y + spec.rail.height);
      expect(spec.nav.y).toBe(spec.noise.y + spec.noise.height);
      expect(spec.objective.y).toBe(spec.nav.y + spec.nav.height);
      expect(spec.world.y).toBe(spec.objective.y + spec.objective.height);
      expect(spec.controls.y).toBe(spec.world.y + spec.world.height);
      expect(spec.controls.y + spec.controls.height).toBe(s.h);
      expect(spec.world.height).toBeGreaterThan(0);
    });
  }
});

describe("the world band keeps its half of a portrait phone", () => {
  for (const s of SHAPES.filter((x) => x.h > x.w)) {
    it(`${s.name}: world ≥ 55 % of the height`, () => {
      const spec = cockpitSpec(s.w, s.h);
      expect(worldFraction(spec), `${s.name} world ${spec.world.height}px of ${s.h}`).toBeGreaterThanOrEqual(0.55);
    });
  }

  it("landscape and desktop still get a usable band", () => {
    expect(worldFraction(cockpitSpec(844, 390))).toBeGreaterThan(0.35);
    expect(worldFraction(cockpitSpec(1280, 800))).toBeGreaterThan(0.5);
  });
});

describe("the budgets are the plan's numbers", () => {
  it("portrait: 48 / 6 / 56 / 40 and a ≥ 150 px control band", () => {
    const spec = cockpitSpec(390, 844);
    expect(spec.rail.height).toBe(48);
    expect(spec.noise.height).toBe(6);
    expect(spec.nav.height).toBe(56);
    expect(spec.objective.height).toBe(40);
    expect(spec.controls.height).toBeGreaterThanOrEqual(150);
    expect(spec.controls.height).toBe(Math.round(844 * 0.22));
  });

  it("landscape merges the rail and the nav strip into one row", () => {
    const spec = cockpitSpec(844, 390);
    expect(spec.rail.height).toBe(48);
    expect(spec.nav.height).toBe(0);
    expect(spec.objective.height).toBe(0);
    expect(spec.controls.height).toBe(BUDGET.controlsMin);
  });

  it("desktop is a centred 520 px column", () => {
    const spec = cockpitSpec(1280, 800);
    expect(spec.column.width).toBe(520);
    expect(spec.column.x).toBe(380);
    expect(spec.rail.x).toBe(380);
    expect(spec.rail.width).toBe(520);
  });
});

describe("the sticks", () => {
  it("are 110–120 px at every shipped width", () => {
    for (const s of SHAPES) {
      const size = cockpitSpec(s.w, s.h).stick;
      expect(size, `${s.name} stick ${size}`).toBeGreaterThanOrEqual(110);
      expect(size).toBeLessThanOrEqual(120);
    }
    // A 390 phone gets 117, and nothing is ever narrower than the minimum.
    expect(stickFor(390)).toBe(117);
    expect(stickFor(320)).toBe(110);
    expect(stickFor(1200)).toBe(120);
  });

  it("sit inside their corners and inside the control band", () => {
    for (const s of SHAPES) {
      const spec = cockpitSpec(s.w, s.h);
      for (const side of ["left", "right"] as const) {
        const o = stickOrigin(spec, side);
        expect(o.x, `${s.name} ${side} x`).toBeGreaterThanOrEqual(spec.controls.x);
        expect(o.x + o.size, `${s.name} ${side} right edge`).toBeLessThanOrEqual(spec.controls.x + spec.controls.width);
        expect(o.y, `${s.name} ${side} y`).toBeGreaterThanOrEqual(spec.controls.y);
        expect(o.y + o.size, `${s.name} ${side} bottom`).toBeLessThanOrEqual(s.h);
      }
      const l = stickOrigin(spec, "left");
      const r = stickOrigin(spec, "right");
      expect(l.x + l.size, `${s.name} the sticks do not touch`).toBeLessThan(r.x);
    }
  });
});

describe("the lights and horn", () => {
  it("are 44 px and never leave the control band", () => {
    for (const s of SHAPES) {
      const spec = cockpitSpec(s.w, s.h);
      for (const index of [0, 1] as const) {
        const b = buttonOrigin(spec, index);
        expect(b.size).toBe(44);
        expect(b.y, `${s.name} button ${index} above the band`).toBeGreaterThanOrEqual(spec.controls.y);
        expect(b.y + b.size, `${s.name} button ${index} below the viewport`).toBeLessThanOrEqual(s.h);
        expect(b.x, `${s.name} button ${index} left`).toBeGreaterThanOrEqual(spec.controls.x);
        expect(b.x + b.size, `${s.name} button ${index} right`).toBeLessThanOrEqual(spec.controls.x + spec.controls.width);
      }
      // The pair never lands on the world band, which is what "LOW hides under the
      // nav panel" was.
      const b = buttonOrigin(spec, 0);
      expect(b.y, `${s.name} the pair stays in the controls`).toBeGreaterThanOrEqual(spec.controls.y);
    }
  });

  it("sit above the right stick where the band has room, beside it where it does not", () => {
    const portrait = cockpitSpec(390, 844);
    const above = buttonOrigin(portrait, 0);
    const stick = stickOrigin(portrait, "right");
    expect(above.y + above.size).toBeLessThanOrEqual(stick.y); // above it
    const landscape = cockpitSpec(844, 390);
    const beside = buttonOrigin(landscape, 0);
    const lStick = stickOrigin(landscape, "right");
    expect(beside.x + beside.size).toBeLessThanOrEqual(lStick.x); // to its left
  });
});

describe("the dialogue box", () => {
  it("ends where the controls begin, and is two lines at most", () => {
    for (const s of SHAPES) {
      const spec = cockpitSpec(s.w, s.h);
      expect(spec.dialogue.bottom).toBe(spec.controls.y);
      expect(spec.dialogue.lines).toBe(2);
      expect(spec.dialogue.maxHeight).toBeLessThanOrEqual(BUDGET.dialogueMax);
      expect(spec.dialogue.maxHeight).toBeGreaterThanOrEqual(64);
    }
  });
});

describe("safe-area insets", () => {
  it("push the bands down and the controls up, and nothing overflows", () => {
    const insets = { top: 47, right: 0, bottom: 34, left: 0 };
    const spec = cockpitSpec(390, 844, insets);
    expect(spec.rail.y).toBe(47);
    expect(spec.controls.y + spec.controls.height).toBe(844 - 34);
    expect(spec.dialogue.bottom).toBe(844 - 34 - spec.controls.height);
    // The world band shrinks by exactly the insets, not by a guess.
    const plain = cockpitSpec(390, 844);
    expect(spec.world.height).toBe(plain.world.height - insets.top - insets.bottom);
    expect(worldFraction(spec)).toBeGreaterThan(0.45);
    for (const side of ["left", "right"] as const) {
      const o = stickOrigin(spec, side);
      expect(o.y + o.size).toBeLessThanOrEqual(844 - insets.bottom);
    }
  });

  it("a small viewport never yields a negative world band", () => {
    const spec = cockpitSpec(320, 480, { top: 24, right: 0, bottom: 24, left: 0 });
    expect(spec.world.height).toBeGreaterThan(0);
    expect(spec.controls.height).toBeGreaterThanOrEqual(150);
  });
});
