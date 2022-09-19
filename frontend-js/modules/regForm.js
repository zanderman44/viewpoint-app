import axios from "axios"

export default class RegForm {
  constructor() {
    this.form = document.querySelector("#reg-form")
    this.allFields = document.querySelectorAll("#reg-form .form-control")
    this.insertValElements()
    this.username = document.querySelector("#username-reg")
    this.username.previousValue = ""
    this.email = document.querySelector("#email-reg")
    this.email.previousValue = ""
    this.password = document.querySelector("#password-reg")
    this.password.previousValue = ""
    this.username.isUnique = false
    this.email.isUnique = false
    this.events()
  }

  // events
  events() {
    this.form.addEventListener("submit", e => {
      e.preventDefault()
      this.formSubmitHandler()
    })

    this.username.addEventListener("keyup", () => {
      this.isDifferent(this.username, this.usernameHandler)
    })

    this.email.addEventListener("keyup", () => {
      this.isDifferent(this.email, this.emailHandler)
    })

    this.password.addEventListener("keyup", () => {
      this.isDifferent(this.password, this.passwordHandler)
    })

    this.username.addEventListener("blur", () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
  
    this.email.addEventListener("blur", () => {
      this.isDifferent(this.email, this.emailHandler)
    })
  
    this.password.addEventListener("blur", () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
  }

  //methods
  insertValElements() {
    this.allFields.forEach((el) => {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValMessage"></div>')
    })
  }


  isDifferent(el, handler) {
    if (el.previousValue != el.value) {
      handler.call(this)
    }
    el.previousValue = el.value
  }


  usernameHandler() {
    this.username.errors = false
    this.usernameImmed()
    clearTimeout(this.username.timer)
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 750)
  }


  emailHandler() {
    this.email.errors = false
    this.hideValError(this.email)
    clearTimeout(this.email.timer)
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 2000)
  }


  passwordHandler() {
    this.password.errors = false
    this.passwordImmed()
    clearTimeout(this.password.timer)
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 750)
  }


  usernameImmed() {
    if (this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.displayValError(this.username, "Username can only contain letters and numbers")
    }

    if (this.username.value.length > 20) {
        this.displayValError(this.username, "Username must be 20 characters or less")
    }

    if (!this.username.errors) {
      this.hideValError(this.username)
    }
  }


  usernameAfterDelay() {
    if (this.username.value.length < 4 && !this.username.value == "") {
      this.displayValError(this.username, "Username must be at least 4 characters")
    }

    if (!this.username.errors) {
      axios.post('/checkForDuplicateUsername', {username: this.username.value}).then((response) => {
        if (response.data) {
          this.displayValError(this.username, "That username is already being used")
          this.username.isUnique = false
        } else {
            this.username.isUnique = true
        }
      }).catch(() => {
        console.log("There was a problem, please try again later")
      })
    }
  }

  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value) && !this.email.value == "") {
      this.displayValError(this.email, "You must provide a valid email address")
    }
        
    if (!this.email.errors) {
      axios.post('/checkForDuplicateEmail', {email: this.email.value}).then((response) => {
        if (response.data) {
          this.email.isUnique = false
          this.displayValError(this.email, "That email is already being used")
        } else {
          this.email.isUnique = true
          this.hideValError(this.email)
        }
      }).catch(() => {
        console.log("There was a problem, please try again later")
      })
    }
  }

  passwordImmed() {
    if (this.password.value.length > 50) {
      this.displayValError(this.password, "Password must not exceed 50 characters")
    }

    if (!this.password.errors) {
        this.hideValError(this.password)
    }
  }


  passwordAfterDelay() {
    if (this.password.value.length < 6 && !this.password.value == "") {
        this.displayValError(this.password, "Password must be a minimum of 6 characters")
    }
  }


  formSubmitHandler() {
    this.usernameImmed()
    this.usernameAfterDelay()
    this.emailAfterDelay()
    this.passwordImmed()
    this.passwordAfterDelay()
    if (
      this.username.isUnique && 
      !this.username.errors && 
      this.email.isUnique &&
      !this.email.errors &&
      !this.password.errors
      ) {
      this.form.submit()  
    }
  }


  displayValError(el, errMessage) {
    el.nextElementSibling.innerHTML = errMessage
    el.nextElementSibling.classList.add("liveValMessage--visible")
    el.errors = true
  }

  hideValError(el) {
    el.nextElementSibling.classList.remove("liveValMessage--visible")
  }

}