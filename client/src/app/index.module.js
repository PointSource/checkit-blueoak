/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the main module.
 */

(function() {
    'use strict';

    angular
        .module('app', [
            'app.config',
            'ui.router',
            'ngAnimate',
            'ngTouch',
            'ngCordova',
            'snap',
            'ngFitText',
            'app.filters',
            'ngFileUpload',
            'smoothScroll',
            'angucomplete-alt'
        ]);
})();
