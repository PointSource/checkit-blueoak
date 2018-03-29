/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file defines the service for authorizing with google
 */

/*jshint camelcase: false */
(function() {
    'use strict';

    angular
        .module('app.auth')
        .factory('AuthService', AuthService);

    AuthService.$inject = [
        '$q',
        '$rootScope',
        'GoogleService',
        'UtilService',
        '$http',
        'appConfig',
        'UserService',
        'ValidationService',
        'GoogleUserService'
    ];

    /**
     * Sets up the authorization service. Returns the functions that the service provides.
     * @param $q
     * @param $rootScope
     * @param GoogleService
     * @param UtilService
     * @param $http
     * @param appConfig
     * @param UserService
     * @param ValidationService
     * @returns {*} -> The functions required for the authorization service
     * @constructor
     */
    function AuthService($q, $rootScope, GoogleService, UtilService,
        $http, appConfig, UserService, ValidationService, GoogleUserService) {

        /**
         * Remaps the CheckIT user database to match the Google Directory schema.
         * Email becomes primaryEmail, name.last becomes name.familyName,
         * name.first becomes name.givenName, and a fullName field is added to name.
         * @param  {object} json The user data
         * @return {object} the remapped data
         */
        function _remapCheckITUserData(json){
            var users = [];
            json.forEach(function(user) {
                //Add fullName field
                user.name.fullName = user.name.first + ' ' + user.name.last;
                //Edit other field names
                user.primaryEmail = user.email;
                delete user.email;
                user.name.familyName = user.name.last;
                delete user.name.last;
                user.name.givenName = user.name.first;
                delete user.name.first;
                users.push(user);
            });
            var data = {
                users: users
            };
            return data;
        }

        /**
         * Retrieves employee info using the GoogleUserService.
         * @return {object} promsise
         */
        var _getEmployeeData = function() {
            var q = $q.defer();

			// Option to either use direct Google service or legacy server passthrough
            //GoogleUserService.getGoogleUserDirectory()
			GoogleUserService.getUserDirectory()
				.then(function(data){
                    q.resolve(data);
                },function(err){ //If the Google Directory call fails, fallback to the CheckIT database
                    UserService.getUsers().then(function(data){
                        UtilService.logError('signin', 'SigninController', 'Error using Google Direcotry API: ' +
                            err + 'Defaulting to CheckIT database...');
                        var remappedData = _remapCheckITUserData(data);
                        q.resolve(remappedData);
                    }, function(err){
                        UtilService.logError('signin', 'SigninController', 'Google Users error: ' + err);
                        q.defer(err);
                    });
                });
            return q.promise;
        };

        /**
         * Callback function that is called on a successful login
         * @param idToken -> The google auth token
         */
        var _loginSuccess = function(idToken) {
            var deferred = $q.defer();
            // Pass code to the server for exchange
            var request = {
                method: 'POST',
                url: appConfig.apiHost + 'api/v1/auth/login',
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'idToken': idToken
                }
            };

            $http(request)
                .success(function(data) {
                    UtilService.logInfo('auth', 'AuthService', 'Successful google authentication');
                    //set the current users ObjectId in session
                    UserService.setUserData(data);
                    if (UserService.getUserRole() === 1) {
                        _getEmployeeData(data).then(function(result){
                            if (!result.nextPageToken) {
                                GoogleUserService.setUserDirectoryData(result);
                            }
                            deferred.resolve();
                        },function(){
                            deferred.resolve();
                        });
                    } else {
                         deferred.resolve();
                    }
                })
                .error(function(err, status) {
                    UtilService.logError('auth', 'AuthService',
                        'Error authenticating with google: ' + err);
                    if (status === 401) {
                        GoogleService.disconnect().then(function() {
                            deferred.reject(status);
                        }, function(err) {
                            deferred.reject(status + err);
                        });
                    } else {
                        deferred.reject(status);
                    }

                });
            return deferred.promise;
        };

        /**
         * Sets isAuthenticated into session storage
         * @param isAuthenticated
         */
        function setIsAuthenticated(isAuthenticated) {
            sessionStorage.setItem('isAuthenticated', isAuthenticated);
        }

        /**
         * Returns the isAuthenticated value from session storage
         * @returns string value - 'true' or 'false'
         */
        function getIsAuthenticated() {
            return sessionStorage.getItem('isAuthenticated');
        }

        return {

            /**
             * Returns whether or not the isAuthenticated object in session storage is true.
             * Returns whether or not the user is authenticated.
             * @returns {boolean}
             */
            isAuthenticated: function() {
                return (getIsAuthenticated() === 'true');
            },

            /**
             * initializes all auth providers as necessary
             */
            init: function() {
                var q = $q.defer();

                //startgoogle
                GoogleService.init().then(function(msg) {
                    q.resolve(msg);
                });
                //endgoogle

                //TODO future: init custom, facebook, twitter, etc.

                return q.promise;
            },

            /**
             * Logs in through Google Plus Service
             * @param {string} method Used to determine which authentication process to use
             * @returns {*}
             */
            login: function(method) {
                var deferred = $q.defer();

                //startgoogle
                if (method === 'google') {
                    GoogleService.login(appConfig.apiKeys).then(function(authResult) {
                            _loginSuccess(authResult.idToken).then(function() {
                                GoogleUserService.setAccessToken(authResult.accessToken);
                                deferred.resolve(authResult);
                                setIsAuthenticated(true);
                            }, function(err) {
                                deferred.reject(err);
                            });
                        },
                        function(err) {
                            setIsAuthenticated(false);
                            deferred.reject(err);
                        }
                    );
                }
                //endgoogle

                return deferred.promise;

            },

            /**
             * Checks to see if the user has already logged in previously, and returns a promise based on that
             * criteria.
             * @returns {*}
             */
            silentLogin: function() {
                var deferred = $q.defer();

                GoogleService.silentLogin(appConfig.apiKeys).then(function(authResult) {
                    _loginSuccess(authResult.idToken).then(function() {
                        GoogleUserService.setAccessToken(authResult.accessToken);
                        setIsAuthenticated(true);
                        deferred.resolve(authResult);
                    }, function(err) {
                        $rootScope.$broadcast('not signed in');
                        setIsAuthenticated(false);
                        deferred.reject(err);
                    });
                }, function(err) {
                    $rootScope.$broadcast('not signed in');
                    deferred.reject(err);
                });

                return deferred.promise;
            },

            /**
             * Logs the user out of the app by calling Google logout and clearing session storage.
             * @returns {*}
             */
            logout: function() {
                ValidationService.clearValidation(); //clears asset validation
                GoogleUserService.setAccessToken('');

                var defer = $q.defer();
                var request = {
                    method: 'DELETE',
                    url: appConfig.apiHost + 'api/v1/auth/logout'
                };

                GoogleService.disconnect()
                    .then(function(msg) {
                        $http(request).success(
                            function(data, status) {
                                UtilService.logInfo('auth', 'AuthService', 'Google logout success. ' + msg);
                                setIsAuthenticated(false);
                                UserService.removeUserData();
                                defer.resolve(status);
                            }).error(
                            function(error) {
                                UtilService.logError('auth', 'AuthService', 'Google logout unsuccessful. ' + msg);
                                setIsAuthenticated(false);
                                defer.reject(error);
                            });
                    });

                return defer.promise;
            }
        };
    }
})();
