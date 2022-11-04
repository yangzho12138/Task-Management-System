/*
 * Connect all of your endpoints together here.
 */

const errorHandle = require('../middleware/errorMiddleware');

module.exports = function (app, router) { 
    // app.use('/api', require('./home')(router));
    app.use('/api/users', require('./usersRoutes')(router));
    app.use('/api/tasks', require('./tasksRoutes')(router));
    app.use(errorHandle.notFound);
    app.use(errorHandle.errorHandler);
};
