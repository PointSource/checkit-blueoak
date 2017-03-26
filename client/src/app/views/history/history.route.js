(function() {
	'use strict';

	angular
		.module('app.history')
		.config(routerConfig);

	routerConfig.$inject = [
		'$stateProvider', '$urlRouterProvider', 'snapRemoteProvider'
	];

	function routerConfig($stateProvider, $urlRouterProvider, snapRemoteProvider) {
		snapRemoteProvider.globalOptions = {
			disable: 'left'
		};

		// For any unmatched url, redirect to home
		$urlRouterProvider.otherwise('/');
		$stateProvider
            .state('history', {
                parent: 'root',
                url: '/history',
                views: {
                    'content@': {
                        templateUrl: 'app/views/history/history.html',
                        controller: 'HistoryController',
						controllerAs: 'vm'
                    }
                },
                data: {
                    requiresAuthentication: true
                }
            });
	}
})();
