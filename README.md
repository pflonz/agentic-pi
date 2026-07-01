# agentic-pi

Portable pi package — extensions, skills, prompts, and themes for [pi](https://pi.dev).

## Install

```bash
pi install git:github.com/your-user/agentic-pi
```

Pi clones this repo to `~/.pi/agent/git/github.com/your-user/agentic-pi/` and auto-loads everything in `extensions/`, `skills/`, `prompts/`, and `themes/`.

## Structure

| Directory | What goes here |
|-----------|----------------|
| `extensions/*.ts` | TypeScript extensions (`export default function(pi)`) |
| `skills/*/SKILL.md` | Skills — frontmatter `name` + `description`, body is the prompt |
| `prompts/*.md` | Prompt templates — loaded via `/template:<name>` |
| `themes/*.json` | Custom themes |

All four directories are optional. Add what you need, leave the rest empty (or delete them).

## Update

```bash
pi update --extensions                              # reconcile all git packages
pi update git:github.com/your-user/agentic-pi@v2    # bump to a new tag/ref
```

## New machine setup

```bash
# 1. Install pi (see https://pi.dev)
# 2. Set API keys in your shell profile
export ANTHROPIC_API_KEY=...
# 3. Install this package
pi install git:github.com/your-user/agentic-pi
# 4. Done — extensions, skills, prompts, themes auto-load
```

## Adding content

- **Extension**: drop a `.ts` file in `extensions/`. Use `/reload` in pi to hot-reload.
- **Skill**: create `skills/<name>/SKILL.md` with frontmatter (`name`, `description`).
- **Prompt template**: drop a `.md` file in `prompts/`.
- **Theme**: drop a `.json` file in `themes/`.

See [pi docs](https://pi.dev/docs) for details on each resource type.

## Versioning

Tag releases so `pi install git:...@v1` pins to a known version:

```bash
git tag v1
git push --tags
```