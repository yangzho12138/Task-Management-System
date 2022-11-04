const asyncHandler =require('express-async-handler')

exports.getTasks = asyncHandler (async(req, res) => {
    res.end("12345")
})

exports.createTask = asyncHandler (async(req, res) => {

})

exports.getTask = asyncHandler (async(req, res) => {
    res.end("1234")
})

exports.replaceTask = asyncHandler (async(req, res) => {

})

exports.deleteTask = asyncHandler (async(req, res) => {

})