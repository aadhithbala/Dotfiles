// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

const { Gio } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();

const utils = Me.imports.utils;

const { SwitcherCommands } = Me.imports.modules.SwitcherCommands;
const { SwitcherThemeCursor, SwitcherThemeGtk, SwitcherThemeIcon, SwitcherThemeShell } = Me.imports.modules.SwitcherTheme;
const { Timer } = Me.imports.modules.Timer;


class NightThemeSwitcher {
    #timer = null;
    #switcherThemeGtk = null;
    #switcherThemeShell = null;
    #switcherThemeIcon = null;
    #switcherThemeCursor = null;
    #switcherCommands = null;

    constructor() {
        console.debug('Initializing extension...');
        extensionUtils.initTranslations();
        this.#migrateBackgroundSettings();
        console.debug('Extension initialized.');
    }

    enable() {
        console.debug('Enabling extension...');
        this.#timer = new Timer();
        this.#switcherThemeGtk = new SwitcherThemeGtk({ timer: this.#timer });
        this.#switcherThemeIcon = new SwitcherThemeIcon({ timer: this.#timer });
        this.#switcherThemeShell = new SwitcherThemeShell({ timer: this.#timer });
        this.#switcherThemeCursor = new SwitcherThemeCursor({ timer: this.#timer });
        this.#switcherCommands = new SwitcherCommands({ timer: this.#timer });

        this.#timer.enable();
        this.#switcherThemeGtk.enable();
        this.#switcherThemeShell.enable();
        this.#switcherThemeIcon.enable();
        this.#switcherThemeCursor.enable();
        this.#switcherCommands.enable();

        console.debug('Extension enabled.');
    }

    disable() {
        // Extension won't be disabled in `unlock-dialog` session mode. This is
        // to enable the color scheme switch while the lock screen is displayed,
        // as the background image and the shell theme are visible in this mode.
        console.debug('Disabling extension...');

        if (this.#switcherThemeGtk) {
            this.#switcherThemeGtk.disable();
            this.#switcherThemeGtk = null;
        }
        if (this.#switcherThemeShell) {
            this.#switcherThemeShell.disable();
            this.#switcherThemeShell = null;
        }
        if (this.#switcherThemeIcon) {
            this.#switcherThemeIcon.disable();
            this.#switcherThemeIcon = null;
        }
        if (this.#switcherThemeCursor) {
            this.#switcherThemeCursor.disable();
            this.#switcherThemeCursor = null;
        }
        if (this.#switcherCommands) {
            this.#switcherCommands.disable();
            this.#switcherCommands = null;
        }
        if (this.#timer) {
            this.#timer.disable();
            this.#timer = null;
        }

        console.debug('Extension disabled.');
    }

    #migrateBackgroundSettings() {
        // GNOME 42 has its own background switching mechanism. Move the day
        // and night backgrounds settings from the extension to the shell.
        // Only run once when the extension is initialized.
        const systemSettings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });
        const extensionSettings = extensionUtils.getSettings(utils.getSettingsSchema('backgrounds'));

        if (extensionSettings.get_string('day')) {
            systemSettings.set_string('picture-uri', extensionSettings.get_string('day'));
            systemSettings.set_string('picture-uri-dark', extensionSettings.get_string('day'));
            extensionSettings.set_string('day', '');
        }

        if (extensionSettings.get_string('night')) {
            systemSettings.set_string('picture-uri-dark', extensionSettings.get_string('night'));
            extensionSettings.set_string('night', '');
        }
    }
}

/**
 * Extension initialization.
 */
function init() {
    return new NightThemeSwitcher();
}
