/**
 *
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file holds the definition for the asset-trait directive.
 */

(function() {
	'use strict';
	angular
		.module('app.directives')
		.directive('linemaker', linemakerDirective);

	linemakerDirective.$inject = [];

	function linemakerDirective() {

		return {
			restrict: 'E',
			replace: false,
			template: '<div class="linemaker-container"><span ng-transclude class="linemaker"></span></div>',
			transclude: true
		};
	}

})();
