import Search from './modules/search'
import Chat from './modules/chat'
import RegForm from './modules/regForm'

if (document.querySelector(".search-icon")) {new Search()}

if (document.querySelector("#chat-box")) {new Chat()}

if (document.querySelector("#reg-form")) {new RegForm()}