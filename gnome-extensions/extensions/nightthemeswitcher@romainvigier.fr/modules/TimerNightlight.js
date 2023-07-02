// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Gio } = imports.gi;
const { extensionUtils } = imports.misc;
const Signals = imports.signals;

const Me = extensionUtils.getCurrentExtension();

const utils = Me.imports.utils;

const { Time } = Me.imports.enums.Time;


const COLOR_INTERFACE = `
<node>
    <interface name="org.gnome.SettingsDaemon.Color">
        <property name="DisabledUntilTomorrow" type="b" access="readwrite"/>
        <property name="NightLightActive" type="b" access="read"/>
    </interface>
</node>`;


/**
 * The Night Light Timer uses Night Light as a time source.
 *
 * It connects to the Color SettingsDaemon DBus proxy to listen to the
 * 'NightLightActive' property and will signal any change.
 */
var TimerNightlight = class {
    #settings;

    #colorDbusProxy = null;
    #settingsConnections = [];
    #nightlightStateConnection = null;
    #previousNightlightActive = null;

    constructor() {
        this.#settings = extensionUtils.getSettings(utils.getSettingsSchema('time'));
    }

    enable() {
        console.debug('Enabling Night Light Timer...');
        this.#connectToColorDbusProxy();
        this.#connectSettings();
        this.#listenToNightlightState();
        this.emit('time-changed', this.time);
        console.debug('Night Light Timer enabled.');
    }

    disable() {
        console.debug('Disabling Night Light Timer...');
        this.#stopListeningToNightlightState();
        this.#disconnectSettings();
        this.#disconnectFromColorDbusProxy();
        console.debug('Night Light Timer disabled.');
    }


    get time() {
        return this.#isNightlightActive() ? Time.NIGHT : Time.DAY;
    }


    #connectToColorDbusProxy() {
        console.debug('Connecting to Color DBus proxy...');
        const ColorProxy = Gio.DBusProxy.makeProxyWrapper(COLOR_INTERFACE);
        this.#colorDbusProxy = new ColorProxy(
            Gio.DBus.session,
            'org.gnome.SettingsDaemon.Color',
            '/org/gnome/SettingsDaemon/Color'
        );
        console.debug('Connected to Color DBus proxy.');
    }

    #disconnectFromColorDbusProxy() {
        console.debug('Disconnecting from Color DBus proxy...');
        this.#colorDbusProxy = null;
        console.debug('Disconnected from Color DBus proxy.');
    }

    #connectSettings() {
        console.debug('Connecting Night Light Timer to settings...');
        this.#settingsConnections.push({
            settings: this.#settings,
            id: this.#settings.connect('changed::nightlight-follow-disable', this.#onNightlightFollowDisableChanged.bind(this)),
        });
    }

    #disconnectSettings() {
        console.debug('Disconnecting Night Light Timer from settings...');
        this.#settingsConnections.forEach(connection => connection.settings.disconnect(connection.id));
        this.#settingsConnections = [];
    }

    #listenToNightlightState() {
        console.debug('Listening to Night Light state...');
        this.#nightlightStateConnection = this.#colorDbusProxy.connect(
            'g-properties-changed',
            this.#onNightlightStateChanged.bind(this)
        );
    }

    #stopListeningToNightlightState() {
        this.#colorDbusProxy.disconnect(this.#nightlightStateConnection);
        console.debug('Stopped listening to Night Light state.');
    }


    #onNightlightFollowDisableChanged() {
        this.#onNightlightStateChanged();
    }

    #onNightlightStateChanged(_sender, _dbusProperties) {
        if (this.#isNightlightActive() !== this.#previousNightlightActive) {
            console.debug(`Night Light has become ${this.#isNightlightActive() ? '' : 'in'}active.`);
            this.#previousNightlightActive = this.#isNightlightActive();
            this.emit('time-changed', this.time);
        }
    }


    #isNightlightActive() {
        return this.#settings.get_boolean('nightlight-follow-disable')
            ? !this.#colorDbusProxy.DisabledUntilTomorrow && this.#colorDbusProxy.NightLightActive
            : this.#colorDbusProxy.NightLightActive;
    }
};
Signals.addSignalMethods(TimerNightlight.prototype);
