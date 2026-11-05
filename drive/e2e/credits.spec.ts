/**
 * The CC-BY attribution, on the screen a player actually sees.
 *
 * Two models in the drive are CC-BY-4.0 — the VW Beetle and the low-poly
 * cactus — and CC-BY is an attribution licence: title, author, source and
 * licence have to reach whoever receives the work. `CREDITS.md` beside the GLBs
 * is not that. This walks the real ending (`8.3.end` unlocks `credits`) and
 * reads the screen, comparing it against the markdown table itself rather than
 * against the module the screen renders — three copies that must agree, and this
 * is the one that looks at the DOM.
 *
 * Headless only, the same 390x844 phone the campaign ends on.
 */
import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { duplicateViewportReason } from "./skipDuplicate";

test.use({ headless: true, hasTouch: true, viewport: { width: 390, height: 844 } });

/** The `| File | Title | Author | Licence | Source |` rows in CREDITS.md. */
function ccByRows() {
  const md = fs.readFileSync(path.resolve(process.cwd(), "public", "models", "CREDITS.md"), "utf8");
  const lines = md.split(/\r?\n/);
  const header = lines.findIndex((l) => /^\|\s*File\s*\|\s*Title\s*\|\s*Author\s*\|\s*Licence\s*\|\s*Source\s*\|/.test(l));
  expect(header, "CREDITS.md has the attribution table").toBeGreaterThan(-1);
  const rows: { file: string; title: string; author: string; licence: string; source: string }[] = [];
  for (let i = header + 2; i < lines.length && lines[i].trim().startsWith("|"); i++) {
    const [file, title, author, licence, source] = lines[i].split("|").slice(1, -1).map((c) => c.trim());
    rows.push({ file: file.replace(/`/g, ""), title, author, licence, source });
  }
  return rows;
}

async function mockStudent(page: Page) {
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{}" }));
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, signedIn: true, kind: "game", person: { id: "credits-1", role: "student", name: "Ali", last4: null } }),
    }),
  );
  await page.route("**/api/drive/progress", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ progress: null }) }),
  );
}

/** The last scene of the campaign, with the respect that opens Deac's answer. */
const ENDING_SAVE = {
  state: {
    vars: { respect: 85 },
    flags: { chains_mounted: true, has_chains: true },
    items: ["chains"],
    unlocks: [],
    ledger: [],
    mastery: {},
    attempts: [],
    choiceLog: [],
    examMissedIds: [],
    checkpoint: "game_complete",
    sceneId: "8.3",
    runnerState: null,
  },
  version: 2,
};

const STATE = `(async () => {
  const { QuietRoads } = await import('/drive/src/systems/QuietRoadsBridge.ts');
  const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
  const { useQRStore } = await import('/drive/src/stores/qrStore.ts');
  const hud = useQRHud.getState();
  return {
    scene: QuietRoads.runner.scene ? QuietRoads.runner.scene.id : null,
    node: QuietRoads.runner.currentId,
    line: hud.line ? hud.line.node_id : null,
    direction: hud.direction ? hud.direction.id : null,
    card: hud.card ? hud.card.id : null,
    credits: hud.credits,
    unlocks: useQRStore.getState().unlocks,
  };
})()`;

type State = {
  scene: string | null;
  node: string;
  line: string | null;
  direction: string | null;
  card: string | null;
  credits: boolean;
  unlocks: string[];
};

const read = (page: Page) => page.evaluate(STATE as unknown as () => Promise<State>) as Promise<State>;

test("the campaign's last unlock opens a credits screen that credits every CC-BY model", async ({ page }) => {
  test.setTimeout(180_000);
  const duplicate = duplicateViewportReason(test.info().project.use?.viewport, { width: 390, height: 844 });
  test.skip(duplicate !== null, duplicate ?? "");
  await mockStudent(page);
  await page.addInitScript((save) => {
    localStorage.setItem("quiet-roads-save", JSON.stringify(save));
    localStorage.setItem("quiet-roads-last-saved", String(Date.now()));
  }, ENDING_SAVE);
  await page.goto("/drive/");
  await page.locator("canvas").first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForTimeout(2000);

  expect((await read(page)).scene, "resumed into the ending").toBe("8.3");

  // Tap the ending out. `8.3.end` unlocks `credits`, and the bridge turns that
  // unlock into the screen — the same path the campaign takes.
  for (let i = 0; i < 80; i++) {
    const st = await read(page);
    if (st.credits) break;
    if (st.card) {
      const options = page.locator('[data-layer="dock"] button:has(span)');
      if ((await options.count()) > 0) await options.first().click({ timeout: 10_000 });
      await page.getByRole("button", { name: "CONTINUE" }).first().click({ timeout: 15_000 });
    } else {
      await page.evaluate(async () => {
        const { QuietRoads } = await import("/drive/src/systems/QuietRoadsBridge.ts");
        QuietRoads.tap();
      });
    }
    await page.waitForTimeout(300);
  }

  const done = await read(page);
  expect(done.unlocks, "the story unlocked credits").toContain("credits");
  expect(done.credits, "and the screen is up").toBe(true);

  const panel = page.locator('[data-layer="credits"]');
  await expect(panel, "the credits screen is on screen").toBeVisible({ timeout: 10_000 });
  await expect(panel).toContainText("CREDITS");

  // Every CC-BY row in CREDITS.md, read out of the DOM.
  const rows = ccByRows();
  expect(rows.length, "there are CC-BY models to credit").toBeGreaterThan(0);
  for (const row of rows) {
    const entry = panel.locator(`[data-credit-file="${row.file}"]`);
    await expect(entry, `${row.file} is credited`).toHaveCount(1);
    await expect(entry.locator("[data-credit-title]")).toHaveText(row.title);
    await expect(entry.locator("[data-credit-author]")).toContainText(row.author);
    await expect(entry.locator("[data-credit-source]")).toHaveAttribute("href", row.source);
    await expect(entry.locator("[data-credit-license]")).toHaveText(row.licence);
    await expect(entry.locator("[data-credit-license]")).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by/4.0/",
    );
  }

  // ...and Kenney, which asks for nothing and gets a line anyway.
  const kenney = panel.locator("[data-credit-kenney]");
  await expect(kenney).toContainText("Kenney");
  await expect(kenney).toContainText("CC0");
  await expect(kenney).toContainText("kenney.nl");

  // It is a panel, not a phase: it closes back to the ending.
  await panel.locator("[data-credits-close]").click();
  await expect(page.locator('[data-layer="credits"]')).toHaveCount(0);
  const back = await read(page);
  expect(back.credits, "closed").toBe(false);
  expect(back.scene, "still the ending behind it").toBe("8.3");
});
