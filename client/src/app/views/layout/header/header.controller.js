/**
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file holds the definition for the header controller.
 */

(function() {
    'use strict';

    angular
        .module('app.layout.header')
        .controller('HeaderController', HeaderController);

    HeaderController.$inject = ['$scope', '$state', 'snapRemote'];

    /**
     * Definition of the header controller.
     * @param $scope
     * @param $state
     * @param snapRemote
     * @constructor
     */
    function HeaderController($scope, $state, snapRemote) {

        var vm = this;

        /**
         * Function that changes the header title based on what page is being viewed
         * @param original -- the current header title
         * @param type -- the type of device being displayed on the list view
         */
        vm.editTitle = function(original, type) {
            if (original !== 'signin') {
                // set the title to either the state, or the type of device list
                var title = (original === 'list') ? type : original;

                // simple edits based on the title
                switch (title) {
                    case 'all':
                        vm.title = 'devices';
                        break;
                    case 'details':
                        vm.title = title;
                        break;
                    case 'misc':
                        vm.title = title;
                        break;
                    case 'checkedout':
                        vm.title = 'checked out';
                        break;
                    case 'edit':
                        vm.title = 'edit device';
                        break;
                    case 'add':
                        vm.title = 'add device';
                        break;
                    case 'history':
                        vm.title = 'asset history';
                        break;
                    default:
                        vm.title = title + 's';
                        break;
                }

                vm.showTitle = (vm.title !== 'homes');
                vm.showBackArrow = (vm.title !== 'homes');
            }
        };


        vm.editTitle($state.current.name, $state.params.type);

        //change the title on the header depending on what page is displayed using the statechange
        $scope.$on('$stateChangeStart', function(event, toState, toParams) {
            vm.editTitle(toState.name, toParams.type);
        });

        //listen for changes to overdue indicator
        $scope.$on('overdue assets', function(event, data) {
            vm.overdueCt = data; //set headers overdue count to be the data sent with broadcast
        });

        vm.showNoClick = false;

        snapRemote.getSnapper().then(function(snapper) {
            snapper.on('close', function() {
                vm.showNoClick = false;
            });
            snapper.on('open', function() {
                vm.showNoClick = true;
            });
        });
    }
})();
