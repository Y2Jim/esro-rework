/**
 * Picks the level-driven HP component for the Endurance rework.
 *
 * Endurance becomes DEF primary + HP secondary. HP is not purchasable, so the
 * point is that Endurance partly tracks character level and cannot be bought
 * outright. Today HP has NO level term at all (base + def*2 + skills), so
 * without adding one the change would make Endurance almost pure DEF.
 *
 * Run: node scripts/tune-endurance.mjs
 */

const K = 20
const PRIMARY_WEIGHT = 1.15
const HP_SCALE = 3
const BASE_HP = 12 // representative base + race + courier

const sec = (v, scale = 1) => 0.5 * K * Math.log1p(v / scale / K)

/** POINTS_PER_LEVEL = 3; a def-focused build sinks most of them into DEF. */
function build(level, hpPerLevel, defShare = 0.6) {
  const points = (level - 1) * 3
  const def = Math.round(points * defShare)
  const hp = BASE_HP + def * 2 + (level - 1) * hpPerLevel
  return { def, hp }
}

for (const hpPerLevel of [0, 2, 3, 4, 6]) {
  console.log(`\n--- HP_PER_LEVEL = ${hpPerLevel} ---`)
  console.log("lvl  def   hp   endurance  (def part / hp part)   hp share")
  for (const level of [1, 5, 10, 20, 40]) {
    const { def, hp } = build(level, hpPerLevel)
    const defPart = def * PRIMARY_WEIGHT
    const hpPart = sec(hp, HP_SCALE)
    const total = defPart + hpPart
    const share = ((hpPart / total) * 100).toFixed(0)
    console.log(
      `${String(level).padStart(3)} ${String(def).padStart(4)} ${String(hp).padStart(4)} ${total.toFixed(1).padStart(9)}   (${defPart.toFixed(1)} / ${hpPart.toFixed(1)})${" ".repeat(8)}${share}%`,
    )
  }
}

// A pure powerleveller who dumps nothing into DEF still gains Endurance from
// level alone; that floor is the anti-powerlevel property we want.
console.log("\n--- floor from level alone (0 DEF spent), HP_PER_LEVEL = 4 ---")
for (const level of [1, 5, 10, 20, 40]) {
  const hp = BASE_HP + (level - 1) * 4
  console.log(`  lvl ${String(level).padStart(3)}: hp ${String(hp).padStart(4)}  endurance floor ${sec(hp, HP_SCALE).toFixed(1)}`)
}
