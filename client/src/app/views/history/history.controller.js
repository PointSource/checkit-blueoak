(function () {
    'use strict';

    angular
        .module('app.history')
        .controller('HistoryController', HistoryController);

    HistoryController.$inject = [
        '$timeout',
        'AssetService',
        'RecordService',
        'moment',
        '$q',
        '$rootScope',
        'ModalService'
    ];

    /**
     * @ngdoc function
     * @name HistoryController
     * @description
     * The history page controller function.
     * @constructor
     */
    function HistoryController($timeout, AssetService, RecordService, moment, $q, $rootScope, ModalService) {
        var vm = this;

        /**
         * Gathers the chronological history for all devices to be displayed.
         */
        vm.chronologicalHistory = function () {
            vm.loadingState = '';
            var historicalRecords = [];
            var assets = [];
            var chain = $q.when();

            AssetService.getAssets(null, null).then(function (data) {
                gatherRecordsForAssets(data, historicalRecords, assets, chain)
            }, getAssetsFail);
        };
        vm.chronologicalHistory();

        /** 
         * Function called if the getAssets promise succeeded.
         * Gets the records for each asset and sorts them chronologically.
         * @param {Array} data the data returned by the promise
         * @param {Array} historicalRecords array to store the historical asset records
         * @param {Array} assets array that stores the assets returned by the promise
         * @param {Promise} chain variable to chain the RecordService function calls
         */
        function gatherRecordsForAssets(data, historicalRecords, assets, chain) {
            for (var i = 0; i < data.length; i++) {
                assets.push(data[i]);
                chain = chain.then(getChronologicalRecords.bind(null, assets, i, historicalRecords));
            }

            chain = chain.then(function () {
                if (historicalRecords.length === 0) {
                    vm.loadingState = 'contentEmpty';
                } else {
                    historicalRecords.sort(sortByCreatedTime);

                    vm.sortedHistoricalRecords = historicalRecords;
                    $timeout(function () {
                        vm.loadingState = 'contentSuccess';
                    }, 100);
                }
            });
        }

        /**
         * Function called if the getAssets promise failed.
         * Publishes the proper error modal according to the error code.
         * @param {Object} err the error code returned by the promise
         */
        function getAssetsFail(err) {
            switch (err.status) {
                case 400:
                    //error while getting list of assets
                    $rootScope.back();
                    $rootScope.errorModalText(err);
                    ModalService.get('errorModal').open();
                    break;
                case 404:
                    //no assets found, show list as empty
                    vm.loadingState = 'contentEmpty';
                    break;
                case 500:
                    //server error
                    vm.loadingState = 'networkError';
                    break;
                default:
                    vm.loadingState = 'networkError';
                    break;
            }
        }

        /** 
         * Gets the chronological records for an asset.
         * @param {Array} assets array storing all assets from getAssets function call
         * @param {Integer} index points to the current index of the asset array to use for the getRecords function
         * @param {Array} historicalRecords array to store the historical asset records
         * @return {Array} all records within the past 3 months for the asset
         */
        function getChronologicalRecords(assets, index, historicalRecords) {
            // console.log(assets);
            return RecordService.getRecords(assets[index].id).then(function (recordData) {
                var three_months_ago = moment().milliseconds(0).seconds(0).minutes(0).hours(0).subtract(3, 'months');
                vm.historyStartDate = three_months_ago.clone().format('MM/DD/YYYY');
                vm.historyEndDate = moment().format('MM/DD/YYYY');

                for (var j = 0; j < recordData.records.length; j++) {
                    if (moment(recordData.records[j].created).isAfter(three_months_ago)) {
                        // Create a detailRecord to store the record fields and the asset id together
                        var detailRecord = {
                            'recordInfo': recordData.records[j],
                            'assetName': assets[index].name
                        };
                        historicalRecords.push(detailRecord);
                    }
                }

            }, function (err) {
                switch (err.status) {
                    case 400:
                        //error while getting list of records
                        $rootScope.back();
                        $rootScope.errorModalText(err);
                        ModalService.get('errorModal').open();
                        break;
                    case 404:
                        //no records found, show list as empty
                        vm.loadingState = 'contentEmpty';
                        break;
                    case 500:
                        //server error
                        vm.loadingState = 'networkError';
                        break;
                    default:
                        vm.loadingState = 'networkError';
                        break;
                }
            });
        }

        /**
         * Sorts two asset records based on the created date for the record.
         * @param {Object} a the first record to compare
         * @param {Object} b the second record to compare
         * @return {Integer} 0 if record create date is identical, 1 if record a is after record b, -1 if record a is
         * before record b
         */
        function sortByCreatedTime(a, b) {
            if (moment(a.recordInfo.created).isSame(b.recordInfo.created)) {
                return 0;
            } else if (moment(a.recordInfo.created).isBefore(b.recordInfo.created)) {
                return 1;
            } else {
                return -1;
            }
        }

        /**
         * Formats the date that appears in a record
         * @param {Object} date the date to format
         */
        vm.formatDate = function (date) {
            var formatted = moment(date);
            return formatted.format('MMM D, YYYY');
        };
    }
})();
