-- WezTerm config: tmux-style keybindings + Cursor Dark palette.
-- Colors match the Cursor / VS Code 'Cursor Dark' theme so the terminal
-- and text editors look consistent.

local wezterm = require 'wezterm'
local config = wezterm.config_builder()

-- Appearance -----------------------------------------------------------
local p = {
    bg       = '#181818',  -- editor canvas
    chrome   = '#141414',  -- titlebar / tab bar / terminal bg
    fg       = '#f0f0f0',
    fg_dim   = '#989898',  -- ~#F0F0F099 on chrome (inactive text)
    line_hl  = '#262626',
    red      = '#FC6B83',
    green    = '#3FA266',
    yellow   = '#D2943E',
    blue     = '#81A1C1',
    magenta  = '#B48EAD',
    cyan     = '#88C0D0',
}

config.font = wezterm.font("Monaco")
config.font_size = 13
config.line_height = 1.2

config.window_frame = {
    active_titlebar_bg = p.chrome,
    inactive_titlebar_bg = p.chrome,
}

config.colors = {
    foreground = p.fg,
    background = p.chrome,
    cursor_bg = p.fg,
    cursor_fg = p.bg,
    selection_bg = '#3a3a3a',
    split = p.line_hl,
    ansi = {
        '#242424', p.red, p.green, p.yellow,
        p.blue, p.magenta, p.cyan, p.fg,
    },
    brights = {
        '#9a9a9a', p.red, '#70B489', '#F1B467',
        '#87A6C4', p.magenta, p.cyan, '#FFFFFF',
    },
    tab_bar = {
        background = p.chrome,
        active_tab = {
            bg_color = p.bg,
            fg_color = p.fg,
        },
        inactive_tab = {
            bg_color = p.chrome,
            fg_color = p.fg_dim,
        },
        inactive_tab_hover = {
            bg_color = p.line_hl,
            fg_color = p.fg,
        },
        new_tab = {
            bg_color = p.chrome,
            fg_color = p.fg_dim,
        },
        new_tab_hover = {
            bg_color = p.line_hl,
            fg_color = p.fg,
        },
    },
}

-- Keybindings ------------------------------------------------------------
-- tmux prefix: Ctrl+b
config.leader = { key = 'b', mods = 'CTRL', timeout_milliseconds = 1000 }

config.keys = {
    -- Cmd+P: send Ctrl+P (triggers the zsh/bash fuzzy file finder)
    { key = 'P', mods = 'CMD', action = wezterm.action.SendKey { key = 'P', mods = 'CTRL' } },
    -- Cmd+/: toggle comment in nvim (sends Ctrl+_ which terminals use for Ctrl+/)
    { key = '/', mods = 'CMD', action = wezterm.action.SendKey { key = '_', mods = 'CTRL' } },

    -- Splits (tmux: prefix % / prefix ")
    { key = '%', mods = 'LEADER', action = wezterm.action.SplitHorizontal { domain = 'CurrentPaneDomain' } },
    { key = '"', mods = 'LEADER', action = wezterm.action.SplitVertical { domain = 'CurrentPaneDomain' } },

    -- Move between panes (tmux: prefix h/j/k/l)
    { key = 'h', mods = 'LEADER', action = wezterm.action.ActivatePaneDirection 'Left' },
    { key = 'j', mods = 'LEADER', action = wezterm.action.ActivatePaneDirection 'Down' },
    { key = 'k', mods = 'LEADER', action = wezterm.action.ActivatePaneDirection 'Up' },
    { key = 'l', mods = 'LEADER', action = wezterm.action.ActivatePaneDirection 'Right' },

    -- Resize panes (tmux: prefix H/J/K/L)
    { key = 'H', mods = 'LEADER', action = wezterm.action.AdjustPaneSize { 'Left', 5 } },
    { key = 'J', mods = 'LEADER', action = wezterm.action.AdjustPaneSize { 'Down', 5 } },
    { key = 'K', mods = 'LEADER', action = wezterm.action.AdjustPaneSize { 'Up', 5 } },
    { key = 'L', mods = 'LEADER', action = wezterm.action.AdjustPaneSize { 'Right', 5 } },

    -- Tabs (tmux: prefix c / n / p / number keys)
    { key = 'c', mods = 'LEADER', action = wezterm.action.SpawnTab 'CurrentPaneDomain' },
    { key = 'n', mods = 'LEADER', action = wezterm.action.ActivateTabRelative(1) },
    { key = 'p', mods = 'LEADER', action = wezterm.action.ActivateTabRelative(-1) },
    { key = ',', mods = 'LEADER', action = wezterm.action.PromptInputLine {
        description = 'Rename tab',
        action = wezterm.action_callback(function(window, pane, line)
            if line then
                window:set_tab_title(line)
            end
        end),
    } },
}

for i = 1, 9 do
    table.insert(config.keys, { key = tostring(i), mods = 'LEADER', action = wezterm.action.ActivateTab(i - 1) })
end

-- Pane actions (tmux: prefix z / x / o / [ / ])
table.insert(config.keys, { key = 'z', mods = 'LEADER', action = wezterm.action.TogglePaneZoomState })
table.insert(config.keys, { key = 'x', mods = 'LEADER', action = wezterm.action.CloseCurrentPane { confirm = true } })
table.insert(config.keys, { key = 'o', mods = 'LEADER', action = wezterm.action.RotatePanes 'Clockwise' })
table.insert(config.keys, { key = '[', mods = 'LEADER', action = wezterm.action.ActivateCopyMode })
table.insert(config.keys, { key = ']', mods = 'LEADER', action = wezterm.action.PasteFrom 'Clipboard' })

return config
