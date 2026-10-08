-- Neovim config: plugin-based (lazy.nvim) for a Cursor-style workflow.
-- First launch needs git + network once: lazy bootstraps plugins, Mason installs LSP servers.

vim.g.mapleader = " "

vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.mouse = "a"
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true
vim.opt.smartindent = true
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.opt.splitright = true
vim.opt.splitbelow = true
vim.opt.termguicolors = true
vim.opt.updatetime = 250
vim.opt.signcolumn = "yes"

vim.keymap.set("n", "<leader>w", "<cmd>write<cr>", { desc = "Write file" })
vim.keymap.set("n", "<leader>q", "<cmd>quit<cr>", { desc = "Quit window" })

-- Tab navigation. These shadow Vim's T{char} till-backwards motion for the
-- characters n, p, and the digits -- motions nobody uses in practice. The count
-- for {count}T{char} precedes the T, so T1..T9 cannot collide with it.
vim.keymap.set("n", "Tn", "<cmd>tabnext<cr>", { desc = "Next tab" })
vim.keymap.set("n", "Tp", "<cmd>tabprevious<cr>", { desc = "Previous tab" })
for tab = 1, 9 do
  vim.keymap.set("n", "T" .. tab, "<cmd>" .. tab .. "tabnext<cr>", { desc = "Go to tab " .. tab })
end

