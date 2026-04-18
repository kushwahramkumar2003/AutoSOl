# Agent Skill Status

Reviewed on April 15, 2026.

## Result

I checked the curated Codex skill registry for obvious Solana/blockchain/web3 skill matches. I did not get a positive match from that curated list during this run.

## What Was Added Instead

Because there was no clear installable Solana-specific skill match, I added repo-native agent context files instead:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.github/copilot-instructions.md`
- `/doc/03-agent-rules.md`

These files are the most reliable way to keep Codex, Claude Code, Gemini-style agents, and Copilot aligned on this repo right now.

## Recommended Next Step

If you want, the next step can be creating a custom local `autosol-solana` skill tailored to this project's stack:

- Anchor program conventions
- PDA and seed safety rules
- worker/monitor/event schema expectations
- wallet auth requirements
- release checklist for Solana payment flows

That would be a project-specific skill, not a public curated one.
