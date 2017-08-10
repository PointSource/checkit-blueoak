/**
 * Copyright © 2016 PointSource, LLC. All rights reserved.
 *
 * This file holds the directive definition for a device's image
 */

(function() {
    'use strict';

    angular
        .module('app.details')
        .directive('deviceImage', DeviceImageDirective);

    DeviceImageDirective.$inject = [];

    /**
     * @ngdoc directive
     * @name DeviceImageDirective
     * @description
     * Function returning the assets directive set up.
     * # A simple directive that formats and displays an image based on checkIT specificaions.
     * If `image` is a blank string (or not provided) it defaults to a preset image based on the `type` attribute.
     * If neither `image` or `type` attributes are present a default image will display.
     * This directive also allows for caption text via the transclude option.
     * @restrict 'E'
     * @param {String=}	image A path to the image
     * @param {String=} type The type of device image. Some possible values are `phone`, `laptop`, or `camera`.
     * @example
     * No image or type provided, default to default image:
     * <device-image>
     * 		<div class="I-can-be-formatted">
     *   		I am a caption
     *   	</div>
     * </device-image>
     *
     * No image provided, default to phone image based on `type` attribute:
     * <device-image type="phone"></device-image>
     *
     * Image and type provided, caption element included:
     * <device-image image="pathToImage" type="laptop">
     * 		<div class="I-can-be-formatted">
     *   		I am a caption
     *   	</div>
     * </device-image>
     *
     */
    function DeviceImageDirective() {

        return {
            restrict: 'E',
            replace: false,
            transclude: true,
            controller: DeviceImageController,
            controllerAs: 'imgCtrl',
            bindToController: {
                image: '=',
                type: '='
            },
            templateUrl: 'app/views/details/details.directives/device-image/device-image.template.html'
        };
    }

    DeviceImageController.$inject = [];

    /**
     * @ngdoc function
     * @description
     * Controls the deviceImage directive
     * @constructor
     */
    function DeviceImageController() {
        var imgCtrl = this;

        if (imgCtrl.image === '' || !imgCtrl.image) {
            var imgUrl;
            switch (imgCtrl.type) {
                case 'phone':
                    imgUrl = 'assets/images/phone_25x42.svg';
                    break;
                case 'tablet':
                    imgUrl = 'assets/images/tablet_40x45.svg';
                    break;
                case 'laptop':
                    imgUrl = 'assets/images/laptop_56x38.svg';
                    break;
                case 'camera':
                    imgUrl = 'assets/images/camera_45x34.svg';
                    break;
                case 'software':
                    imgUrl = 'assets/images/code.svg';
                    break;
                case 'misc':
                    imgUrl = 'assets/images/circle-thin-checkit-green.svg';
                    break;
                case 'watch':
                    imgUrl = 'assets/images/circle-thin-checkit-green.svg';
                    break;
                default:
                    imgUrl = 'assets/images/circle-thin-checkit-green.svg';
            }
            imgCtrl.image = imgUrl;
        }
    }
})();
