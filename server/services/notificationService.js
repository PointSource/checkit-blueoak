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


var _emailNotification = function(msg) {
    //See https://nodemailer.com/smtp/oauth2/
};

/**
 * TODO FINISH COMMENT
 * @param  {[type]}   msg      [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var _hipchatNotification = function(msg, callback) {
   
};

/**
 * TODO FINSIH COMMENT
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
function notify(msg) {
    if (method === 'email') {
        _emailNotification(msg);
    } else if (method === 'hipchat') {
        _hipchatNotification(msg);
    }
}

exports.notify = notify;