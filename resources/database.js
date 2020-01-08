const mysql = require('mysql')

var connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  charset: 'utf8mb4'
})

connection.connect()

module.exports = connection
