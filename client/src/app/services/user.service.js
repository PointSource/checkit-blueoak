/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the service for communicating with the user API endpoints
 */

(function() {
    'use strict';

    angular
        .module('app.services')
        .service('UserService', UserService);

    UserService.$inject = [
        '$q',
        '$rootScope',
        'appConfig',
        '$http',
        'UtilService'
    ];

    /**
     * Function defining UserService
     * @param $q
     * @param $rootScope
     * @param appConfig -> Contains configuration information for REST calls.
     * @param $http
     * @param UtilService -> service used to format the status of an asset.
     * @returns {{getReservations: Function}}
     * @constructor
     */
    function UserService($q, $rootScope, appConfig, $http, UtilService) {
        return {
            /**
             * Gets and returns a promise for the set of the current users active reservations.
             * @returns {*} -> Promise object whose data is the users active reservations
             */
            getReservations: function() {
                var count, //The count of overdue items
                    i, //iterating var
                    defer, //promise
                    request; //http request object

                count = 0; //init to 0
                defer = $q.defer(); //initialize promise defer

                //Configure request
                request = {
                    method: 'GET',
                    withCredentials: true,
                    url: appConfig.apiHost + 'api/v1/users/me/reservations'
                };

                //Make the request
                $http(request)
                    .success(function(data) {
                        //GET Successful
                        UtilService.logInfo('services', 'UserService', 'get user reservations sucessful');
                        for (i = 0; i < data.length; i++) {

                            if ((data[i].end = UtilService.formatDueDate('Due ', data[i].end)) === 'OVERDUE') {
                                count++;
                            }
                        }

                        $rootScope.$broadcast('overdue assets', count);

                        //finish promise
                        defer.resolve(data);
                    })
                    .error(
                        function(data, status) {
                            //GET unsuccessful
                            var err = {
                                data: data,
                                status: status
                            };
                            UtilService.logError('services', 'UserService', err.data + status);
                            defer.reject(err);
                        });



                return defer.promise;
            },
            /**
             * Returns the ObjectId associated with the current user.
             * @returns ObjectId.
             */
            getUserId: function() {
                return angular.fromJson(sessionStorage.getItem('userData')).userId;
            },
            /**
             * Sets the ObjectId associated with the current user.
             */
            setUserData: function(data) {
                sessionStorage.setItem('userData', angular.toJson(data));
            },
            /**
             * Removes the userId from sessionStorage.
             */
            removeUserData: function() {
                sessionStorage.removeItem('userData');
            },
            /**
             * Returns the UserRole associated with the current user.
             * @returns ObjectId.
             */
            getUserRole: function() {
                return angular.fromJson(sessionStorage.getItem('userData')).userRole;
            }
        };

    }
})();
