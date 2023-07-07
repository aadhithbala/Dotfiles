// SPDX-FileCopyrightText: 2020, 2021 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Gdk, Gio, GLib, Gtk } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

const { ExtensionState } = extensionUtils;


/**
 * Build the full settings schema from a subschema.
 *
 * @param {string} subSchema The subschema to get.
 * @returns {string} The full schema.
 */
function getSettingsSchema(subSchema) {
    return subSchema ? `${Me.metadata['settings-schema']}.${subSchema}` : Me.metadata['settings-schema'];
}

/**
 * Get all the directories of the system for a resource.
 *
 * @param {string} resource The resource to get the directories.
 * @returns {string[]} An array of paths.
 */
function getResourcesDirsPaths(resource) {
    return [
        GLib.build_filenamev([GLib.get_home_dir(), `.${resource}`]),
        GLib.build_filenamev([GLib.get_user_data_dir(), resource]),
        ...GLib.get_system_data_dirs().map(path => GLib.build_filenamev([path, resource])),
    ];
}

/**
 * Get all the resources installed on the system.
 *
 * @param {string} type The resources to get.
 * @returns {Set} A set of installed resources.
 */
function getInstalledResources(type) {
    const installedResources = new Set();
    getResourcesDirsPaths(type).forEach(resourcesDirPath => {
        const resourcesDir = Gio.File.new_for_path(resourcesDirPath);
        if (resourcesDir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) !== Gio.FileType.DIRECTORY)
            return;
        const resourcesDirsEnumerator = resourcesDir.enumerate_children('standard::', Gio.FileQueryInfoFlags.NONE, null);
        while (true) {
            let resourceDirInfo = resourcesDirsEnumerator.next_file(null);
            if (resourceDirInfo === null)
                break;
            const resourceDir = resourcesDirsEnumerator.get_child(resourceDirInfo);
            if (resourceDir === null)
                continue;
            const resource = new Map([
                ['name', resourceDir.get_basename()],
                ['path', resourceDir.get_path()],
            ]);
            installedResources.add(resource);
        }
        resourcesDirsEnumerator.close(null);
    });
    return installedResources;
}

/**
 * Get all the installed GTK themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed GTK themes names.
 */
function getInstalledGtkThemes() {
    const themes = new Set();
    getInstalledResources('themes').forEach(theme => {
        const version = [0, Gtk.MINOR_VERSION].find(gtkVersion => {
            if (gtkVersion % 2)
                gtkVersion += 1;
            const cssFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), `gtk-3.${gtkVersion}`, 'gtk.css']));
            return cssFile.query_exists(null);
        });
        if (version !== undefined)
            themes.add(theme.get('name'));
    });
    return themes;
}

/**
 * Get all the installed shell themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed shell themes names.
 */
function getInstalledShellThemes() {
    const themes = new Set(['']);
    getInstalledResources('themes').forEach(theme => {
        const themeFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), 'gnome-shell', 'gnome-shell.css']));
        if (themeFile.query_exists(null))
            themes.add(theme.get('name'));
    });
    return themes;
}

/**
 * Get all the installed icon themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed icon themes names.
 */
function getInstalledIconThemes() {
    const themes = new Set();
    getInstalledResources('icons').forEach(theme => {
        const themeFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), 'index.theme']));
        if (themeFile.query_exists(null))
            themes.add(theme.get('name'));
    });
    themes.delete('default');
    return themes;
}

/**
 * Get all the installed cursor themes on the system.
 *
 * @returns {Set<string>} A set containing all the installed cursor themes names.
 */
function getInstalledCursorThemes() {
    const themes = new Set();
    getInstalledResources('icons').forEach(theme => {
        const themeFile = Gio.File.new_for_path(GLib.build_filenamev([theme.get('path'), 'cursors']));
        if (themeFile.query_exists(null))
            themes.add(theme.get('name'));
    });
    return themes;
}

/**
 * Get the User Themes extension.
 *
 * @returns {object|undefined} The User Themes extension object or undefined if
 * it isn't installed.
 */
function getUserthemesExtension() {
    try {
        return imports.ui.main.extensionManager.lookup('user-theme@gnome-shell-extensions.gcampax.github.com');
    } catch (_e) {
        return undefined;
    }
}

/**
 * Get the User Themes extension settings.
 *
 * @returns {Gio.Settings|null} The User Themes extension settings or null if
 * the extension isn't installed.
 */
function getUserthemesSettings() {
    let extension = getUserthemesExtension();
    if (!extension || extension.state !== ExtensionState.ENABLED)
        return null;
    const schemaDir = extension.dir.get_child('schemas');
    const GioSSS = Gio.SettingsSchemaSource;
    let schemaSource;
    if (schemaDir.query_exists(null))
        schemaSource = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
    else
        schemaSource = GioSSS.get_default();
    const schemaObj = schemaSource.lookup('org.gnome.shell.extensions.user-theme', true);
    return new Gio.Settings({ settings_schema: schemaObj });
}

