/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the error directive which displays when a network error has occurred.
 */

(function () {
    'use strict';

    angular
        .module('app.directives')
        .directive('error', errorDirective);

    errorDirective.$inject = [];

    function errorDirective() {
        return {
            restrict: 'A',
            templateUrl: 'app/directives/error/error.template.html'
        };
    }
})();
