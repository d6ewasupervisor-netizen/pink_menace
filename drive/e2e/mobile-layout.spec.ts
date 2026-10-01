/**
 * Phone cockpit: the dash stays under the act line, and a quiz result
 * sits above the sticks in both one-stick and two-stick layouts.
 */
import { test, expect } from '@playwright/test';

async function mockStudent(page: import('@playwright/test').Page) {
  await page.route('**/api/**', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  await page.route('**/api/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        signedIn: true,
        kind: 'game',
        person: { id: 'student-smoke-1', role: 'student', name: 'Ali', last4: null },
      }),
    }),
  );
  await page.route('**/api/drive/progress', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ progress: null }) }),
  );
}

async function showDrive(page: import('@playwright/test').Page, scheme: string) {
  await page.evaluate(async (controlsScheme) => {
    const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
    const { useQRHud } = await import('/drive/src/stores/qrHud.ts');
    useGameStore.setState({
      worldMode: 'kent',
      phase: 'driving',
      controlsScheme,
    });
    useQRHud.getState().setTransient({
      objective: 'Kent DOL: east on Titus, right on Central, all the way south.',
    });
  }, scheme);
  await expect(page.getByLabel('Navigation')).toBeVisible();
}

test('phone dash clears the act line and the quiz result clears the sticks', async ({ page }) => {
  test.setTimeout(90_000);
  await mockStudent(page);
  await page.goto('/drive/');
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 45_000 });

  for (const scheme of ['single-left', 'dual-steer-left']) {
    await showDrive(page, scheme);
    const gap = await page.evaluate(() => {
      const nav = document.querySelector('[aria-label="Navigation"]')?.getBoundingClientRect();
      const badge = [...document.querySelectorAll('span')].find((el) => (el.textContent ?? '').trim().startsWith('ACT '))?.parentElement;
      const badgeBox = badge?.getBoundingClientRect();
      return nav && badgeBox ? Math.round(nav.top - badgeBox.bottom) : null;
    });
    expect(gap, scheme).not.toBeNull();
    expect(gap!, scheme).toBeGreaterThan(8);

    await page.evaluate(async () => {
      const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
      useGameStore.getState().triggerQuiz({
        id: 'layout-check',
        category: 'road_signs',
        difficulty: 'easy',
        title: 'Stop',
        question: 'What does a stop sign mean?',
        correctAnswer: 'A complete stop',
        wrongAnswers: ['Slow down', 'Yield', 'Honk'],
        explanation: 'A stop sign means a complete stop.',
        imagePrompt: '',
        imageUrl: null,
        tags: [],
        waTestFrequency: 'high',
        source: 'quietroads',
      });
    });
    await page.getByRole('button', { name: 'A complete stop' }).click();
    const cont = page.getByRole('button', { name: 'CONTINUE' });
    await expect(cont).toBeVisible();
    const overlap = await page.evaluate(() => {
      const hits = (box: DOMRect | undefined, nodes: Element[]) => {
        if (!box) return -1;
        let hit = 0;
        for (const node of nodes) {
          const ring = node.getBoundingClientRect();
          const x = box.left < ring.right && box.right > ring.left;
          const y = box.top < ring.bottom && box.bottom > ring.top;
          if (x && y) hit += 1;
        }
        return hit;
      };
      const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.trim() === 'CONTINUE');
      const box = button?.getBoundingClientRect();
      const sticks = [...document.querySelectorAll('span')]
        .filter((el) => /STEER|GAS/.test(el.textContent ?? ''))
        .map((el) => el.parentElement)
        .filter((el): el is HTMLElement => Boolean(el));
      const horn = [...document.querySelectorAll('button')].filter((el) => el.textContent?.trim() === 'HORN' || el.textContent?.trim() === 'LOW');
      const line = [...document.querySelectorAll('div')]
        .filter((el) => (el.textContent ?? '').includes('Gracie. We have talked about this.'))
        .sort((a, b) => (a.textContent?.length ?? 0) - (b.textContent?.length ?? 0))[0];
      return {
        sticks: hits(box, sticks),
        horn: hits(box, horn),
        line: hits(line?.getBoundingClientRect(), horn),
      };
    });
    expect(overlap.sticks, scheme).toBe(0);
    expect(overlap.horn, scheme).toBe(0);
    expect(overlap.line, scheme).toBe(0);
    await page.evaluate(async () => {
      const { useGameStore } = await import('/drive/src/stores/gameStore.ts');
      useGameStore.setState({ currentQuestion: null, quizActive: false, phase: 'driving' });
    });
  }
});
