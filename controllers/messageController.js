const Message = require('../models/Message')

exports.displayNewMessagePage = (req, res) => {
  res.render('new-message')
}

exports.saveMessage = (req, res) => {
  let message = new Message(req.body, req.session.member._id)
  message.saveMessage().then((newId) => {
    req.flash("success", "New message created")
    req.session.save(() => res.redirect(`/message/${newId}`))
  }).catch((errors) => {
    errors.forEach(error => req.flash("errors", error))
    req.session.save(() => res.redirect("/new-message"))
  })
}

exports.viewMessage = async (req, res) => {
  try {
    let message = await Message.findMessageById(req.params.id, req.visitorId)
    res.render('view-message', {message: message, messageTitle: message.messageTitle})
  } catch {
    res.render('404')
  }
}

exports.editMessage = async (req, res) => {
  try {
    let message = await Message.findMessageById(req.params.id, req.visitorId)
    if (message.isVisitorAuthor) {
    //if (message.authorId == req.visitorId) {
      res.render("edit-message", {message: message})
    } else {
      req.flash("errors", "You are not permitted to edit that message")
      req.session.save(() => res.redirect("/"))
    }
  } catch {
    res.render('404')
  }
}
// runs when the 'Save Changes' button is pressed in the message edit view
exports.edit = (req, res) => {
  let message = new Message(req.body, req.visitorId, req.params.id)
  message.requestedMessageId = message.requestedMessageId.trim()
  message.update().then((status) => {
    // message successfully updated to the db
    // visitor is the author but validation errors
    if (status == "success") {
      // message was updated successfully
      req.flash("success", "Message updated")
      req.session.save(() => {
        res.redirect(`/message/${req.params.id.trim()}/edit`)
      })
    } else {
      message.errors.forEach((error) => {
        req.flash("errors", error)
      })
      req.session.save(() => {
        res.redirect(`/message/${req.params.id}/edit`)
      })
    }
  }).catch(() => {
    // message with requested id doesn't exist
    // or current visitor isn't the author
    req.flash("errors", "Only the author can edit the message")
    req.session.save(() => {
      res.redirect("/")
    })
  })
}

exports.delete = (req, res) => {
  Message.delete(req.params.id, req.visitorId).then(() => {
    req.flash("success", "Message deleted")
    req.session.save(() => res.redirect(`/profile/${req.session.member.username}`))
  }).catch(() => {
    req.flash("errors", "You are not permitted to delete the message")
    req.session.save(() => res.redirect("/"))
  })
}

exports.search = (req, res) => {
  Message.search(req.body.searchString).then(messages => {
    res.json(messages)
  }).catch(() => {
    res.json([])
  })
}
