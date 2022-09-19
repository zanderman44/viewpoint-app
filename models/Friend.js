const membersCollection = require('../db').db().collection("members")
const friendCollection = require('../db').db().collection("friend")
const ObjectID = require('mongodb').ObjectId
const Member = require('./Member')

let Friend = function(friendRequestUsername, authorId) {
  this.friendRequestUsername = friendRequestUsername
  this.authorId = authorId
  this.errors = []
}

Friend.prototype.cleanUp = function() {
  if (typeof(this.friendRequestUsername) != "string") {this.friendRequestUsername = ""}
}

Friend.prototype.validate = async function(action) {
  // friendRequestUsername must exist in db
  let friendRequestAccount = await membersCollection.findOne({username: this.friendRequestUsername})
  if (friendRequestAccount) {
    this.friendId = friendRequestAccount._id
  } else {
    this.errors.push("You cannot follow someome who is not a member")
  }
  let alreadyAFriend = await friendCollection.findOne({friendId: this.friendId, authorId: new ObjectID(this.authorId)})
  if (action == "create") {
    if (alreadyAFriend) {this.errors.push("You are already following this person")}
  }
  if (action == "delete") {
    if (!alreadyAFriend) {this.errors.push("You are not following this person")}
  }
  // not able to follow yourself
  if (this.friendId.equals(this.authorId)) {this.errors.push("You cannot follow yourself")

  }
}  

Friend.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate("create")
    if (!this.errors.length) {
      await friendCollection.insertOne({friendId: this.friendId, authorId: new ObjectID(this.authorId)})
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Friend.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp()
      await this.validate("delete")
      if (!this.errors.length) {
        await friendCollection.deleteOne({friendId: this.friendId, authorId: new ObjectID(this.authorId)})
        resolve()
      } else {
        reject(this.errors)
      }
    })
  }

Friend.isVisitorFriend = async function(friendId, visitorId) {
  let friendDoc = await friendCollection.findOne({friendId: friendId, authorId: new ObjectID(visitorId)})
  if (friendDoc) {
    return true
  } else {
    return false
  }
}

Friend.getTheirFriendById = (id) => {
  return new Promise (async (resolve, reject) => {
    try {
      let theirFriend = await friendCollection.aggregate([
        {$match: {friendId: id}},
        {$lookup: {from: "members", localField: "authorId", foreignField: "_id", as: "memberDoc"}},
        {$project: {
          username: {$arrayElemAt: ["$memberDoc.username", 0]},
          avatar: {$arrayElemAt: ["$memberDoc.avatarData.avatarChars", 0]},
          redValue: {$arrayElemAt: ["$memberDoc.avatarData.redValue", 0]},
          greenValue: {$arrayElemAt: ["$memberDoc.avatarData.greenValue", 0]},
          blueValue: {$arrayElemAt: ["$memberDoc.avatarData.blueValue", 0]}
        }}
      ]).toArray()
      theirFriend = theirFriend.map(friend => {
      // might not be required depending on how I'm doing the avatar
        let member = new Member(friend, true)
        return {username: friend.username, avatar: friend.avatar, redCode: friend.redValue, greenCode: friend.greenValue, blueCode: friend.blueValue}
      })
      resolve(theirFriend)
    } catch {
      reject()
    }
  })
}

Friend.getYourFriendsById = (id) => {
  return new Promise (async (resolve, reject) => {
    try {
      let yourFriends = await friendCollection.aggregate([
        {$match: {authorId: id}},
        {$lookup: {from: "members", localField: "friendId", foreignField: "_id", as: "memberDoc"}},
        {$project: {
          username: {$arrayElemAt: ["$memberDoc.username", 0]},
          avatar: {$arrayElemAt: ["$memberDoc.avatarData.avatarChars", 0]},
          redValue: {$arrayElemAt: ["$memberDoc.avatarData.redValue", 0]},
          greenValue: {$arrayElemAt: ["$memberDoc.avatarData.greenValue", 0]},
          blueValue: {$arrayElemAt: ["$memberDoc.avatarData.blueValue", 0]}
         }}
      ]).toArray()
      yourFriends = yourFriends.map(friend => {
        let member = new Member(friend, true)
        return {username: friend.username, avatar: friend.avatar, redCode: friend.redValue, greenCode: friend.greenValue, blueCode: friend.blueValue}
      })
      resolve(yourFriends)
    } catch {
      reject()
    }
  })
}

Friend.countTheirFriendById = function(id) {
  return new Promise(async (resolve, reject) => {
    let theirFriendCount = await friendCollection.countDocuments({friendId: id})
    resolve(theirFriendCount)
  })
}

Friend.countYourFriendsById = function(id) {
  return new Promise(async (resolve, reject) => {
    let yourFriendsCount = await friendCollection.countDocuments({authorId: id})
    resolve(yourFriendsCount)
  })
}

module.exports = Friend