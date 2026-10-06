# Shell hints

Personal cheat sheet for aliases, keybindings, and tools to integrate into your workflow.
Run `hint` to open this file in your default markdown app.

> Add a new reminder quickly:
> `printf -- "- %s\n" "note text" >> ~/.config/shell/hints.md`

## Aliases already in your shell

| Command | What it does |
| --- | --- |
| `lf` | file manager; Enter = new WezTerm tab, `l` = open in current pane |
| `sf` | same as `lf` (alias of lfcd) |
| `hint` | open this file in the default markdown app |
| `rfind` | global search: Enter = new tab, Ctrl-L = current pane |
| `gopen` | dirty git files → one new WezTerm/tmux tab (nvim tabs inside) |
| `topen` | open file(s) in a new WezTerm/tmux tab: `topen path` |
| `edit-tab` / `edit-here` | open file(s) in a new WezTerm/tmux tab / current pane |

Git branch Tab-completion is enabled (`git switch <Tab>`, `git checkout <Tab>`, etc.).


## Keybindings

| Keys | What it does |
| --- | --- |
| Cmd+P | fuzzy find: Enter = new WezTerm tab, Ctrl-L = current pane |
| Ctrl+Shift+P / Cmd+Shift+P | WezTerm command palette |
| Leader `b` `%` / `b` `"` | split pane horizontal / vertical |
| Leader `b` c / `b` n / `b` p | new tab / next tab / previous tab |
| Leader `b` z | zoom / unzoom the current pane |

## Vim / Neovim shortcuts

| Keys | What it does |
| --- | --- |
| `:Cclaude` / `:Ccursor` / `:Copencode` | open that agent in a side split, seeded with open tabs + dirty files (`:Copencode`: press Enter to send) |
| `:Ccontext` | preview the context an agent would receive, without launching |
| `gt` / `gT` / `2gt` | next / prev / jump to nvim tab (styled by bufferline) |
| `Tn` / `Tp` | next / previous tab (vim + nvim) |
| `T1` … `T9` | jump straight to tab 1-9 (vim + nvim) |
| `:tabedit {file}` | open a file in a new tab |
| `Cmd+/` / `gcc` | toggle comment line (visual: select then `Cmd+/` or `gc`) |
| `gd` | go to definition / open file from import (LSP) |
| `<leader>gt` | definition in a new tab |
| `<leader>gd` | pick from all definition candidates (Telescope) |
| `gr` | go to references (LSP) |
| `]c` / `[c` | next / prev git hunk (gutter signs + line number highlight) |
| right scrollbar | satellite.nvim: map of git changes / diagnostics / search |
| `<leader>hp` | float preview of hunk under cursor |
| `<leader>hd` | side-by-side diff (right/left split vs index) |
| `<leader>hs` / `hr` | stage / reset hunk |
| `<leader>gs` | all git hunks repo-wide (quickfix) |
| `<leader>gm` | pick from modified files (Telescope `git_status`) |
| `Tab` / `Shift-Tab` | next/prev completion (or indent / unindent) |
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