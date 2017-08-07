/**
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file defines the device history directive
 */

(function() {
    'use strict';

    angular
        .module('app.details')
        .directive('deviceHistory', DeviceHistoryDirective);

    DeviceHistoryDirective.$inject = [];

     /**
     * @ngdoc directive
     * @name DeviceHistoryDirective
     * @description
     * Function returning the device-history directive set up.
     * @returns {*} -> directive object as defined by AngularJS (https://docs.angularjs.org/guide/directive)
     *
     */
    function DeviceHistoryDirective() {

        return {
            restrict: 'E',
            replace: false,
            controllerAs: 'historyCtrl',
            controller: DeviceHistoryController,
            bindToController: {
                deviceId: '='
            },
            templateUrl: 'app/views/details/details.directives/device-history/device-history.template.html'
        };
    }

    DeviceHistoryController.$inject = [
        'moment',
        '$timeout',
        '$location',
        '$anchorScroll',
        'RecordService',
        'UtilService'
    ];

    /**
     * @ngdoc function
     * @description
     * Controls the deviceHistory directive
     * @param moment
     * @param $timeout
     * @param $location
     * @param $anchorScroll
     * @param RecordService
     * @param UtilService
     * @constructor
     */
    function DeviceHistoryController(moment, $timeout, $location, $anchorScroll, RecordService,UtilService) {
        var historyCtrl = this;
        // Basic variables for the switch
        historyCtrl.showHistory = false;
        historyCtrl.historyMessage = 'Click to show history';

        // Switch boolean and update message
        /**
         * Expands the history dropdown and uses $anchorScroll to scroll down the list
         */
        historyCtrl.expandHistory = function() {
            _updateRecords();
            historyCtrl.showHistory = !historyCtrl.showHistory;
            historyCtrl.historyMessage = historyCtrl.showHistory ? 'Click to hide history' : 'Click to show history';

            $anchorScroll.yOffset = 10;
            $timeout(function() {
                $location.hash('anchorid');
                $location.replace();
                $anchorScroll();
            });
        };

        /**
         * Formats the date that appears in a record
         * @param date -- the date to format
         */
        historyCtrl.formatDate = function(date) {
            var formatted = moment(date);
            return formatted.format('MMM D, YYYY');
        };

        /**
         * Private function for GETing the device's record
         */
        function _updateRecords() {
            RecordService.getRecords(historyCtrl.deviceId).then(_recordsSuccess, _recordsFail);
        }

        /**
         * Private callback function called when the _updateRecords function returns successful
         */
        function _recordsSuccess(data) {

            historyCtrl.records = data.records;
            historyCtrl.loadingState = 'contentSuccess';

        }

        /**
         * Private callback function called when the _updateRecords function returns a failure
         */
        function _recordsFail(err) {
            UtilService.logError('details', 'devicehistory', err.message + err.status);
            switch (err.status) {
                case 404:
                    //no records found, show list as empty
                    historyCtrl.loadingState = 'contentEmpty';
                    break;
                case 500:
                    //server error
                    historyCtrl.loadingState = 'networkError';
                    break;
                default:
                    historyCtrl.loadingState = 'networkError';
                    break;
            }
        }
    }
})();
