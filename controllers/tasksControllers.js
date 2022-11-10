const asyncHandler = require('express-async-handler')
const Task = require('../models/task')
const User = require('../models/user')
const url = require('url')
const querystring = require('querystring')

exports.getTasks = asyncHandler (async(req, res) => {
    const arg = url.parse(req.url).query;
    const params = querystring.parse(arg)
    let tasks = null
    if(params.count)
        tasks = await Task.find(params.where ? JSON.parse(params.where):null, params.select ? JSON.parse(params.select):null).sort(params.sort ? JSON.parse(params.sort):null).skip(params.skip ? params.skip * 1 : 0).limit(params.limit ? params.limit * 1:null).count()
    else
        tasks = await Task.find(params.where ? JSON.parse(params.where):null, params.select ? JSON.parse(params.select):null).sort(params.sort ? JSON.parse(params.sort):null).skip(params.skip ? params.skip * 1 : 0).limit(params.limit ? params.limit * 1:null)
    
    if(tasks){
        res.status(200);
        res.json({
            'message': 'OK',
            'data': tasks 
        })
    }else{
        res.status(404)
        throw new Error('No Tasks')
    }
})

exports.createTask = asyncHandler (async(req, res) => {
    const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;

    if(!name || !deadline){
        res.status(500);
        throw new Error("Invalid Name Or Deadline");
    }

    let taskOwner = null;
    if(assignedUserName !== 'unassigned'){
        taskOwner = await User.findById(assignedUser);

        if(!taskOwner){
            res.status(500)
            throw new Error('Task Is Assigned To A Non-existent User')
        }
    }

    // create a new task
    const task = await Task.insertMany([
        {
            "name": name,
            "description": description,
            "deadline": deadline,
            "completed": completed,
            "assignedUser": assignedUser,
            "assignedUserName": assignedUserName ? assignedUserName:taskOwner.name,
            "dateCreated": Date.now()
        }
    ])

    if(!task){
        res.status(500)
        throw new Error('Create Task Failed')
    }

    // add the task to the corresponding user
    if(assignedUserName !== 'unassigned'){
        let pendingTasks = taskOwner.pendingTasks;
        pendingTasks.push(task[0]._id);
        const user = await User.updateOne({"_id":assignedUser}, {$set:{"pendingTasks": pendingTasks}});

        if(!user){
            res.status(500)
            throw new Error('Failed To Update User Tasks')
        }
    }

    res.status(201);
    res.json({
        'message': 'OK',
        'data': task[0]
    })
})

exports.getTask = asyncHandler (async(req, res) => {
    const arg = url.parse(req.url).query;
    const param = querystring.parse(arg);
    const task = await Task.findById(req.params.id, param.select ? JSON.parse(param.select):null)
    if(task){
        res.status(200);
        res.json({
            'message': 'OK',
            'data': task
        })
    }else{
        res.status(404);
        throw new Error('No Task')
    }
})

exports.replaceTask = asyncHandler (async(req, res) => {
    const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
    
    if(!name || !deadline){
        res.status(500);
        throw new Error("Invalid Name Or Deadline");
    }

    // get the task to be replaced: change the corresponding user's info
    const oldTask = await Task.findById(req.params.id);
    if(oldTask){
        if(oldTask.assignedUserName !== 'unassigned'){
            const deleteTaskUser = await User.findById(oldTask.assignedUser);
            if(deleteTaskUser){
                let deleteTaskUserPendingTasks = deleteTaskUser.pendingTasks;
                let index = deleteTaskUserPendingTasks.indexOf(req.params.id);
                if(index > -1){
                    deleteTaskUserPendingTasks.splice(index, 1);
                    await User.updateOne({"_id":oldTask.assignedUser}, {$set:{"pendingTasks": deleteTaskUserPendingTasks}})
                }else{
                    res.status(404);
                    throw new Error("The Task Has Not Been Assigned To A Legal User")
                }
            }else{
                res.status(404);
                throw new Error("The Task Has Not Been Assigned To A Legal User")
            }
        }
    }else{
        res.status(404);
        throw new Error("No Task Found")
    }

    let updateTaskUser = null;
    if(assignedUserName !== 'unassigned')
        updateTaskUser = await User.findById(assignedUser);

    // update task info
    const task = await Task.replaceOne({"_id":req.params.id}, {
        "name": name,
        "description": description,
        "deadline": deadline,
        "completed": completed,
        "assignedUser": assignedUser,
        "assignedUserName": assignedUserName ? assignedUserName:updateTaskUser.name,
        "dateCreated": Date.now()
    })

    if(task.nModified === 0){
        res.status(500);
        throw new Error('Replace Task Failed')
    }

    // update corresponding user info
    if(updateTaskUser !== null){
        let updateTaskUserPendingTasks = updateTaskUser.pendingTasks;
        updateTaskUserPendingTasks.push(req.params.id);
        const updateUser = await User.updateOne({"_id":assignedUser}, {$set:{"pendingTasks": updateTaskUserPendingTasks}})

        if(!updateUser){
            res.status(500);
            throw new Error('Update User Task Info Failed')
        }
    }

    res.status(200);
    res.json({
        'message': 'OK',
        'data': task
    })
})

exports.deleteTask = asyncHandler (async(req, res) => {
    const task = await Task.findById(req.params.id);
    if(!task){
        res.status(404);
        throw new Error('Not Found Task')
    }

    let user = null;
    if(task.assignedUserName !== 'unassigned')
        user = await User.findById(task.assignedUser);

    // delete task info
    const deleteTask = await Task.deleteOne({"_id":req.params.id});

    if(deleteTask.ok === 0){
        res.status(500);
        throw new Error('Delete Task Failed')
    }

    // delete info in corresponding user's info
    if(user !== null){
        let userPendingTasks = user.pendingTasks;
        let index = userPendingTasks.indexOf(req.params.id);
        userPendingTasks.splice(index, 1);
        const updateUser = await User.updateOne({"_id":task.assignedUser}, {$set:{"pendingTasks": userPendingTasks}})

        if(!updateUser){
            res.status(500);
            throw new Error('Update User Info Failed');
        }
    }

    res.status(200);
    res.json({
        'message': 'OK',
        'data': deleteTask
    })
})