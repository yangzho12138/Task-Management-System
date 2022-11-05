/*
 * Connect all of your endpoints together here.
 */

const errorHandle = require('../middleware/errorMiddleware');
const express = require('express')

module.exports = function (app, router) { 
    // app.use('/api', require('./home')(router));
    app.use('/api/users', require('./usersRoutes')(express.Router()));
    app.use('/api/tasks', require('./tasksRoutes')(express.Router()));
    app.use(errorHandle.notFound);
    app.use(errorHandle.errorHandler);
};




