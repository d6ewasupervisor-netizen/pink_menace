/**
 * ShopCounter — the counter the web drive never had.
 *
 * Every shop scene (2.6 / 2.7 / 2.8 / 7.2) is `type: "shop"` and its greet node
 * fires `start_gameplay: shop_*`. There is no mission behind that id, so the
 * scene used to fall through to "isn't built yet", read its greet line, and then
 * sit on a blank frame until the stranded net fired `shop.close`. Nothing could
 * be bought — which made 5.2's chain-up loop a soft-lock (5.2.block -> 2.8 ->
 * 5.1 -> 5.2.block, forever) and left every `has_item` branch downstream
 * (6.2's LED lights, 7.2's "you've already got both", 8.1's lights and quiet
 * cluster) permanently false.
 *
 * This is the minimum port: the catalogue from `quietroads/shop.ts`, a price,
 * and a button. A buy goes through `QuietRoads.buy(id)`, which spends the Trade
 * Points and fires the scene's own `shop.buy:<id>` trigger — the same bus the
 * sim uses, so the buy line, the flags and the items stay the story's, not the
 * UI's. An unaffordable pick fires `shop.cant_afford` and the keeper says so.
 *
 * It renders in the body band only while the runner is idle: the greet line and
 * every buy line are read first, then the counter comes back.
 */
import { useQRStore } from '@/stores/qrStore';
import { useQRHud } from '@/stores/qrHud';
import { useGameStore } from '@/stores/gameStore';
import { QuietRoads } from '@/systems/QuietRoadsBridge';
import { canFrontChains } from '@/quietroads/shop';
import { frameFor, qteBand, useCockpitOrientation } from './cockpit/layout';
import { tokens } from './cockpit/tokens';

export function ShopCounter() {
  const shop = useQRHud((s) => s.shop);
  const line = useQRHud((s) => s.line);
  const direction = useQRHud((s) => s.direction);
  const choices = useQRHud((s) => s.choices);
  const card = useQRHud((s) => s.card);
  const debrief = useQRHud((s) => s.debrief);
  const phase = useGameStore((s) => s.phase);
  const worldMode = useGameStore((s) => s.worldMode);
  const tradePoints = useQRStore((s) => s.vars.trade_points ?? 0);
  const items = useQRStore((s) => s.items);
  const flags = useQRStore((s) => s.flags);
  const orientation = useCockpitOrientation();

  if (worldMode !== 'kent' || !shop) return null;
  if (phase === 'quiz' || phase === 'paused' || phase === 'menu' || phase === 'card') return null;
  // A line, a direction or a choice owns the screen; the counter waits its turn.
  if (line || direction || choices || card || debrief) return null;

  const owns = (id: string) => {
    const item = shop.items.find((i) => i.id === id);
    if (!item) return false;
    if (item.item && items.includes(item.item)) return true;
    return item.flag ? flags[item.flag] === true : false;
  };
  const front = canFrontChains({
    shop,
    tradePoints,
    ownsChains: owns('chains'),
    chainupBlocked: flags.chainup_blocked === true,
  });

  return (
    <div
      data-layer="shop"
      data-shop-scene={shop.scene}
      data-shop-trade-points={tradePoints}
      style={{ ...qteBand(frameFor(orientation, true)), zIndex: tokens.z.stranded, pointerEvents: 'auto' }}
    >
      <div style={styles.panel}>
        <div style={styles.head}>
          <span style={styles.keeper}>{shop.keeper}</span>
          <span style={styles.tp} data-shop-tp>{tradePoints} TP</span>
        </div>
        <div style={styles.list}>
          {shop.items.map((item) => {
            const owned = owns(item.id);
            const affordable = tradePoints >= item.price;
            return (
              <button
                key={item.id}
                data-ui
                data-shop-item={item.id}
                data-shop-price={item.price}
                data-shop-owned={owned ? 'true' : 'false'}
                data-shop-affordable={affordable ? 'true' : 'false'}
                disabled={owned}
                onClick={() => QuietRoads.buy(item.id)}
                style={{ ...styles.row, ...(owned ? styles.rowOwned : null) }}
              >
                <span style={styles.label}>{item.label}</span>
                <span style={{ ...styles.price, ...(affordable || owned ? null : styles.priceShort) }}>
                  {owned ? 'owned' : `${item.price} TP`}
                </span>
              </button>
            );
          })}
          {front && (
            <button
              data-ui
              data-shop-item="front_chains"
              onClick={() => QuietRoads.frontChains()}
              style={{ ...styles.row, ...styles.rowFront }}
            >
              <span style={styles.label}>Ask Tuna to front you the chains</span>
              <span style={styles.price}>on the tab</span>
            </button>
          )}
        </div>
        <button data-ui data-shop-leave onClick={() => QuietRoads.leaveShop()} style={styles.leave}>
          Leave
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 'min(420px, calc(100vw - 32px))',
    maxHeight: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '12px 14px',
    borderRadius: tokens.radius.lg,
    background: 'rgba(7,8,12,0.9)',
    border: `1px solid ${tokens.colors.stroke}`,
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    pointerEvents: 'auto',
  },
  head: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  keeper: {
    fontFamily: tokens.fonts.ui,
    fontSize: 'calc(12px * var(--qr-text-scale, 1))',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: tokens.colors.accent,
  },
  tp: {
    fontFamily: tokens.fonts.mono,
    fontSize: 'calc(12px * var(--qr-text-scale, 1))',
    color: tokens.colors.body,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.06)',
    color: tokens.colors.ink,
    border: `1px solid ${tokens.colors.strokeSoft}`,
    borderRadius: tokens.radius.md,
    font: 'inherit',
    fontSize: 'calc(14px * var(--qr-text-scale, 1))',
    textAlign: 'left',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  rowOwned: { opacity: 0.45, cursor: 'default' },
  rowFront: { borderColor: tokens.colors.accent },
  label: { flex: 1 },
  price: { fontFamily: tokens.fonts.mono, fontSize: 'calc(12px * var(--qr-text-scale, 1))', color: tokens.colors.body },
  priceShort: { color: tokens.colors.warn },
  leave: {
    marginTop: 2,
    minHeight: 44,
    padding: '10px 12px',
    background: 'rgba(0,0,0,0.5)',
    color: tokens.colors.ink,
    border: `1px solid ${tokens.colors.stroke}`,
    borderRadius: tokens.radius.md,
    font: 'inherit',
    fontSize: 'calc(13px * var(--qr-text-scale, 1))',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
};
