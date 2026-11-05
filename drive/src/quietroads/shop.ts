/**
 * The shop counter — the one thing the web drive never ported.
 *
 * Every shop scene (2.6 Bea's cats, 2.7 Priya's photocards, 2.8 Tuna's bay,
 * 7.2 the Ritzville trading post) is `type: "shop"` and its greet node fires
 * `start_gameplay: shop_*`. There is no mission behind that id, so the scene
 * used to fall through to "isn't built yet", show its greet line, and then sit
 * on a blank frame until the stranded net fired `shop.close`. The buys were
 * unreachable, which made the chain-up loop a soft-lock: 5.2 without chains
 * sends the player to 2.8, and 2.8 could only be left empty-handed, straight
 * back to 5.1 and 5.2.block again.
 *
 * This file is the counter's catalogue: what each shop sells, what it costs in
 * Trade Points, and the flag/item the buy node sets so the counter can show it
 * as owned. The counter itself (`components/Game3D/ShopCounter.tsx`) only
 * renders this and calls `QuietRoads.buy(id)`, which spends the points and
 * fires the scene's own `shop.buy:<id>` trigger — the same bus the sim uses.
 *
 * Prices are set against the campaign's own economy: the 7.2 tier gate reads
 * `trade_points >= 400` for "both" and `>= 180` for "one", so the two things it
 * sells are 180 and 200 (380 for both, less the 20 the vendor knocks off).
 */

export interface ShopItem {
  /** The id the scene's `shop.buy:<id>` trigger listens for. */
  id: string;
  /** What the counter calls it. */
  label: string;
  /** Trade Points. */
  price: number;
  /** The flag the buy node sets, if it sets one. */
  flag?: string;
  /** The item the buy node grants, if it grants one. */
  item?: string;
}

export interface Shop {
  /** The `start_gameplay` id the scene's greet node fires. */
  gameplay: string;
  /** The scene that owns the counter. */
  scene: string;
  /** Who is behind it, for the counter's heading. */
  keeper: string;
  items: ShopItem[];
}

export const SHOPS: Shop[] = [
  {
    gameplay: "shop_cats",
    scene: "2.6",
    keeper: "Auntie Bea",
    items: [
      { id: "gracie_toy", label: "A toy for Gracie", price: 40, flag: "has_gracie_toy", item: "gracie_toy" },
      { id: "gracie_collar", label: "A collar, no bell", price: 30, flag: "has_gracie_collar", item: "gracie_collar" },
      { id: "mya_snacks", label: "Snacks for Mya", price: 15, item: "mya_snacks" },
    ],
  },
  {
    gameplay: "shop_kpop",
    scene: "2.7",
    keeper: "Priya",
    items: [
      { id: "photocard_common", label: "A common photocard", price: 25, item: "photocard_common" },
      { id: "photocard_sori", label: "The Sori photocard", price: 120, flag: "has_sori_card", item: "photocard_sori" },
      { id: "radio_skin", label: "A dash skin", price: 60, item: "radio_skin" },
      { id: "lightbar", label: "A light bar", price: 80, item: "lightbar" },
    ],
  },
  {
    gameplay: "shop_upgrades",
    scene: "2.8",
    keeper: "Tuna",
    items: [
      { id: "muffler", label: "Quiet muffler", price: 200, flag: "has_quiet_muffler", item: "muffler" },
      { id: "chains", label: "A set of chains", price: 150, flag: "has_chains", item: "chains" },
      { id: "tires", label: "Better rubber", price: 120, item: "tires" },
      { id: "led_lights", label: "LED lights", price: 180, item: "led_lights" },
      { id: "plow_tune", label: "Plow tune", price: 100, item: "plow_tune" },
    ],
  },
  {
    gameplay: "shop_ritzville",
    scene: "7.2",
    keeper: "The vendor",
    items: [
      { id: "led_lights", label: "LED lights", price: 180, flag: "bought_led_lights", item: "led_lights" },
      { id: "muffler", label: "Quiet muffler", price: 200, flag: "muffler_from_ritzville", item: "muffler" },
    ],
  },
];

/** The counter a `start_gameplay` id opens, or null when it is not a shop. */
export function shopForGameplay(gameplay: string): Shop | null {
  return SHOPS.find((s) => s.gameplay === gameplay) ?? null;
}

/** The counter a scene owns, or null. */
export function shopForScene(sceneId: string): Shop | null {
  return SHOPS.find((s) => s.scene === sceneId) ?? null;
}

/**
 * Tuna's one exception. The chain-up loop can leave a player who spent their
 * Trade Points on the other upgrades unable to buy the set that gets them up
 * the pass — 5.2.block -> 2.8 -> 5.1 -> 5.2.block forever. When the loop is
 * open and the set is out of reach, the counter offers to have Tuna front it
 * (she is the one who says "Tuna's got a set. Earn it."). The debt is a flag,
 * not a number: nothing in the campaign charges interest.
 */
export const FRONT_CHAINS_EVENT = "shop.front:chains";
export const FRONT_CHAINS_FLAG = "tuna_fronted_chains";

/** True when the counter should offer to front the chains. */
export function canFrontChains(args: {
  shop: Shop;
  tradePoints: number;
  ownsChains: boolean;
  chainupBlocked: boolean;
}): boolean {
  if (args.shop.scene !== "2.8" || args.ownsChains || !args.chainupBlocked) return false;
  const chains = args.shop.items.find((i) => i.id === "chains");
  return chains != null && args.tradePoints < chains.price;
}
