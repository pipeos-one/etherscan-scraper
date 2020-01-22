const mysql = require('mysql')
const colors = require('colors')

const config = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  charset: 'utf8mb4'
}

// var connection = mysql.createConnection(config)
//
// connection.connect()

// module.exports = connection

function connectAndRestart (restartOnError = false, callback) {
  const connection = mysql.createConnection(config)

  connection.connect(err => {
    if (err) {
      console.log(colors.red('error when connecting to db'))
      setTimeout(() => {
        const newconn = connectAndRestart(restartOnError, callback)
        if (callback) callback(newconn)
      }, 2000)
    }
  })

  connection.on('error', err => {
    console.log(colors.red('db error'))
    console.error(err)

    if (restartOnError) {
      const newconn = connectAndRestart(restartOnError, callback)
      if (callback) callback(newconn)
    }
  })
  return connection
}

module.exports = connectAndRestart
