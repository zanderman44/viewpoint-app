const Member = require('../models/Member')
const Message = require('../models/Message')
const Friend = require('../models/Friend')

exports.home = async (req, res) => {
  if (req.session.member) {
    // get current member's feeds
    let messages = await Message.getFeed(req.session.member._id)
    res.render('member-dashboard', {messages: messages})
  } else {
    res.render('index', {registrationErrors: req.flash('registrationErrors')})
  }
}

exports.registration = (req, res) => {
  let member = new Member(req.body)
  member.register().then(() => {
    req.session.member = {username: member.memberData.username,
      _id: member.memberData._id,
      avatar: member.memberData.avatarData.avatarChars,
      red: member.memberData.avatarData.redValue,
      green: member.memberData.avatarData.greenValue,
      blue: member.memberData.avatarData.blueValue
    }
    req.session.save(() => {
      res.redirect('/')
    })
  }).catch((registrationErrors) => {
    registrationErrors.forEach((errorMessage) => {
      req.flash('registrationErrors', errorMessage)
    })
    req.session.save(() => {
      res.redirect('/')
    })
  })
}

exports.login = (req, res) => {
  let member = new Member(req.body)
  member.login().then(() => {
    req.session.member = {username: member.memberData.username,
      _id: member.memberData._id,
      avatar: member.memberData.avatarData.avatarChars,
      red: member.memberData.avatarData.redValue,
      green: member.memberData.avatarData.greenValue,
      blue: member.memberData.avatarData.blueValue
    }
    req.session.save(() => {
    res.redirect('/')
    })
  }).catch((err) => {
    req.flash('errors', err)
    req.session.save(() => {
      res.redirect('/')
    })
  })
}

exports.checkIfLoggedIn = (req, res, next) => {
  if (req.session.member) {
    next()
  } else {
    req.flash('errors', "Log in first to perform that action")
    req.session.save(() => {
      res.redirect('/')
    })
  }
}

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
}

exports.ifMemberExits = (req, res, next) => {
  Member.findByUsername(req.params.username).then((memberDocument) => {
    req.memberProfile = memberDocument
    next()
  }).catch(() => {
    res.render("404")
  })
}

exports.displayProfileMessages = (req, res) => {
  // get messages associated with member
  Message.findByAuthorId(req.memberProfile._id).then((messages) => {
    res.render('member-profile', {
      currentPage: "messages",
      messages: messages,
      profileUsername: req.memberProfile.username,
      profileAvatar: req.memberProfile.avatar,
      profileRedCode: req.memberProfile.redCode,
      profileGreenCode: req.memberProfile.greenCode,
      profileBlueCode: req.memberProfile.blueCode,
      isFriend: req.isFriend,
      isMembersProfile: req.isMembersProfile,
      counts: {messageCount: req.messageCount, theirFriendCount: req.theirFriendCount, yourFriendsCount: req.yourFriendsCount}
    })
  }).catch(() => {
    res.render("404")
  })
}

exports.sharedProfileData = async (req, res, next) => {
  let isMembersProfile = false
  let isFriend = false
  if (req.session.member) {
    isMembersProfile = req.memberProfile._id.equals(req.session.member._id)
    isFriend = await Friend.isVisitorFriend(req.memberProfile._id, req.visitorId)
  }
  req.isMembersProfile = isMembersProfile
  req.isFriend = isFriend
  // retrieve tab counts
  let messageCountPromise = Message.countMessagesByAuthor(req.memberProfile._id)
  let theirFriendCountPromise = Friend.countTheirFriendById(req.memberProfile._id)
  let yourFriendsCountPromise = Friend.countYourFriendsById(req.memberProfile._id)
  let [messageCount, theirFriendCount, yourFriendsCount] = await Promise.all([messageCountPromise, theirFriendCountPromise, yourFriendsCountPromise]) 
  
  req.messageCount = messageCount
  req.theirFriendCount = theirFriendCount
  req.yourFriendsCount = yourFriendsCount

  next()
}

exports.displayTheirFriend = async (req, res) => {
  try {
    let theirFriends = await Friend.getTheirFriendById(req.memberProfile._id)
    res.render('profile-theirFriend', {
      currentPage: "theirFriend",
      theirFriends: theirFriends,
      profileUsername: req.memberProfile.username,
      profileAvatar: req.memberProfile.avatar,
      profileRedCode: req.memberProfile.redCode,
      profileGreenCode: req.memberProfile.greenCode,
      profileBlueCode: req.memberProfile.blueCode,
      isFriend: req.isFriend,
      isMembersProfile: req.isMembersProfile,
      counts: {messageCount: req.messageCount, theirFriendCount: req.theirFriendCount, yourFriendsCount: req.yourFriendsCount}
    })
  } catch {
    res.render("404")
  }
}

exports.displayYourFriends = async (req, res) => {
  try {
    let yourFriends = await Friend.getYourFriendsById(req.memberProfile._id)
    res.render('profile-yourFriends', {
      currentPage: "yourFriends",
      yourFriends: yourFriends,
      profileUsername: req.memberProfile.username,
      profileAvatar: req.memberProfile.avatar,
      profileRedCode: req.memberProfile.redCode,
      profileGreenCode: req.memberProfile.greenCode,
      profileBlueCode: req.memberProfile.blueCode,
      isFriend: req.isFriend,
      isMembersProfile: req.isMembersProfile,
      counts: {messageCount: req.messageCount, theirFriendCount: req.theirFriendCount, yourFriendsCount: req.yourFriendsCount}
    })
  } catch {
    res.render("404")
  }
}

exports.checkForDuplicateUsername = (req, res) => {
  Member.findByUsername(req.body.username).then(() => {
    res.json(true)
  }).catch(() => {
    res.json(false)
  })
}

exports.checkForDuplicateEmail = async (req, res) => {
  let emailBool = await Member.checkForDuplicateEmail(req.body.email)
  res.json(emailBool) 
}