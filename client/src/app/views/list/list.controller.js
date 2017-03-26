/**
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file holds the definition for the list controller for the list page.
 */

(function () {
    'use strict';

    angular
        .module('app.list')
        .controller('ListController', ListController);

    ListController.$inject = [
        '$rootScope',
        '$timeout',
        'type',
        'AssetService',
        'ModalService'
    ];

    /**
     * Function for the list controller. Retrieves the data and assesses its success or fail.
     * @param $rootScope
     * @param $timeout
     * @param type
     * @param AssetService
     * @param ModalService
     * @constructor
     */
    function ListController($rootScope, $timeout, type, AssetService, ModalService) {

        var vm = this;

        vm.getData = function () {
            vm.loadingState = '';
            if (type !== 'all') {
                AssetService.getAssets(type, null).then(listSuccess, listFail); //100ms
            } else {
                AssetService.getAssets(null, null).then(listSuccess, listFail);
            }
        };
        vm.getData();

        /**
         * Function called if the promise succeeded. Simply publishes the data.
         *
         * @param data
         */
        function listSuccess(data) {
            vm.list = data;
            $timeout(function () {
                vm.loadingState = 'contentSuccess';
            }, 100);
        }

        /**
         * Function called if the promise failed.
         * Publishes the proper error modal according to the error code.
         * @param err -> The error code returned by the promise.
         */
        function listFail(err) {
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
    }

})();
