// SPDX-FileCopyrightText: 2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Adw, GLib, GObject } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();


var ContributePage = GObject.registerClass({
    GTypeName: 'ContributePage',
    Template: 'resource:///org/gnome/shell/extensions/nightthemeswitcher/preferences/ui/ContributePage.ui',
}, class ContributePage extends Adw.PreferencesPage {});
