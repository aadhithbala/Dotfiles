// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Clutter, Gio, GLib, GObject, Meta, Shell, St } = imports.gi;
const { extensionUtils } = imports.misc;
const Signals = imports.signals;

const { main } = imports.ui;

const { Button: PanelMenuButton } = imports.ui.panelMenu;
const { PopupMenuItem, PopupSubMenuMenuItem } = imports.ui.popupMenu;

const Me = extensionUtils.getCurrentExtension();
const _ = extensionUtils.gettext;

const utils = Me.imports.utils;

const { Time } = Me.imports.enums.Time;

/**
 * The On-demand Timer allows the user to manually switch between the day and
 * night variants with a button in the top bar and a keybinding.
 *
 * The user can change the key combination in the extension's preferences.
 */
var TimerOndemand = class {
    #timer;
    #settings;

    #settingsConnections = [];
    #button = null;
    #previousKeybinding = null;
    #timerConnection = null;

    constructor({ timer }) {
        this.#timer = timer;
        this.#settings = extensionUtils.getSettings(utils.getSettingsSchema('time'));
    }

    enable() {
        console.debug('Enabling On-demand Timer...');
        this.#connectSettings();
        this.#addKeybinding();
        this.#addButton();
        this.#connectTimer();
        this.emit('time-changed', this.time);
        console.debug('On-demand Timer enabled.');
    }

    disable() {
        console.debug('Disabling On-demand Timer...');
        this.#disconnectTimer();
        this.#removeKeybinding();
        this.#removeButton();
        this.#disconnectSettings();
        console.debug('On-demand Timer disabled.');
    }


    get time() {
        return this.#settings.get_string('ondemand-time') === 'day' ? Time.DAY : Time.NIGHT;
    }


    #connectSettings() {
        console.debug('Connecting On-demand Timer to settings...');
        this.#settingsConnections.push({
            settings: this.#settings,
            id: this.#settings.connect('changed::ondemand-time', this.#onOndemandTimeChanged.bind(this)),
        });
        this.#settingsConnections.push({
            settings: this.#settings,
            id: this.#settings.connect('changed::nightthemeswitcher-ondemand-keybinding', this.#onOndemandKeybindingChanged.bind(this)),
        });
        this.#settingsConnections.push({
            settings: this.#settings,
            id: this.#settings.connect('changed::ondemand-button-placement', this.#onOndemandButtonPlacementChanged.bind(this)),
        });
    }

    #disconnectSettings() {
        console.debug('Disconnecting On-demand Timer from settings...');
        this.#settingsConnections.forEach(connection => connection.settings.disconnect(connection.id));
        this.#settingsConnections = [];
    }

    #connectTimer() {
        console.debug('Connecting On-demand Timer to Timer...');
        this.#timerConnection = this.#timer.connect('time-changed', this.#onTimeChanged.bind(this));
    }

    #disconnectTimer() {
        if (this.#timerConnection) {
            this.#timer.disconnect(this.#timerConnection);
            this.#timerConnection = null;
        }
        console.debug('Disconnected On-demand Timer from Timer.');
    }


    #onOndemandTimeChanged() {
        this.emit('time-changed', this.time);
    }

    #onOndemandKeybindingChanged() {
        this.#removeKeybinding();
        this.#addKeybinding();
    }

    #onOndemandButtonPlacementChanged() {
        this.#removeButton();
        this.#addButton();
    }

    #onTimeChanged(_timer, _newTime) {
        this.#settings.set_string('ondemand-time', this.#timer.time);
        this.#updateButton();
    }


    #addKeybinding() {
        this.#previousKeybinding = this.#settings.get_strv('nightthemeswitcher-ondemand-keybinding')[0];
        if (!this.#settings.get_strv('nightthemeswitcher-ondemand-keybinding')[0])
            return;
        console.debug('Adding On-demand Timer keybinding...');
        main.wm.addKeybinding(
            'nightthemeswitcher-ondemand-keybinding',
            this.#settings,
            Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
            Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
            this.#toggleTime.bind(this)
        );
        console.debug('Added On-demand Timer keybinding.');
    }

    #removeKeybinding() {
        if (this.#previousKeybinding) {
            console.debug('Removing On-demand Timer keybinding...');
            main.wm.removeKeybinding('nightthemeswitcher-ondemand-keybinding');
            console.debug('Removed On-demand Timer keybinding.');
        }
    }

    #addButton() {
        switch (this.#settings.get_string('ondemand-button-placement')) {
        case 'panel':
            this.#addButtonToPanel();
            break;
        case 'menu':
            this.#addButtonToMenu();
        }
    }

    #removeButton() {
        if (this.#button) {
            console.debug('Removing On-demand Timer button...');
            this.#button.destroy();
            this.#button = null;
            console.debug('Removed On-demand Timer button.');
        }
    }

    #updateButton() {
        if (this.#button) {
            console.debug('Updating On-demand Timer button state...');
            this.#button.update();
            console.debug('Updated On-demand Timer button state.');
        }
    }

    #addButtonToPanel() {
        console.debug('Adding On-demand Timer button to the panel...');
        this.#button = new NtsPanelMenuButton({ timer: this.#timer, toggleCallback: this.#toggleTime.bind(this) });
        main.panel.addToStatusArea('NightThemeSwitcherButton', this.#button);
        console.debug('Added On-demand Timer button to the panel.');
    }

    #addButtonToMenu() {
        console.debug('Adding On-demand Timer button to the menu...');
        const aggregateMenu = main.panel.statusArea.aggregateMenu;
        const position = utils.findShellAggregateMenuItemPosition(aggregateMenu._system.menu) - 1;
        this.#button = new NtsPopupSubMenuMenuItem({ timer: this.#timer, toggleCallback: this.#toggleTime.bind(this) });
        aggregateMenu.menu.addMenuItem(this.#button, position);
        console.debug('Added On-demand Timer button to the menu.');
    }

    #toggleTime() {
        this.#settings.set_string('ondemand-time', this.#timer.time === Time.DAY ? Time.NIGHT : Time.DAY);
        this.emit('time-changed', this.time);
    }
};
Signals.addSignalMethods(TimerOndemand.prototype);

