const express = require('express')
const router = express.Router()
const memberController = require('./controllers/memberController')
const messageController = require('./controllers/messageController')
const friendController = require('./controllers/friendController')

// routes for members
router.get('/', memberController.home)
router.post('/registration', memberController.registration)
router.post('/login', memberController.login)
router.post('/logout', memberController.logout)
router.post('/checkForDuplicateUsername', memberController.checkForDuplicateUsername)
router.post('/checkForDuplicateEmail', memberController.checkForDuplicateEmail)

// routes for messages
router.get('/new-message', memberController.checkIfLoggedIn, messageController.displayNewMessagePage)
router.post('/new-message', memberController.checkIfLoggedIn, messageController.saveMessage)
router.get('/message/:id', messageController.viewMessage)
router.get('/message/:id/edit', memberController.checkIfLoggedIn, messageController.editMessage)
router.post('/message/:id/edit', memberController.checkIfLoggedIn, messageController.edit)
router.post('/message/:id/delete', memberController.checkIfLoggedIn, messageController.delete)
router.post('/search', messageController.search)

// routes for member profile
router.get('/profile/:username', memberController.ifMemberExits, memberController.sharedProfileData, memberController.displayProfileMessages)
router.get('/profile/:username/theirFriend', memberController.ifMemberExits, memberController.sharedProfileData, memberController.displayTheirFriend)
router.get('/profile/:username/yourFriends', memberController.ifMemberExits, memberController.sharedProfileData, memberController.displayYourFriends)

// routes for following other members
router.post('/addFriend/:username', memberController.checkIfLoggedIn, friendController.addFriend)
router.post('/removeFriend/:username', memberController.checkIfLoggedIn, friendController.removeFriend)

module.exports = router