# Opinions

Inspired by Kun Chen's "Everyone Should Have an OPINIONS.md"
(https://blog.kunchenguid.com/p/everyone-should-have-an-opinionsmd); a few
entries are adapted from his.

How I'd decide when no rule says what to do. Read this when a task involves a
judgment call: design, trade-offs, scope, tooling, or how to present work.
Rules (`AGENTS.md` / `CLAUDE.md`) say what must happen; these are defaults
that a project's own conventions or an explicit request can override.

What belongs here: durable, general preferences that change how work gets
done. Not here: anything sensitive (clients, credentials, internal details),
one-off task decisions, or strong takes on contested topics.

## Working with agents

### Agents should be judged by useful work, not demos
A change is done when it works in the real environment and is verified, not
when it looks plausible. Say what was tested and what wasn't.

### Run fast, but gate what can't be undone
Routine work should not stop for approval. Production writes, deploys,
deletes, and anything outward-facing should always pause for a human.
Permissions and credentials are the real boundary; prompts are the second line.

### Decisions that are mine get asked, not assumed
When a choice changes scope, cost, or direction, or a requirement is unclear
or has two valid approaches, stop and ask with a recommendation before
building that part. Don't ask about things with an obvious conventional answer.

### Requirements, tests, and review are the bottleneck
Agree on behavior first (plain-language scenarios), then code. Time spent on
clear acceptance criteria and review pays back more than faster typing.

## Code and change

### Small, focused diffs
Solve the stated problem. Unrelated improvements are noted, not folded in.

### Fix what you touch; flag the backlog
Existing problems found along the way (type errors, lint, dead code) are
listed with counts, and I decide how far to go. Cleanup gets its own pass.

### Match what's already there
Follow the project's patterns, naming, and tools before introducing new ones.
Keep the same concept consistent everywhere: one name across API and client,
the same commands across repos, the same keys across tools. A slightly better
local fit isn't worth something new to remember.

### Avoid duplication, but decide how together
If a value, type, setting, or helper already exists, use it rather than adding
a copy. When a change would create a duplicate, or you notice existing
duplication, flag it and ask instead of choosing: facts (values, types,
business rules) usually belong in one place, while code that merely looks
similar is often fine to leave until a pattern is clear. Don't create shared
helpers or consolidate copies without agreement. When writing into something
that already exists, merge; never silently overwrite.

### Make the right thing automatic
If a check matters, put it in tooling or CI rather than relying on someone
remembering. Rules and instructions are for judgment, automation is for
enforcement.

## Code defaults

### Own the code unless a package clearly earns its place
Prefer an internal solution when most of the knowledge is ours. Use a package
when it's an industry standard, solves something hard to get right, or saves
significant time. Avoid bloated packages that install far more than the task
needs (a full editor suite when three tools are used); look for a lighter or
modular option first. When adding one, say why it earns its place.

### Strict in the backend, graceful in the UI
APIs and backend code validate at their boundaries and fail loudly with clear
errors; no swallowed exceptions or silent fallbacks. The UI degrades
gracefully with a user-friendly message, while still logging the real error.

### Readable first, except where data moves
Write the clear version and optimize only for a measured problem, except for
database queries and data fetching: those are always written with performance
in mind (no N+1 queries, over-fetching, or repeated requests).

### Follow the project, lean on SOLID
Within the project's conventions, prefer one responsibility per unit,
extending over modifying shared code, and depending on abstractions at
boundaries. Don't force patterns the codebase doesn't already use.

## Communication

### Short by default, detail on request
Lead with the outcome in a paragraph or two; offer depth as a follow-up.

### Concrete over jargon
Name the actual key, command, or file ("press Space then e") rather than the
concept ("Leader + e"). Write for someone who wasn't there for the context.

### Comments earn their place
Code comments and PR comments add context the code or description can't
give. Restating what's already visible is noise.
