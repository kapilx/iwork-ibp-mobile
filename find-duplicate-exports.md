# Find Duplicate Exports Utility

This utility script helps you identify duplicate exports (functions, types, interfaces, constants, etc.) across the `apps/ui/ui-lib/src` directory in your monorepo. Duplicate exports can lead to confusion, conflicts, and maintenance issues, so it's important to detect and resolve them early.

---

## How It Works

- The script uses [ts-morph](https://ts-morph.com/) to parse all TypeScript files in `apps/ui/ui-lib/src/**/*.ts` and `apps/ui/ui-lib/src/**/*.tsx`.
- It builds a map of all exported symbols and the files where they are exported.
- If a symbol is exported from more than one file, it prints a warning with the symbol name and the file paths.

---

## Usage

### 1. Install Dependencies

If you haven't already, install `ts-morph`:

```bash
npm install ts-morph
```

### 2. Run the Script

From the root of your repository, run:

```bash
npx ts-node find-duplicate-exports.ts
```

Or, if you have `ts-node` installed globally:

```bash
ts-node find-duplicate-exports.ts
```

### 3. Review Output

The script will output lines like:

```
❗ Duplicate exports found:

🔁 BUTTON_PROPS exported in:
  - /absolute/path/to/Button/index.ts
  - /absolute/path/to/Button/types.ts

🔁 useCustomHook exported in:
  - /absolute/path/to/hooks/useCustomHook.ts
  - /absolute/path/to/utils/useCustomHook.ts
```

Each entry indicates a symbol that is exported from multiple files.

If no duplicates are found, you will see:

```
✅ No duplicate exports found.
```

---

## Alternative: Shell Command

You can also use a shell one-liner to find duplicate export names (names only, no file locations):

```bash
grep -hroE 'export (const|function|class|type|interface|enum) \w+' apps/ui/ui-lib/src \
  | awk '{print $2}' \
  | sort \
  | uniq -d
```

---

## Notes

- The script uses the `tsconfig.base.json` file for project context. Adjust the path if your config is elsewhere.
- Both `.ts` and `.tsx` files under `apps/ui/ui-lib/src` are scanned.
- For best results, ensure your codebase is up-to-date and all files are saved before running.
- This script is intended for use in an Nx monorepo with a React (Vite) frontend.

---

## Troubleshooting

- If you see unexpected results, check for barrel files or re-exports that might cause duplicate symbol names.
- Make sure your `tsconfig.base.json` includes all relevant files.
- If you add or remove files, re-run the script to update the results.

---

## Related

- [ts-morph documentation](https://ts-morph.com/)
- [Conventional Commit Guidelines](https://www.conventionalcommits.org/en/v1.0.0/)
