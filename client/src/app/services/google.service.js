/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the service for communicating with the record API endpoints
 */

(function() {
    'use strict';

    angular
        .module('app.services')
        .service('GoogleUserService', GoogleUserService);

    GoogleUserService.$inject = [
        '$q',
        'appConfig',
        '$http',
        'UtilService'
    ];

    /**
     * @ngdoc service
     * @name GoogleUserService
     * @description
     * Function which defines the record service
     *
     * @param $q
     * @param appConfig -> to get the api host url
     * @param $http
     * @param UtilService -> for formatted debug logging
     *
     */
    function GoogleUserService($q, appConfig, $http, UtilService) {
        return {

            /**
             * Makes an HTTP call to the server and GETs a list of records
             * @param assetId
             * @returns {*}
             */
            getUserDirectory: function() {
                var defer,
                    request;

                defer = $q.defer();

                request = {
                    method: 'GET',
                    withCredentials: true,
                    url: appConfig.apiHost + 'api/v1/admin/users/googleDirectory'
                };

                $http(request)
                    .success(function(data) {
                        //GET is successful
                        UtilService.logInfo('services', 'GoogleUserService', 'getUserDirectory successful');

                        defer.resolve(data);
                    })
                    .error(function(data, status) {
                        // GET is unsuccessful
                        UtilService.logError('services', 'GoogleUserService',  status);
                        defer.reject(data);
                    });
                return defer.promise;
            },
            /**
             * [setUserDirectoryData description]
             * @param {[type]} data [description]
             */
            setUserDirectoryData: function(data) {
                sessionStorage.setItem('userDirectory', angular.toJson(data.users));
            },
            /**
             * [getUserDirectoryData description]
             * @return {[type]}      [description]
             */
            getUserDirectoryData: function() {
                return angular.fromJson(sessionStorage.getItem('userDirectory'));
            }
        };
    }
})();
