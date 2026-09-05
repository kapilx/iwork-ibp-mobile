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

## 2. Backend Guidelines

### 1.Code Structure & Organization

- **Follow the NestJS module structure**—group related controllers, services, and models within modules.
- **Keep files small and manageable**—each module should have a clear responsibility.
- **Separate concerns properly**—controllers handle HTTP requests, services handle business logic, and repositories interact with the database.
- **Use Dependency Injection (DI)** to manage dependencies efficiently.
- **Organize the folder structure** to improve readability and maintainability.

### 2.Naming Conventions

- **Modules, controllers, and services** should follow **PascalCase** (e.g., `UserModule`, `AuthService`).
- **Variables and functions** should follow **camelCase** (e.g., `getUserById`, `isValidToken`).
- **Constants** should be stored in a separate file and follow **UPPER_CASE_WITH_UNDERSCORES** (e.g., `JWT_SECRET_KEY`).
- **Environment variables** should follow `UPPER_CASE_WITH_UNDERSCORES` (e.g., `DB_HOST`, `API_KEY`).

### 3. Single Responsibility Principle (SRP) & DRY

- **Each function should have a single, well-defined purpose** and should not perform multiple tasks.
- **Avoid code duplication**—move reusable logic into **helper functions** or **common utility services**.
- **Use DTOs (Data Transfer Objects)** for request validation and transformation.

### 4. Error Handling & Logging

- **Use NestJS built-in exception filters** to handle errors centrally (`HttpExceptionFilter`).
- **Throw meaningful HTTP exceptions** (`throw new NotFoundException('User not found')`).
- **Use a logger (e.g., `Logger` from NestJS)** for structured logging.
- **Log all critical actions and errors**, but avoid logging sensitive data.
- **Use middleware or interceptors** for global error handling if required.

### 5. Authentication & Authorization

- **Use JWT authentication** for secure user sessions.
- **Implement role-based access control (RBAC)** using NestJS guards (`@UseGuards(RolesGuard)`).
- **Secure routes using `AuthGuard`** (`@UseGuards(AuthGuard('jwt'))`).
- **Never expose sensitive information** in responses.

### 6. Database Best Practices

- **Use TypeORM** for database management.
- **Define entities and relationships properly** using decorators (`@Entity()`, `@ManyToOne()`).
- **Use migrations for schema changes** instead of modifying the database directly.
- **Index frequently queried fields** for better performance.
- **Use transactions** where needed to maintain data integrity.

### 7. API Design Best Practices

- **Follow RESTful principles** (`GET /users`, `POST /auth/login`).
- **Use meaningful HTTP status codes** (`201 Created`, `400 Bad Request`, `403 Forbidden`).
- **Validate request payloads** using `class-validator` and `class-transformer`.
- **Use pagination and filtering** for large datasets (`/users?page=1&limit=10`).
- **Document APIs using Swagger** (`@nestjs/swagger`).

### 8. Security Best Practices

- **Use environment variables** instead of hardcoding secrets.
- **Hash passwords using bcrypt** (`bcrypt.hash(password, salt)`).
- **Sanitize user inputs** to prevent SQL injection and XSS attacks.
- **Enable CORS properly** (`app.enableCors()`).
- **Use helmet middleware** to add security headers.
- **Rate-limit API requests** to prevent abuse (`rate-limit` middleware).

### 9. Code Quality & Linting

- **Follow ESLint and Prettier** for consistent code formatting.
- **Run linting and formatting before committing** (`npm run lint`, `npm run format`).
- **Write meaningful inline comments** where necessary.
- **Remove all commented-out and unnecessary code or imports.**
- **Ensure proper formatting** with no lint errors before committing the code.

### 10. Branching & Version Control

- **Follow Git best practices** (`feature/`, `bugfix/`, `hotfix/` branches).
- **Use meaningful commit messages** (`feat: add JWT authentication`).
- **Follow a standard PR naming format:**
  - If Jira ID is `IIRM-1234` and the title is `Implement login functionality`,
  - PR title should be: **`feature/IIRM-1234-implement-login-functionality`**

```
src/
│── main.ts                # Entry point
│── app.module.ts          # Root module
├── modules/               # Feature-based modules
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   ├── tests/
│   │   │   ├── users.service.spec.ts
│   │   │   ├── users.controller.spec.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── jwt.strategy.ts
│   │   ├── local.strategy.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   ├── tests/
│   │   │   ├── auth.service.spec.ts
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── middlewares/
│   ├── interceptors/
│   ├── utils/
│   │   ├── password-hash.util.ts
│   │   ├── date.util.ts
│   │   ├── response.util.ts
├── config/
│   ├── database.config.ts
│   ├── app.config.ts
│   ├── jwt.config.ts
├── constants/              # Global constants
├── interfaces/             # Global interfaces
├── filters/                # Global exception filters
├── pipes/                  # Global pipes
├── validators/             # Custom validators
├── assets/                 # Static assets (icons, images)
├── environments/           # Environment files
│   ├── .env
│   ├── .env.development
│   ├── .env.production
├── tests/                  # Integration tests
├── README.md               # Documentation
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

- **Optimize database queries** using eager loading (`relations: ['profile']`).
- **Use caching mechanisms** (Redis) for frequently accessed data.
- **Use pagination and limit query results** (`skip, take`).
- **Minimize the use of synchronous operations**—use async/await properly.

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
