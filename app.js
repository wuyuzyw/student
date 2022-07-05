const express = require('express')
const { required } = require('joi')
const userRouter = require('./router/user')
const app = express()
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
app.use(express.urlencoded({extended:false})).use(resData).use(db).use('/user',userRouter)
app.listen(port, () => console.log('serve running at http://127.0.0.1'))