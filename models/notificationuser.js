let mongoose = require('mongoose');

let notificationUserChema = mongoose.Schema({
    id: String,
    idUser: String,
    idAdmin: String,
    nameAdmin: string,
    title: String,
    content: String,
    dateCreate: Date,
    statusNoti: Boolean,
    status: Boolean
});

let notificationUser = module.exports = mongoose.model('notificationusers', notificationUserChema);