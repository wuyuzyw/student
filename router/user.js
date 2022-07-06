const express =require('express')
const {
  reguserHandler,
  getCodeHandler, modifyPassword, loginHandler
} = require('../router_handler/user')
const userRouter =express.Router()
userRouter.post('/reguser',reguserHandler)
//验证码
userRouter.get('/getCode', getCodeHandler)
//设置密码
userRouter.post('/modifyPassword', modifyPassword)
//登入
userRouter.post('/login',loginHandler)
module.exports=userRouter