/**
 * Get the shell theme stylesheet.
 *
 * @param {string} theme The shell theme name.
 * @returns {string|null} Path to the shell theme stylesheet.
 */
function getShellThemeStylesheet(theme) {
    const themeName = theme ? `'${theme}'` : 'default';
    console.debug(`Getting the ${themeName} theme shell stylesheet...`);
    let stylesheet = null;
    if (theme) {
        const stylesheetPaths = getResourcesDirsPaths('themes').map(path => GLib.build_filenamev([path, theme, 'gnome-shell', 'gnome-shell.css']));
        stylesheet = stylesheetPaths.find(path => {
            const file = Gio.file_new_for_path(path);
            return file.query_exists(null);
        });
    }
    return stylesheet;
}

/**
 * Apply a stylesheet to the shell.
 *
 * @param {string} stylesheet The shell stylesheet to apply.
 */
function applyShellStylesheet(stylesheet) {
    console.debug('Applying shell stylesheet...');
    imports.ui.main.setThemeStylesheet(stylesheet);
    imports.ui.main.loadTheme();
    console.debug('Shell stylesheet applied.');
}

/**
 * Check if the given keyval is forbidden.
 *
 * @param {number} keyval The keyval number.
 * @returns {boolean} `true` if the keyval is forbidden.
 */
function isKeyvalForbidden(keyval) {
    const forbiddenKeyvals = [
        Gdk.KEY_Home,
        Gdk.KEY_Left,
        Gdk.KEY_Up,
        Gdk.KEY_Right,
        Gdk.KEY_Down,
        Gdk.KEY_Page_Up,
        Gdk.KEY_Page_Down,
        Gdk.KEY_End,
        Gdk.KEY_Tab,
        Gdk.KEY_KP_Enter,
        Gdk.KEY_Return,
        Gdk.KEY_Mode_switch,
    ];
    return forbiddenKeyvals.includes(keyval);
}

/**
 * Check if the given key combo is a valid binding
 *
 * @param {{mask: number, keycode: number, keyval:number}} combo An object
 * representing the key combo.
 * @returns {boolean} `true` if the key combo is a valid binding.
 */
function isBindingValid({ mask, keycode, keyval }) {
    if ((mask === 0 || mask === Gdk.SHIFT_MASK) && keycode !== 0) {
        if (
            (keyval >= Gdk.KEY_a && keyval <= Gdk.KEY_z) ||
            (keyval >= Gdk.KEY_A && keyval <= Gdk.KEY_Z) ||
            (keyval >= Gdk.KEY_0 && keyval <= Gdk.KEY_9) ||
            (keyval >= Gdk.KEY_kana_fullstop && keyval <= Gdk.KEY_semivoicedsound) ||
            (keyval >= Gdk.KEY_Arabic_comma && keyval <= Gdk.KEY_Arabic_sukun) ||
            (keyval >= Gdk.KEY_Serbian_dje && keyval <= Gdk.KEY_Cyrillic_HARDSIGN) ||
            (keyval >= Gdk.KEY_Greek_ALPHAaccent && keyval <= Gdk.KEY_Greek_omega) ||
            (keyval >= Gdk.KEY_hebrew_doublelowline && keyval <= Gdk.KEY_hebrew_taf) ||
            (keyval >= Gdk.KEY_Thai_kokai && keyval <= Gdk.KEY_Thai_lekkao) ||
            (keyval >= Gdk.KEY_Hangul_Kiyeog && keyval <= Gdk.KEY_Hangul_J_YeorinHieuh) ||
            (keyval === Gdk.KEY_space && mask === 0) ||
            isKeyvalForbidden(keyval)
        )
            return false;
    }
    return true;
}

/**
 * Check if the given key combo is a valid accelerator.
 *
 * @param {{mask: number, keyval:number}} combo An object representing the key
 * combo.
 * @returns {boolean} `true` if the key combo is a valid accelerator.
 */
function isAccelValid({ mask, keyval }) {
    return Gtk.accelerator_valid(keyval, mask) || (keyval === Gdk.KEY_Tab && mask !== 0);
}

/**
 * Find the position of a menu item in the Shell aggregate menu.
 *
 * @param {*} menuItem The desired menu item.
 * @returns {number} The position of the menu item, `-1` if not found.
 */
function findShellAggregateMenuItemPosition(menuItem) {
    const menu = imports.ui.main.panel.statusArea.aggregateMenu.menu;
    const items = menu._getMenuItems();
    return items.indexOf(menuItem);
}

/**
 * Find an item in a `Gio.ListModel`.
 *
 * @param {Gio.ListModel} model The ListModel to search.
 * @param {Function} findFunction The function used to find the item. Gets the item as argument.
 * @returns {(*|undefined)} The found item or `undefined`.
 */
function findItemPositionInModel(model, findFunction) {
    const nItems = model.get_n_items();
    for (let i = 0; i < nItems; i++) {
        if (findFunction(model.get_item(i)))
            return i;
    }
    return undefined;
}
