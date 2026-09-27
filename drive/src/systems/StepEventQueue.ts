/** Ordered, synchronous post-step delivery. Nested events join the same drain. */
export class StepEventQueue<T> {
  private pending: T[] = [];
  private collecting = false;
  private draining = false;

  begin() { this.collecting = true; }

  dispatch(event: T, deliver: (event: T) => void) {
    this.pending.push(event);
    if (!this.collecting && !this.draining) this.end(deliver);
  }

  end(deliver: (event: T) => void) {
    this.collecting = false;
    if (this.draining) return;
    this.draining = true;
    try {
      let index = 0;
      while (index < this.pending.length) {
        if (index >= 256) throw new Error('Quiet Roads event chain exceeded 256 transitions');
        deliver(this.pending[index++]);
      }
    } finally {
      this.pending.length = 0;
      this.draining = false;
    }
  }
}