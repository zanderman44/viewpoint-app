import DOMPurify from 'dompurify'

export default class Chat {
  constructor() {
    this.chatAlreadyOpened = false
    this.chatBox = document.querySelector("#chat-box")
    this.openChat = document.querySelector(".chat-icon")
    this.injectHTML()
    this.chatField = document.querySelector("#chatField")
    this.chatForm = document.querySelector("#chatForm")
    this.closeChat = document.querySelector(".chat-close-icon")
    this.chatLog = document.querySelector("#chat-log")
    this.events()
  }


  // Events
  events() {
    this.openChat.addEventListener("click", () => this.displayChat())
    this.closeChat.addEventListener("click", () => this.hideChat())
    this.chatForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.sendChatToServer()
    })
  }

  // Methods
  injectHTML() {
    this.chatBox.innerHTML = `
    <div class="chat-title-header">Chat<span class="chat-close-icon"><i class="bi bi-x-square-fill"></i></span></div>
    <div id="chat-log" class="chat-log"></div>
    <form id="chatForm" class="chat-form border-top">
      <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
    </form>
    `
  }

  displayChat() {
    if (!this.chatAlreadyOpened) {
      this.openConnection()
    }
    this.chatAlreadyOpened = true
    this.chatBox.classList.add("chat--visible")
    this.chatField.focus()
  }

  hideChat() {
    this.chatBox.classList.remove("chat--visible")
  }

  openConnection() {
    this.socket = io()
    this.socket.on('chatStart', data => {
      this.username = data.username
      // avatar line goes here
    })
    this.socket.on('chatMessageToBrowsers', (chatData) => {
      this.displayMessagesOnBrowsers(chatData)
    })
  }

  sendChatToServer() {
    this.socket.emit('chatMessageToServer', {chatMessage: this.chatField.value})
    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
      <div class="chat-self">
        <div class="chat-message">
          <div class="chat-message-inner">
            ${this.chatField.value}
          </div>
        </div>
        <img class="chat-avatar avatar-tiny" src="">
      </div>
    `))
    this.chatLog.scrollTop = this.chatLog.scrollHeight
    this.chatField.value = ""
    this.chatField.focus()
  }

  displayMessagesOnBrowsers(chatData) {
    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
      <div class="chat-other">
        <a href="/profile/${chatData.username}"><img class="avatar-tiny" src=""></a>
        <div class="chat-message"><div class="chat-message-inner">
          <a href="/profile/${chatData.username}"><strong>${chatData.username}:</strong></a>
          ${chatData.broadcastChat}
        </div></div>
      </div>
    `))
    this.chatLog.scrollTop = this.chatLog.scrollHeight
  }
}