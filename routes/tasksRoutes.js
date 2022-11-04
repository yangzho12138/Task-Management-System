const tasksControllers = require('../controllers/tasksControllers')

module.exports = function (router) {

    var taskRoute1 = router.route('/');
    var taskRoute2 = router.route('/:id')

    taskRoute1.get(tasksControllers.getTasks).post(tasksControllers.createTask)
    taskRoute2.get(tasksControllers.getTask).put(tasksControllers.replaceTask).delete(tasksControllers.deleteTask)

    return router;
}
