const { reguserSchema,passwordSchema,loginSchema,no_repeatPasswordSchema,nicknameSchema,avatarSchema,sexSchema } = require("../schema") //导入验证规则模块
const nodemailer=require('nodemailer') //导入可以处理发送QQ邮件模块
const bcrypt = require('bcrypt'); //导入密码加密模块
const jwt = require('jsonwebtoken'); //导入生成tokeb模块
const privateKey = require('../utils/getprivateKe') //获取私钥的自定义模块
const fs=require('fs');

 /*存放多个用户注册时的信息,例如：
{
  '726834@qq.com':{
     code: null, //用户注册时的验证码
     oldTime: null, //发送验证码的时间
     newTime: null, //注册完成的时间
  },
  '7534@qq.com':{}
}
 */
let userList={}
//发送邮件的相关配置
const mailTransport = nodemailer.createTransport({
  service: 'qq',
  secure: true,
  auth: {
    user: '3060580200@qq.com',
    pass: 'salvfaonnomtdgfh'
  }
})
//一天的毫秒数
const oneDay=1000*60*60*24
//隔24小时删除没有注册成功的用户信息
setInterval(() => {
 userList={}
}, oneDay);
//生成随机验证码
function genrateCode() {
  let Code = ''
  for (let i = 0; i < 6; i++) {
    Code += Math.floor(Math.random() * 10)
  }
  return Code
}
//生成hash密码
function hashPassword(password){
  const hash = bcrypt.hashSync(password, 10);
  return hash
}
//注册用户的处理函数
const reguserHandler = async(req, res) => {
  const {email,validateCode,password,repeatPassword} = req.body
  try {
  await reguserSchema.validateAsync({email})
  await passwordSchema.validateAsync({password,repeatPassword})
  //是否获取验证码
  if(userList[email]){
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
               pool.query('insert user set ?',{username:email,password:hashPassword(password)},(err,results)=>{
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
               pool.query('update user set ? where id=?', [{status:1,password:hashPassword(password)},results[0].id], (err, results) => {
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
    const options = {
      from: '3060580200@qq.com',
      to: email,
      subject: '用户注册或找回密码',
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
          res.cc('验证码已发送至QQ邮箱',0);
        }
      })
    }else{
      res.cc('已发送验证码至QQ邮箱，注意查收')
    }
    // end
  } catch (error) {
    res.cc(error)
  }
}
//重新设置密码的处理函数
const modifyPassword = async (req, res) => {
  const {password,no_repeatPassword}=req.body
  const {pool}=req
  const {id}=req.auth
  try {
    await no_repeatPasswordSchema.validateAsync({password,no_repeatPassword})
    pool.query('select * from user where id=?',id,(err,results)=>{
      if(err){
        res.cc(err)
      }else{
        if(bcrypt.compareSync(password,results[0].password)){
          pool.query('update user set ? where id=?',[{password:hashPassword(no_repeatPassword)},id],(err,results)=>{
            if(err){
              res.cc(err)
            }else{
              if(results.affectedRows===1){
                res.cc('修改密码成功',0)
              }else{
                res.cc('密码修改失败，请稍后重试!')
              }
            }
          })
        }else{
          res.cc('旧密码错误')
        }
      }
    })
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
        if(results.length===1 && results[0].status===1){
          if(bcrypt.compareSync(password,results[0].password)){
            const token = jwt.sign({id:results[0].id,username:results[0].username,nickname:results[0].nickname}, privateKey,{expiresIn:'24h'});
            res.send({
              message:'登入成功',
              data:{
                token:'Bearer '+token
              },
              status:0
            })
          }else{
            res.cc('密码错误！')
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
//添加（修改）用户昵称的处理函数
const modifyNivknameHandler=async(req,res)=>{
  const {nickname}=req.body
  const {pool} =req
  const {id}=req.auth
  try {
    await nicknameSchema.validateAsync({nickname})
    pool.query('update user set ? where id=?',[{nickname},id],(err,results)=>{
      if(err){
        res.cc(err)
      }else{
        if(results.affectedRows===1){
          res.cc('用户昵称修改成功！',0)
        }else{
          res.cc('用户昵称修改失败，请稍后重试')
        }
      }
    })
  } catch (error) {
    res.cc(error)
  }
}
//添加（修改）、用户头像的处理函数
const modifyAvatarHandler=async(req,res)=>{
  if(req.file){
    const {id}=req.auth
    const {pool}=req
    const {path,mimetype}=req.file
    let avatarStr=fs.readFileSync(path,'base64')
    avatar = `data:${mimetype};base64,${avatarStr}`
    try {
      await avatarSchema.validateAsync({avatar})
      pool.query('update user set ? where id=?',[{avatar},id],(err,results)=>{
        if(err){
          res.cc(err)
        }else{
          if(results.affectedRows==1){
            res.cc('用户头像修改成功',0)
            fs.unlinkSync(path)
          }else{
            res.cc('用户头像修改失败，请稍后重试')
          }
        }
      })
    } catch (error) {
      res.cc(error)
    }
  }else{
    res.cc('图片格式必须是jpeg,png,gif')
  }
}
//修改性别的处理函数
const modifySex=async(req,res)=>{
  const {sex} =req.body
  const {pool} =req
  const {id}=req.auth
  try {
    await sexSchema.validateAsync({sex})
    pool.query('update user set ? where id=?',[{sex},id],(err,results)=>{
      if(err){
        res.cc(err)
      }else{
        if(results.affectedRows===1){
          res.cc('用户性别更新成功', 0)
        }else{
          res.cc('用户性别更新失败，请稍后重试！')
        }
      }
    })
  } catch (error) {
    res.cc(error)
  }
}
//找回密码的处理函数
const retrievePassword=async (req,res)=>{
  const {validateCode,email}=req.query
  const {pool}=req
  try {
    await reguserSchema.validateAsync({email})
    if(userList[email]){
      const newTime =+new Date()
     userList[email].newTime=newTime
     if((userList[email].newTime-userList[email].oldTime)/1000<=60){
        if(validateCode===userList[email].code){
          const Tempassword = '111111a'
          const password = hashPassword(Tempassword)
          pool.query('update user set ? where username=?',[{password},email],(err,results)=>{
            if(err){
              res.cc(err)
            }else{
              if(results.affectedRows===1){
                const options = {
                  from: '3060580200@qq.com',
                  to: email,
                  subject: '登入密码',
                  html: `<h1>hello ,您的登入密码为:${Tempassword},密码简单，请及时更改</h1>`
                };
                 mailTransport.sendMail(options, function (err, msg) {
                   if (err) {
                     res.cc(err);
                   } else {
                     res.cc('登入密码已发送至QQ邮箱', 0);
                     delete userList[email] //删除用户临时的信息
                   }
                 })
              }else{
                res.cc('登入密码获取失败,请稍后重试')
              }
            }
          })
        }else{
          res.cc('请输入正确的验证码')
        }
     }else{
      res.cc('验证码失效，请重新获取！')
     }
    }else{
      res.cc('请获取验证码')
    }
  } catch (error) {
    res.cc(error)
  }
}
// 注销账号的处理函数
const cancelUser=(req,res)=>{
  const {id} = req.auth
  const {pool} = req
  pool.query('update user set ? where id=?',[{status:0},id],(err,results)=>{
    if(err){
      res.cc(err)
    }else{
      if(results.affectedRows===1){
        res.cc('账号注销成功',0)
      }else{
        res.cc('注销找好失败,请稍后重试')
      }
    }
  })
}
module.exports={
  reguserHandler, getCodeHandler, modifyPassword, loginHandler, modifyNivknameHandler, modifyAvatarHandler, modifySex, retrievePassword, cancelUser
}