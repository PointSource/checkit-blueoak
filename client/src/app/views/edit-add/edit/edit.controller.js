/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file defines the controller for the editing page.
 */
(function() {
    angular
        .module('app.edit')
        .controller('EditController', EditController);

    EditController.$inject = [
        '$rootScope',
        '$timeout',
        '$document',
        'assetId',
        'AssetService',
        'Foundation',
        'UtilService'
    ];

    /**
     * The edit page controller function. Calls the getAssets function to load the data, then sets
     * That data to editable fields for the admin.
     * @param $rootScope
     * @param assetId - the ID of the asset being edited. "" for a new asset.
     * @param AssetService - used to retrieve asset from the database
     * @param Foundation - used for error modals
     * @param UtilService
     * @constructor
     */
    function EditController($rootScope, $timeout, $document, assetId, AssetService, Foundation, UtilService) {
        var vm = this;
        var errorModal;
        vm.deviceData = {};

        $timeout(function() {
            //DOM has finished rendering
            errorModal = new Foundation.Reveal($document.find('#errorModal'));
        });

        /**
         * Retrieves the asset data from the server
         * @private
         */
        vm.getData = function() {
            // Show loading screen while data is being retrieved
            vm.loadingState = '';
            AssetService.getAssets(null, assetId).then(retrieveSuccess, retrieveFail);
            vm.header = 'Database ID: ' + assetId;

        }(); //call automatically on load

        /**
         * Callback function called when the getData function succeeds at retrieving the asset data
         * @private
         */
        function retrieveSuccess(data) {
            vm.deviceData = data;
            vm.loadingState = 'contentSuccess';
        }

        /**
         * Callback function called when the getData function fails at retrieving the asset data.
         * Opens the respective modal associated with the error.
         * @private
         */
        function retrieveFail(err) {
            switch (err.status) {
                case 400:
                    //error while getting asset
                    $rootScope.back();
                    $rootScope.errorModalText(err);
                    errorModal.open();
                    break;
                case 404:
                    //no assets found
                    $rootScope.back();
                    $rootScope.errorModalText(err);
                    errorModal.open();
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
         * This function is called when the save button is pressed on the UI.
         * Updates an asset's details with the user's changes.
         * Once updated, it returns to that asset's details page
         */
        vm.editAsset = function() {
            vm.loadingState = '';
            AssetService.updateAsset(vm.deviceData, vm.deviceData.id)
                .then(function(data) {
                    //vm.loadingState = 'contentSuccess';
                    vm.deviceData = data;
                    $rootScope.back();
                }, function(err) {
                    //vm.loadingState = 'networkError';
                    UtilService.logError('edit', 'editController', 'failed to save edit: ' + err);
                    $rootScope.back();
                });
        };
    }
})();
