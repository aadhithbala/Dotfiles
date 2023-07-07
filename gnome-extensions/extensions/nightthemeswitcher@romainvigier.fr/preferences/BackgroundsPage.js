// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Adw, Gio, GLib, GObject } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();


var BackgroundsPage = GObject.registerClass({
    GTypeName: 'BackgroundsPage',
    Template: 'resource:///org/gnome/shell/extensions/nightthemeswitcher/preferences/ui/BackgroundsPage.ui',
    InternalChildren: [
        'day_button',
        'night_button',
    ],
}, class BackgroundsPage extends Adw.PreferencesPage {
    constructor(props = {}) {
        super(props);
        const settings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });

        settings.bind('picture-uri', this._day_button, 'uri', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('picture-uri-dark', this._night_button, 'uri', Gio.SettingsBindFlags.DEFAULT);
    }
});
