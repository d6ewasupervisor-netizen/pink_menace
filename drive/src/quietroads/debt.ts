/**
 * Tuna's tab — the one debt in the campaign, and the only place a Trade Point
 * award is not the number the scene wrote.
 *
 * `2.8.front_chains` is the soft-lock fix: when the chain-up loop is open and
 * the set is out of reach, Tuna fronts it. A gift would make her the one person
 * in the story nobody owes anything to, and it would also make the front the
 * *better* outcome — cheaper than buying, with the same chains. So the front
 * records the price as a debt (`tuna_debt`) and the next pay settles it:
 *
 *   award 30, debt 150  ->  the player gets 0, `tuna_debt` becomes 0,
 *                           `tuna_debt_paid` records the 30 that came out.
 *   award 500, debt 150 ->  the player gets 350, `tuna_debt` becomes 0.
 *
 * "The next award" is measured, not chosen: every Trade Point in the game is a
 * positive `addVar("trade_points", n)` — dialogue `tp` effects, quiz answers,
 * the Ritzville discount — so `qrStore.addVar` is the one writer, and the debt
 * cannot be dodged by earning somewhere the story did not expect. Deac names it
 * in scene 5.2 (`5.2.debt_line`), the scene where the loop's pay lands.
 *
 * `settleDebt` is pure so the rule is testable without a store; the store is a
 * two-line call site (`stores/qrStore.ts`), not a second implementation.
 */

/** Trade Points owed to Tuna. Persisted with the rest of `vars`. */
export const TUNA_DEBT_VAR = "tuna_debt";
/**
 * What actually came out of the last pay. The story reads it to decide whether
 * Deac says anything (`5.2.debt_branch`), and clears it after he has.
 */
export const TUNA_DEBT_PAID_VAR = "tuna_debt_paid";

export interface Settlement {
  /** What the scene tried to pay. */
  award: number;
  /** What the player actually receives. */
  net: number;
  /** How much of the debt this award took. */
  paid: number;
  /** True when a debt was standing and this award cleared it. */
  settled: boolean;
}

/**
 * Take the standing debt out of one award. Nothing standing, nothing to do.
 * The debt is cleared either way once it is touched — a short pay does not
 * leave a balance behind, which is the whole point of "the next pay".
 */
export function settleDebt(award: number, debt: number): Settlement {
  if (!(award > 0) || !(debt > 0)) return { award, net: award, paid: 0, settled: false };
  const paid = Math.min(award, debt);
  return { award, net: award - paid, paid, settled: true };
}
