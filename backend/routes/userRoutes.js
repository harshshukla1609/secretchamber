const express=require("express")
const router=express.Router()
const {registerUser,authUser, allUsers}=require('../controllers/userController.js')
const {protect}=require('../middleware/authMiddleware.js')

router.route('/').post(registerUser).get(protect,allUsers)
router.route('/login').post(authUser)
module.exports=router