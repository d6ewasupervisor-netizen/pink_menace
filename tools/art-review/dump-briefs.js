"use strict";

const fs = require("fs");
const path = require("path");
const { camerasForHazard } = require("../../scripts/geometry");

const dir = path.join(__dirname, "..", "..", "cards");
const files = fs
  .readdirSync(dir)
  .filter((f) => /^III-\d{3}\.json$/.test(f))
  .sort();

for (const f of files) {
  const c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  const b = c.image_brief || {};
  const g = b.geometry || {};
  const cam = b.camera;
  const haz = g.hazard_position;
  const allowed = camerasForHazard(haz, c.driver);
  const camOk = !allowed || allowed.includes(cam);
  const parts = String(c.debrief || "")
    .trim()
    .split(/(?<=[.!?])\s+/);
  process.stdout.write(
    JSON.stringify({
      id: c.card_id,
      cam,
      haz,
      heading: g.ego_heading,
      camOk,
      hook: c.hook,
      decision: c.decision,
      read: b.read,
      scene: String(c.scene || "").slice(0, 220),
      closer: parts[parts.length - 1] || "",
    }) + "\n"
  );
}
