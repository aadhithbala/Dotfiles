// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

'use strict';

const { Adw, Gdk, Gio, GLib, GObject, Gtk } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();
const _ = extensionUtils.gettext;


/**
 * Initialize the preferences.
 */
function init() {
    extensionUtils.initTranslations();

    const resource = Gio.Resource.load(GLib.build_filenamev([Me.path, 'resources', 'preferences.gresource']));
    Gio.resources_register(resource);

    GObject.type_ensure(Me.imports.preferences.BackgroundsPage.BackgroundsPage);
    GObject.type_ensure(Me.imports.preferences.CommandsPage.CommandsPage);
    GObject.type_ensure(Me.imports.preferences.ContributePage.ContributePage);
    GObject.type_ensure(Me.imports.preferences.SchedulePage.SchedulePage);
    GObject.type_ensure(Me.imports.preferences.ThemesPage.ThemesPage);

    GObject.type_ensure(Me.imports.preferences.BackgroundButton.BackgroundButton);
    GObject.type_ensure(Me.imports.preferences.ClearableEntry.ClearableEntry);
    GObject.type_ensure(Me.imports.preferences.ShortcutButton.ShortcutButton);
    GObject.type_ensure(Me.imports.preferences.TimeChooser.TimeChooser);

    const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
    iconTheme.add_resource_path('/org/gnome/shell/extensions/nightthemeswitcher/preferences/icons');
}

/**
 * Fill the PreferencesWindow.
 *
 * @param {Adw.PreferencesWindow} window The PreferencesWindow to fill.
 */
function fillPreferencesWindow(window) {
    const { BackgroundsPage } = Me.imports.preferences.BackgroundsPage;
    const { CommandsPage } = Me.imports.preferences.CommandsPage;
    const { ContributePage } = Me.imports.preferences.ContributePage;
    const { SchedulePage } = Me.imports.preferences.SchedulePage;
    const { ThemesPage } = Me.imports.preferences.ThemesPage;

    [
        new SchedulePage(),
        new BackgroundsPage(),
        new CommandsPage(),
        new ThemesPage(),
        new ContributePage(),
    ].forEach(page => window.add(page));

    window.search_enabled = true;
    window.set_default_size(720, 490);
}
