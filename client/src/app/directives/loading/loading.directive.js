/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the loading directive which is used to indicate that content is loading for a page.
 */

(function () {
    'use strict';

    angular
        .module('app.directives')
        .directive('loading', loadingDirective);

    loadingDirective.$inject = [

    ];

    function loadingDirective() {
        return {
            restrict: 'A',
            templateUrl: 'app/directives/loading/loading.template.html'
        };
    }
})();
