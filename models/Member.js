const validator = require("validator")
const membersCollection = require ('../db').db().collection("members")
const bcrypt = require("bcryptjs")

let Member = function(regData) {
  this.memberData = regData
  this.errors = []
}

Member.prototype.dataClean = function() {
  if (typeof(this.memberData.username) != "string") {this.memberData.username = ""}
  if (typeof(this.memberData.email) != "string") {this.memberData.email = ""}
  if (typeof(this.memberData.password) != "string") {this.memberData.password = ""}

  // trim and format supplied new member data
  this.memberData = {
    username: this.memberData.username.trim().toLowerCase(),
    email: this.memberData.email.trim().toLowerCase(),
    password: this.memberData.password
  }
}

// Validating entered member details
Member.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    if (this.memberData.username == "") {this.errors.push("You must set up a username.")}
    if (this.memberData.username.length > 0 && this.memberData.username.length < 4) {this.errors.push("Username must be at least 4 characters")}
    if (this.memberData.username.length > 20) {this.errors.push("Username must not exceed 20 characters.")}
    if (this.memberData.username != "" && !validator.isAlphanumeric(this.memberData.username)) {this.errors.push("Username can only contain letters and numbers.")}
    if (!validator.isEmail(this.memberData.email)) {this.errors.push("You must use a valid email address.")}  
    if (this.memberData.password == "") {this.errors.push("You must set a password.")}
    if (this.memberData.password.length > 0 && this.memberData.password.length < 6) {this.errors.push("Password must be a minimum of 6 characters")}
    if (this.memberData.password.length > 50) {this.errors.push("Password must not exceed 50 characters.")}
  
    // If valid username, check to see if it's already been taken
    if (this.memberData.username.length > 3 && this.memberData.username.length < 21 && validator.isAlphanumeric(this.memberData.username)) {
      let usernameTaken = await membersCollection.findOne({username: this.memberData.username})  //search db for entered username
      if (usernameTaken) {this.errors.push("That username is already taken")}
    }
  
    // If valid email, check to see if it's already been taken
    if (validator.isEmail(this.memberData.email)) {
      let emailTaken = await membersCollection.findOne({email: this.memberData.email})  //search db for entered email
      if (emailTaken) {this.errors.push("That email address is already being used")}
    }
    resolve()
  })
}

Member.prototype.createAvatar = function() {
  const avatarChars = this.memberData.username.slice(0,1) + this.memberData.username.slice(-1)
  const charCodeRed = avatarChars.charCodeAt(0)
  const charCodeGreen = avatarChars.charCodeAt(1)

  const red = Math.pow(charCodeRed, 7) % 200
  const green = Math.pow(charCodeGreen, 7) % 200
  const blue = Math.pow(charCodeRed + charCodeGreen, 7) % 200

  const avatarData = {avatarChars: avatarChars, redValue: red, greenValue: green, blueValue: blue}
  this.memberData.avatarData = avatarData
}



Member.prototype.register = function() {
  return new Promise (async (resolve, reject) => {
    this.dataClean()      // Clean the supplied new member data
    await this.validate()       // Validate supplied new member data
    this.createAvatar()
    // If no validation errors, save member data to database
    if (!this.errors.length) {
      let salt = bcrypt.genSaltSync(10)   // hashing member password
      this.memberData.password = bcrypt.hashSync(this.memberData.password, salt)
      await membersCollection.insertOne(this.memberData)  // save member data to database
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Member.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.dataClean()
    membersCollection.findOne({username: this.memberData.username}).then((validMember) => {
      if (validMember && bcrypt.compareSync(this.memberData.password, validMember.password)) {
        this.memberData = validMember
        resolve()
      } else {
        reject("Invalid usermane or password")
      }    
    }).catch(() => reject("Please try again later"))
  })
}

Member.findByUsername = (username) => {
  return new Promise((resolve, reject) => {
    if (typeof(username) != "string") {
      reject()
      return
    }
    membersCollection.findOne({username: username}).then((memberDoc) => {
      if (memberDoc) {
        memberDoc = new Member(memberDoc, true)
        memberDoc = {
          _id: memberDoc.memberData._id,
          username: memberDoc.memberData.username,
          avatar: memberDoc.memberData.avatarData.avatarChars,
          redCode: memberDoc.memberData.avatarData.redValue,
          greenCode: memberDoc.memberData.avatarData.greenValue,
          blueCode: memberDoc.memberData.avatarData.blueValue
        }
        resolve(memberDoc)
      } else {
        reject()
      }
    }).catch(() => {
      reject()
    })
  })
}


Member.checkForDuplicateEmail = (email) => {
  return new Promise(async (resolve, reject) => {
    if (typeof(email) != "string") {
      resolve(false)
      return
    }

    let member = await membersCollection.findOne({email: email})
    if (member) {
      resolve(true)
    } else {
      resolve (false)
    }
  })
}

module.exports = Member