var NtsPanelMenuButton = GObject.registerClass(
    class NtsPanelMenuButton extends PanelMenuButton {
        #timer;

        constructor({ timer, toggleCallback }) {
            super(0.0);
            this.#timer = timer;
            this.icon = new St.Icon({
                style_class: 'system-status-icon',
            });
            this.add_child(this.icon);
            this.connect('button-press-event', () => toggleCallback());
            this.connect('touch-event', () => toggleCallback());
            this.update();
        }

        update() {
            this.icon.icon_name = _getIconNameForTime(this.#timer.time);
            this.icon.fallback_gicon = _getGiconForTime(this.#timer.time);
            this.accessible_name = this.#timer.time === Time.DAY ? _('Turn Night Mode On') : _('Turn Night Mode Off');
        }
    }
);

var NtsPopupSubMenuMenuItem = GObject.registerClass(
    class NtsPopupSubMenuMenuItem extends PopupSubMenuMenuItem {
        #timer;

        constructor({ timer, toggleCallback }) {
            super('', true);
            this.#timer = timer;
            this._toggleItem = new PopupMenuItem('');
            this._toggleItem.connect('activate', () => toggleCallback());
            this.menu.addMenuItem(this._toggleItem);
            this._prefsItem = new PopupMenuItem(_('Extension Settings'));
            this._prefsItem.connect('activate', () => main.extensionManager.openExtensionPrefs(Me.uuid, '', []));
            this.menu.addMenuItem(this._prefsItem);
            this.update();
        }

        update() {
            this.icon.icon_name = _getIconNameForTime(this.#timer.time);
            this.icon.fallback_gicon = _getGiconForTime(this.#timer.time);
            this.label.text = this.#timer.time === Time.DAY ? _('Night Mode Off') : _('Night Mode On');
            this._toggleItem.label.text = this.#timer.time === Time.DAY ? _('Turn On') : _('Turn Off');
        }
    }
);

var _getIconNameForTime = time => {
    return time === Time.DAY ? 'nightthemeswitcher-ondemand-off-symbolic' : 'nightthemeswitcher-ondemand-on-symbolic';
};

var _getGiconForTime = time => {
    return Gio.icon_new_for_string(GLib.build_filenamev([Me.path, 'icons', 'hicolor', 'scalable', 'status', `${this._getIconNameForTime(time)}.svg`]));
};
