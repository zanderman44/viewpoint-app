const express = require('express')
const app = express()
const session = require('express-session')
const sessionStore = require('connect-mongo')
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')

// set up the member session options
let sessionSetup = session({
    secret: "white juggler beech lamb",
    store: sessionStore.create({client: require('./db')}), // save session to mongodb
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
})


app.use(flash())
app.use(sessionSetup)

app.use ((req, res, next) => {
  // make markdown available within ejs templates
  res.locals.userHTML = (content) => {
    return sanitizeHTML(markdown.parse(content), {allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}})
  }

  // make flash messages available from all templates
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")

  // make current member id available on the req object
  if (req.session.member) {req.visitorId = req.session.member._id} else {req.visitorId = 0}
 
  // make member session data availble from within view-message.ejs
  res.locals.member = req.session.member
  next()
})

const router = require('./router')

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(express.static('public'))
app.set('view engine', 'ejs')

app.use('/', router)

const server = require('http').createServer(app)
const socketIo = require('socket.io')(server)

socketIo.use((socket, next) => {
  sessionSetup(socket.request, socket.request.res, next)
})

socketIo.on('connection', (socket) => {
  if (socket.request.session.member) {
    let member = socket.request.session.member
    socket.emit('chatStart', {username: member.username})
    socket.on('chatMessageToServer', (chatData) => {
      socket.broadcast.emit('chatMessageToBrowsers', {broadcastChat: sanitizeHTML(chatData.chatMessage, {allowedTags: [], allowedAttributes: {}}), username: member.username})
    })
  }
})

module.exports = server