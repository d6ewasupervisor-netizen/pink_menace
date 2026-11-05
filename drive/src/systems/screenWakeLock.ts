/**
 * screenWakeLock — hold the screen awake while a hands-off wait is up.
 *
 * On 6.3's sixty-second wait the phone locked itself (iOS auto-lock, ~30 s with
 * no touch) and the HAR shows the consequences: an 83,910 ms `client.stall`, the
 * wait's clock stopped, and when she came back the screen was where she left it.
 * A player who is being told not to touch the screen must not be punished for
 * obeying.
 *
 * `navigator.wakeLock` is Safari 16.4+ / Chrome 84+; where it is missing this
 * does nothing and says nothing (feature-detect, fail silent). A wake lock is
 * dropped by the platform whenever the page is hidden, so it is re-requested on
 * `visibilitychange` when the overlay is still wanted — and only then.
 *
 * The host is injected so `test/handsoff.test.ts` can count requests and
 * releases without a browser.
 */
export interface WakeSentinelLike {
  release(): Promise<void>;
  released?: boolean;
  addEventListener?(type: 'release', listener: () => void): void;
}

export interface WakeHost {
  wakeLock?: { request(type: 'screen'): Promise<WakeSentinelLike> };
}

export const defaultWakeHost = (): WakeHost | null =>
  typeof navigator === 'undefined' ? null : (navigator as unknown as WakeHost);

export class ScreenWakeKeeper {
  private sentinel: WakeSentinelLike | null = null;
  private wanted = false;
  private pending: Promise<boolean> | null = null;
  /** Requests asked of the platform (a re-request after a loss counts again). */
  requests = 0;
  /** Releases handed back. */
  releases = 0;

  constructor(private readonly host: () => WakeHost | null = defaultWakeHost) {}

  get active(): boolean {
    return this.wanted;
  }

  /** Ask once. Re-entrant: two calls in the same frame make one request. */
  acquire(): Promise<boolean> {
    this.wanted = true;
    if (this.sentinel && !this.sentinel.released) return Promise.resolve(true);
    if (this.pending) return this.pending;
    const api = this.host()?.wakeLock;
    if (!api || typeof api.request !== 'function') return Promise.resolve(false);
    this.requests += 1;
    this.pending = api
      .request('screen')
      .then((sentinel) => {
        this.sentinel = sentinel;
        // The platform releases the lock on its own when the page hides or the
        // battery saver kicks in; forget it so the next visibilitychange can ask.
        sentinel.addEventListener?.('release', () => {
          if (this.sentinel === sentinel) this.sentinel = null;
        });
        return true;
      })
      .catch(() => false)
      .finally(() => {
        this.pending = null;
      });
    return this.pending;
  }

  /** Give it back. Safe when nothing was ever acquired. */
  async release(): Promise<void> {
    this.wanted = false;
    const sentinel = this.sentinel;
    this.sentinel = null;
    if (!sentinel || sentinel.released) return;
    try {
      await sentinel.release();
      this.releases += 1;
    } catch {
      /* the platform already dropped it */
    }
  }

  /** The page is visible again: re-request if the overlay still wants it. */
  onVisible(): Promise<boolean> {
    if (!this.wanted) return Promise.resolve(false);
    if (this.sentinel && !this.sentinel.released) return Promise.resolve(true);
    return this.acquire();
  }
}

/** One keeper for the page: an overlay is the only thing that ever asks. */
export const screenWake = new ScreenWakeKeeper();
