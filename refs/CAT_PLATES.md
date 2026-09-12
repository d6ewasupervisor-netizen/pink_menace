# Cat identity plates

Cropped from an already-passed frame. The scene was not regenerated.
No new cats. Studio portraits `ref_gracie.jpg` and `ref_mya.jpg` are
untouched. `ref_carrier` stays the promoted charcoal lock (PR #110).

| | |
|---|---|
| Source | `cards/takes/IV-028-take-70.png` (Claude muted-read PASS, PR #108; live still) |
| Ginger plate | `refs/ref_cat_ginger.png` — left grate face |
| Mackerel plate | `refs/ref_cat_mackerel.png` — right grate face |
| Crop | face + ears only, one cat per plate, wire grate in frame |
| Ginger sha256 | `b8dfd8a385f3eaa1b197ef81e2881b1853234b3c5ea561a83bb2a445d90c7a87` |
| Mackerel sha256 | `38b45405c2e305001c16670fc2a0265f2b881eea38cb656ba9fe372e53e019f8` |

## Which plate is which

Card text on IV-028: both cats at the grate — "orange with a cream chest,
brown with a dark stripe." Bible: Gracie is the orange tabby (amber-green
eyes, cream chest); Mya is the brown mackerel (dark dorsal stripe, green
eyes, heavier). Mya is the one lost in Act I and recovered in Act III.

| Plate | Coat in the crop | Identity from card / bible |
|---|---|---|
| `ref_cat_ginger.png` | orange / ginger tabby, amber eyes | **Gracie** |
| `ref_cat_mackerel.png` | brown mackerel, green eyes, forehead stripe | **Mya** |

Coat + eye color in take-70 match the copy. Identity is **not** ambiguous
at the face. Residuals: cream chest is only a sliver; Mya's heavier build
does not read in a face crop. IV-028 take 72 (olive) is discarded — do
not crop from it.

These plates exist so IV-018 can tell the two faces apart. They are not
swapped into `pack/09_REF_MAP.json` on this PR (studio refs remain the
compile locks). Do not attach take-72.
