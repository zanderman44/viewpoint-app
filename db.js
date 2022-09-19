const dotenv = require('dotenv')
dotenv.config()

const {MongoClient} = require('mongodb')

const dbClient = new MongoClient(process.env.DBCONNECTIONSTRING)

start = async () => {
  await dbClient.connect()
  module.exports = dbClient
  const app = require('./app')
  app.listen(process.env.PORT)
}

start()