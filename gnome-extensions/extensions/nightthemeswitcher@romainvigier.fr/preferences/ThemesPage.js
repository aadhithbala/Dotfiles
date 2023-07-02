// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Adw, Gio, GLib, GObject, Gtk } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();
const _ = extensionUtils.gettext;

const utils = Me.imports.utils;

const { DropDownChoice } = Me.imports.preferences.DropDownChoice;


var ThemesPage = GObject.registerClass({
    GTypeName: 'ThemesPage',
    Template: 'resource:///org/gnome/shell/extensions/nightthemeswitcher/preferences/ui/ThemesPage.ui',
    InternalChildren: [
        'gtk_row',
        'gtk_day_variant_combo_row',
        'gtk_night_variant_combo_row',
        'shell_row',
        'shell_day_variant_combo_row',
        'shell_night_variant_combo_row',
        'icon_row',
        'icon_day_variant_combo_row',
        'icon_night_variant_combo_row',
        'cursor_row',
        'cursor_day_variant_combo_row',
        'cursor_night_variant_combo_row',
    ],
}, class ThemesPage extends Adw.PreferencesPage {
    constructor(props = {}) {
        super(props);
        const gtkSettings = extensionUtils.getSettings(utils.getSettingsSchema('gtk-variants'));
        const shellSettings = extensionUtils.getSettings(utils.getSettingsSchema('shell-variants'));
        const iconSettings = extensionUtils.getSettings(utils.getSettingsSchema('icon-variants'));
        const cursorSettings = extensionUtils.getSettings(utils.getSettingsSchema('cursor-variants'));

        gtkSettings.bind('enabled', this._gtk_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const gtkThemesStore = Gio.ListStore.new(DropDownChoice);
        gtkThemesStore.splice(0, 0, Array.from(utils.getInstalledGtkThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme })));
        _setupComboRow(this._gtk_day_variant_combo_row, gtkThemesStore, gtkSettings, 'day');
        _setupComboRow(this._gtk_night_variant_combo_row, gtkThemesStore, gtkSettings, 'night');

        shellSettings.bind('enabled', this._shell_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const shellThemesStore = Gio.ListStore.new(DropDownChoice);
        shellThemesStore.splice(0, 0, Array.from(utils.getInstalledShellThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme || _('Default') })));
        _setupComboRow(this._shell_day_variant_combo_row, shellThemesStore, shellSettings, 'day');
        _setupComboRow(this._shell_night_variant_combo_row, shellThemesStore, shellSettings, 'night');

        iconSettings.bind('enabled', this._icon_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const iconThemesStore = Gio.ListStore.new(DropDownChoice);
        iconThemesStore.splice(0, 0, Array.from(utils.getInstalledIconThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme })));
        _setupComboRow(this._icon_day_variant_combo_row, iconThemesStore, iconSettings, 'day');
        _setupComboRow(this._icon_night_variant_combo_row, iconThemesStore, iconSettings, 'night');

        cursorSettings.bind('enabled', this._cursor_row, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

        const cursorThemesStore = Gio.ListStore.new(DropDownChoice);
        cursorThemesStore.splice(0, 0, Array.from(utils.getInstalledCursorThemes()).sort().map(theme => new DropDownChoice({ id: theme, title: theme })));
        _setupComboRow(this._cursor_day_variant_combo_row, cursorThemesStore, cursorSettings, 'day');
        _setupComboRow(this._cursor_night_variant_combo_row, cursorThemesStore, cursorSettings, 'night');
    }
});

/**
 * Set up the model of a combo row.
 *
 * @param {Adw.ComboRow} row The row to set up.
 * @param {Gio.ListModel} model A list model of DropDownChoice.
 * @param {Gio.Settings} settings The settings to connect.
 * @param {str} key The key to update.
 */
function _setupComboRow(row, model, settings, key) {
    row.model = model;
    row.expression = Gtk.PropertyExpression.new(DropDownChoice, null, 'title');
    row.connect('notify::selected-item', () => settings.set_string(key, row.selected_item.id));
    const updateComboRowSelected = () => {
        row.selected = utils.findItemPositionInModel(row.model, item => item.id === settings.get_string(key));
    };
    settings.connect(`changed::${key}`, () => updateComboRowSelected());
    updateComboRowSelected();
}
