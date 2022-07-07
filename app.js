const express = require('express')
const userRouter = require('./router/user')
const app = express()
var { expressjwt: jwt } = require("express-jwt"); //验证token模块
const privateKey =require('./utils/getprivateKe')
const {port} = require('./project.json')
const pool = require('./DB')
//封装响应数据的全局中间件statu为0表示成功，1表示失败
const resData = function (req, res, next){
  res.cc=function(message,status=1){
    const msg = message instanceof Error ? message.message:message
    res.send({message:msg,status})
  }
  next()
}
//在req上追加mysql的连接对象
const db=function(req,res,next){
  req.pool=pool
  next()
}
app.use(express.urlencoded({extended:false})).use(express.json()).use( jwt({ secret: privateKey, algorithms: ["HS256"] }).unless({path:['/user/login','/user/reguser','/user/getCode']})).use(resData).use(db).use('/user',userRouter)
app.use(function(err,req,res,next){
  if (err.name === 'UnauthorizedError'){
    res.send({
      message:'token失效',
      status:1
    })
  }
})
app.listen(port, () => console.log('serve running at http://127.0.0.1')) 