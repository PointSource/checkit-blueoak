/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the validation view directive that is used when validating the ID of a device.
 */

(function () {
    'use strict';

    angular
        .module('app.directives')
        .directive('validation', validationDirective);

    validationDirective.$inject = [

    ];

    function validationDirective() {
        return {
            restrict: 'E',
			replace: false,
            templateUrl: 'app/directives/validation/validation.template.html'
        };
    }
})();
