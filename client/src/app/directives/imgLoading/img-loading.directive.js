/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Captures the image loading event and displays a spinner while the image loads
 */

(function() {
    'use strict';

    angular
        .module('app.directives')
        .directive('imageLoader', ImageLoaderDirective);

        ImageLoaderDirective.$inject = ['$parse'];

        function ImageLoaderDirective($parse) {
            return {
                restrict: 'A',
                link: function(scope, elem, attrs) {
                    var fn = $parse(attrs.imageLoader);
                    elem.on('load', function(event) {
                        scope.$apply(function() {
                            fn(scope, {
                                $event: event
                            });
                        });
                    });
                }
            };
        }
})();
