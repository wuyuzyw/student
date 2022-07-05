const mysql=require('mysql')
const pool = mysql.createPool({
  // connectionLimit: 100, //设置最大连接数
  host: '127.0.0.1',
  user: 'root',
  password: '123456',
  database: 'my_db_01'
});
module.exports=pool