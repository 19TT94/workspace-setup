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
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter").install({
        "bash", "css", "dockerfile", "go", "html", "javascript", "json",
        "lua", "markdown", "markdown_inline", "python", "query", "sql",
        "terraform", "toml", "tsx", "typescript", "vim", "vimdoc", "vue", "yaml",
      }):wait(300000)
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
    "MeanderingProgrammer/render-markdown.nvim",
    dependencies = { "nvim-treesitter/nvim-treesitter" },
    ft = "markdown",
    opts = {},
  },
}, {
  install = { colorscheme = {} },
  checker = { enabled = false },
})