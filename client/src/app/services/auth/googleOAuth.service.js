/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the functions/protocols for Google Sign In on the Web and on Devices (iOS/Android)
 */

(function() {
    'use strict';

    angular
        .module('app.auth')
        .service('GoogleService', GoogleService);

    GoogleService.$inject = [
        'appConfig',
        '$window',
        '$log',
        '$q'
    ];

    /**
     * Methods for authenticating a user with Google.
     *
     * Adapted from ngCordova, which uses cordova-plugin-googleplus, to include methods for Web only auth
     * install: cordova plugin add https://github.com/EddyVerbruggen/cordova-plugin-googleplus.git
     * link:    https://github.com/EddyVerbruggen/cordova-plugin-googleplus
     *
     * @param appConfig
     * @param $window
     * @param $log
     * @param $q
     * @returns {{init: init, login: login, disconnect: disconnect, silentLogin: silentLogin}}
     */
    function GoogleService(appConfig, $window, $log, $q) {
        var _this = this;
        _this.onDevice = true; //default to true

        function buildObject(user) {
            /*jshint camelcase: false */

            var userAuth = user.getAuthResponse();
            var userProf = user.getBasicProfile();

            return {
                accessToken: userAuth.access_token,
                displayName: userProf.getName(),
                email: userProf.getEmail(),
                idToken: userAuth.id_token,
                imageUrl: userProf.getImageUrl(),
                oauthToken: '', //no oauthToken will be received
                refreshToken: '', //no refreshToken received right now
                userId: userProf.getId()
            };
        }

        return {
            /**
             * Initializes google auth for web based applications
             */
            init: function() {
                /*jshint camelcase: false */
                var q = $q.defer();

                if ($window.cordova || $window.Cordova) {
                    q.resolve('On Device');
                } else {
                    _this.onDevice = false;


                    gapi.load('auth2', function() {
                        _this.auth = gapi.auth2.init({
                            client_id: appConfig.googleClientId,
                            scope: appConfig.googleScopes
                        });

                        _this.auth.then(function() {
                            q.resolve('success');
                        }, function(err) {
                            $log.log(err);
                            q.reject('failed to initialize');
                        });
                    });
                }

                return q.promise;
            },

            /**
             * Logs user in with Google
             * @returns Promise on success/fail
             */
            login: function() {
                var q = $q.defer();

                if (_this.onDevice) {
                    $window.plugins.googleplus.login({ webClientId: appConfig.googleClientId },
                        function(response) {
                            q.resolve(response);
                        },
                        function(error) {
                            q.reject(error);
                        });
                } else {
                    _this.auth.signIn().then(
                        function() {
                            q.resolve(buildObject(gapi.auth2.getAuthInstance().currentUser.get()));
                        },
                        function(err) {
                            q.reject(err);
                        }
                    );
                }

                return q.promise;
            },

            /**
             * disconnects user with Google
             * @returns {*}
             */
            disconnect: function() {
                var q = $q.defer();

                if (_this.onDevice) {
                    $window.plugins.googleplus.disconnect(function(response) {
                        q.resolve(response);
                    });
                } else {
                    _this.auth.disconnect().then(function() {
                        $log.log('disconnected');
                        q.resolve();
                    });
                }

                return q.promise;
            },

            /**
             * Silently tries to logon using Google
             */
            silentLogin: function() {
                var q = $q.defer();

                if (_this.onDevice) {
                    $log.log('Device Ready');
                    $window.plugins.googleplus.trySilentLogin({
                            webClientId: appConfig.googleClientId
                        },
                        function(response) {
                            q.resolve(response);
                        },
                        function(error) {
                            q.reject(error);
                        });
                } else {
                    //TODO Web version persistence
                    if (_this.auth.isSignedIn.get()) {
                        $log.log('Signed in');
                        q.resolve(buildObject(_this.auth.currentUser.get()));
                    } else {
                        q.reject('Not signed in');
                    }
                }
                //Can you do this with web? probably with the _this.auth.isSignedOn() method.

                return q.promise;
            }
        };
    }
})();
