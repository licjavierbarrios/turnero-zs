# Task Completion Checklist for Turnero ZS

## Quality Assurance Steps
When completing any development task, always run these commands:

1. **Type Checking**
   ```bash
   npm run typecheck
   ```
   - Ensures TypeScript compilation succeeds
   - Catches type errors early
   - Must pass before considering task complete

2. **Code Linting**
   ```bash
   npm run lint
   ```
   - Checks code style and potential issues
   - Follows Next.js and ESLint best practices
   - Must pass before considering task complete

3. **Build Verification** (for significant changes)
   ```bash
   npm run build
   ```
   - Ensures production build succeeds
   - Catches build-time errors
   - Recommended for major features

## Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] User-facing text is in Spanish
- [ ] Components follow shadcn/ui patterns
- [ ] Responsive design implemented
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Accessibility considerations addressed

## Database Changes Checklist
- [ ] RLS policies updated if needed
- [ ] Database schema migrations planned
- [ ] Seed data updated if necessary
- [ ] Multi-tenancy isolation verified

## Testing Checklist (when tests exist)
Currently no test framework is set up. Future sprints should include:
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows

## Documentation Checklist
- [ ] Update relevant README sections
- [ ] Document new environment variables
- [ ] Update API documentation if applicable
- [ ] Add inline comments for complex logic

## Deployment Checklist (for production)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build succeeds in production environment
- [ ] Real-time functionality tested
- [ ] Performance metrics validated