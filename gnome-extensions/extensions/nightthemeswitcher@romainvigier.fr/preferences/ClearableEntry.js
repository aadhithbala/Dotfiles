// SPDX-FileCopyrightText: 2021 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Gio, GLib, GObject, Gtk } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();


var ClearableEntry = GObject.registerClass({
    GTypeName: 'ClearableEntry',
    Template: 'resource:///org/gnome/shell/extensions/nightthemeswitcher/preferences/ui/ClearableEntry.ui',
}, class ClearableEntry extends Gtk.Entry {
    onIconReleased(entry, position) {
        if (position === Gtk.EntryIconPosition.SECONDARY)
            entry.text = '';
    }
});
