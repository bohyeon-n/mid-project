import axios from 'axios'

const mallAPI = axios.create({
  baseURL: process.env.API_URL
})

const rootEl = document.querySelector(".root")
const templates = {
  join: document.querySelector('#join').content,
  login: document.querySelector('#login').content,
  list: document.querySelector("#list").content,
  itemEl: document.querySelector("#item").content,
  regist: document.querySelector('#regist').content,
  bag: document.querySelector('#bag').content
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
mainPage()
})
render(frag)
}



// 로그인 
document.querySelector('.login').addEventListener('click', e => {
  if(!(localStorage.getItem('token'))) {
    loginPage()
  }else {
    logout()
    document.querySelector('.login').textContent="로그아웃"
  }
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
  const idRes = await mallAPI.get(`users?username=${payload.username}`)
  console.log(idRes)
  console.log(payload.username)
  console.log(`id: ${idRes.data[0].id}`)
  localStorage.setItem('userId', idRes.data[0].id)
  document.querySelector(".login").textContent = "로그아웃"
  mainPage('/items')
})
frag.querySelector('.modal-close').addEventListener('click', e => {
  mainPage('/items')
})
frag.querySelector(".join-btn").addEventListener('click', e => {
  joinPage();
})
render(frag)
}
// 상품 메인 페이지 
async function mainPage(url) {
  const listFrag = document.importNode(templates.list, true)
  const list = listFrag.querySelector('.columns')
  const res = await mallAPI.get(url)
  for (const {id, title, descriptions, price, likeCount} of res.data){
    const frag = document.importNode(templates.itemEl, true)
    frag.querySelector(".item__likeCount").textContent = likeCount
    frag.getElementById('img').src = descriptions[0].img
    frag.querySelector('.item__description').textContent = descriptions[0].body
    frag.querySelector('.item__price').textContent = price
    frag.querySelector('.inBag').addEventListener('click', async e => {
      const payload = {
        itemId: id,
        userId: localStorage.getItem('userId'),
        quantity: 1,
        created: "0513"
      }
      console.log(payload)
      const res = await mallAPI.post('/bags',payload)
    })
    list.appendChild(frag)   
    // 장바구니 클릭 시 장바구니로 들어간다.
  }
  render(listFrag)
}
mainPage('/items')
// 카테고리 클릭하면 카테고리별로 아이템이 나온다.  카테고리 페이지
function title(title) {
  document.querySelector('.title').textContent = title
}
document.querySelector('.outer').addEventListener('click', e => {
  title('outer')
  mainPage('/items?category=outer')
})
document.querySelector('.top').addEventListener('click', e => {
  title('top')
  mainPage('/items?category=top')
})
document.querySelector('.bottom').addEventListener('click', e => {
  title('bottom')
  mainPage('/items?category=bottom')
})
document.querySelector('.dress').addEventListener('click', e => {
  title('dress')
  mainPage('/items?category=dress')
})
document.querySelector('.acc').addEventListener('click', e => {
  title('acc')
  mainPage('/items?category=acc')
})

// 장바구니 사용자의 장바구니를 보여준다.

document.querySelector('.bag').addEventListener('click', e => {
  bagPage()
})

async function bagPage() {
  const listFrag = document.importNode(templates.list)
  const res = await mallAPI.get(`/bags?userId=${localStorage.getItem('userId')}`)
  console.log(res.data)
  for(const {itemId, quantity, created} of res.data) {

    const itemRes = await mallAPI.get(`/items?id=${itemId}`)
    const frag = document.importNode(templates.bag, true)
    console.log(itemRes.data)
    frag.querySelector('.item__title').textContent = itemRes.data[0].title
    console.log(itemRes.data[0].price)
    frag.querySelector('.item__price').textContent = itemRes.data[0].price
    frag.querySelector('.item__quantity').textContent = quantity
    frag.querySelector('.item__img').src = itemRes.data[0].descriptions[0].img
    listFrag.appendChild(frag)
  }
  title(`장바구니`)
  render(listFrag)
}

// 로그인 로그아웃 버튼 체인지

// if(localStorage.getItem('token')) {
//   document.querySelector('.login').textContent = "로그아웃"
//   mainPage()
// } else {
//   document.querySelector('.login').textContent = "로그인"
//   mainPage()
// }
// 상품등록 임시로 만들기 
document.querySelector('.register').addEventListener('click', e => {
  regist()
})
async function regist() {
  const frag = document.importNode(templates.regist, true)
  frag.querySelector('.regist__form').addEventListener('submit', async e => {
    e.preventDefault()
  const payload = {
    category: e.target.elements.category.value,
    title: e.target.elements.title.value,
    price: e.target.elements.price.value,
    descriptions: [
     {
       img: e.target.elements.mainImg.value,
       body: e.target.elements.mainBody.value
      },
     {
      img: e.target.elements.subImg.value,
      body: e.target.elements.subBody.value,
     }  
   ],
    likeCount: 0
   } 
   console.log(payload)
   const res = await mallAPI.post('/items', payload)
   regist()
  })
  render(frag)
}
