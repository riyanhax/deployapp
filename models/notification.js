let mongoose = require('mongoose');

let notificationChema = mongoose.Schema({
    idApp: String,
    idNotification: String,
    titleNotification: Object,
    contentNotification: Object,
    internalLink: [{
        typeUrl: String,
        url: String
    }],
    smallIcon: String,
    iconNotification: String,
    bigimagesNotification: String,
    backgroundNotification: String,
    titleColor: String,
    contentColor: String,
    ledColor: String,
    accentColor: String,
    sendTo: Array,
    excludeSendTo: Array,
    dateCreate: Date,
    statusNotification: String,
    status: Boolean
});

let notification = module.exports = mongoose.model('notifications', notificationChema);