import { Project } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "./tsconfig.base.json", // Use base config
});

// Support both `.ts` and `.tsx` files
const sourceFiles = project.getSourceFiles([
  "apps/ui/ui-lib/src/**/*.ts",
  "apps/ui/ui-lib/src/**/*.tsx",
]);

const exportMap: Record<string, string[]> = {};

sourceFiles.forEach((file) => {
  file.getExportSymbols().forEach((symbol) => {
    const name = symbol.getName();
    if (!exportMap[name]) exportMap[name] = [];
    exportMap[name].push(file.getFilePath());
  });
});

const duplicates = Object.entries(exportMap).filter(
  ([_, paths]) => paths.length > 1
);

if (duplicates.length === 0) {
  console.log("✅ No duplicate exports found.");
} else {
  console.log("❗ Duplicate exports found:\n");
  duplicates.forEach(([name, paths]) => {
    console.log(`🔁 ${name} exported in:\n  - ${paths.join("\n  - ")}\n`);
  });
}

//   grep -hroE 'export (const|function|class|type|interface|enum) \w+' apps/ui/ui-lib/src \
//   | awk '{print $2}' \
//   | sort \
//   | uniq -d

// const
// enum
// function
// interface
// type

//open bash and run the following command to find duplicate exports
// npx ts-node find-duplicate-exports.ts
