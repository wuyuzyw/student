const mysql=require('mysql')
var pool = mysql.createPool({
  // connectionLimit: 10,
  host: '127.0.0.1',
  user: 'root',
  password: '123456',
  database: 'my_db_01'
});
module.exports=pool