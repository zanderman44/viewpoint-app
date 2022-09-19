import axios from 'axios'
import DOMPurify from 'dompurify'

export default class Search {
  // DOM elements
  constructor() {
    this.insertHTML()
    this.searchIcon = document.querySelector(".search-icon")
    this.searchPopup = document.querySelector(".search-popup")
    this.closeSearchIcon = document.querySelector(".close-search")
    this.searchInput = document.querySelector("#search-input-field")
    this.searchResults = document.querySelector(".search-results")
    this.searchLoaderIcon = document.querySelector(".spinner-border")
    this.typingTimer
    this.previousKey = ""
    this.events()
  }

  // Events
  events() {
    this.searchIcon.addEventListener("click", (e) => {
      e.preventDefault()
      this.openSearchPopup()
    })

    this.searchInput.addEventListener("keyup", () => this.keyUpHandler())
    this.closeSearchIcon.addEventListener("click", () => this.closeSearchPopup())
  }

  // Methods
  openSearchPopup() {
    this.searchPopup.classList.add("search-popup--visible")
    setTimeout(() => this.searchInput.focus(), 50)
  }

  keyUpHandler() {
    let value = this.searchInput.value

    if (value == "") {
      clearTimeout(this.typingTimer)
      this.hideLoaderIcon()
      this.hideSearchResults()
    }

    if(value != "" && value !=this.previousKey) {
      clearTimeout(this.typingTimer)
      this.displayLoaderIcon()
      this.hideSearchResults()
      this.typingTimer = setTimeout(() => this.sendRequest(), 750)
    }

    this.previousKey = value
  }

  
  sendRequest() {
    axios.post('/search', {searchString: this.searchInput.value}).then(response => {
      console.log(response.data)
      this.renderSearchResults(response.data)
    }).catch(() => {
      alert("request failed")  
    })
  }
  
  renderSearchResults(messages) {
    if (messages.length) {
      this.searchResults.innerHTML = DOMPurify.sanitize(`<div class="list-group shadow-sm">
      <div class="list-group-item main-color text-color"><strong>Search Results</strong> (${messages.length > 1 ? `${messages.length} items found` : '1 item found'})</div>
      ${messages.map(message => {
        let messageDate = new Date(message.createdDate)
        return `<a href="/message/${message._id}" class="list-group-item list-group-item-action">
        <img class="avatar-tiny" src=""> <strong>${message.messageTitle}</strong>
        <span class="text-muted small">by ${message.author.username} on ${messageDate.getDate()}/${messageDate.getMonth() + 1}/${messageDate.getFullYear()}</span>
      </a>`
      }).join('')}

    </div>`)
    } else {
      this.searchResults.innerHTML = `<p class="alert alert-danger text-center shadow-sm">No results found</p>`
    }
    this.hideLoaderIcon()
    this.displaySearchResults()
  }

  displayLoaderIcon() {
    this.searchLoaderIcon.classList.add("spinner-border--visible")
  }

  hideLoaderIcon() {
    this.searchLoaderIcon.classList.remove("spinner-border--visible")
  }

  displaySearchResults() {
    this.searchResults.classList.add("display-search-results--visible")
  }

  hideSearchResults() {
    this.searchResults.classList.remove("display-search-results--visible")
  }

  closeSearchPopup() {
    this.searchPopup.classList.remove("search-popup--visible")
  }

  insertHTML() {
    document.body.insertAdjacentHTML('beforeend', `
    <div class="search-popup">
      <div class="search-popup-header shadow-sm pt-4 pb-4 d-flex justify-content-center">
        <div class="col-10 d-flex justify-content-center">
          <label for="search-input-field" class="search-popup-icon me-2"><i class="bi bi-search"></i></label>
          <input type="text" id="search-input-field" class="search-input-field ps-2 col-5" autocomplete="off" placeholder="What would you like to search for?">
          <a class="close-search ms-2"><i class="bi bi-x-square-fill"></i></a>
        </div>
      </div>

      <div class="search-popup-bottom row justify-content-center">
        <div class="container-lg row justify-content-center py-5">
        <div class="spinner-border" role="status"></div>
        <div class="search-results col-8"></div>
        </div>
      </div>
    </div>
    `)
  }
}