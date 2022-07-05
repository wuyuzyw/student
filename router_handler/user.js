const { reguserSchema,passwordSchema,loginSchema } = require("../schema")
const nodemailer=require('nodemailer')

 /*存放多个用户注册时的信息,例如：
{
  '726834@qq.com':{
     code: null, //注册用户的验证码
     oldTime: null, //发送验证码的时间
     newTime: null, //注册完成的时间
  },
  '7534@qq.com':{}
}
 */
let userList={}
//生成随机验证码
function genrateCode() {
  let Code = ''
  for (let i = 0; i < 6; i++) {
    Code += Math.floor(Math.random() * 10)
  }
  return Code
}
//注册用户的处理函数
const reguserHandler = async(req, res) => {
  const {email,validateCode} = req.body
  try {
  await reguserSchema.validateAsync({email})
  //是否填写了验证码
  if(validateCode&&userList[email]){
    const newTime=+new Date()
    userList[email].newTime=newTime
    //判断是否在60秒内注册，如果不是验证码失效，需重新获取
    if((userList[email].newTime-userList[email].oldTime)/1000<=60){
      if (validateCode === userList[email].code) {
        const {pool}=req
        //查询数据库中该用户是否已存在
        pool.query('select * from user where username=?',email,(err,results)=>{
          if(err){
            res.cc(err)
          }else{
            //用户不存在
            if(results.length!==1){
              //向数据库插入用户
               pool.query('insert user set ?',{username:email},(err,results)=>{
                 if(err){
                   res.cc(err)
                 }else{
                  //插入成功
                   if(results.affectedRows===1){
                     res.cc('用户注册成功！', 0)
                     delete userList[email] //用户注册成功，删除存放的注册信息
                   }else{
                     res.cc('用户注册失败，请稍后重试！')
                   }
                 }
               })
            }
            //用户是否是之前注销过的用户 
            else if (results.length === 1 && results[0].status == 0) {
              //恢复用户的账号
               pool.query('update user set status=1 where id=?', results[0].id, (err, results) => {
                if(err){
                  res.cc(err)
                }else{
                  if(results.affectedRows===1){
                    res.cc('用户注册成功！',0)
                    delete userList[email] //用户注册成功，删除存放的注册信息
                  }else{
                    res.cc('注册失败，请稍后重试！')
                  }
                }
               })
            }else{
              res.cc('该用户已注册！')
            }
          }
        })
      }else{
        res.cc('请输入正确的验证码')
      }
    }else{
      res.cc('验证码已失效，请重新获取')
    }
  }else{
    res.cc('请获取验证码')
  }
  } catch (error) {
    res.cc(error)
  }
}
//获取验证码处理函数
const getCodeHandler=async(req,res)=>{
  const {email} = req.query
  try {
    await reguserSchema.validateAsync({email})
    code= genrateCode()
    if(!userList[email]){
      userList[email]={
        code: null, //注册用户的验证码
        oldTime: null, //发送验证码的时间
        newTime: null, //注册完成的时间
      }
    }
    // start 实现发送QQ邮件
    const mailTransport = nodemailer.createTransport({
      service: 'qq',
      secure: true,
      auth: {
        user: '3060580200@qq.com',
        pass: 'salvfaonnomtdgfh'
      } 
    })
    const options = {
      from: '3060580200@qq.com',
      to: email,
      subject: '用户注册',
      html: `<h1>hello ,您的注册验证码为:${code}有效期是60秒</h1>`
    };
    const time=+new Date()
    userList[email].time=time
    // 如果发送邮件时间小于60秒，不再重新发送，大于60秒再重新发送
    if ((userList[email].time-userList[email].oldTime) / 1000 > 60) {
      userList[email].code = code
      mailTransport.sendMail(options, function (err, msg) {
        if (err) {
          res.cc(err);
        } else {
          userList[email].oldTime =+new Date()
          res.cc('验证码已发送',0);
        }
      })
    }else{
      res.cc('已发送验证码，注意查收')
    }
    // end
  } catch (error) {
    res.cc(error)
  }
}
//设置密码的处理函数
const setPassword=async(req,res)=>{
  const {password,repeatPassword}=req.body
  try {
    await passwordSchema.validateAsync({password,repeatPassword})
    res.cc('ok')
  } catch (error) {
    res.cc(error)
  }
}
//登入的处理函数
const loginHandler=async(req,res)=>{
  const {email,password}=req.body
  const {pool}=req
  try {
    await loginSchema.validateAsync({email,password})
    pool.query('select * from user where username=?',email,(err,results)=>{
      if(err){
        res.cc(err)
      }else{
        if(results.length===1){
          if(password===results[0].password){
            res.cc('登入成功！',0)
          }
        }else{
          res.cc('用户名不存在')
        }
      }
    })
  } catch (error) {
    res.cc(error)
  }
}
module.exports={
  reguserHandler, getCodeHandler, setPassword,loginHandler
}