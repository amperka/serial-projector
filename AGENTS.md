# AGENTS.md

Guidelines for AI agents working with this project.

---

## 1. General Principles

- **Minimalism first**: keep the codebase small, clean, and understandable.
- **No external dependencies in production**: all production code must be plain HTML, CSS, and JavaScript.
- **Static only**: project runs as a static website (with PWA support). No backend code.
- **Modern standards**: use modern JavaScript (ES6+), semantic HTML, and clean CSS.
- **Performance**: target initial load time ≤1 second on average hardware.

---

## 2. Project Structure

```
index.html
src/style.css
src/main.js
src/*.js
public/icons/
public/screenshots/
public/robots.txt
tests/
package.json (dev only)
```

---

## 3. Development Rules

- Do not add new production dependencies.
- For development, only use tools declared in `package.json` (`eslint`, `prettier`, `vitest`).
- Build via `vite`
- Code must run directly in the browser.

---

## 4. Coding Standards

- Follow ESLint rules defined in the project.
- Format code with Prettier.
- Use clear, descriptive names for functions, variables, and classes.
- Avoid over-engineering: minimal code to achieve requirements.
- Keep functions small and focused.

---

## 5. Testing

- All JavaScript code must be unit tested with Vitest.
- Target **≥90% coverage**.
- Write tests alongside features (do not postpone).
- Keep tests readable and focused on behavior.

---

## 6. CI/CD

- GitHub Actions workflow must run:
  - ESLint
  - Prettier format check
  - Vitest unit tests with coverage
- CI must fail if linting, formatting, or tests fail.

---

## 7. PWA Requirements

- Must include manifest.json with icons (`192x192`, `512x512`, etc).
- Must include service worker with:
  - Offline support.
  - Update prompt: _“Update available — click to refresh.”_
- Ensure small static footprint (fast cache load).

---

## 8. Security

- All incoming HTML from Serial must be sanitized:
  - Strip `<script>` tags.
  - Block inline event handlers (`on*=` attributes).
- Never execute arbitrary JavaScript from messages.

---

## 9. Collaboration Notes

- Do not introduce new features beyond specification.
- If user requests enhancements, confirm whether they are **in scope** before implementation.
- Always update documentation (README, AGENTS.md) when workflow changes.

---

## 10. Language & Style

- Code comments and documentation in **English**.
- UI text is in **English only**.

---

## 11. Non-Goals

- No accessibility modes for visually impaired users.
- No multi-language support.
- No server-side code.
- No complex message parsing beyond “last message only.”

---

## 12. Example Prompts for AI Agents

### 12.1 Adding Tests

- _“Write Viest unit tests for the function that parses Serial messages.”_
- _“Add tests ensuring HTML sanitization removes `<script>` tags and inline event handlers.”_
- _“Create a test suite for autoconnect behavior (success, failure, retry).”_

### 12.2 Fixing Bugs

- _“Fix the bug where the reconnect timer continues running after successful reconnection.”_
- _“Correct the sanitization function so it doesn’t strip allowed HTML tags.”_
- _“Resolve fullscreen toggle not working on Safari.”_

### 12.3 Refactoring

- _“Refactor `main.js` to separate UI logic and Serial connection logic into different modules.”_
- _“Simplify the settings modal code while keeping functionality identical.”_
- _“Extract sanitization logic into a standalone function with tests.”_

### 12.4 Documentation

- _“Update README.md with steps to run tests and linting locally.”_
- _“Add a section to AGENTS.md explaining how to add new icons to the PWA manifest.”_
- _“Document the CI workflow in CONTRIBUTING.md.”_

### 12.5 Maintenance

- _“Upgrade Vitest and ESLint devDependencies to the latest stable versions.”_
- _“Ensure Prettier formatting is consistent across all files.”_
- _“Check that the service worker cache clears properly when a new version is deployed.”_

---
