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

vim.filetype.add({
  extension = { tf = "terraform", tfvars = "terraform" },
})

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
    "folke/tokyonight.nvim",
    priority = 1000,
    config = function()
      require("tokyonight").setup({
        styles = {
          comments = { italic = true },
        },
        on_highlights = function(hl, c)
          hl["@keyword"] = { fg = c.magenta, italic = true }
          hl["@keyword.return"] = { fg = c.magenta, italic = true }
          hl["@keyword.conditional"] = { fg = c.magenta, italic = true }
          hl["@type"] = { fg = c.cyan }
          hl["@type.builtin"] = { fg = c.red }
          hl["@variable.builtin"] = { fg = c.red }
          hl["@function.builtin"] = { fg = c.red }
          hl["@constant.builtin"] = { fg = c.red }
          hl["@module.builtin"] = { fg = c.red }
          hl["@number"] = { fg = c.yellow }
          hl["@boolean"] = { fg = c.yellow }
          hl["@operator"] = { fg = c.cyan }
        end,
      })
      vim.cmd.colorscheme("tokyonight-night")
    end,
  },

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
    "MeanderingProgrammer/render-markdown.nvim",
    dependencies = { "nvim-treesitter/nvim-treesitter" },
    ft = "markdown",
    opts = {},
  },
}, {
  install = { colorscheme = {} },
  checker = { enabled = false },
})
