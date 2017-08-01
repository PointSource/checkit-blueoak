/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
//Types should be formatted as my_variable (use underscores as delimiters)
var types = 'created checked_in checked_out removed'.split(' ');

/**
 * Record Schema
 */
/*jshint camelcase: false */
var RecordSchema = new Schema({
    assetID: {
        type: ObjectId,
        required: true,
        index: true
    },
    userID: {
        type: ObjectId,
        required: true,
        index: true
    },
    adminID: {
        type: ObjectId,
        required: false,
        index: true
    },
    type: {
        type: String,
        enum: types,
        default: types[0],
        required: true,
        index: true
    },
    return_date: {
        type: Date,
        default: Date.now,
        required: false
    },
    created:{
        type: Date,
        default: Date.now,
        required: true
    }
});

mongoose.model('Record', RecordSchema);
