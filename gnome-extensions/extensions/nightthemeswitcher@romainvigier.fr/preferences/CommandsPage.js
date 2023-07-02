// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Adw, Gio, GLib, GObject } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();

const utils = Me.imports.utils;


var CommandsPage = GObject.registerClass({
    GTypeName: 'CommandsPage',
    Template: 'resource:///org/gnome/shell/extensions/nightthemeswitcher/preferences/ui/CommandsPage.ui',
    InternalChildren: [
        'enabled_switch',
        'sunrise_entry',
        'sunset_entry',
    ],
}, class CommandsPage extends Adw.PreferencesPage {
    constructor(props = {}) {
        super(props);
        const settings = extensionUtils.getSettings(utils.getSettingsSchema('commands'));

        settings.bind('enabled', this._enabled_switch, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('sunrise', this._sunrise_entry, 'text', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('sunset', this._sunset_entry, 'text', Gio.SettingsBindFlags.DEFAULT);
    }
});
