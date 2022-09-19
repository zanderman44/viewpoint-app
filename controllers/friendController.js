const Friend = require('../models/Friend')

exports.addFriend = (req, res) => {
  let friend = new Friend(req.params.username, req.visitorId)
  friend.create().then(() => {
    req.flash("success", `You are now following ${req.params.username}`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  }).catch((errors) => {
    errors.forEach(error => {
      req.flash("errors", error)
    })
    req.session.save(() => res.redirect('/'))
  })
}

exports.removeFriend = (req, res) => {
  let friend = new Friend(req.params.username, req.visitorId)
  friend.delete().then(() => {
    req.flash("success", `You are no longer following ${req.params.username}`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  }).catch((errors) => {
    errors.forEach(error => {
      req.flash("errors", error)
    })
    req.session.save(() => res.redirect('/'))
  })
}