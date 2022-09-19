// const { post } = require('../app')

const messagesCollection = require('../db').db().collection("messages")
const friendCollection = require('../db').db().collection("friend")
const ObjectID = require('mongodb').ObjectId
const sanitizeHTML = require('sanitize-html')

let Message = function(messageData, memberId, requestedMessageId) {
  this.messageData = messageData
  this.memberId = memberId
  this.requestedMessageId = requestedMessageId
  this.errors = []
}

Message.prototype.cleanUp = function() {
  if (typeof(this.messageData.messageTitle) != "string") {this.messageData.messageTitle = ""}
  if (typeof(this.messageData.messageContent) != "string") {this.messageData.messageContent = ""}

  // ensure the data to be saved doesn't have any extra properties
  this.messageData = {
    messageTitle: sanitizeHTML(this.messageData.messageTitle.trim(), {allowedTags: [], allowedAttributes: {}}),
    messageContent: sanitizeHTML(this.messageData.messageContent.trim(), {allowedTags: [], allowedAttributes: {}}),
    createdDate: new Date(),
    author: ObjectID(this.memberId)
  }
}

Message.prototype.validate = function() {
  if (this.messageData.messageTitle == "") {this.errors.push("You must include a title")}
  if (this.messageData.messageContent == "") {this.errors.push("You must include a message")}
}

Message.prototype.saveMessage = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // save message to db
      messagesCollection.insertOne(this.messageData).then((info) => {
        resolve(info.insertedId)
      }).catch(() => {
        this.errors.push("Please try again later")
        reject(this.errors)
      })
    } else {
      reject(this.errors)    
    }
  })
}

Message.messageQuery = (uniqueOperations, visitorId, finalOperations = []) => {
  return new Promise( async (resolve, reject) => {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "members", localField: "author", foreignField: "_id", as: "messageAuthor"}},
      {$project: {
        messageTitle: 1,
        messageContent: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$messageAuthor", 0]}
      }}
    ]).concat(finalOperations)
    let messages = await messagesCollection.aggregate(aggOperations).toArray()
    // remove unrequired elements in each message object
    messages = messages.map((message) => {
      message.isVisitorAuthor = message.authorId.equals(visitorId)
      message.authorId = undefined
      message.author = {
        username: message.author.username,
        avatar: message.author.avatarData.avatarChars,
        redCode: message.author.avatarData.redValue,
        greenCode: message.author.avatarData.greenValue,
        blueCode: message.author.avatarData.blueValue
      }
      return message
    })
    resolve(messages)
  })
}

Message.findMessageById = (id, visitorId) => {
  return new Promise( async (resolve, reject) => {
    if (typeof(id) != "string" || !ObjectID.isValid(id)) {
      reject()
      return
    }
    let messages = await Message.messageQuery([
      {$match: {_id: new ObjectID(id)}}
    ], visitorId)
    if (messages.length) {
      resolve(messages[0])
    } else {
      reject()
    }
  })
}

Message.findByAuthorId = (authorId) => {
  return Message.messageQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ])
}

Message.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let message = await Message.findMessageById(this.requestedMessageId, this.memberId)
      if (message.isVisitorAuthor) {
        // okay to update db
        let status = await this.performUpdate()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Message.prototype.performUpdate = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await messagesCollection.findOneAndUpdate({_id: new ObjectID(this.requestedMessageId)}, {$set: {messageTitle: this.messageData.messageTitle, messageContent: this.messageData.messageContent}})
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}


Message.delete = function(messageToDelete, currentMemberId) {
  return new Promise(async (resolve, reject) => {
    try {
      let message = await Message.findMessageById(messageToDelete, currentMemberId)
      if (message.isVisitorAuthor) {
        await messagesCollection.deleteOne({_id: new ObjectID(messageToDelete)})
        resolve()
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Message.search = function(searchString) {
  return new Promise(async (resolve, reject) => {
    if (typeof(searchString) == "string") {
      let messages = await Message.messageQuery([
        {$match: {$text: {$search: searchString}}}        
      ], undefined, [{$sort: {score: {$meta: "textScore"}}}])
      resolve(messages)
    } else {
      reject()
    }
  })
}

Message.countMessagesByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let messageCount = await messagesCollection.countDocuments({author: id})
    resolve(messageCount)
  })
}

Message.getFeed = async function(id) {
  // create array of members who are followed
  let friendedMembers = await friendCollection.find({authorId: new ObjectID(id)}).toArray()
  friendedMembers = friendedMembers.map(function(friendedDoc) {
    return friendedDoc.friendId
  })
  // look for messages of authors in above array
  return Message.messageQuery([
    {$match: {author: {$in: friendedMembers}}},
    {$sort: {createdDate: -1}}
  ])
}

module.exports = Message