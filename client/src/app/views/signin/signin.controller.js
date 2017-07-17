/**
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 *
 * This file holds the definition for the sign-in page controller.
 */

(function() {
    'use strict';

    angular
        .module('app.signin')
        .controller('SigninController', SigninController);

    SigninController.$inject = [
        '$rootScope',
        '$log',
        'UtilService',
        'AuthService',
        'ModalService',
        'UserService',
        'GoogleUserService'
    ];

    /**
     * The sign-in page controller function.
     * @param $rootScope
     * @param $log
     * @param UtilService
     * @param AuthService
     * @param ModalService
     * @constructor
     */
    function SigninController($rootScope, $log, UtilService, AuthService, ModalService, UserService, 
        GoogleUserService) {

        var vm = this;

        ModalService.add('errorModal');

        //Listen for silent sign on to fail
        var signOnListener = $rootScope.$on('not signed in', function() {
            vm.pageState = 'signin'; //not signed in so allow sign in button

            //unregister the listener
            signOnListener();
        });

        /**
         * The following makes sure that the sign in page isn't navigated to if already logged in.
         */
        if (!AuthService.isAuthenticated() || sessionStorage.getItem('isAuthenticated')) {
            signOnListener();
            vm.pageState = 'signin';
        } else {
            authSuccess();
        }

        /**
         * Callback function that navigates to the home page when the authentication flow succeeds.
         */
        function authSuccess() {
            if (UserService.getUserRole() === 1) { //If the user is an admin, pull in employee info
                GoogleUserService.getUserDirectory().then(function(data){
                    
                    GoogleUserService.setUserDirectoryData(data);

                    $rootScope.navigate('home');
                },function(err){ //If the Google Directory call fails, fallback to the CheckIT database
                    UserService.getUsers().then(function(data){
                        UtilService.logError('signin', 'SigninController', 'Error using Google Direcotry API: ' + 
                            err + 'Defaulting to CheckIT database...');
                        var remappedData = _remapCheckITUserData(data);
                        GoogleUserService.setUserDirectoryData(remappedData);
                    }, function(err){
                        UtilService.logError('signin', 'SigninController', 'Google Users error: ' + err);
                        $rootScope.navigate('home');
                    });
                });
            } else {
                $rootScope.navigate('home');
            }
        }

        /**
         * Remaps the CheckIT user database to match the Google Directory schema.
         * Email becomes primaryEmail, name.last becomes name.familyName,
         * name.first becomes name.givenName, and a fullName field is added to name.
         * @param  {object} json The user data
         * @return {object} the remapped data  
         */
        function _remapCheckITUserData(json){
            var users = [];
            json.forEach(function(user) {
                //Add fullName field
                user.name.fullName = user.name.first + ' ' + user.name.last;
                //Edit other field names
                user.primaryEmail = user.email;
                delete user.email;
                user.name.familyName = user.name.last;
                delete user.name.last;
                user.name.givenName = user.name.first;
                delete user.name.first;
                users.push(user);
            });
            var data = {
                users: users
            };
            return data;
        }

        /**
         * Callback function for when the authentication flow fails.
         * @param err -> the error to print out when authentication fails.
         */
        function authFailure(err) {
            if (err === 401) {
                $rootScope.errorModalText({ message: 'Please use a valid email address.' });
            } else {
                $rootScope.errorModalText({ message: 'Error authenticating with Google. ' + err });
            }
            ModalService.get('errorModal').open();
            vm.pageState = 'signin';
            UtilService.logError('signin', 'SigninController', 'Authentication failure: ' + err);
        }

		/**
         * Fundtion to intiate the signin process.
         * @param method -> the method of authentication to use. Currently the only valid method is 'google'.
         */
        vm.signIn = function(method) {
            vm.pageState = ''; //show loading icon
            AuthService.login(method).then(authSuccess, authFailure);
        };
    }

})();
