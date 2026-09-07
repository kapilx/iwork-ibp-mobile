const fs = require("fs");
const { SourceMapConsumer } = require("source-map");

(async () => {
  const mapPath = "dist/apps/ui/ibp/assets/index-XHJZzWhu.js.map";
  const raw = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const consumer = await new SourceMapConsumer(raw);

  const line = 216;
  const column = 64907;

  const pos = consumer.originalPositionFor({ line, column });
  console.log("Resolved position:", pos);

  // Also scan a window of nearby columns on the same line in case of off-by-a-bit,
  // and print the surrounding original source lines for context.
  if (pos.source) {
    const content = consumer.sourceContentFor(pos.source, true);
    if (content) {
      const lines = content.split("\n");
      const start = Math.max(0, (pos.line || 1) - 6);
      const end = Math.min(lines.length, (pos.line || 1) + 5);
      console.log(`\n--- ${pos.source} (lines ${start + 1}-${end}) ---`);
      for (let i = start; i < end; i++) {
        console.log(`${i + 1}${i + 1 === pos.line ? " >>" : "   "} ${lines[i]}`);
      }
    } else {
      console.log("No inline source content for", pos.source);
    }
  }

  consumer.destroy();
})().catch((e) => {
  console.error("FAILED", e);
  process.exit(1);
});
