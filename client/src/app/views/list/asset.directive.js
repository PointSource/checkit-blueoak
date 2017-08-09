/**
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file holds the directive definition for the assets that occupy the lists
 */

(function() {
    'use strict';

    angular
        .module('app.list')
        .directive('asset', AssetDirective);

    AssetDirective.$inject = [];

    /**
     * Function returning the assets directive set up.
     * @returns {*} -> directive object as defined by AngularJS (https://docs.angularjs.org/guide/directive)
     */
    function AssetDirective() {
        return {
            restrict: 'E',
            replace: false,
            templateUrl: 'app/views/list/asset.template.html',
            controllerAs: 'vm',
            controller: CategoryController,
            bindToController: {
                content: '=',
                index: '@'
            }
        };
    }

    CategoryController.$inject = [
        '$rootScope'
    ];

    /**
     * @ngdoc function
     * @description
     * Controls the category directive
     * @param $rootScope
     */
    function CategoryController($rootScope) {

        var vm = this;

        /**
         * Navigates from the list page to the details page.
         * @param state -- the state to navigate to
         * @param params -- parameters to pass to the new state
         */
        vm.goToDetails = function(state, params) {
            $rootScope.navigate(state, params);
        };

        /**
         * Returns an image based on the content type. Used to display in asset.template.
         * @returns {*} -- the url of the image to display
         */
        vm.addImage = function() {
            var imgUrl;

            if (vm.content.categories.type === 'phone') {
                imgUrl = 'assets/images/phone_25x42.svg';
            } else if (vm.content.categories.type === 'tablet') {
                imgUrl = 'assets/images/tablet_40x45.svg';
            } else if (vm.content.categories.type === 'laptop') {
                imgUrl = 'assets/images/laptop_56x38.svg';
            } else if (vm.content.categories.type === 'camera') {
                imgUrl = 'assets/images/camera_45x34.svg';
            } else if (vm.content.categories.type === 'software') {
                imgUrl = 'assets/images/code.svg';
            } else if (vm.content.categories.type === 'misc') {
                imgUrl = 'assets/images/circle-thin-checkit-green.svg';
            } else {
                imgUrl = 'assets/images/circle-thin-checkit-green.svg';
            }

            return imgUrl;
        };

        /**
         * Sets a class to change the background color based on the assets index or reservation end date.
         * @param endDate -- the end date of the reservation
         * @returns {*} -- name of the class used to set the background color
         */
        vm.backgroundClass = function(endDate) {
            if (endDate === 'OVERDUE') {
                return 'overdue';
            } else if (vm.index % 2 === 0) {
                return 'checkit-list-light';
            } else {
                return 'checkit-list-dark';
            }
        };

        /**
         * Sets a class to change the text color of the reservation date and owner name based on the owner.
         * @param owner -- the current asset owner
         * @param endDate -- the end date of the reservation
         * @returns String -- name of the class used to set the reservation text color
         */
        vm.resColor = function(owner, endDate) {
            if (endDate !== 'OVERDUE') {
                if (owner !== 'You') {
                    return 'dangerzone';
                }
                return 'owner-text';
            }
            return '';
        };
    }


})();
