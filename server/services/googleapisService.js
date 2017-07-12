/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */


var errors = require('../util/errors.js');
var google = require('googleapis');
var path = require('path');

var url, _logger, serviceAccount, serviceScopes, domain,
appAccountEmail, serviceAccountEmail, serviceAccountKeyFile;

var adminServices = {};

exports.init = function(logger, config, callback) {
    url = 'https://www.googleapis.com';
    _logger = logger;

    serviceAccount = config.get('google').serviceAccount;
    serviceScopes = config.get('google').serviceScopes;
    appAccountEmail = config.get('google').appAccountEmail;
    domain = config.get('google').domain;

    callback();
};

function getAuthClient(callback){
    
    var authClient = new google.auth.JWT(
        serviceAccount.email,
        path.resolve('./', serviceAccount.keyFile),
        null,
        serviceScopes,
        appAccountEmail
    );
    
    authClient.authorize(function(err, result) {
        if (err) {
            return callback(err);
        }
        return callback(null, authClient);
    });
}

/**
 * A call to this endpoint returns all the users associated with the apps registered google account
 */
adminServices.getGoogleUsers = function(callback) {
    getAuthClient(function(err, authClient){
        if (err) {
            return callback(new errors.DefaultError(500, 'Failed to authenticate the server with Google'));
        } else {
            var service = google.admin('directory_v1');
            service.users.list({
                domain: domain,
                fields: 'users(primaryEmail, name)',
                maxResults: 500, // Default is 100. Maximum is 500.
                auth: authClient
            }, function(err, profiles) {
                if (err){
                    return callback(new errors.DefaultError(err.code, 'Failed to retrieve the list of Google Users'));
                } else {
                    return callback(null, profiles);
                }
            });
        }
    });
};

exports.adminServices = adminServices;
