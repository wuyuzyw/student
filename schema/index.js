const Joi = require("joi");
const email = Joi.string().required().pattern(/^[1-9][0-9]{4,10}@qq.com$/i).error(errors => {
  switch(errors[0].code){
    case 'string.empty': return new Error('邮箱不能为空')
    case 'any.required': return new Error('邮箱必填项')
    case 'string.pattern.base':return new Error('请填写正确的QQ邮箱')
  }
})
const password = Joi.string().required().pattern(/^(?=.*[a-zA-Z])(?=.*\d).{7,15}$/).error(errors=>{
   switch (errors[0].code) {
     case 'string.empty': return new Error('密码不能为空')
     case 'any.required':return new Error('密码必填项')
     case 'string.pattern.base':
       return new Error('密码格式不正确')
    case 'any.only':return new Error('输入的密码不一致')
    case 'any.invalid':return new Error('新密码不能与旧密码一致')
   }
})
const repeatPassword =Joi.valid(Joi.ref('password')).concat(password)
const no_repeatPassword=Joi.invalid(Joi.ref('password')).concat(password)
//注册（用户名|QQ邮箱）的验证规则
module.exports.reguserSchema=Joi.object({
  email
})
//密码的验证规则
module.exports.passwordSchema=Joi.object({
  password,
  repeatPassword
})
//登入的验证规则
module.exports.loginSchema=Joi.object({
  email,
  password
})
//修改密码的验证规则
module.exports.no_repeatPasswordSchema=Joi.object({
  password,
  no_repeatPassword
})