-- Splits use the same second key as WezTerm/tmux (Ctrl+b % / " / z / x),
-- with <Space> in place of Ctrl+b. Same in tools/vimrc.
vim.keymap.set("n", "<leader>%", "<cmd>vsplit<cr>", { desc = "Split side by side" })
vim.keymap.set("n", '<leader>"', "<cmd>split<cr>", { desc = "Split stacked" })
vim.keymap.set("n", "<leader>x", "<cmd>close<cr>", { desc = "Close split" })
vim.keymap.set("n", "<leader>z", function()
  if vim.t.zoomed then
    vim.cmd("wincmd =")
  else
    vim.cmd("wincmd _ | wincmd |")
  end
  vim.t.zoomed = not vim.t.zoomed
end, { desc = "Zoom / unzoom split" })

-- Neovim 0.11+ ships gra/gri/grn/grr/grt/grx, which make the `gr` mapping
-- below wait for a possible second key. Drop them so `gr` fires at once;
-- rename and code action keep their <leader>rn / <leader>a mappings.
for _, lhs in ipairs({ "gra", "gri", "grn", "grr", "grt", "grx" }) do
  pcall(vim.keymap.del, "n", lhs)
end
pcall(vim.keymap.del, "x", "gra")

-- <Space>e: browse files with lf in a float, same keys as in the shell:
-- Enter opens in a new tab, l opens here, Enter on a directory cds there.
-- tools/lfrc writes the pick to $LF_PICK instead of opening its own editor.
vim.keymap.set("n", "<leader>e", function()
  local pick = vim.fn.tempname()
  local file = vim.api.nvim_buf_get_name(0)
  local target = file ~= "" and vim.fn.filereadable(file) == 1 and file or vim.fn.getcwd()
  local width = math.floor(vim.o.columns * 0.85)
  local height = math.floor(vim.o.lines * 0.8)
  local buf = vim.api.nvim_create_buf(false, true)
  vim.bo[buf].bufhidden = "wipe"
  local win = vim.api.nvim_open_win(buf, true, {
    relative = "editor", width = width, height = height, border = "rounded",
    row = math.floor((vim.o.lines - height) / 2), col = math.floor((vim.o.columns - width) / 2),
  })
  vim.fn.jobstart({ "lf", target }, {
    term = true,
    env = { LF_PICK = pick },
    on_exit = function()
      vim.schedule(function()
        if vim.api.nvim_win_is_valid(win) then
          vim.api.nvim_win_close(win, true)
        end
        local line = vim.fn.filereadable(pick) == 1 and vim.fn.readfile(pick)[1] or nil
        vim.fn.delete(pick)
        if not line then
          return
        end
        local action, path = line:match("^(%a+)\t(.+)$")
        local cmd = ({ here = "edit", tab = "tabedit", cd = "cd" })[action]
        if cmd then
          vim.cmd[cmd](vim.fn.fnameescape(path))
        end
      end)
    end,
  })
  vim.cmd.startinsert()
end, { desc = "Browse files (lf)" })

-- pstash (tools/pstash): stash prompts for later, same store as the shell.
-- <Space>s stashes the selection (visual) or asks for a one-liner (normal);
-- :Pstash [list | pop n | peek n] runs the shell command.
local function pstash(args, input)
  if vim.fn.executable("pstash") ~= 1 then
    vim.notify("pstash is not installed", vim.log.levels.ERROR)
    return
  end
  local cmd = { "pstash" }
  vim.list_extend(cmd, args)
  vim.notify(vim.trim(vim.fn.system(cmd, input)))
end
vim.keymap.set("x", "<leader>s", function()
  local lines = vim.fn.getregion(vim.fn.getpos("v"), vim.fn.getpos("."), { type = vim.fn.mode() })
  vim.api.nvim_feedkeys(vim.keycode("<Esc>"), "nx", false)
  pstash({ "-" }, table.concat(lines, "\n"))
end, { desc = "Stash selection as a prompt" })
vim.keymap.set("n", "<leader>s", function()
  vim.ui.input({ prompt = "Stash prompt: " }, function(text)
    if text and text ~= "" then
      pstash({ "-" }, text)
    end
  end)
end, { desc = "Stash a prompt" })
vim.api.nvim_create_user_command("Pstash", function(opts)
  pstash(#opts.fargs > 0 and opts.fargs or { "list" })
end, { nargs = "*", desc = "pstash list / pop n / peek n" })

vim.filetype.add({
  extension = { tf = "terraform", tfvars = "terraform" },
})

-- Cursor Dark inline colorscheme (matches Cursor / VS Code 'Cursor Dark'
-- and tools/wezterm.lua). No colorscheme plugin required.
vim.opt.background = "dark"
local p = {
  bg = "#181818", chrome = "#141414", fg = "#d6d6dd", fg_bright = "#f0f0f0",
  comment = "#989898", line_nr = "#666666", line_hl = "#262626", sel = "#3a3a3a",
  teal = "#82D2CE", pink = "#e394dc", cream = "#ebc88d", orange = "#efb080",
  blue = "#87C3FF", purple = "#AAA0FA", rose = "#CC7C8A",
  red = "#F14C4C", green = "#3FA266", yellow = "#D2943E",
}
vim.cmd.colorscheme("default")
do
  local hl = function(name, spec)
    vim.api.nvim_set_hl(0, name, spec)
  end
  hl("Normal", { fg = p.fg, bg = p.bg })
  hl("NormalFloat", { fg = p.fg, bg = p.chrome })
  hl("Comment", { fg = p.comment, italic = true })
  hl("LineNr", { fg = p.line_nr })
  hl("CursorLineNr", { fg = p.fg_bright })
  hl("CursorLine", { bg = p.line_hl })
  hl("CursorColumn", { bg = p.line_hl })
  hl("SignColumn", { bg = p.bg })
  hl("Visual", { bg = p.sel })
  hl("Search", { bg = "#404040", fg = p.fg_bright })
  hl("CurSearch", { bg = p.teal, fg = p.bg })
  hl("Pmenu", { bg = p.chrome, fg = p.fg })
  hl("PmenuSel", { bg = p.sel, fg = p.fg_bright })
  hl("PmenuSbar", { bg = p.chrome })
  hl("StatusLine", { bg = p.chrome, fg = p.fg_bright })
  hl("StatusLineNC", { bg = p.chrome, fg = p.comment })
  hl("TabLine", { bg = p.chrome, fg = p.comment })
  hl("TabLineSel", { bg = p.bg, fg = p.fg_bright })
  hl("TabLineFill", { bg = p.chrome })
  hl("WinSeparator", { fg = p.line_hl })
  hl("VertSplit", { fg = p.line_hl })
  hl("FloatBorder", { fg = p.line_hl })
  hl("FoldColumn", { bg = p.bg, fg = p.line_nr })
  hl("DiagnosticError", { fg = p.red })
  hl("DiagnosticWarn", { fg = p.yellow })
  hl("DiagnosticInfo", { fg = p.blue })
  hl("DiagnosticHint", { fg = p.comment })
  hl("DiagnosticUnderlineError", { undercurl = true, sp = p.red })
  hl("DiagnosticUnderlineWarn", { undercurl = true, sp = p.yellow })
  -- Treesitter tokens mapped to the Cursor Dark syntax palette
  hl("@keyword", { fg = p.teal })
  hl("@keyword.conditional", { fg = p.teal })
  hl("@keyword.repeat", { fg = p.teal })
  hl("@keyword.return", { fg = p.teal })
  hl("@keyword.exception", { fg = p.teal })
  hl("@keyword.import", { fg = p.teal })
  hl("@keyword.function", { fg = p.teal })
  hl("@function", { fg = p.orange })
  hl("@function.call", { fg = p.orange })
  hl("@function.builtin", { fg = p.purple })
  hl("@function.macro", { fg = p.purple })
  hl("@method", { fg = p.orange })
  hl("@method.call", { fg = p.orange })
  hl("@type", { fg = p.orange })
  hl("@type.builtin", { fg = p.teal })
  hl("@type.qualifier", { fg = p.teal })
  hl("@variable", { fg = p.blue })
  hl("@variable.member", { fg = p.blue })
  hl("@variable.builtin", { fg = p.rose })
  hl("@variable.parameter", { fg = p.fg })
  hl("@constant", { fg = p.purple })
  hl("@constant.builtin", { fg = p.purple })
  hl("@constant.macro", { fg = p.cream })
  hl("@string", { fg = p.pink })
  hl("@string.documentation", { fg = p.pink })
  hl("@string.escape", { fg = p.cream })
  hl("@string.regexp", { fg = p.cream })
  hl("@number", { fg = p.cream })
  hl("@float", { fg = p.cream })
  hl("@boolean", { fg = p.teal })
  hl("@operator", { fg = p.fg })
  hl("@punctuation.delimiter", { fg = p.fg })
  hl("@punctuation.bracket", { fg = p.fg })
  hl("@property", { fg = p.purple })
  hl("@field", { fg = p.blue })
  hl("@parameter", { fg = p.fg })
  hl("@label", { fg = p.yellow })
  hl("@include", { fg = p.teal })
  hl("@namespace", { fg = p.orange })
  hl("@constructor", { fg = p.orange })
  hl("@tag", { fg = p.blue })
  hl("@tag.attribute", { fg = p.purple })
  hl("@tag.delimiter", { fg = p.fg })
  hl("@attribute", { fg = p.purple })
  hl("@character", { fg = p.cream })
  hl("@comment", { fg = p.comment, italic = true })
  hl("GitSignsAdd", { fg = p.green })
  hl("GitSignsChange", { fg = p.yellow })
  hl("GitSignsDelete", { fg = p.red })
end

-- Context agents: :Cclaude / :Ccursor / :Copencode open that agent in a split
-- beside this window (WezTerm/tmux pane, else :terminal), seeded with this
-- session's open tabs + dirty files. :Ccontext previews the context first.
local function agent_root()
  local cwd = vim.fn.getcwd()
  local root = vim.fn.systemlist({ "git", "-C", cwd, "rev-parse", "--show-toplevel" })
  if vim.v.shell_error == 0 and root[1] and root[1] ~= "" then
    return root[1]
  end
  return cwd
end

-- Absolute paths of dirty + untracked files, or {} outside a git repo.
-- Mirrors gopen (tools/zshrc): diff HEAD plus untracked, both from repo root.
local function agent_dirty(root)
  local inside = vim.fn.systemlist({ "git", "-C", root, "rev-parse", "--is-inside-work-tree" })
  if vim.v.shell_error ~= 0 or inside[1] ~= "true" then
    return {}
  end
  local function git_lines(...)
    local out = vim.fn.systemlist({ "git", "-C", root, ... })
    if vim.v.shell_error ~= 0 then
      return {}
    end
    return out
  end
  local dirty = {}
  for _, list in ipairs({ git_lines("diff", "--name-only", "HEAD"), git_lines("ls-files", "--others", "--exclude-standard") }) do
    for _, file in ipairs(list) do
      if file ~= "" then
        dirty[root .. "/" .. file] = true
      end
    end
  end
  return dirty
end

local function agent_rel(root, path)
  local prefix = root == "/" and "/" or root .. "/"
  if vim.startswith(path, prefix) then
    return path:sub(#prefix + 1)
  end
  return path
end

local function agent_context()
  local root = agent_root()
  local dirty = agent_dirty(root)
  local tabs = vim.api.nvim_list_tabpages()
  local cur = vim.api.nvim_get_current_tabpage()
  local raw = vim.api.nvim_buf_get_name(0)
  local path = raw == "" and "" or vim.fn.fnamemodify(raw, ":p")
  local name = path == "" and "(unnamed)" or agent_rel(root, path)
  local pos = path == "" and "" or (":" .. vim.api.nvim_win_get_cursor(0)[1])
  local cur_idx = 1
  for i, t in ipairs(tabs) do
    if t == cur then
      cur_idx = i
    end
  end
  local out = {
    "Context from my editor session (open in a split beside you).",
    "Treat this as your starting point: the files below are already open in my editor.",
    "",
    ("Active file: %s%s (tab %d of %d)"):format(name, pos, cur_idx, #tabs),
    "Tabs:",
  }
  for i, t in ipairs(tabs) do
    local buf = vim.api.nvim_win_get_buf(vim.api.nvim_tabpage_get_win(t))
    local p = vim.api.nvim_buf_get_name(buf)
    local full = p == "" and "" or vim.fn.fnamemodify(p, ":p")
    local disp = full == "" and "(unnamed)" or agent_rel(root, full)
    out[#out + 1] = ("  %d. %s%s"):format(i, disp, dirty[full] and " *" or "")
  end
  if next(dirty) ~= nil then
    out[#out + 1] = "Dirty/untracked files:"
    local rels = {}
    for p in pairs(dirty) do
      rels[#rels + 1] = agent_rel(root, p)
    end
    table.sort(rels)
    for _, p in ipairs(rels) do
      out[#out + 1] = "  - " .. p
    end
  end
  out[#out + 1] = "Repo root: " .. root
  return table.concat(out, "\n")
end

-- opencode's TUI has no prompt argument: paste the context into its input box
-- once it has booted, then send a raw Enter. Everything goes through bracketed
-- paste, so the newlines in the context cannot submit early.
local function agent_seed(transport, id, ctx)
  if transport == "wezterm" then
    vim.fn.system({ "wezterm", "cli", "send-text", "--pane-id", id, ctx })
    vim.defer_fn(function()
      vim.fn.system({ "wezterm", "cli", "send-text", "--no-paste", "--pane-id", id, "\r" })
    end, 300)
  elseif transport == "tmux" then
    vim.fn.system({ "tmux", "load-buffer", "-b", "agentctx", "-" }, ctx)
    vim.fn.system({ "tmux", "paste-buffer", "-p", "-b", "agentctx", "-t", id })
    vim.defer_fn(function()
      vim.fn.system({ "tmux", "send-keys", "-t", id, "Enter" })
    end, 300)
  else
    vim.api.nvim_chan_send(id, "\27[200~" .. ctx .. "\27[201~")
    vim.defer_fn(function()
      vim.api.nvim_chan_send(id, "\r")
    end, 300)
  end
end

local function agent_open(which)
  local root = agent_root()
  local ctx = agent_context()
  local cmd
  if which == "claude" then
    cmd = { "claude", ctx }
  elseif which == "cursor" then
    cmd = { "cursor-agent", ctx }
  elseif which == "opencode" then
    cmd = { "opencode" }
  else
    return
  end
  if vim.fn.executable(cmd[1]) ~= 1 then
    vim.notify("Agent not installed: " .. cmd[1], vim.log.levels.ERROR)
    return
  end

  local transport, id
  if vim.env.WEZTERM_PANE and vim.fn.executable("wezterm") == 1 then
    local argv = { "wezterm", "cli", "split-pane", "--right", "--percent", "45", "--cwd", root, "--" }
    vim.list_extend(argv, cmd)
    local out = vim.fn.systemlist(argv)
    if vim.v.shell_error ~= 0 then
      vim.notify("wezterm split-pane failed: " .. table.concat(out, " "), vim.log.levels.ERROR)
      return
    end
    transport, id = "wezterm", vim.trim(out[1] or "")
    vim.fn.system({ "wezterm", "cli", "activate-pane", "--pane-id", id })
  elseif vim.env.TMUX and vim.fn.executable("tmux") == 1 then
    local argv = { "tmux", "split-window", "-h", "-P", "-F", "#{pane_id}", "-c", root, "--" }
    vim.list_extend(argv, cmd)
    local out = vim.fn.systemlist(argv)
    if vim.v.shell_error ~= 0 then
      vim.notify("tmux split-window failed: " .. table.concat(out, " "), vim.log.levels.ERROR)
      return
    end
    transport, id = "tmux", vim.trim(out[1] or "")
  else
    -- No WezTerm/tmux: run the agent in a :terminal split instead.
    vim.cmd("botright split")
    transport = "term"
    id = vim.fn.termopen(cmd, { cwd = root })
    if id <= 0 then
      vim.notify("Failed to start terminal", vim.log.levels.ERROR)
      return
    end
  end

  if which == "opencode" then
    vim.defer_fn(function()
      agent_seed(transport, id, ctx)
    end, 1500)
  end
end

vim.api.nvim_create_user_command("Ccontext", function()
  print(agent_context())
end, { desc = "Preview the context an agent would receive" })
vim.api.nvim_create_user_command("Cclaude", function()
  agent_open("claude")
end, { desc = "Open Claude Code in a split with session context" })
vim.api.nvim_create_user_command("Ccursor", function()
  agent_open("cursor")
end, { desc = "Open Cursor Agent in a split with session context" })
vim.api.nvim_create_user_command("Copencode", function()
  agent_open("opencode")
end, { desc = "Open opencode in a split with session context" })

-- File pickers (Cmd+P, <Space>/, <Space>gm) open like the shell pickers and
-- lf: Enter in a new tab, Ctrl+O here. Other pickers keep Telescope defaults.
local function open_in_tab_or_here(_, map)
  local actions = require("telescope.actions")
  for _, mode in ipairs({ "i", "n" }) do
    map(mode, "<CR>", actions.select_tab)
    map(mode, "<C-o>", actions.select_default)
  end
  return true
end

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none", "--branch=stable",
    "https://github.com/folke/lazy.nvim.git", lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
  {
    "nvim-tree/nvim-web-devicons",
    lazy = true,
  },

  {
    "akinsho/bufferline.nvim",
    version = "*",
    dependencies = { "nvim-tree/nvim-web-devicons" },
    event = "VeryLazy",
    config = function()
      vim.opt.showtabline = 2
      require("bufferline").setup({
        options = {
          -- gopen / nvim -p use real vim tab pages
          mode = "tabs",
          numbers = "ordinal",
          diagnostics = "nvim_lsp",
          always_show_bufferline = true,
          show_close_icon = false,
          show_buffer_close_icons = false,
          separator_style = "slant",
          max_name_length = 28,
          tab_size = 18,
          color_icons = true,
          show_tab_indicators = true,
        },
      })
    end,
  },

  {
    "numToStr/Comment.nvim",
    event = "VeryLazy",
    config = function()
      require("Comment").setup()
      local api = require("Comment.api")
      -- Ctrl+/ (terminals often send <C-_>); WezTerm maps Cmd+/ → Ctrl+/
      local function toggle_line()
        api.toggle.linewise.current()
      end
      local function toggle_visual()
        local esc = vim.api.nvim_replace_termcodes("<Esc>", true, false, true)
        vim.api.nvim_feedkeys(esc, "nx", false)
        api.toggle.linewise(vim.fn.visualmode())
      end
      for _, lhs in ipairs({ "<C-_>", "<C-/>" }) do
        vim.keymap.set("n", lhs, toggle_line, { desc = "Toggle comment" })
        vim.keymap.set("x", lhs, toggle_visual, { desc = "Toggle comment" })
        vim.keymap.set("i", lhs, function()
          vim.api.nvim_feedkeys(
            vim.api.nvim_replace_termcodes("<Esc>", true, false, true), "nx", false
          )
          toggle_line()
          vim.cmd("startinsert!")
        end, { desc = "Toggle comment" })
      end
    end,
  },

  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    lazy = false,
    config = function()
      require("nvim-treesitter").install({
        "bash", "css", "dockerfile", "go", "html", "javascript", "json",
        "lua", "markdown", "markdown_inline", "python", "query", "sql",
        "terraform", "toml", "tsx", "typescript", "vim", "vimdoc", "vue", "yaml",
      }):wait(300000)
      -- New nvim-treesitter does not enable highlighting by default.
      vim.api.nvim_create_autocmd("FileType", {
        callback = function()
          pcall(vim.treesitter.start)
        end,
      })
    end,
  },

  {
    "williamboman/mason.nvim",
    cmd = "Mason",
    config = function()
      require("mason").setup()
      local mason_bin = vim.fn.stdpath("data") .. "/mason/bin"
      local sep = vim.fn.has("win32") == 1 and ";" or ":"
      vim.env.PATH = mason_bin .. sep .. vim.env.PATH
    end,
  },

  {
    "WhoIsSethDaniel/mason-tool-installer.nvim",
    dependencies = { "williamboman/mason.nvim" },
    opts = {
      ensure_installed = {
        "vtsls", "css-lsp", "json-lsp", "yaml-language-server",
        "lua-language-server", "pyright", "terraform-ls",
        "prettier", "stylua", "terraform",
      },
    },
  },

  {
    "neovim/nvim-lspconfig",
    dependencies = { "hrsh7th/cmp-nvim-lsp" },
    config = function()
      local caps = require("cmp_nvim_lsp").default_capabilities()

      local function on_attach(_, bufnr)
        local opts = { buffer = bufnr }
        vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
        vim.keymap.set("n", "<leader>gt", function()
          vim.cmd("tab split")
          vim.lsp.buf.definition()
        end, opts)
        vim.keymap.set("n", "K", vim.lsp.buf.hover, opts)
        vim.keymap.set("n", "gr", vim.lsp.buf.references, opts)
        vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
        vim.keymap.set("n", "<leader>d", vim.diagnostic.open_float, opts)
        vim.keymap.set("n", "<leader>a", vim.lsp.buf.code_action, opts)
        -- Insert mode only: normal-mode Ctrl+k moves between splits/panes.
        vim.keymap.set("i", "<C-k>", vim.lsp.buf.signature_help, opts)
        vim.keymap.set("n", "<leader>F", function()
          vim.lsp.buf.format({ async = true })
        end, opts)
      end

      vim.lsp.config("*", { capabilities = caps, on_attach = on_attach })
      vim.lsp.config("yamlls", {
        settings = {
          yaml = {
            schemas = {
              ["https://json.schemastore.org/github-action.json"] = ".github/workflows/*.{yml,yaml}",
            },
            schemaStore = { enable = true },
          },
        },
      })
      vim.lsp.config("lua_ls", {
        settings = {
          Lua = {
            runtime = { version = "LuaJIT" },
            diagnostics = { globals = { "vim" } },
            workspace = { library = vim.api.nvim_get_runtime_file("", true) },
          },
        },
      })

      vim.lsp.enable({ "vtsls", "cssls", "jsonls", "pyright", "terraformls", "yamlls", "lua_ls" })

      vim.diagnostic.config({ virtual_text = true, signs = true })
    end,
  },

  {
    "hrsh7th/nvim-cmp",
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-buffer",
      "hrsh7th/cmp-path",
      "L3MON4D3/LuaSnip",
      "rafamadriz/friendly-snippets",
    },
    config = function()
      local cmp = require("cmp")
      local luasnip = require("luasnip")
      require("luasnip.loaders.from_vscode").lazy_load()

      cmp.setup({
        snippet = {
          expand = function(args)
            luasnip.lsp_expand(args.body)
          end,
        },
        mapping = cmp.mapping.preset.insert({
          ["<C-b>"] = cmp.mapping.scroll_docs(-4),
          ["<C-f>"] = cmp.mapping.scroll_docs(4),
          ["<C-Space>"] = cmp.mapping.complete(),
          ["<C-e>"] = cmp.mapping.abort(),
          ["<CR>"] = cmp.mapping.confirm({ select = true }),
          ["<Tab>"] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_next_item()
            elseif luasnip.expand_or_jumpable() then
              luasnip.expand_or_jump()
            else
              fallback()
            end
          end, { "i", "s" }),
          ["<S-Tab>"] = cmp.mapping(function(fallback)
            if cmp.visible() then
              cmp.select_prev_item()
            elseif luasnip.jumpable(-1) then
              luasnip.jump(-1)
            else
              vim.api.nvim_feedkeys(
                vim.api.nvim_replace_termcodes("<C-d>", true, false, true), "n", false
              )
            end
          end, { "i", "s" }),
        }),
        sources = cmp.config.sources({
          { name = "nvim_lsp" },
          { name = "luasnip" },
        }, {
          { name = "buffer" },
          { name = "path" },
        }),
      })
    end,
  },

  {
    "stevearc/conform.nvim",
    event = "BufWritePre",
    opts = {
      formatters_by_ft = {
        javascript = { "prettier" },
        typescript = { "prettier" },
        javascriptreact = { "prettier" },
        typescriptreact = { "prettier" },
        vue = { "prettier" },
        json = { "prettier" },
        jsonc = { "prettier" },
        css = { "prettier" },
        scss = { "prettier" },
        html = { "prettier" },
        markdown = { "prettier" },
        yaml = { "prettier" },
        terraform = { "terraform_fmt" },
        tfvars = { "terraform_fmt" },
        lua = { "stylua" },
      },
      format_on_save = { timeout_ms = 1500, lsp_format = "fallback" },
    },
  },

  {
    "folke/todo-comments.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    event = "BufReadPost",
    opts = {},
  },

  {
    "lewis6991/gitsigns.nvim",
    event = "BufReadPost",
    config = function()
      local gs = require("gitsigns")
      gs.setup({
        signs = {
          add = { text = "┃" },
          change = { text = "┃" },
          delete = { text = "_" },
          topdelete = { text = "‾" },
          changedelete = { text = "~" },
        },
        signcolumn = true,
        numhl = true,
        linehl = false,
        word_diff = false,
        current_line_blame = true,
        current_line_blame_opts = { delay = 400, virt_text_pos = "eol" },
        preview_config = { border = "rounded" },
        on_attach = function(bufnr)
          local opts = { buffer = bufnr }
          vim.keymap.set("n", "]c", function()
            if vim.wo.diff then
              vim.cmd.normal({ "]c", bang = true })
            else
              gs.nav_hunk("next")
            end
          end, opts)
          vim.keymap.set("n", "[c", function()
            if vim.wo.diff then
              vim.cmd.normal({ "[c", bang = true })
            else
              gs.nav_hunk("prev")
            end
          end, opts)
          -- float preview of the hunk under the cursor
          vim.keymap.set("n", "<leader>hp", gs.preview_hunk, opts)
          -- side-by-side diff (index on the left / right split)
          vim.keymap.set("n", "<leader>hd", gs.diffthis, opts)
          vim.keymap.set("n", "<leader>hs", gs.stage_hunk, opts)
          vim.keymap.set("n", "<leader>hr", gs.reset_hunk, opts)
        end,
      })
      vim.keymap.set("n", "<leader>gs", function()
        gs.setqflist("all")
        vim.cmd("copen")
      end, { desc = "Git hunks (repo-wide)" })
    end,
  },

  {
    "lewis6991/satellite.nvim",
    event = "BufReadPost",
    dependencies = { "lewis6991/gitsigns.nvim" },
    config = function()
      require("satellite").setup({
        width = 2,
        handlers = {
          cursor = { enable = true },
          search = { enable = true },
          diagnostic = { enable = true },
          gitsigns = {
            enable = true,
            signs = { add = "│", change = "│", delete = "-" },
          },
          marks = { enable = false },
        },
      })
    end,
  },

  {
    -- Ctrl+h/j/k/l move between splits and keep going into WezTerm/tmux
    -- panes at the edge; <Space>H/J/K/L resize like Ctrl+b H/J/K/L.
    -- tools/wezterm.lua and tools/tmux.conf pass the keys through to nvim.
    "mrjones2014/smart-splits.nvim",
    lazy = false,
    config = function()
      local ss = require("smart-splits")
      ss.setup({})
      vim.keymap.set("n", "<C-h>", ss.move_cursor_left, { desc = "Move to left split/pane" })
      vim.keymap.set("n", "<C-j>", ss.move_cursor_down, { desc = "Move to lower split/pane" })
      vim.keymap.set("n", "<C-k>", ss.move_cursor_up, { desc = "Move to upper split/pane" })
      vim.keymap.set("n", "<C-l>", ss.move_cursor_right, { desc = "Move to right split/pane" })
      vim.keymap.set("n", "<leader>H", ss.resize_left, { desc = "Resize left" })
      vim.keymap.set("n", "<leader>J", ss.resize_down, { desc = "Resize down" })
      vim.keymap.set("n", "<leader>K", ss.resize_up, { desc = "Resize up" })
      vim.keymap.set("n", "<leader>L", ss.resize_right, { desc = "Resize right" })
    end,
  },

  {
    "nvim-telescope/telescope.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    cmd = "Telescope",
    -- Declared in the spec, not in config(): `config()` only runs once the
    -- plugin has loaded, so keymaps set there stay dead until `:Telescope` is
    -- first typed. `keys` registers them at startup and lazy-loads on press.
    keys = {
      -- Same pickers and keys as the shell: Cmd+P (WezTerm sends Ctrl+P) finds
      -- files like `fzf-open`, <Space>/ searches text like `rfind`.
      {
        "<C-p>",
        function() require("telescope.builtin").find_files({ hidden = true, attach_mappings = open_in_tab_or_here }) end,
        desc = "Find file",
      },
      {
        "<leader>/",
        function() require("telescope.builtin").live_grep({ attach_mappings = open_in_tab_or_here }) end,
        desc = "Search text",
      },
      {
        "<leader>gd",
        function() require("telescope.builtin").lsp_definitions() end,
        desc = "Definition picker",
      },
      {
        -- `<leader>gs` is gitsigns' repo-wide hunk quickfix. Telescope's
        -- git_status is available here as `gm` so the two never collide.
        "<leader>gm",
        function() require("telescope.builtin").git_status({ attach_mappings = open_in_tab_or_here }) end,
        desc = "Git modified files",
      },
    },
    config = function()
      require("telescope").setup({
        defaults = { file_ignore_patterns = { "^.git/" } },
      })
    end,
  },

  {
    "MeanderingProgrammer/render-markdown.nvim",
    dependencies = { "nvim-treesitter/nvim-treesitter" },
    ft = "markdown",
    opts = {},
  },
}, {
  install = { colorscheme = {} },
  checker = { enabled = false },
})
