const express =require('express')
const multer = require('multer');
const path=require('path');
const {
  reguserHandler,
  getCodeHandler, modifyPassword, loginHandler, modifyAvatarHandler, modifyNivknameHandler, modifySex, retrievePassword, cancelUser
} = require('../router_handler/user')
const userRouter =express.Router()
userRouter.post('/reguser',reguserHandler)
//验证码
userRouter.get('/getCode', getCodeHandler)
//设置密码
userRouter.post('/modifyPassword', modifyPassword)
//登入
userRouter.post('/login',loginHandler)
//添加（修改）昵称
userRouter.post('/nickname', modifyNivknameHandler)
//添加（修改）头像

//配置用户头像信息
const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: {
    fileSize: 56 * 1000,
    files: 1
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif') {
      cb(null,false)
    } else {
      cb(null, true)
    }
  }
}).single('avatar')

userRouter.post('/avatar',function(req,res,next){
  upload(req,res,(err)=>{
    if(err instanceof multer.MulterError){
      res.cc(err)
    }
    else{
      next()
    }
  })
},modifyAvatarHandler)
//修改性别
userRouter.post('/sex',modifySex)
//找回密码
userRouter.get('/retrievePassword', retrievePassword)
// 注销账号
userRouter.get('/cancelUser', cancelUser)
module.exports=userRouter