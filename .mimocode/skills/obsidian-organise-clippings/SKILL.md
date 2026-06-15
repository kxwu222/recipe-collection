---
name: obsidian-organise-clippings
description: Organise Obsidian Clippings files into topic-based subdirectories
---

# Organise Clippings

Read all `.md` files in the vault's `Clippings/` folder, categorise them by topic, create subdirectories, and move files.

## Steps

1. **List clippings** — `ls` or `Glob` the `Clippings/` directory. If subdirectories already exist, note them.
2. **Read headers** — Read the first 20–30 lines of each `.md` file to understand its topic. Look at the title, frontmatter, and opening paragraph.
3. **Propose categories** — Group files into 2–4 topic subdirectories. Prefer existing subdirectory names if they already cover the topic. Present the plan to the user before moving anything.
4. **Create subdirectories** — `mkdir -p` for each new category.
5. **Move files** — `mv` each clipping into its category subdirectory.
6. **Confirm** — Show the resulting tree structure.

## Conventions

- Subdirectory names are short, title-case, no special characters (e.g. `SEO`, `AI & Search`, `PBSA`).
- If a clipping spans multiple topics, place it in the most specific category.
- Do not rename the `.md` files themselves — only move them.
- If the vault path isn't specified, ask or check for the `Obsidian Vault` directory under `~/Documents/`.
