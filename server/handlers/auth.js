/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */

var authUtil = require('../util/authUtil.js');
var _app, _logger, _authService;

module.exports = {
    init: function(app, logger, authService) {
        _app = app;
        _logger = logger;
        _authService = authService;
    },
    login: function(req, res, next) {
        _logger.info('POSTing to /api/auth/login');
        var idToken = req.body.idToken;
        _authService.authenticateGoogle(idToken, req.session, function(err, result) {
            if (err) {
                _logger.error(err);
                return next(err); //WORK? CHECK
            } else { // The user has been verified to be of the correct domain
                // Setup the session properties
                _logger.info('Setting up session data');
                req.session.email = result.email;
                req.session.role = result.role;
                req.session.sub = result.sub;
                req.session.hd = result.hd;
                console.log(req.session);
                var returned = {
                    userEmail: result.email,
                    userRole: result.role
                };

                res.status(200).send(returned);
            }
        });

    },
    logout: function(req, res, next){
        _logger.info('DELETEing to /api/auth/logout');
        authUtil.clearSession(req);
        _logger.info('User logout successful');
        res.status(200).send();
    }
};

//Authentication middleware for use by swagger
module.exports.authenticateHandler = function(req, res, next) {
    authUtil.isAuthenticated(req, res, next);
};

//Admin middleware for use by swagger
module.exports.adminHandler = function(req, res, next) {
    authUtil.isAdmin(req, res, next);
};
