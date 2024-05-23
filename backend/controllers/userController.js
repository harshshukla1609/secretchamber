const asyncHandler=require('express-async-handler')
const User =require('../models/userModel.js')
const generateToken = require('../config/generateToken.js')

const registerUser= asyncHandler(async(req,res)=>{
    const {name,email,password,profilePic}=req.body;
    if(!name||!email||!password){
        res.status(400)
        throw new Error("Please enter all the fields")
    }
    const userExists=await User.findOne({email})
    if(userExists){
        res.status(400)
        throw new Error("User already exists")
    }
    const user=await User.create({
        name,
        email,
        password,
        profilePic
    })
    if(user){
        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            password:user.password,
            pic:user.profilePic,
            token:generateToken(user._id)
        })
    }
    else{
        res.status(400)
        throw new Error('Failed to register the User')
    }
})

const authUser=asyncHandler(async(req,res)=>{
    const {email,password}=req.body
    const user=await User.findOne({email})
    if(user && (await user.matchPassword(password))){
        res.json({
            _id:user._id,
            name:user.name,
            email:user.email,
            pic: user.profilePic,
            token:generateToken(user._id)
        })
    }
    else{
        res.status(401)
        throw new Error('Invalid Email or Password')
    }
})

const allUsers=asyncHandler(async(req,res)=>{
    const keyword=req.query.search
    ?{
        $or:[
            {name:{$regex:req.query.search,$options:'i'}},
            {email:{$regex:req.query.search,$options:'i'}},
            //a MongoDB query to search for users regular expression ($regex) with 
            //case-insensitive matching ($options: 'i').
        ]
    }:{};

    const users=await User.find(keyword).find({_id:{$ne:req.user._id}})
    //It ensures that the current user making the request is not included in the 
    //search results ({_id:{$ne:req.user._id}}).
    res.send(users)
})

module.exports={registerUser,authUser,allUsers}