---
name: obsidian-refresh-wiki
description: Refresh the Obsidian wiki/_index.md with current vault content metadata
---

# Refresh Wiki Index

Scan the Obsidian vault for raw articles, threads, and clippings, then update `wiki/_index.md` with accurate metadata and summaries.

## Steps

1. **Read current index** — Read `wiki/_index.md` to understand the existing structure and table format.
2. **Scan vault sources** — Glob and list files in:
   - `raw/articles/`
   - `raw/threads/`
   - `Clippings/` (including subdirectories)
   - `output/` (if present)
3. **Identify new/changed files** — Compare vault contents against the index. Flag files that are:
   - Missing from the index entirely
   - Listed with placeholder or incomplete metadata
   - New since the last refresh
4. **Read new files** — Read the first 30–50 lines of each unindexed file to extract:
   - Title and source/author
   - Publication date (if available)
   - A one-line summary of content
5. **Update the index** — Use `Edit` to:
   - Add new entries to the appropriate table (Articles, Threads, Clippings)
   - Fill in missing metadata for incomplete rows
   - Update the "Last updated" timestamp
   - Add relevant items to the Concepts list if they suggest new article ideas
6. **Confirm** — Summarise what changed: new entries added, rows updated, concepts suggested.

## Conventions

- Follow the existing table column format in `wiki/_index.md` exactly.
- Summaries are one line, factual, no marketing language.
- Date format: `YYYY-MM-DD`.
- If a file has no clear date, use the file modification date or mark as "undated".
- Do not delete existing entries — only add or update.
