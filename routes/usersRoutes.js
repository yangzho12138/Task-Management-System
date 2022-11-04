const usersControllers = require("../controllers/usersControllers")

module.exports = function (router) {

    var userRoute1 = router.route('/');
    var userRoute2 = router.route('/:id');

    userRoute1.get(usersControllers.getUsers).post(usersControllers.createUser)
    userRoute2.get(usersControllers.getUser).put(usersControllers.replaceUser).delete(usersControllers.deleteUser)

    return router;
}