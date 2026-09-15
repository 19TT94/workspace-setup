# Shell hints

Personal cheat sheet for aliases, keybindings, and tools to integrate into your workflow.
Run `hint` to open this file in your editor (vim/nvim).

> Add a new reminder quickly:
> `printf -- "- %s\n" "note text" >> ~/.config/shell/hints.md`

## Aliases already in your shell

| Command | What it does |
| --- | --- |
| `lf` | file manager; opens files in the editor, quits into the selected dir |
| `sf` | same as `lf` (alias of lfcd) |
| `hint` | open this file in the editor for viewing/editing in place |
| `rfind` | global search in the current dir: `rfind <term>` searches now, bare `rfind` searches as you type |

## Keybindings

| Keys | What it does |
| --- | --- |
| Cmd+P | fuzzy find + preview + open any file (sends Ctrl+P to the shell) |
| Ctrl+Shift+P / Cmd+Shift+P | WezTerm command palette |
| Leader `b` `%` / `b` `"` | split pane horizontal / vertical |
| Leader `b` c / `b` n / `b` p | new tab / next tab / previous tab |
| Leader `b` z | zoom / unzoom the current pane |

## Vim / Neovim shortcuts

| Keys | What it does |
| --- | --- |
| `Ctrl+V` → `Shift+I` → `Esc` | visual block mode: insert text at the front of multiple lines |
| `0` | jump to start of line |
| `Shift+4` (`$`) | jump to end of line |

## Tools to integrate

Add rows here as you adopt each tool. Keep one line per tool so the list stays scannable.

| Tool | Command | Use it for |
| --- | --- | --- |
| ripgrep | `rg <term>` | fast recursive search everywhere |
| fzf | `fzf` / `Cmd+P` | fuzzy-find files, preview, jump |
| bat | `bat <file>` | syntax-highlighted file viewer |
| glow | `glow <file.md>` | render markdown in the terminal |

## Quick notes

<!-- delete this file's contents and add your own workflow notes below -->

-