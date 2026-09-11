-- WezTerm config: tmux-style keybindings + personal theme.

local wezterm = require 'wezterm'
local config = wezterm.config_builder()

-- Appearance -----------------------------------------------------------
config.color_scheme = 'tokyonight_night'
config.font = wezterm.font("Spline Sans Mono")
config.font_size = 16
config.line_height = 1.2

config.window_frame = {
    active_titlebar_bg = '#1a1b26',
    inactive_titlebar_bg = '#1a1b26',
}

config.colors = {
    tab_bar = {
        background = '#1a1b26',
        active_tab = {
            bg_color = '#24283b',
            fg_color = '#a9b1d6',
        },
        inactive_tab = {
            bg_color = '#1a1b26',
            fg_color = '#565f89',
        },
        inactive_tab_hover = {
            bg_color = '#24283b',
            fg_color = '#a9b1d6',
        },
        new_tab = {
            bg_color = '#1a1b26',
            fg_color = '#565f89',
        },
        new_tab_hover = {
            bg_color = '#24283b',
            fg_color = '#a9b1d6',
        },
    },
}

-- Keybindings ------------------------------------------------------------
-- tmux prefix: Ctrl+b
config.leader = { key = 'b', mods = 'CTRL', timeout_milliseconds = 1000 }

config.keys = {
    -- Cmd+P: send Ctrl+P (triggers the zsh/bash fuzzy file finder)
    { key = 'P', mods = 'CMD', action = wezterm.action.SendKey { key = 'P', mods = 'CTRL' } },

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
