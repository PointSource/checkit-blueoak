/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */

'use strict';
var auth = require('../util/authUtil.js');
var _app, _logger, _usersService, _googleapisService;
module.exports = {
    init: function(app, logger, usersService, googleapisService){
        _app = app;
        _logger = logger;
        _usersService = usersService;
        _googleapisService = googleapisService;
    },
    getUserReservations: function(req, res, next){
        _logger.info('GETing from /api/v1/users/reservations using', req.session.email);
        console.log(req.session.email);
        _usersService.getUserReservations(req.session.email, function(err, result) {
            if (err) {
                _logger.error(err);
                next(err);
            } else {
                res.status(200).send(result);
            }
        });
    },
    getGoogleUsers: function(req, res, next) {
        _logger.info('GETing from /api/v1/admin/users/googleDirectory');
        _googleapisService.adminServices.getGoogleUsers(function(err, result) {
            if (err) {
                _logger.error(err);
                next(err);
            } else {
                res.status(200).send(result);
            }
        });
    }
};
