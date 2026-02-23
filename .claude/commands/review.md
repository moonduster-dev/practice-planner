# Code Review Command

Perform a comprehensive code review of this project focusing on:

## 1. Security Analysis
- Check for exposed API keys or credentials
- Review authentication and authorization
- Look for XSS vulnerabilities (dangerouslySetInnerHTML, unvalidated URLs in iframes)
- Check input validation and sanitization
- Review CORS and CSP configurations
- Check for SQL/NoSQL injection vulnerabilities
- Audit dependencies for known vulnerabilities

## 2. Best Practices Review
- TypeScript usage and type safety (avoid `any`)
- React patterns (proper hooks, memoization, effect dependencies)
- Component structure and separation of concerns
- Error handling (try/catch, error boundaries)
- Code organization and naming conventions
- DRY violations (duplicated code)
- ESLint compliance
- Accessibility (ARIA labels, keyboard navigation)

## 3. Efficiency Analysis
- Database query optimization
- React performance (useMemo, useCallback, React.memo)
- Bundle size and tree-shaking
- Memory leaks (uncleared timeouts, subscriptions)
- Algorithm complexity (avoid O(n^2) operations)
- Network request batching and caching
- Lazy loading opportunities

## Output Format
Provide findings in a structured table format:
- Issue name
- File location with line numbers
- Severity (CRITICAL/HIGH/MEDIUM/LOW)
- Recommended fix

Prioritize findings by severity and provide actionable remediation steps.
