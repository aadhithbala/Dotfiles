// SPDX-FileCopyrightText: 2021, 2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Gdk, GLib, GObject, Gtk } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();

const utils = Me.imports.utils;


var ShortcutButton = GObject.registerClass({
    GTypeName: 'ShortcutButton',
    Template: 'resource:///org/gnome/shell/extensions/nightthemeswitcher/preferences/ui/ShortcutButton.ui',
    InternalChildren: ['choose_button', 'change_button', 'clear_button', 'dialog'],
    Properties: {
        keybinding: GObject.ParamSpec.string(
            'keybinding',
            'Keybinding',
            'Key sequence',
            GObject.ParamFlags.READWRITE,
            null
        ),
    },
}, class ShortcutButton extends Gtk.Stack {
    vfunc_mnemonic_activate() {
        this.activate();
    }

    activate() {
        if (this.keybinding)
            return this._change_button.activate();
        else
            return this._choose_button.activate();
    }

    openDialog() {
        this._dialog.transient_for = this.get_root();
        this._dialog.present();
    }

    onKeybindingChanged(button) {
        button.visible_child_name = button.keybinding ? 'edit' : 'choose';
    }

    onChooseButtonClicked(_button) {
        this.openDialog();
    }

    onChangeButtonClicked(_button) {
        this.openDialog();
    }

    onClearButtonClicked(_button) {
        this.keybinding = '';
    }

    onKeyPressed(_widget, keyval, keycode, state) {
        let mask = state & Gtk.accelerator_get_default_mod_mask();
        mask &= ~Gdk.ModifierType.LOCK_MASK;

        if (mask === 0 && keyval === Gdk.KEY_Escape) {
            this._dialog.close();
            return Gdk.EVENT_STOP;
        }

        if (
            !utils.isBindingValid({ mask, keycode, keyval }) ||
            !utils.isAccelValid({ mask, keyval })
        )
            return Gdk.EVENT_STOP;

        this.keybinding = Gtk.accelerator_name_with_keycode(
            null,
            keyval,
            keycode,
            mask
        );
        this._dialog.close();
        return Gdk.EVENT_STOP;
    }
});
