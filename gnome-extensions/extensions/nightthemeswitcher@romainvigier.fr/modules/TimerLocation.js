// SPDX-FileCopyrightText: 2020-2022 Romain Vigier <contact AT romainvigier.fr>
// SPDX-License-Identifier: GPL-3.0-or-later

const { Geoclue, GLib } = imports.gi;
const { extensionUtils } = imports.misc;
const Signals = imports.signals;

const Me = extensionUtils.getCurrentExtension();

const utils = Me.imports.utils;

const { Time } = Me.imports.enums.Time;


/**
 * The Location Timer uses Location Services to get the current sunrise and
 * sunset times.
 *
 * It gets the current user's location with the GeoClue2 DBus proxy and
 * calculate the times.
 *
 * It will recalculate every hour and when the user's location changed to stay
 * up to date.
 *
 * Every second, it will check if the time has changed and signal if that's the
 * case.
 */
var TimerLocation = class {
    #suntimes;

    #previouslyDaytime = null;
    #geoclue = null;
    #geoclueConnection = null;
    #timeChangeTimer = null;
    #regularlyUpdateSuntimesTimer = null;

    constructor() {
        // Before we have the location suntimes, we'll use the manual schedule
        // times
        const timeSettings = extensionUtils.getSettings(utils.getSettingsSchema('time'));
        this.#suntimes = new Map([
            ['sunrise', timeSettings.get_double('schedule-sunrise')],
            ['sunset', timeSettings.get_double('schedule-sunset')],
        ]);
    }

    enable() {
        console.debug('Enabling Location Timer...');
        this.#connectToGeoclue();
        this.#watchForTimeChange();
        this.#regularlyUpdateSuntimes();
        console.debug('Location Timer enabled.');
    }

    disable() {
        console.debug('Disabling Location Timer...');
        this.#stopRegularlyUpdatingSuntimes();
        this.#stopWatchingForTimeChange();
        this.#disconnectFromGeoclue();
        console.debug('Location Timer disabled.');
    }


    get time() {
        return this.#isDaytime() ? Time.DAY : Time.NIGHT;
    }


    #connectToGeoclue() {
        console.debug('Connecting to GeoClue...');
        Geoclue.Simple.new(
            'org.gnome.Shell',
            Geoclue.AccuracyLevel.CITY,
            null,
            this.#onGeoclueReady.bind(this)
        );
    }

    #disconnectFromGeoclue() {
        console.debug('Disconnecting from GeoClue...');
        if (this.#geoclueConnection) {
            this.#geoclue.disconnect(this.#geoclueConnection);
            this.#geoclueConnection = null;
        }
        console.debug('Disconnected from GeoClue.');
    }


    #onGeoclueReady(_, result) {
        this.#geoclue = Geoclue.Simple.new_finish(result);
        this.#geoclueConnection = this.#geoclue.connect('notify::location', this.#onLocationUpdated.bind(this));
        console.debug('Connected to GeoClue.');
        this.#onLocationUpdated();
    }

    #onLocationUpdated(_geoclue, _location) {
        console.debug('Location has changed.');
        this.#updateLocation();
        this.#updateSuntimes();
    }


    #updateLocation() {
        if (this.#geoclue) {
            console.debug('Updating location...');
            const { latitude, longitude } = this.#geoclue.get_location();
            this.location = new Map([
                ['latitude', latitude],
                ['longitude', longitude],
            ]);
            console.debug(`Current location: (${latitude};${longitude})`);
        }
    }

    #updateSuntimes() {
        if (!this.location)
            return;

        console.debug('Updating sun times...');

        Math.rad = degrees => degrees * Math.PI / 180;
        Math.deg = radians => radians * 180 / Math.PI;

        // Calculations from https://www.esrl.noaa.gov/gmd/grad/solcalc/calcdetails.html
        const latitude = this.location.get('latitude');
        const longitude = this.location.get('longitude');

        const dtNow = GLib.DateTime.new_now_local();
        const dtZero = GLib.DateTime.new_utc(1900, 1, 1, 0, 0, 0);

        const timeSpan = dtNow.difference(dtZero);

        const date = timeSpan / 1000 / 1000 / 60 / 60 / 24 + 2;
        const tzOffset = dtNow.get_utc_offset() / 1000 / 1000 / 60 / 60;
        const timePastLocalMidnight = 0;

        const julianDay = date + 2415018.5 + timePastLocalMidnight - tzOffset / 24;
        const julianCentury = (julianDay - 2451545) / 36525;
        const geomMeanLongSun = (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
        const geomMeanAnomSun = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);
        const eccentEarthOrbit = 0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury);
        const sunEqOfCtr = Math.sin(Math.rad(geomMeanAnomSun)) * (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury)) + Math.sin(Math.rad(2 * geomMeanAnomSun)) * (0.019993 - 0.000101 * julianCentury) + Math.sin(Math.rad(3 * geomMeanAnomSun)) * 0.000289;
        const sunTrueLong = geomMeanLongSun + sunEqOfCtr;
        const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(Math.rad(125.04 - 1934.136 * julianCentury));
        const meanObliqEcliptic = 23 + (26 + ((21.448 - julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813)))) / 60) / 60;
        const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos(Math.rad(125.04 - 1934.136 * julianCentury));
        const sunDeclin = Math.deg(Math.asin(Math.sin(Math.rad(obliqCorr)) * Math.sin(Math.rad(sunAppLong))));
        const varY = Math.tan(Math.rad(obliqCorr / 2)) * Math.tan(Math.rad(obliqCorr / 2));
        const eqOfTime = 4 * Math.deg(varY * Math.sin(2 * Math.rad(geomMeanLongSun)) - 2 * eccentEarthOrbit * Math.sin(Math.rad(geomMeanAnomSun)) + 4 * eccentEarthOrbit * varY * Math.sin(Math.rad(geomMeanAnomSun)) * Math.cos(2 * Math.rad(geomMeanLongSun)) - 0.5 * varY * varY * Math.sin(4 * Math.rad(geomMeanLongSun)) - 1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin(2 * Math.rad(geomMeanAnomSun)));
        const haSunrise = Math.deg(Math.acos(Math.cos(Math.rad(90.833)) / (Math.cos(Math.rad(latitude)) * Math.cos(Math.rad(sunDeclin))) - Math.tan(Math.rad(latitude)) * Math.tan(Math.rad(sunDeclin))));
        const solarNoon = (720 - 4 * longitude - eqOfTime + tzOffset * 60) / 1440;

        const timeSunrise = solarNoon - haSunrise * 4 / 1440;
        const timeSunset = solarNoon + haSunrise * 4 / 1440;

        const sunrise = timeSunrise * 24;
        const sunset = timeSunset * 24;

        this.#suntimes.set('sunrise', sunrise);
        this.#suntimes.set('sunset', sunset);
        console.debug(`New sun times: (sunrise: ${sunrise}; sunset: ${sunset})`);
    }

    #regularlyUpdateSuntimes() {
        console.debug('Regularly updating sun times...');
        this.#regularlyUpdateSuntimesTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 3600, () => {
            this.#updateSuntimes();
            return GLib.SOURCE_CONTINUE;
        });
    }

    #stopRegularlyUpdatingSuntimes() {
        GLib.Source.remove(this.#regularlyUpdateSuntimesTimer);
        this.#regularlyUpdateSuntimesTimer = null;
        console.debug('Stopped regularly updating sun times.');
    }

    #isDaytime() {
        const time = GLib.DateTime.new_now_local();
        const hour = time.get_hour() + time.get_minute() / 60 + time.get_second() / 3600;
        return hour >= this.#suntimes.get('sunrise') && hour <= this.#suntimes.get('sunset');
    }

    #watchForTimeChange() {
        console.debug('Watching for time change...');
        this.#timeChangeTimer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            if (this.#previouslyDaytime !== this.#isDaytime()) {
                this.#previouslyDaytime = this.#isDaytime();
                this.emit('time-changed', this.time);
            }
            return GLib.SOURCE_CONTINUE;
        });
    }

    #stopWatchingForTimeChange() {
        GLib.Source.remove(this.#timeChangeTimer);
        console.debug('Stopped watching for time change.');
    }
};
Signals.addSignalMethods(TimerLocation.prototype);
