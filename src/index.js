import axios from 'axios'

const mallAPI = axios.create({
  baseURL: process.env.API_URL
})

const rootEl = document.querySelector(".root")
const templates = {
  join: document.querySelector('#join').content,
  login: document.querySelector('#login').content,
  list: document.querySelector("#list").content,
  itemEl: document.querySelector("#item").content
}

function render(frag) {
  rootEl.textContent = ""
  rootEl.appendChild(frag)
}
function login(token) {
  localStorage.setItem('token', token)
  mallAPI.defaults.headers['Authorization'] = `Bearer ${token}`
}
function logout() {
  localStorage.removeItem('token')
  delete mallAPI.defaults.headers['Authorization']
}




// 회원가입
document.querySelector('.join').addEventListener('click', e => {
  joinPage()
})
async function joinPage() {
const frag = document.importNode(templates.join, true)
const formEl = frag.querySelector('.join__form')

formEl.addEventListener('submit', async e => {
  e.preventDefault()
 const payload = {
   username: e.target.elements.username.value,
   password: e.target.elements.password.value
   
  }
  const detailPaylaod = {
    address: e.target.elements.address.value,
    phone: e.target.elements.phone.value

 }
 const res = await mallAPI.post('/users/register', payload)
 login(res.data.token)
 const idRes = await mallAPI.get(`/users?username=${payload.username}`)
 console.log(idRes.data[0].id)
//  접근권한 없음으로 나옴. user register 등록할 때 정보를 함께 넘겨주려고 했지만 실패함...
//  const detailRes = await mallAPI.patch(`/users/${idRes.data[0].id}`, detailPaylaod)
})
render(frag)
}



// 로그인 
document.querySelector('.login').addEventListener('click', e => {
  loginPage()
})

async function loginPage() {
const frag = document.importNode(templates.login, true)
const formEl = frag.querySelector('.login__form')

formEl.addEventListener('submit', async e => {
  e.preventDefault()
  const payload = {
    username: e.target.elements.username.value,
    password: e.target.elements.password.value
  }
  const res = await mallAPI.post('/users/login',payload)
  login(res.data.token)
})
render(frag)
}

async function mainPage() {
  const listFrag = document.importNode(templates.list, true)
  const list = listFrag.querySelector('.columns')
  const res = await mallAPI.get('/items')
  console.log(res.data[0].descriptions[0].body)
  console.log(res.data[0].likeCount)
  for (const {artist, title, descriptions, price, likeCount} of res.data){
    const frag = document.importNode(templates.itemEl, true)
    frag.querySelector(".item__likeCount").textContent = likeCount
    frag.querySelector('.item__artist').textContent = artist
    frag.querySelector('.item__img').src = descriptions[0].image
    frag.querySelector('.item__description').textContent = descriptions[0].body
    frag.querySelector('.item__price').textContent = price
    list.appendChild(frag)   
  }
  rootEl.appendChild(listFrag)
}
mainPage()
