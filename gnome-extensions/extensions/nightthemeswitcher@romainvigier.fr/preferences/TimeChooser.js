// SPDX-FileCopyrightText: 2021 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { GLib, GObject, Gtk } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();


var TimeChooser = GObject.registerClass({
    GTypeName: 'TimeChooser',
    Template: 'resource:///org/gnome/shell/extensions/nightthemeswitcher/preferences/ui/TimeChooser.ui',
    InternalChildren: ['hours', 'minutes'],
    Properties: {
        time: GObject.ParamSpec.double(
            'time',
            'Time',
            'The time of the chooser',
            GObject.ParamFlags.READWRITE,
            0,
            24,
            0
        ),
    },
}, class TimeChooser extends Gtk.Box {
    onTimeChanged(chooser) {
        const hours = Math.trunc(chooser.time);
        const minutes = Math.round((chooser.time - hours) * 60);
        chooser._hours.value = hours;
        chooser._minutes.value = minutes;
    }

    onValueChanged(_spin) {
        const hours = this._hours.value;
        const minutes = this._minutes.value / 60;
        this.time = hours + minutes;
    }

    onOutputChanged(spin) {
        spin.text = spin.value.toString().padStart(2, '0');
        return true;
    }
});
