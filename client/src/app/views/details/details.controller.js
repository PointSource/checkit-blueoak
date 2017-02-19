/**
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file holds the definition for the Details page controller.
 */

(function() {
    'use strict';

    angular
        .module('app.details')
        .controller('DetailsController', DetailsController);

    DetailsController.$inject = [
        '$rootScope',
        '$filter',
        'UtilService',
        'assetId',
        'AssetService',
        'UserService',
        'ValidationService',
        '$cordovaBarcodeScanner',
        '$document',
        '$timeout',
        'ModalService',
        'moment'
    ];

    /**
     * @ngdoc function
     * @name DetailsController
     * @description
     * The details page controller function. Calls the getAssets function from AssetService to get the details about
     * the requested asset (by assetId).
     * @param $rootScope
     * @param $filter
     * @param UtilService
     * @param assetId -> id of the asset to get details for
     * @param AssetService -> the factory that gets and returns the details.
     * @param UserService -> the factory that gets and returns user data.
     * @param ValdationService -> the factory that validates a scan
     * @param UserService -> the factory that gets and returns user data.
     * @param $cordovaBarcodeScanner
     * @param $document
     * @param $timeout
     * @param ModalService -> The service responsible for handling modals
     * @param moment
     * @constructor
     */
    function DetailsController($rootScope,
        $filter,
        UtilService,
        assetId,
        AssetService,
        UserService,
        ValidationService,
        $cordovaBarcodeScanner,
        $document,
        $timeout,
        ModalService,
        moment) {
        var vm = this;

        ModalService.add('invalidId');
        ModalService.add('errorModal');
        ModalService.compile();

        vm.onDevice = UtilService.isOnDevice();
        vm.datepicker = {};
        vm.datepicker.returnDate = new Date();
        vm.isCheckoutFor = false;
        vm.checkoutFor = {};
        vm.checkoutFor.email = null;
        vm.deleteDevice = {};
        vm.deleteDevice.fn = function() {};

        /**
         * Changes the page's view state
         * @private
         */
        vm.switchView = function(state) {
            vm.pageState = state;
        };

        /**
         * Retrieves the asset data from the server
         * @private
         */
        vm.getData = function() {
            vm.loadingState = ''; //Used when making api calls
            vm.pageState = 'infoView'; //Used fto switch between various views on the page
            AssetService.getAssets(null, assetId).then(_updateDeviceData, _detailsFail);
        }; //call automatically on load
        vm.getData();

        /**
         * Callback function called when the getData function fails at retrieving the asset data
         * @private
         */
        function _detailsFail(err) {
            switch (err.status) {
                case 400:
                    //error while getting asset
                    $rootScope.back();
                    $rootScope.errorModalText(err);
                    ModalService.get('errorModal').open();
                    break;
                case 404:
                    //no assets found
                    $rootScope.back();
                    $rootScope.errorModalText(err);
                    ModalService.get('errorModal').open();
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
         * Checks if the user has scanned the qr code.
         * @private
         */
        function _isValidated() {
            return ValidationService.checkValidatedId(vm.deviceData.id) &&
                ValidationService.checkForTimeOut(moment().toISOString());
        }

        /**
         * Starts the check out or check in process.
         * Case 1: Checking out, switches to date picking view.
         *
         * @private
         */
        vm.startCheckInOut = function() {

            // First, check to see if the scanned device is validated
            if (!_isValidated()) {

                if (vm.onDevice) {
                    vm.switchView('');
                    //run scanner
                    $cordovaBarcodeScanner.scan()
                        .then(function(barcodeData) {
                            vm.scanSuccess(barcodeData);
                        }, function(error) {
                            vm.scanFail(error);
                        });
                } else {
                    vm.switchView('validationView');
                }
            } else {
                if (vm.buttonStyles.class === 'checkout') {
                    vm.switchView('checkoutView');
                    //Not calling service here. CheckOutDevice is when it is called.
                } else if (vm.buttonStyles.class === 'checkin') {
                    UtilService.logInfo('details', 'detailsContainer', 'Calling AssetService.checkinAsset');

                    vm.loadingState = ''; //Hide buttons until operation done

                    AssetService.checkinAsset(vm.deviceData.id, vm.deviceData['active_reservations'][0].id)
                        .then(_updateDeviceData, _checkInFail);
                }
            }
        };

        /**
         * On checkin fail, handles/displays the error.
         * @private
         */
        function _checkInFail() {
            var err = {
                message: 'Failed to checkin asset.'
            };
            $rootScope.errorModalText(err);
            vm.switchView('validationView');
            vm.loadingState = 'contentSuccess';
        }

        /**
         * Callback function called on a successful qr code scan
         * @private
         */
        vm.scanSuccess = function(scanObj) {
            if (!scanObj.cancelled) {
                // First, check for if the input is blank
                // For the modal; the scanner can't return a blank string
                if (angular.isUndefined(scanObj) || scanObj.text === '') {
                    ModalService.get('invalidId').open();
                } else if (scanObj.text !== vm.deviceData.id) {
                    ModalService.get('invalidId').open();
                } else {
                    ValidationService.newValidationObject(scanObj.text, moment().toISOString());
                    vm.switchView('infoView');
                    vm.startCheckInOut();
                }
            }
        };

        /**
         * Callback function called on failure of a qr code scan
         * @private
         */
        vm.scanFail = function(error) {
            vm.switchView('infoView');
            UtilService.logError('details', 'detailsContainer', 'Scan failed: ' + error);
            ModalService.get('scannerError').open();
        };

        /**
         * Applies the selected date, if valid and in range, by checking out this asset.
         * @private
         *
         */
        vm.checkOutDevice = function() {
            if (vm.deviceData.categories.type === 'laptop') { //allow indefinite checkouts to laptops
                UtilService.logInfo('details', 'detailsContainer', 'Calling AssetService.checkoutAsset');
                //Hide buttons until operation done
                vm.loadingState = '';
                AssetService.checkoutAsset(vm.deviceData.id, vm.datepicker.returnDate, vm.checkoutFor.email)
                    .then(_checkOutSuccess, _checkOutFail);
            } else {
                var date = moment(vm.datepicker.returnDate);
                //get the current moment then set it to the same time as the return date.
                var now = moment().hour(date.hours())
                    .minute(date.minutes())
                    .second(date.seconds())
                    .millisecond(date.milliseconds());
                var future = now.clone().add(3, 'weeks');
                if ((date.isBefore(future) && date.isAfter(now)) || date.isSame(future) || date.isSame(now)) {
                    UtilService.logInfo('details', 'detailsContainer', 'Calling AssetService.checkoutAsset');
                    //Hide buttons until operation done
                    vm.loadingState = '';
                    AssetService.checkoutAsset(vm.deviceData.id,
                            vm.datepicker.returnDate,
                            vm.checkoutFor.email)
                        .then(_checkOutSuccess, _checkOutFail);
                } else {
                    ModalService.get('dateWarning').open();
                }
            }

        };

        /**
         * On checkout success, page is reinitialized with the updated asset data and shows details.
         * @param ret - the server return data
         * @private
         */
        function _checkOutSuccess(ret) {

            if (ret.status === 200) {

                if (ret.data.categories.type === 'phone') { //TODO in the future this would be set in the config
                    ModalService.get('doNotUpgradeModal').open();
                }
            } else if (ret.status === 202) {
                $rootScope.errorModalText({
                    message: 'Error 202: Asset was already checked out.'
                });
                ModalService.get('errorModal').open();
            }

            //In both 200 and 202 cases, update to most recent details.

            _updateDeviceData(ret.data);
        }

        /**
         * On checkout fail, handles/displays the error.
         * @private
         */
        function _checkOutFail() {

            var modalError = {
                message: 'Failed to checkout asset.'
            };
            $rootScope.errorModalText(modalError);
            ModalService.get('errorModal').open();
            vm.loadingState = 'contentSuccess';
        }

        /**
         * Resets the displayed data in the infoView page state
         * @param data -- the new data to display
         * @private
         */
        function _updateDeviceData(data) {
            vm.deviceData = data;
            vm.isAdmin = (UserService.getUserRole() > 0) ? true : false;
            vm.buttonStyles = _formatButton(data.state, data['active_reservations'][0]);
            _formatDetails(data);

            vm.switchView('infoView');
            vm.loadingState = 'contentSuccess';
        }

        /**
         * Changes the checkout/checkin button's format on a checkIn or checkOut action
         * @param state -- the current state of the asset
         * @param activeReservation -- the asset's active reservation
         * @private
         * TODO TEST
         */
        function _formatButton(state, activeReservation) {
            var button = {};
            if (state === 'available') {
                button.unavailable = false;
                button.class = 'checkout';
                return button;
            } else if (activeReservation) {
                if (vm.isAdmin){
                    button.class = 'checkin';
                } else { //User is not admin
                    button.unavailable = true;
                    button.class = 'checkin';
                    if(vm.deviceData['active_reservations'][0].borrower.name.first === 'You'){
                        button.unavailable = false;
                    }
                }
                return button;
            } else {
                return {
                    unavailable: true,
                    class: 'checkout'
                };
            }
        }

         /**
         * Formats the details to match checkIT standards so that the data can be displayed by Angular
         * @param data -- the asset's data as returned by the server
         * @private
         */
        function _formatDetails(data) {
            vm.statusColor = _formatStatus(data.state);
            vm.borrower = _formatBorrower(data.state, data['active_reservations'][0]);
            vm.details = [{
                'title': 'Device',
                'value': data.name
            }, {
                'title': 'Type',
                'value': $filter('capitalize')(data.categories.type)
            }, {
                'title': 'OS',
                'value': data.categories.os.name + ' ' + data.categories.os.version
            }, {
                'title': 'Status',
                'value': $filter('capitalize')(data.state),
                'valueModifier': vm.statusColor
            }, {
                'title': 'Owner',
                'value': vm.borrower.name,
                'valueModifier': vm.borrower.color
            }, {
                'title': 'Description',
                'value': (data.description ? data.description : 'None'),
                'titleModifier': 'longform',
                'valueModifier': 'longform'
            }];
        }

         /**
         * Function to format the status part of the info page view
         * @param state -- the current state of the asset
         * @private
         */
        function _formatStatus(state) {
            if (state === 'available') {
                return 'checkit-text';
            } else {
                if (state === 'OVERDUE') {
                    return 'dangerzone';
                } else {
                    return 'owner-text';
                }
            }
        }

        /**
         * Function to format the borrower part of the info page view
         * @param state -- the current state of the asset
         * @param activeReservation -- the asset's active reservation
         * @private
         */
        function _formatBorrower(state, activeReservation) {
            if (state === 'available') {
                return {
                    name: 'N/A',
                    color: 'checkit-text'
                };
            } else if (activeReservation) { //if this device is reserved
                var borrower = activeReservation.borrower;
                if (borrower.name.first === 'You') {
                    return {
                        name: 'You',
                        color: 'owner-text'
                    };
                } else if (vm.isAdmin) {
                    return {
                        name: borrower.name.first + ' ' +
                            borrower.name.last,
                        color: 'owner-text'
                    };
                } else {
                    return {
                        name: borrower.name.first + ' ' +
                            borrower.name.last,
                        color: 'dangerzone' // Not current user, so text is red
                    };
                }
            }
        }
    }
})();
