(function() {
"use strict";
function SimulatorViewModel() {
    var self = this;
    var dropzones = {
        "si-sticna": [45.94124308458961, 14.853357442519796],
        "si-bovec": [46.33087570832793, 13.552239083733248],
        "it-venice": [45.69926612892522, 12.763687696990164],
        "es-empuria":[42.26007927137759, 3.1107708555605003],
        "other-dubai": [25.090282, 55.135681],
        "other-red-square": [55.754216, 37.620083],
        "us-lodi": [38.199366, -121.264474],
        "us-chicago": [41.399797, -88.792626],
        "us-elsinore": [33.631444, -117.296746],
        "us-eloy": [32.805771, -111.581645],
        "us-perris": [33.761911, -117.217576],
        "us-skydance": [38.584191, -121.851634],
        "us-statue-of-liberty": [40.690531, -74.04575],
        "custom": null
    };

    self.dzMenu = [
        {
            name: 'si',
            members: [ 'si-sticna', 'si-bovec' ]
        },
        {
            name: 'it',
            members: [ 'it-venice' ]
        },
        {
            name: 'es',
            members: [ 'es-empuria' ]
        },
        {
            name: 'us',
            members: [ 'us-lodi', 'us-elsinore', 'us-skydance', 'us-eloy', 'us-perris', 'us-chicago', 'us-statue-of-liberty' ]
        },
        {
            name: 'other',
            members: [ 'other-dubai', 'other-red-square' ]
        }
    ];

    self.debug = {
        on: ko.observable(false),
        cheats: ko.observable(false)
    };

    self.parameters = {
        embedded: ko.observable(false),
        startable: ko.observable(true)
    }

    self.display = {
        language: ko.observable("en"),
        unitSystem: ko.observable("metric"),

        steadyPoint: ko.observable(false),
        reachset: ko.observable(false),
        controlset: ko.observable(false),

        pattern: ko.observable("hide"),

        fullscreen: ko.observable(false),

        maxAltitude: ko.computed(function() {
            return Math.max(altitudeProgressbarMax, self.pattern.openingAltitude());
        }, this, { deferEvaluation: true }),

        useMetric: ko.computed(function() {
            return self.display.unitSystem() === "metric";
        }, this, { deferEvaluation: true }),

        toggleFullscreen: function() {
            self.display.fullscreen(!self.display.fullscreen());
        }
    };

    self.wind = {
        // We use the azimuth of the wind speed vector here, not the navigational wind direction (i.e. where wind is blowing, not where _from_)
        direction: ko.observable(),
        speed: ko.observable(),

        randomize: function() {
            self.wind.direction(Math.random() * Math.PI * 2);
            self.wind.speed(2 + Math.random() * 2 - 1);
        }
    };

    self.wind.randomize();

    self.pattern = {
        selectedLandingDirection: ko.observable(0),
        intoWind: ko.observable(true),
        openingAltitude: ko.observable(700),

        show: ko.computed(function() {
            return self.display.pattern() !== "hide";
        }, this, { deferEvaluation: true }),
        lhs: ko.computed(function() {
            return self.pattern.show() ?
                (self.display.pattern() === "lhs"):
                undefined;
        }, this, { deferEvaluation: true }),

        landingDirection: ko.computed(function() {
            return self.pattern.intoWind() ? normalizeAngle(self.wind.direction() + Math.PI) : self.pattern.selectedLandingDirection();
        }, this, { deferEvaluation: true }),

        points: ko.computed(function() {
            if (!self.pattern.show()) {
                return [];
            }
            return computeLandingPattern(self.location.coords(), self.wind, self.pattern);
        }, this, { deferEvaluation: true })
    };

    self.simulation = {
        started: ko.observable(false),
        speed: ko.observable(1.0),

        oldSpeed: 1.0, // to support togglePause
        togglePause: function() {
            if (self.simulation.speed() != 0) {
                self.simulation.oldSpeed = self.simulation.speed();
                self.simulation.speed(0);
            } else {
                self.simulation.speed(self.simulation.oldSpeed);
            }
        },

        pauseText: ko.computed(function() {
            return localize(self.simulation.speed() != 0 ? "Pause" : "Unpause") + " (P)";
        }, this, { deferEvaluation: true }),

        flying: ko.computed(function() {
            return self.simulation.started() && self.canopy.altitude() > eps;
        }, this, { deferEvaluation: true }),

        start: function(loc) {
            self.canopy.location(loc);
            self.canopy.altitude(self.pattern.openingAltitude());
            self.canopy.heading(self.wind.direction() + Math.PI); // Into the wind
            self.canopy.mode(0.6);

            self.simulation.started(true);
        },

        stop: function() {
            self.canopy.altitude(0);
        }
    };

    self.canopy = {
        location: ko.observable(),
        altitude: ko.observable(),
        heading: ko.observable(),
        mode: ko.observable(),

        speedH: ko.computed(function() {
            return getCanopyHorizontalSpeed(self.canopy.mode());
        }, this, { deferEvaluation: true }),

        speedV: ko.computed(function() {
            return getCanopyVerticalSpeed(self.canopy.mode());
        }, this, { deferEvaluation: true }),

        icon: ko.computed(function() {
            return createCanopyMarkerIcon(self.canopy.heading(), self.map.heading());
        }, this, { deferEvaluation: true }),

        modeChange: function(amount) {
            var minMode = 0.1; // We don't allow flying in the stall
            self.canopy.mode(clamp(self.canopy.mode() + amount, minMode, 1));
        },

        steeringInput: function(amount) {
            self.canopy.heading(normalizeAngle(self.canopy.heading() + amount));
        },

        descend: function(time) {
            self.canopy.altitude(self.canopy.altitude() - time * self.canopy.speedV());
            self.canopy.location(moveInWind(self.canopy.location(), self.wind.speed(), self.wind.direction(), self.canopy.speedH(), self.canopy.heading(), time));
        }
    };

    self.map = {
        center: ko.observable(),
        heading: ko.observable(),
        zoom: ko.observable(defaultMapZoom)
    };

    self.map.center.subscribe(function() {
        self.map.zoom(defaultMapZoom);
    });

    self.location = {
        _id: ko.observable().extend({ notify: 'always' }),
        coords: ko.observable(),

        custom: {
            coords: ko.observable(),
            name: ko.observable(),
            available: ko.computed(function() {
                return !!self.location.custom.coords();
            }, this, { deferEvaluation: true }),

            // This is used for persistence
            coordsJS: ko.computed({
                read: function() {
                    if (self.location.custom.coords()) {
                        return [
                            self.location.custom.coords().lat(),
                            self.location.custom.coords().lng()
                        ];
                    } else {
                        return null;
                    }
                },
                write: function(val) {
                    if (val) {
                        self.location.custom.coords(createLatLng(val));
                    } else {
                        self.location.custom.coords(null);
                    }
                },
                deferEvaluation: true
            })
        },
        id: ko.computed({
            write: function(id) {
                if (!(id in dropzones)) {
                    return;
                }

                self.location.coords(id === "custom" ? self.location.custom.coords() : createLatLng(dropzones[id]));
                self.location._id(id);
                self.map.center(self.location.coords());
            },
            read: function() { return self.location._id(); },
            deferEvaluation: true
        }).extend({ notify: 'always' }),

        name: ko.computed(function() {
            return localize(self.location.id());
        }, this, { deferEvaluation: true }),
        finderText: ko.computed(function() {
            return (self.location.id() == 'custom' ? self.location.custom.name() : '')
        }, this, { deferEvaluation: true })
    };

    self.location.id("si-sticna");

    self.reachSetAltitude = ko.computed(function() {
        return self.simulation.flying() ? self.canopy.altitude() : self.pattern.openingAltitude();
    });

    self.analytics = {
        steadyPoint: ko.computed(function() {
            if (!self.simulation.flying()) {
                return undefined;
            }
            var timeToLanding = this.altitude() / this.speedV();
            return moveInWind(this.location(), self.wind.speed(), self.wind.direction(), this.speedH(), this.heading(), timeToLanding);
        }, self.canopy, { deferEvaluation: true }),

        reachSet: ko.computed(function() {
            if (!(self.display.reachset() && self.simulation.flying())) {
                return undefined;
            }
            return computeReachSet(self.canopy.location(), self.canopy.altitude(), self.wind, true);
        }, this, { deferEvaluation: true }),
        controlSet: ko.computed(function() {
            if (!self.display.controlset()) {
                return undefined;
            }
            return computeReachSet(self.location.coords(), self.reachSetAltitude(), self.wind, false);
        }, this, { deferEvaluation: true })
    };

    self.misc = {
        tutorFinished: ko.observable(false)
    };

    self.shareLocation = {
        language: ko.observable(false),
        wind: ko.observable(false),
        pattern: ko.observable(false),
        GET: ko.computed(function() {
            return getFullPath(window.location) + generateGETForLocation();
        }, this, { deferEvaluation: true })
    };

    self.persistence = {
        // List of observables to save and load
        _list: [
            self.display.language,
            self.display.unitSystem,
            self.display.steadyPoint,
            self.display.reachset,
            self.display.controlset,
            self.display.pattern,

            self.location.custom.coordsJS,
            self.location.custom.name,
            self.location.id,

            self.pattern.openingAltitude,

            self.misc.tutorFinished
        ],
        // If _list is only appended to after the release, we don't need to
        // change _version. If _list is modified incompatibly, or we need to reset user
        // saved settings for other reasons, bump _version!
        _version: 1,

        saveOnExit: ko.observable(true),

        init: function() {
            self.persistence.load();
            $(window).on('beforeunload', function() {
                if (self.persistence.saveOnExit()) {
                    self.persistence.save();
                }
            });
        },

        save: function(what, where) {
            what = what || self.persistence._list;
            where = where || 'persistence';
            if (!localStorage) {
                return;
            }

            var saveData = what.map(function(observable) {
                return observable();
            });

            localStorage[where] = JSON.stringify(saveData);
            localStorage.version = self.persistence._version;
        },

        load: function(what, where) {
            what = what || self.persistence._list;
            where = where || 'persistence';
            if (!localStorage || localStorage.version != self.persistence._version || !localStorage[where]) {
                return;
            }

            var saveData = JSON.parse(localStorage[where]);
            for (var i = 0; i < saveData.length; i++ ) {
                what[i](saveData[i]);
            }
        },

        reset: function() {
            if (localStorage) {
                localStorage.removeItem("persistence");
                localStorage.removeItem("version");
            }
            self.persistence.saveOnExit(false);
        }
    };
}

window.sim = new SimulatorViewModel();
})();
