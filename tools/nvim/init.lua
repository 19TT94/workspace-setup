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
        vim.keymap.set({ "n", "i" }, "<C-k>", vim.lsp.buf.signature_help, opts)
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
    "nvim-telescope/telescope.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    cmd = "Telescope",
    -- Declared in the spec, not in config(): `config()` only runs once the
    -- plugin has loaded, so keymaps set there stay dead until `:Telescope` is
    -- first typed. `keys` registers them at startup and lazy-loads on press.
    keys = {
      {
        "<leader>gd",
        function() require("telescope.builtin").lsp_definitions() end,
        desc = "Definition picker",
      },
      {
        -- `<leader>gs` is gitsigns' repo-wide hunk quickfix. Telescope's
        -- git_status is available here as `gm` so the two never collide.
        "<leader>gm",
        function() require("telescope.builtin").git_status() end,
        desc = "Git modified files",
      },
    },
    config = function()
      require("telescope").setup({})
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
