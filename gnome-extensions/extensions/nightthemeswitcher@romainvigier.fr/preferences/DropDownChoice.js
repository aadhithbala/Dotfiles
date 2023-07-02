// SPDX-FileCopyrightText: 2020, 2021 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { GObject } = imports.gi;


var DropDownChoice = GObject.registerClass({
    GTypeName: 'DropDownChoice',
    Properties: {
        id: GObject.ParamSpec.string(
            'id',
            'ID',
            'Identifier',
            GObject.ParamFlags.READWRITE,
            null
        ),
        title: GObject.ParamSpec.string(
            'title',
            'Title',
            'Displayed title',
            GObject.ParamFlags.READWRITE,
            null
        ),
        enabled: GObject.ParamSpec.boolean(
            'enabled',
            'Enabled',
            'If the choice is enabled',
            GObject.ParamFlags.READWRITE,
            true
        ),
    },
}, class DropDownChoice extends GObject.Object {});
