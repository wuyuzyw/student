const fs = require('fs')
const path = require('path')
const privateKey = fs.readFileSync(path.join(__dirname, '../privateKey.txt'), 'utf-8');
module.exports=privateKey