## Follow all the instructions below for code generation

# IIRM Code Guidelines

## 1. Common Guidelines

### Interfaces and Types

- Use **interfaces and type aliases** to define complex types and enforce type checking.

### Type Annotations

- Use **type annotations** for variables, function parameters, and return types to ensure type safety.

### Naming Conventions

- Naming convention for common libraries shared between UI and backend:
  - All program variables and functions should use **camelCase** notation.
  - Constant variables should be defined in **TITLE_CASE** separated by an underscore.
- **Use `let` and `const`**:
  - Prefer `const` for variables that will not be reassigned.
  - Use `let` for variables that can be reassigned.
  - Avoid using `var`.

### Export Hierarchy

- Follow an export hierarchy where everything is exported to its parent with a unique name in the module.
- At the end, all exports should be directly exported at the module level.

### Dependencies

- This is a **common library** and **should not** depend on any other modules or internal libraries.

---

## 2. Frontend Guidelines

### Component Structure

- Define **one component per file**, and the file should be **< 200 lines**.
- A component should have:
  - A **component file (`index.tsx`)**.
  - A **styles file (`styles.ts`)** that includes styles as **styled components**.

### Naming Conventions

- Components and folders should follow **PascalCase**.
- Variables should use **camelCase**.
- **All names should be meaningful**.
- Define all constants in a **constants file** using **TITLE_CASE** separated by an underscore.

### React Best Practices

- Use **functional components with hooks**.
- Follow **component reusability and modularization**.
- Keep **TSX clean and readable**.
- **Follow clean code principles**.
- **Arrow Functions**: Use arrow functions (`=>`) for anonymous functions, especially for callbacks.
- **Error Handling**: Always handle errors gracefully. Use `try...catch` for synchronous code and `.catch()` for Promises.

### Coding Best Practices

- **SRP (Single Responsibility Principle)**: A component should serve **one** well-defined purpose.
- **DRY (Don't Repeat Yourself)**: Reusable components and functionalities should be implemented.
- **No inline styles**: Use styled components or CSS modules.
- **Icons** should be named in **lowercase** separated by `-` and stored in the `assets` folder.
- **Helper functions and services** should be available **outside** the component in the `utils` library based on scope.
- **Types should be defined and reused based on scope**.

### Code Formatting & Linting

- **Remove commented/unwanted code and imports** before committing.
- **Use Prettier** for proper formatting with **no lint errors**.
- Provide **inline comments** for necessary components, functions, and variables but prioritize self-explanatory code.
  - Use **Copilot Doc Generation** by selecting the code.

### Branch Naming

- If Jira ID is `IIRM-1234` and the Jira title is **"Implement login functionality"**,
  - PR title should be:  
    **`feature/IIRM-1234-implement-login-functionality`**

### Folder Structure

```text
/apps/ui/MFE
|-src/
|----components (Reusable UI Components)
|----hooks (Custom React Hooks)
|----contexts (React Contexts)
|----pages (Page-level components)
|----services (API Calls using Axios)
|----utils (Frontend-specific utilities)
|----app/
|-------app.tsx
|----main.tsx
```

---

## 3. Testing Best Practices

- **Write unit tests using Jest** (`describe, it, expect`).
- **Implement integration tests for APIs**.
- **Follow TDD (Test-Driven Development) principles where applicable**.
- **Mock dependencies properly** to avoid external calls in tests.
- **Ensure each service and controller has test coverage**.
- **Run tests before pushing code** (`npm run test`).
- **Code coverage percentage should be at least 90%**.

---

## 4. Performance Optimization

- **Optimize images and assets**.
- **Use lazy loading and code splitting in React**.

---

## 5. Documentation

- **Maintain clear README files**.
- **Use JSDoc or TypeDoc for inline documentation**.

---

## 6. PR Guidelines

### PR Title

- If Jira ID is `IIRM-1234` and Jira title is **"Build a login functionality"**, then PR title should be:
  **`IIRM-1234-Build a login functionality`**

### PR Description

- **Unit test cases** are mandatory for all files and components included in the PR.
- **Code coverage percentage should be a minimum of 90%**.
- **Include screenshots of the passed test cases**.
- **Include the leads and Copilot as reviewers for all PRs**.

---

## 7. General Principles

- **Consistency**: Consistent code is crucial for readability and maintenance.
- **Clarity**: Write code that is clear and easy to understand.
- **Simplicity**: Avoid complexity when simpler solutions exist.
- **Scalability**: Ensure that code is scalable and maintainable.

---

## 8. References

- [Code commit guidelines](https://www.conventionalcommits.org/en/v1.0.0/)
