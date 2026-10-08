# Shell hints

Personal cheat sheet for aliases, keybindings, and tools to integrate into your workflow.
Run `hint` to open this file in your default markdown app.

> Add a new reminder quickly:
> `printf -- "- %s\n" "note text" >> ~/.config/shell/hints.md`

## One set of keys everywhere

In WezTerm and tmux, press `Ctrl+b` first; in Vim and Neovim, press `Space` first.
The key that follows does the same thing in both, e.g. `Ctrl+b z` / `Space z` zooms.

| Action | WezTerm / tmux | Vim / Neovim | Shell |
| --- | --- | --- | --- |
| Move to the pane / split on the left, below, above, right | `Ctrl+h/j/k/l` | `Ctrl+h/j/k/l` (continues into the terminal pane at the edge) | `Ctrl+h/j/k/l` |
| Split side by side / stacked | `Ctrl+b %` / `Ctrl+b "` | `Space %` / `Space "` | |
| Resize | `Ctrl+b H/J/K/L` | `Space H/J/K/L` | |
| Zoom / unzoom | `Ctrl+b z` | `Space z` | |
| Close pane / split | `Ctrl+b x` | `Space x` | |
| Browse files (lf) | | `Space e` | `lf` (or `sf`) |
| Find a file | | `Cmd+P` | `Cmd+P` |
| Search text | | `Space /` | `rfind [term]` |
| Toggle comment | | `Cmd+/` (or `gcc`, visual `gc`) | |

Wherever a file opens (lf, `Cmd+P`, search): **Enter = new tab, `Ctrl+O` = open here** (in lf, `l` = open here).
In the shell a "tab" is a WezTerm/tmux tab; inside an editor it is an editor tab.

`Ctrl+h/j/k/l` move panes, so in a plain shell use `clear` instead of `Ctrl+L`.

## Tabs

| Keys | What it does |
| --- | --- |
| `Cmd+1` … `Cmd+9` | WezTerm tab 1-9 |
| `Ctrl+b c` / `n` / `p` / `1-9` | new / next / previous / jump to WezTerm or tmux tab |
| `Ctrl+b ,` | rename the tab |
| `Tn` / `Tp` / `T1` … `T9` | next / previous / jump to editor tab (vim + nvim) |
| `gt` / `gT` / `2gt` | built-in editor tab keys (same as `Tn` / `Tp` / `T2`) |
| `:tabedit {file}` | open a file in a new editor tab |

## Shell aliases

| Command | What it does |
| --- | --- |
| `vim` | opens Neovim (when installed) |
| `vimt` | Neovim in a new WezTerm tab |
| `topen` / `edit-tab` | open file(s) in a new WezTerm/tmux tab: `topen path` |
| `edit-here` | open file(s) in the current pane |
| `gopen` | dirty git files → one new WezTerm/tmux tab (editor tabs inside) |
| `opn` | open file(s) in their default app: `opn notes.md` |
| `ezshrc` / `rzshrc` | edit / reload `~/.zshrc` (zsh only) |
| `hint` | open this file in the default markdown app |
| `pstash "idea"` / `pstash` | stash a prompt for later (no text: write it in your editor) |
| `pstash list` / `pop [n]` / `peek [n]` | list stashed prompts; copy one to the clipboard (pop also removes it) |

Git branch Tab-completion is enabled (`git switch <Tab>`, `git checkout <Tab>`, etc.).

## Terminal (WezTerm / tmux)

| Keys | What it does |
| --- | --- |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | WezTerm command palette |
| `Ctrl+b o` | rotate panes |
| `Ctrl+b [` | copy mode (vi keys; `v` select, `y` copy in tmux) |
| `Ctrl+b ]` | paste |

## Editor (Vim + Neovim)

| Keys | What it does |
| --- | --- |
| `Space w` / `Space q` | write / quit |
| `Space s` | stash the selection as a prompt (normal mode: type a one-liner) |
| `:Pstash` / `:Pstash pop 2` | list stashed prompts / pop one to the clipboard |
| `:Cclaude` / `:Ccursor` / `:Copencode` | open that agent in a side split, seeded with open tabs + dirty files (`:Copencode`: press Enter to send) |
| `:Ccontext` | preview the context an agent would receive, without launching |
| `Ctrl+V` → `Shift+I` → `Esc` | visual block mode: insert text at the front of multiple lines |
| `0` / `$` | start / end of line |

## Neovim only

| Keys | What it does |
| --- | --- |
| `gd` / `Space gt` / `Space gd` | go to definition / in a new tab / pick from candidates |
| `gr` | references |
| `K` | hover docs |
| `Space rn` / `Space a` | rename symbol / code action |
| `Space d` | show the diagnostic under the cursor |
| `Space F` | format the file (also runs on save) |
| `Ctrl+Space` / `Tab` / `Shift-Tab` | completion: open / next / previous (or indent / unindent) |
| `Ctrl+K` (insert mode) | signature help |
| `]c` / `[c` | next / previous git hunk |
| `Space hp` / `Space hd` | preview hunk / side-by-side diff against the index |
| `Space hs` / `Space hr` | stage / reset hunk |
| `Space gs` / `Space gm` | all git hunks (quickfix) / pick from modified files |
| right scrollbar | map of git changes, diagnostics and search matches |
| `:Lazy` / `:Mason` | manage plugins / language servers and formatters |

## Tools to integrate

Add rows here as you adopt each tool. Keep one line per tool so the list stays scannable.

| Tool | Command | Use it for |
| --- | --- | --- |
| ripgrep | `rg <term>` | fast recursive search everywhere |
| fzf | `fzf` / `Cmd+P` | fuzzy-find files, preview, jump |
| bat | `bat <file>` | syntax-highlighted file viewer |
| lf | `lf` / `Space e` | file manager: `h`/`l` out/in, `j`/`k` move |

## Quick notes

<!-- delete this file's contents and add your own workflow notes below -->

-
