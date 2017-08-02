/*
 * Copyright (c) 2015-2016 PointSource, LLC.
 * MIT Licensed
 */

'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var types = 'phone tablet laptop webcam camera projector watch misc'.split(' ');
var locations = 'Raleigh Chicago'.split(' ');
var locationIds = [697673324, 409625272];
var statuses = 'available in_use missing retired'.split(' ');
var OSnames = 'Android iOS Windows WatchOS FireOS OSX N/A'.split(' ');
var attrTypes = 'string array object integer'.split(' ');

/**
 * Asset Schema
 */
var Location = {
    name: {
        type: String,
        enum: locations,
        default: locations[0],
        required: true
    },
    id: {
        type: Number,
        enum: locationIds,
        default: locationIds[0],
        required: true
    }
};

var OS = {
    name: {
        type: String,
        enum: OSnames,
        required: true
    },
    version: {
        type: String,
        required: true
    }
};

var Categories = {
    type: {
        type: String,
        trim: true,
        required: true,
        enum: types,
        default: types[0],
        index: true
    },
    os: OS
};
var Attribute = {
    type: {
        type: String,
        trim: true,
        required: true,
        enum: attrTypes,
        default: attrTypes[0]
    },
    key: {
        type: String,
        trim: true,
        required: true,
        default: 'Fill this in'
    },
    value: {} //must markmodified when changed
};

var AssetSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: '',
        max: 50
    },
    description: {
        type: String,
        trim: true,
        max: 140,
        default: ''
    },
    image: { //images should be base64 encoded
        type: String,
        default: ''
    },
    location: Location,
    categories: Categories,
    attributes: [Attribute],
    status: {
        type: String,
        enum: statuses,
        default: statuses[0],
        required: true,
        index: true
    },
    created: {
        type: Date,
        default: Date.now,
        required: true
    },
    updated: {
        type: Date,
        required: true,
        default: Date.now
    }
});

AssetSchema.pre('save', function(next) {
    if (!this.isModified('updated')) {
        this.updated = new Date();
    }
    this.markModified('attributes');

    next();
});

AssetSchema.static('findByType', function(type, callback) {
    return this.find({
        type: new RegExp(type, 'i')
    }, callback);
});

AssetSchema.static('findAvailableByType', function(type, callback) {
    return this.find({
        $and: [{
            type: new RegExp(type, 'i')
        }, {
            status: 'available'
        }]
    }, callback);
});

AssetSchema.static('findInUse', function(assetID, callback) {
    return this.find({
        $and: [{
            _id: assetID
        }, {
            status: 'in_use'
        }]
    }, callback);
});

mongoose.model('Asset', AssetSchema);
