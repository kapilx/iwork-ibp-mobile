# Codex Instructions

This repository uses an Nx monorepo containing both React (frontend) and NestJS (backend) applications.  
All contributions should follow the existing conventions defined in `.github/copilot-instructions.md` and the files under `.github/prompts/`.

Commit and PR guidelines
- Use Conventional Commits for commit messages.
- Summarize the key file changes and reference important functions or modules in the PR description.
- Include test results or mention if tests couldn’t run in the environment.
- Keep changes focused; avoid editing unrelated files or lockfiles unless necessary.

Code style
- Ensure Prettier formatting and ESLint rules pass (nx format:write and nx lint).
- Maintain TypeScript strictness—don’t loosen compiler settings.

Scope
- Typical modifications should occur in apps/ or libs/.
- Avoid committing generated artifacts or temporary files.

## Programmatic checks

Before committing, run the following commands from the repository root:

```bash
# Format changed files
#npx nx format:write

# Lint affected projects
#npx nx affected --target=lint --parallel

# Run tests for affected projects
#npx nx affected --target=test --parallel

