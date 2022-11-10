const asyncHandler = require('express-async-handler')
const User = require('../models/user')
const url = require('url')
const querystring = require('querystring')

exports.getUsers = asyncHandler (async(req, res) => {
    const arg = url.parse(req.url).query;
    const params = querystring.parse(arg)
    let users = null
    if(params.count)
        users = await User.find(params.where ? JSON.parse(params.where):null, params.select ? JSON.parse(params.select):null).sort(params.sort ? JSON.parse(params.sort):null).skip(params.skip ? params.skip * 1 : 0).limit(params.limit ? params.limit * 1:null).count()
    else
        users = await User.find(params.where ? JSON.parse(params.where):null, params.select ? JSON.parse(params.select):null).sort(params.sort ? JSON.parse(params.sort):null).skip(params.skip ? params.skip * 1 : 0).limit(params.limit ? params.limit * 1:null)
    
    if(users){
        res.status(200);
        res.json({
            'message': 'OK',
            'data': users 
        })
    }else{
        res.status(404)
        throw new Error('No Users')
    }
})

exports.createUser = asyncHandler (async(req, res) => {
    const { name, email, pendingTasks } = req.body;

    if(!name || !email){
        res.status(500);
        throw new Error("Invalid Name Or Email");
    }

    // check the email unique
    const existUser = await User.findOne({'email': email});
    if(existUser){
        res.status(500);
        throw new Error("Email Exists");
    }

    const user = await User.insertMany([
        {
            "name": name,
            "email": email,
            "pendingTasks": pendingTasks,
            "dateCreated": Date.now()
        }
    ])
    if(user){
        res.status(201);
        res.json({
            'message': 'OK',
            'data': user[0]
        })
    }else{
        res.status(500)
        throw new Error('Create User Failed')
    }

})

exports.getUser = asyncHandler (async(req, res) => {
    const arg = url.parse(req.url).query;
    const param = querystring.parse(arg);
    const user = await User.findById(req.params.id, param.select ? JSON.parse(param.select):null)
    if(user){
        res.status(200);
        res.json({
            'message': 'OK',
            'data': user[0]
        })
    }else{
        res.status(404);
        throw new Error('No User')
    }
})

exports.replaceUser = asyncHandler (async(req, res) => {
    const { name, email, pendingTasks } = req.body;

    if(!name || !email){
        res.status(500);
        throw new Error("Invalid Name Or Email");
    }

    // check the email unique
    const existUser = await User.findById({'email': email});
    if(existUser){
        res.status(500);
        throw new Error("Email Exists");
    }

    const user = await User.replaceOne({"_id":req.params.id}, {
        "name": name,
        "email": email,
        "pendingTasks": pendingTasks,
        "dateCreated": Date.now()
    })

    if(user.nModified !== 0){
        res.status(200);
        res.json({
            'message': 'OK',
            'data': user[0]
        })
    }else{
        res.status(500);
        throw new Error('Replace User Failed')
    }
})

exports.deleteUser = asyncHandler (async(req, res) => {
    const deleteUser = await User.findById(req.params.id);
    const deletePendingTasks = deleteUser.pendingTasks;

    const user = await User.deleteOne({"_id":req.params.id});

    // update the corresponding tasks of the user
    for(let i = 0; i < deletePendingTasks.length; i++){
        let taskId = deletePendingTasks[i];
        await Task.updateOne({"_id": taskId}, {$set:{"assignedUser": "", "assignedUserName": "unassigned"}});
    }


    if(user.ok !== 0){
        res.status(200);
        res.json({
            'message': 'OK',
            'data': user
        })
    }else{
        res.status(500);
        throw new Error('Delete User Failed')
    }
})