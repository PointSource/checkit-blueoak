/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the service for communicating with the asset API endpoints
 */

(function() {
    'use strict';

    angular
        .module('app.services')
        .service('AssetService', AssetService);

    AssetService.$inject = [
        '$q',
        '$rootScope',
        'appConfig',
        '$http',
        '$window',
        'UtilService',
        'UserService',
        'Upload',
        'moment'
    ];

    /**
     * @ngdoc service
     * @name AssetService
     * @description
     * Defines the AssetService
     * @param {object} $q
     * @param {object} $rootScope
     * @param {object} appConfig Contains configuration information for REST calls.
     * @param {object} $http
     * @param {object} $window
     * @param {object} UtilService Separate service that formats an assets status
     * @param {object} UserService Used to refresh the reservations list
     * @param {object} moment
     * @returns {object} object is {getAssets: Function, checkoutAsset: Function, checkinAsset: Function}
     * @constructor
     */
    function AssetService($q, $rootScope, appConfig, $http, $window, UtilService, UserService, Upload, moment) {
        var assetUrl = 'api/v1/assets';

        /**
         * Calls setBorrowerName and formatDueDate on a single asset.
         * @param data
         * @private
         */
        function _modSingleAsset(data) {
            var j;

            // set the borrower name
            _setBorrowerName(data);
            //format dates for active reservations
            for (j = 0; j < data['active_reservations'].length; j++) {

                data.state =
                    UtilService.formatDueDate('Due ', data['active_reservations'][j].end);
            }
        }

        /**
         * Calls setBorrowerName and formatDueDate on a set of assets.
         * @param data
         * @private
         */
        function _modAssetSet(data) {
            var i, j;

            // Pass assets/dates one at a time to setBorrowerName and formatDueDate
            for (i = 0; i < data.length; i++) {
                _setBorrowerName(data[i]);

                for (j = 0; j < data[i]['active_reservations'].length; j++) {
                    data[i]['active_reservations'][j].end =
                        UtilService.formatDueDate('', data[i]['active_reservations'][j].end);
                }
            }
        }

        /**
         * Sets the borrower name of the asset. If current user has asset, then changes name to 'You.' Else, does not
         * modify.
         * @param asset -> asset object to examine.
         * @private
         */
        function _setBorrowerName(asset) {
            var userEmail = UserService.getUserEmail(); //userId as recorded from login success
            
            // Check active reservations in asset
            for (var i = 0; i < asset['active_reservations'].length; i++) {
                // The asset is yours if the borrower email of the active_reservation matches email
                if (userEmail === asset['active_reservations'][i].borrower.email) {
                    asset['active_reservations'][i].borrower.name.first = 'You';
                    asset['active_reservations'][i].borrower.name.last = '';
                }
            }
        }

        /**
         * Depending on the url this function either updates an existing asset or adds a new one
         */
        function _putAsset(newData, url) {
            var defer = $q.defer();
            var request = {
                method: 'POST',
                url: url,
                withCredentials: true,
                data: newData
            };

            //check if the image is a Blob object
            if (newData.image instanceof Blob) {

                //Convert image to base64 for storing on MongoDB
                //This fetches the image from the blobURL
                Upload.base64DataUrl(newData.image).then(function(dataUrl) {

                    //base64 encoding the image
                    request.data.image = dataUrl;

                    // Make request
                    $http(request)
                        .success(function(data) {
                            // POST successful
                            defer.resolve(data);
                        })
                        .error(function(err, status) {
                            //POST unsuccessful
                            defer.reject(err + status);
                        });
                });
            } else {
                $http(request)
                    .success(function(data) {
                        /* TODO
                        $rootScope.$broadcast('ci:Update Reservations');*/
                        defer.resolve(data);
                    })
                    .error(function(err, status) {
                        //POST unsuccessful
                        defer.reject(err + status);
                    });
            }
            return defer.promise;

        }

        return {
            /**
             * GETs either (Case 1) a single assets details, (Case 2) a list of assets of a specified type (with
             * condensed asset details), (Case 3) or the set of all assets (also with condensed asset details).
             *
             * For Case 3: both type and targetId are null.
             *
             * @param type -> the category of assets to return (If defined, Case 2; else Case 1 or 3)
             * @param targetId -> the id of the asset to return (If defined, Case 1; else Case 2 or 3)
             * @returns {*} -> Promise object whose data is a set of asset objects or a single asset object
             */
            getAssets: function(type, targetId) {
                var defer = $q.defer(); //initialize promise defer

                //Configure request
                var url; // url of endpoint

                if (type) {
                    if (type === 'checkedout') {
                        url = appConfig.apiHost + assetUrl + '?filter=status&type=in_use';
                        // err = 'Error getting assets by specified type: ';
                    } else {
                        url = appConfig.apiHost + assetUrl + '?filter=categories.type&type=' + type;
                        // err = 'Error getting assets by specified type: ';
                    }
                } else if (targetId) {
                    url = appConfig.apiHost + assetUrl + '/' + targetId;
                    // err = 'Error getting asset details: ';
                } else {
                    url = appConfig.apiHost + assetUrl;
                    // err = 'Error getting all assets: ';
                }

                var request = {
                    method: 'GET',
                    withCredentials: true,
                    url: url
                }; //request object

                //Make request
                $http(request)
                    .success(function(data) {

                        //GET successful
                        UtilService.logInfo('services', 'AssetService', 'getAssets successful');

                        if (targetId) {
                            // Single Asset returned; set borrower name and format status
                            _modSingleAsset(data);
                        } else {
                            // Array of assets returned
                            _modAssetSet(data);
                        }

                        defer.resolve(data);
                    })
                    .error(function(data, status) {
                        //GET unsuccessful
                        var err = {
                            data: data,
                            status: status
                        };
                        if (status === 404) {
                            err.data = 'No assets found under this category. ';
                        }

                        UtilService.logError('services', 'AssetService', err.data + status);
                        defer.reject(err);
                    });

                return defer.promise;
            },

            /**
             * Checks out asset associated with the assetID until the specified return date.
             * @param assetID -> id of the asset involved
             * @param returnDate -> date chosen to return the asset by
             * @returns {*} -> Promise object whose data is the udpated asset details
             */
            checkoutAsset: function(assetID, returnDate) {
                var defer = $q.defer(); //initialize promise defer

                var request = {
                    method: 'POST',
                    url: appConfig.apiHost + 'api/v1/assets/checkout',
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        assetID: assetID,
                        'return_date': moment(returnDate).utc()
                            .milliseconds(999)
                            .seconds(59)
                            .minutes(59)
                            .hours(23)
                            .toISOString()
                    }
                };

                //Make request
                $http(request)
                    .success(function(data, status) {
                        //POST successful
                        UtilService.logInfo('services', 'AssetService', 'Checkout successful');
                        // set borrower name and format status
                        _modSingleAsset(data);

                        // Set up return object
                        var ret = {};
                        ret.data = data;
                        ret.status = status;

                        if (status === 200) {

                            //Successfully checked out for current user
                            defer.resolve(ret);
                            //Notify menu controller that it's data is stale
                            $rootScope.$broadcast('ci:Update Reservations');

                        } else if (status === 202) {
                            defer.resolve(ret);
                        }

                    })
                    .error(function(data, status) {
                        //POST unsuccessful
                        UtilService.logError('services', 'AssetService', status);

                        defer.reject(data);
                    });

                //return the updated asset object
                return defer.promise;
            },

            /**
             * Checks out asset for a specific user associated with the assetID until the 
             * specified return date.
             * @param  {string} assetID    The unique ID for the asset
             * @param  {date} returnDate   The date the asset needs to be checked back in
             * @param  {Object} userInfo   Object that includes the user's first and last 
             *                             name and their primary email.
             * @return {*}                 Promise object whose data is the udpated asset details
             */
            checkoutAssetForUser: function(assetID, returnDate, userInfo) {
                var defer = $q.defer(); //initialize promise defer
                var err = 'Error checking out asset ' + assetID + ': '; //error message on unsuccessful

                var request = {
                    method: 'POST',
                    url: appConfig.apiHost + 'api/v1/admin/assets/checkout',
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        assetID: assetID,
                        'return_date': moment(returnDate).utc()
                            .milliseconds(999)
                            .seconds(59)
                            .minutes(59)
                            .hours(23)
                            .toISOString(),
                        'userInfo' : userInfo
                    }
                };
                $http(request)
                    .success(function(data, status) {
                        //POST successful
                        UtilService.logInfo('services', 'AssetService', 'Checkout successful');
                        // set borrower name and format status
                        _modSingleAsset(data);

                        // Set up return object
                        var ret = {};
                        ret.data = data;
                        ret.status = status;

                        if (status === 200) {

                            //Successfully checked out for current user
                            $rootScope.$broadcast('ci:Update Reservations');
                            defer.resolve(ret);

                        } else if (status === 202) {
                            defer.resolve(ret);
                        }

                    })
                    .error(function(data, status) {
                        //POST unsuccessful
                        UtilService.logError('services', 'AssetService', err + status);

                        defer.reject(data);
                    });

                return defer.promise;
            },
            /**
             * Checks in asset associated with the assetID and recordID
             * @param assetID -> id of the asset involved
             * @returns {*} -> Promise object whose data is the updated asset details
             */
            checkinAsset: function(assetID) {
                var defer = $q.defer(); //initialize promise defer

                var request = {
                    method: 'POST',
                    url: appConfig.apiHost + 'api/v1/assets/checkin',
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        assetID: assetID
                    }
                };

                //Make request
                $http(request)
                    .success(function(data) {

                        //POST successful
                        UtilService.logInfo('services', 'AssetService', 'Check-in successful');

                        //Notify menu controller that it's data is stale
                        $rootScope.$broadcast('ci:Update Reservations');

                        // set borrower name and format status
                        _modSingleAsset(data);
                        defer.resolve(data);

                    })
                    .error(function(data, status) {
                        //POST unsuccessful
                        UtilService.logError('services', 'AssetService', status);

                        defer.reject(data);
                    });

                //return the updated asset object
                return defer.promise;
            },
            /**
             * Checks in asset associated with the assetID and recordID
             * @param assetID -> id of the asset involved
             * @returns {*} -> Promise object whose data is the updated asset details
             */
            checkinAssetForUser: function(assetID, userInfo) {
                var defer = $q.defer(); //initialize promise defer

                var request = {
                    method: 'POST',
                    url: appConfig.apiHost + 'api/v1/admin/assets/checkin',
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        assetID: assetID,
                        userInfo: userInfo
                    }
                };

                //Make request
                $http(request)
                    .success(function(data) {

                        //POST successful
                        UtilService.logInfo('services', 'AssetService', 'Check-in successful');

                        //Notify menu controller that it's data is stale
                        $rootScope.$broadcast('ci:Update Reservations');

                        // set borrower name and format status
                        _modSingleAsset(data);
                        defer.resolve(data);

                    })
                    .error(function(data, status) {
                        //POST unsuccessful
                        UtilService.logError('services', 'AssetService', status);

                        defer.reject(data);
                    });

                //return the updated asset object
                return defer.promise;
            },
            /**
             * Deletes the asset from the database. This function should only be called from an admin
             * @param assetID the asset being deleted
             */
            deleteAsset: function(assetID) {
                var defer = $q.defer(); // initialize promise

                var url = appConfig.apiHost + 'api/v1/admin/assets/' + assetID; // url of endpoint

                var request = {
                    method: 'DELETE',
                    withCredentials: true,
                    url: url
                }; //request object

                //Make request
                $http(request)
                    .success(function(data) {
                        //DELETE successful
                        UtilService.logInfo('services', 'AssetService', 'deleteAsset successful');

                        defer.resolve(data);
                    })
                    .error(function(data, status) {
                        //DELETE unsuccessful
                        UtilService.logError('services', 'AssetService', status);
                        defer.reject(data);
                    });

                return defer.promise;
            },

            /**
             * Updates the object from the database. This function should only be called from an admin
             * @param newDetails the new details of the object //TODO think of a better name
             * @param assetID the ID of the asset being updated
             */
            updateAsset: function(newDetails, assetID) {

                var defer = $q.defer();
                var url = appConfig.apiHost + 'api/v1/admin/assets/' + assetID;

                _putAsset(newDetails, url).then(function(data) {
                    UtilService.logInfo('services', 'AssetService', 'editAsset successful');
                    $rootScope.$broadcast('ci:Update Reservations');
                    defer.resolve(data);
                }, function(err) {
                    UtilService.logError('services', 'AssetService', err);
                    defer.reject(err);
                });
                return defer.promise;
            },

            addAsset: function(newDetails) {
                var defer = $q.defer();

                var url = appConfig.apiHost + 'api/v1/admin/assets/';

                _putAsset(newDetails, url).then(function(data) {
                    UtilService.logInfo('services', 'AssetService', 'editAsset successful');
                    $rootScope.$broadcast('ci:Update Reservations');
                    defer.resolve(data);
                }, function(err) {
                    UtilService.logError('services', 'AssetService', err);
                    defer.reject(err);
                });
                return defer.promise;
            }
        };
    }
})();
