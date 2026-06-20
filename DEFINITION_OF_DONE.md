# DEFINITION_OF_DONE.md

> A task is not done until every applicable item is checked.
> "Done" does not mean "the code works on my machine."
> Agents must not mark a task complete in TASKS.md until this checklist passes.

---

## Code Quality

- [ ] The code compiles / builds with no new errors
- [ ] Static type checking passes with no new errors or suppressions
- [ ] No new lint errors or warnings
- [ ] No `TODO`, `FIXME`, `HACK`, or `XXX` comments in delivered code
- [ ] No commented-out code blocks
- [ ] No debug logging left in (e.g. `console.log`, `print`, `debugger`)
- [ ] No hardcoded secrets, credentials, or environment-specific values
- [ ] No new dependencies added without noting them in the task response

## Correctness

- [ ] The implementation matches the acceptance criteria in `TASKS.md`
- [ ] The implementation follows the approach in `PLAN.md` — or `PLAN.md` has been updated to reflect the deviation
- [ ] All code paths handle errors — nothing is silently swallowed
- [ ] Edge cases identified in the task are handled
- [ ] No unintended side effects on code outside the task scope

## Tests

- [ ] All existing tests pass (full suite — not just tests for the changed code)
- [ ] New behaviour has tests
- [ ] New tests cover at least one failure path, not only the happy path
- [ ] Test names describe the expected behaviour, not the implementation
- [ ] No test infrastructure left in production code paths

## Documentation

- [ ] `TASKS.md` updated — task marked complete with any relevant notes
- [ ] `PLAN.md` updated if the approach deviated from the plan
- [ ] `docs/DECISIONS.md` updated if a non-obvious architectural decision was made
- [ ] Inline comments added where the code is non-obvious (not to explain what, but why)
- [ ] Public API / function signatures match what is documented, if docs exist

## Review Readiness

- [ ] Changes are limited to the scope of the task — no unrelated changes
- [ ] The diff is readable: one logical change, not a mix of multiple concerns
- [ ] Commit message follows the project convention (`docs/CONVENTIONS.md`)
- [ ] No merge conflicts

## For Database Changes Only

- [ ] Migration is reversible (has a down migration)
- [ ] Migration tested both up and down
- [ ] No data-destructive operations without explicit sign-off
- [ ] Schema change is backward-compatible, or a deployment plan exists

## For API Changes Only

- [ ] Backward-compatible, or existing clients have been updated
- [ ] Error responses follow the established error format
- [ ] New endpoints are authenticated if they access non-public data
- [ ] Input validation present on all new endpoints

## For Security-Sensitive Changes

- [ ] Auth paths tested for both authorised and unauthorised access
- [ ] No PII written to logs
- [ ] No sensitive data in error messages returned to clients
- [ ] Human review completed before merge (not agent-only)

---

## What "Done" Is Not

- "It works in dev" — the test suite must pass
- "I tested it manually" — manual testing does not replace automated tests; it supplements them
- "The type checker is happy" — types passing does not verify runtime behaviour
- "I'll clean it up later" — code that ships is code that stays
