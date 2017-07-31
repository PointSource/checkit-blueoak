/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */
var request = require('request');
var errors = require('../util/errors.js');

var _logger,
    method,
    hipchatConfig;

exports.init = function(logger, config, callback) {
    method = config.get('notifications').method;
    hipchatConfig = config.get('notifications').hipchat;
    _logger = logger;

    callback();
};


var _notifyEmail = function(msg) {
    //See https://nodemailer.com/smtp/oauth2/
};

/**
 * Connects to a hipchat room specified in the config and
 * sends a message to that room
 * @param  {string}   msg      The message to send
 * @param  {Function} callback The callback function
 * @return {Function}          Returns the callback function
 */
var _notifyHipchat = function(msg, callback) {
    var hipchatMessage = msg;
    var url = 'https://pointsource.hipchat.com/v2/room/' + hipchatConfig.roomID + '/notification';
    var hipchatParams = {
        method: 'POST',
        uri: url,
        qs: { auth_token: hipchatConfig.token },
        json: {
            color: 'green',
            message: hipchatMessage,
            notify: true,
            message_format: 'text'
        }
    };
    request.post(hipchatParams, function(err, response) {
        if (err) {
            return callback(new errors.DefaultError(err));
        } else {
            return callback(null, response);
        }
    });
};

/**
 * Exposed method for other services to interact with notifications
 * @param  {string} msg The message to send
 * @return {Function} callback function     
 */
function notify(msg, callback) {
    if (method === 'email') {
        return _notifyEmail(msg, callback);
    } else if (method === 'hipchat') {
        return _notifyHipchat(msg, callback);
    }
}

exports.notify = notify;
