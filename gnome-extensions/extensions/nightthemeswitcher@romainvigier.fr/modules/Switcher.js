// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Gio } = imports.gi;
const { extensionUtils } = imports.misc;

const Me = extensionUtils.getCurrentExtension();

const utils = Me.imports.utils;

const { Time } = Me.imports.enums.Time;


/**
 * Function called when the time changes.
 *
 * @callback TimeChangedCallback
 * @param {Time} time New time.
 */


/**
 * The Switcher runs a callback function when the time changes.
 *
 * @param {Object} params Params object.
 * @param {string} params.name Name of the switcher.
 * @param {Timer} params.timer Timer to listen to.
 * @param {Gio.Settings} params.settings Settings with the `enabled` key.
 * @param {TimeChangedCallback} params.callback Callback function.
 */
var Switcher = class {
    #name;
    #timer;
    #settings;
    #callback;

    #statusConnection = null;
    #timerConnection = null;

    constructor({ name, timer, settings, callback }) {
        this.#name = name;
        this.#timer = timer;
        this.#settings = settings;
        this.#callback = callback;
    }

    enable() {
        console.debug(`Enabling ${this.#name} switcher...`);
        this.#watchStatus();
        if (this.#settings.get_boolean('enabled')) {
            this.#connectTimer();
            this.#onTimeChanged();
        }
        console.debug(`${this.#name} switcher enabled.`);
    }

    disable() {
        console.debug(`Disabling ${this.#name} switcher...`);
        this.#disconnectTimer();
        this.#unwatchStatus();
        console.debug(`${this.#name} switcher disabled.`);
    }


    #watchStatus() {
        console.debug(`Watching ${this.#name} switching status...`);
        this.#statusConnection = this.#settings.connect('changed::enabled', this.#onStatusChanged.bind(this));
    }

    #unwatchStatus() {
        if (this.#statusConnection) {
            this.#settings.disconnect(this.#statusConnection);
            this.#statusConnection = null;
        }
        console.debug(`Stopped watching ${this.#name} switching status.`);
    }

    #connectTimer() {
        console.debug(`Connecting ${this.#name} switcher to Timer...`);
        this.#timerConnection = this.#timer.connect('time-changed', this.#onTimeChanged.bind(this));
    }

    #disconnectTimer() {
        if (this.#timerConnection) {
            this.#timer.disconnect(this.#timerConnection);
            this.#timerConnection = null;
        }
        console.debug(`Disconnected ${this.#name} switcher from Timer.`);
    }


    #onStatusChanged() {
        console.debug(`${this.#name} switching has been ${this.#settings.get_boolean('enabled') ? 'enabled' : 'disabled'}.`);
        this.disable();
        this.enable();
    }

    #onTimeChanged() {
        this.#callback(this.#timer.time);
    }
};
