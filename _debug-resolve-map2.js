const fs = require("fs");
const { SourceMapConsumer } = require("source-map");

(async () => {
  const mapPath = "dist/apps/ui/ibp/assets/index-C0fvRleP.js.map";
  const raw = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const consumer = await new SourceMapConsumer(raw);
  const pos = consumer.originalPositionFor({ line: 503, column: 64865 });
  console.log("Resolved position:", pos);
  if (pos.source) {
    const content = consumer.sourceContentFor(pos.source, true);
    if (content) {
      const lines = content.split("\n");
      const start = Math.max(0, (pos.line || 1) - 8);
      const end = Math.min(lines.length, (pos.line || 1) + 5);
      console.log(`\n--- ${pos.source} (lines ${start + 1}-${end}) ---`);
      for (let i = start; i < end; i++) {
        console.log(`${i + 1}${i + 1 === pos.line ? " >>" : "   "} ${lines[i]}`);
      }
    }
  }
})().catch((e) => { console.error("FAILED", e); process.exit(1); });
