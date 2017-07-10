/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * Defines the alternate image directive for if the image originally intended cannot be found
 */

(function () {
    'use strict';

    angular
        .module('app.directives')
        .directive('altimg', imageRedirect);

    imageRedirect.$inject = [];

    /**
     * Function returning the altimg directive set up.
     * @returns {*} -> directive object as defined by AngularJS (https://docs.angularjs.org/guide/directive)
     */
    function imageRedirect() {
        return {
            link: function (scope, element, attrs) {
                element.bind('error', function () {
                    if (attrs.src !== attrs.altimg) {
                        attrs.$set('src', attrs.altimg);
                    }
                });
            }
        };
    }
})();
