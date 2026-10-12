# Project notes for Claude

## Design system

`DESIGN.md` is the single source of truth for all UI/UX in this project.
Before implementing any new UI component or UX pattern, check it against
`DESIGN.md` first — if it doesn't fit, stop and get the user's feedback
before writing code, and update `DESIGN.md` itself when the system
legitimately needs to grow.

## `feature/` folder

`feature/` (gitignored, local-only) holds design-decision docs for past and
future feature work. `feature/completed/` holds docs for features that are
already built and shipped — kept as historical record of the design
reasoning, not as active specs.

**Do not read, list, or reference anything under `feature/` (including
`feature/completed/`) unless the user explicitly asks about it or names a
file in it.** Treat it as out of scope for normal exploration, audits, or
codebase searches.

## GitHub push user

This repo (`codetopolymath/finance`) requires pushing as the `codetopolymath`
GitHub account. This machine's `gh` CLI has both `codetopolymath` and
`rohit-ghawale` accounts logged in, and the active one may not be
`codetopolymath`. **Before pushing to the remote, run `gh auth status` — if
`codetopolymath` isn't the active account, run
`gh auth switch --user codetopolymath` (and `gh auth setup-git` if the git
credential still fails) before retrying the push.**
