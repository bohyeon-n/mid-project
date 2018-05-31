import axios from "axios";

const mallAPI = axios.create({
  baseURL: process.env.API_URL
});

const rootEl = document.querySelector(".root");
const templates = {
  join: document.querySelector("#join").content,
  login: document.querySelector("#login").content,
  list: document.querySelector("#list").content,
  itemEl: document.querySelector("#item").content,
  regist: document.querySelector("#regist").content,
  bag: document.querySelector("#bag").content,
  totalPrice: document.querySelector("#totalPrice").content,
  order: document.querySelector("#order").content,
  orderItem: document.querySelector("#orderItem").content,
  detail: document.querySelector("#detail").content,
  detailBody: document.querySelector("#detailBody").content,
  toBag: document.querySelector("#goToBag").content,
  myPage: document.querySelector("#myPage").content,
  myPageItem: document.querySelector("#myPageItem").content,
  orderHistory: document.querySelector("#orderHistory").content,
  orderHistoryItem: document.querySelector("#orderHistoryItem").content,
  administrator: document.querySelector("#administrator").content,
  manageItem: document.querySelector("#manageItem").content
};

function render(frag) {
  rootEl.textContent = "";
  rootEl.appendChild(frag);
}
function login(token) {
  localStorage.setItem("token", token);
  mallAPI.defaults.headers["Authorization"] = `Bearer ${token}`;
}
function logout() {
  localStorage.removeItem("token");
  delete mallAPI.defaults.headers["Authorization"];
  localStorage.removeItem("userId");
}

// 회원가입
document.querySelector(".member__join").addEventListener("click", e => {
  joinPage();
});
async function joinPage() {
  const frag = document.importNode(templates.join, true);
  const formEl = frag.querySelector(".join__form");

  formEl.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value
    };
    const detailPayload = {
      address: e.target.elements.address.value,
      phone: e.target.elements.phone.value
    };
    const res = await mallAPI.post("/users/register", payload);
    login(res.data.token);
    const meRes = await mallAPI.get("/me");
    console.log(`meRes: ${meRes.data.id}`);
    localStorage.setItem("userId", meRes.data.id);
    //403 서버가 사용하지 않는 웹 페이지나 미디어를 사용자가 요청할 때
    const detailRes = await mallAPI.patch(
      `/users/${meRes.data.id}`,
      detailPayload
    );
    mainPage();
  });
  title("회원가입");
  render(frag);
}

async function loginPage(arg) {
  const frag = document.importNode(templates.login, true);
  if (arg !== undefined) {
    frag.querySelector(".login__alert").textContent =
      "회원만 이용할 수 있는 서비스입니다.";
  }
  const formEl = frag.querySelector(".login__form");
  formEl.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      username: e.target.elements.username.value,
      password: e.target.elements.password.value
    };
    const res = await mallAPI.post("/users/login", payload);
    login(res.data.token);
    const idRes = await mallAPI.get(`users?username=${payload.username}`);
    localStorage.setItem("userId", idRes.data[0].id);
    document.querySelector(".member__login").textContent = "로그아웃";
    mainPage();
  });
  frag.querySelector(".modal-close").addEventListener("click", e => {
    mainPage();
  });
  frag.querySelector(".join-btn").addEventListener("click", e => {
    joinPage();
  });
  render(frag);
}
async function isOverlapItem(id) {
  const itemRes = await mallAPI.get(
    `/bags?userId=${localStorage.getItem(`userId`)}`
  );
  // 하나라도 같은 아이템이 있다면, 패치 요청을 보내준다. 아니라면 포스트 요청을 보낸다.
  console.log(`id: ${id}`);

  const filter = itemRes.data.filter(element => element.itemId === id);
  console.log(`filter:${filter[0]}`);
  if (filter[0]) {
    console.log("같은 아이템이 이미 장바구니에 있다. ");
    console.log(filter[0].quantity);
    const itemPayload = {
      quantity: ++filter[0].quantity
    };
    console.log(itemPayload);
    const res = await mallAPI.patch(`bags/${filter[0].id}`, itemPayload);
  } else {
    const payload = {
      itemId: id,
      userId: localStorage.getItem("userId"),
      quantity: 1,
      created: new Date()
    };
    const res = await mallAPI.post("/bags", payload);
  }
  // 요청을 보낸 후에는 장바구니로 이동할건지 물어본다.
  goToBag();
}

// 장바구니에 담지 않고 바로구매했을 시에 바로구매 함수
async function buyNow(id, title, descriptions, price) {
  const frag = document.importNode(templates.order, true);
  const fragItem = document.importNode(templates.orderItem, true);
  const orderList = frag.querySelector(".order-list");
  console.log(id, title, descriptions, price);
  fragItem.querySelector(".item__img").src = descriptions[0].img;
  fragItem.querySelector(".item__title").textContent = title;
  fragItem.querySelector(".item__price").textContent = price;
  fragItem.querySelector(".item__quantity").textContent = 1;
  orderList.appendChild(fragItem);
  frag.querySelector(".order__total").textContent = price;
  const item = [
    {
      title: title,
      itemId: id,
      itemImg: descriptions[0].img,
      price: price,
      quantity: 1
    }
  ];
  frag.querySelector(".order__form").addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name: e.target.elements.name.value,
      address: e.target.elements.address.value,
      tel: e.target.elements.tel.value,
      request: e.target.elements.request.value,
      created: new Date(),
      userId: localStorage.getItem("userId"),
      total: price,
      items: item
    };
    const orderRes = await mallAPI.post("/orderHistories", payload);

    myPage();
  });
  render(frag);
}

// 디테일 페이지
async function detailPage(id, title, descriptions, price) {
  const frag = document.importNode(templates.detail, true);
  frag.querySelector(".item__img").src = descriptions[0].img;
  frag.querySelector(".item__title").textContent = title;
  frag.querySelector(".item__price").textContent = price;
  const detail = frag.querySelector(".item__detail");
  for (const { img, body } of descriptions) {
    const detailFrag = document.importNode(templates.detailBody, true);
    detailFrag.querySelector(".detail__img").src = img;
    detailFrag.querySelector(".detail__body").textContent = body;
    detail.appendChild(detailFrag);
  }
  frag.querySelector(".buying").addEventListener("click", e => {
    buyNow(id, title, descriptions, price);
  });
  frag.querySelector(".inBag").addEventListener("click", async e => {
    isOverlapItem(id);
    // 요청을 보낸 후에는 장바구니로 이동할건지 물어본다.
    goToBag();
  });

  render(frag);

  console.log(title, descriptions, price);
}

// 상품 메인 페이지
async function mainPage(category = "all") {
  const listFrag = document.importNode(templates.list, true);
  const list = listFrag.querySelector(".columns");

  let url = "/items?_sort=id&_order=desc";
  if (category !== "all") {
    url = `items?category=${category}&_sort=id&_order=desc`;
  } else {
    title("new arrival");
  }

  const res = await mallAPI.get(url);
  for (const { id, title, descriptions, price, likeCount } of res.data) {
    const frag = document.importNode(templates.itemEl, true);
    frag.querySelector(".item__title").textContent = title;
    frag.querySelector(".item__likeCount").textContent = likeCount;
    frag.querySelector(".item__img").src = descriptions[0].img;

    frag.querySelector(".image").addEventListener("click", e => {
      detailPage(id, title, descriptions, price);
    });

    // frag.querySelector('.item__description').textContent = descriptions[0].body
    frag.querySelector(".item__price").textContent = price;

    frag.querySelector(".inBag").addEventListener("click", async e => {
      isOverlapItem(id);
    });
    frag.querySelector(".buying").addEventListener("click", e => {
      buyNow(id, title, descriptions, price);
    });
    list.appendChild(frag);
  }
  render(listFrag);
}

mainPage();

function goToBag() {
  const frag = document.importNode(templates.toBag, true);
  const notification = frag.querySelector(".notification");
  frag.querySelector(".toBag").addEventListener("click", e => {
    bagPage();
  });
  frag.querySelector(".continue").addEventListener("click", e => {
    rootEl.removeChild(notification);
  });
  frag.querySelector(".delete").addEventListener("click", e => {
    rootEl.removeChild(notification);
  });

  rootEl.appendChild(frag);
}
//카테고리 페이지
// 카테고리 클릭하면 카테고리별로 아이템이 나온다.
function title(title) {
  document.querySelector(".title").textContent = title;
}

function updateTitleAndGoToMainPage(pageName) {
  return function() {
    title(pageName);
    mainPage(pageName);
  };
}

document
  .querySelector(".outer")
  .addEventListener("click", updateTitleAndGoToMainPage("outer"));
document
  .querySelector(".top")
  .addEventListener("click", updateTitleAndGoToMainPage("top"));
document
  .querySelector(".bottom")
  .addEventListener("click", updateTitleAndGoToMainPage("bottom"));
document
  .querySelector(".dress")
  .addEventListener("click", updateTitleAndGoToMainPage("dress"));
document
  .querySelector(".acc")
  .addEventListener("click", updateTitleAndGoToMainPage("acc"));

// 장바구니 사용자의 장바구니를 보여준다.

document.querySelector(".member__bag").addEventListener("click", e => {
  if (localStorage.getItem("userId")) {
    bagPage();
  } else {
    loginPage(alert);
  }
});


async function bagPage() {
  const listFrag = document.importNode(templates.list, true);
  const userId = localStorage.getItem('userId')
  const res = await mallAPI.get(
    `/bags?userId=${userId}&_expand=item`
  );
  let totalPrice = 0;
  if (res.data.length === 0) {
    listFrag.querySelector(".alert").textContent =
      "장바구니에 담긴 상품이 없습니다.";
  } else {
    for (let { id, itemId, quantity, created, item } of res.data) {
      // 수량조정하기 버튼 클릭 시에 input value 바꿔주고, 통신해서 quantity patch요청보내기
      const frag = document.importNode(templates.bag, true);
      const quantityEl = frag.querySelector(".item__quantity");
      const upEl = frag.querySelector(".up");
      const downEl = frag.querySelector(".down");
      upEl.addEventListener("click", async e => {
        const payload = {
          quantity: ++quantity
        };
        const res = await mallAPI.patch(`/bags/${id}`, payload);
        bagPage();
      });
      downEl.addEventListener("click", async e => {
        if (quantity >= 1) {
          const payload = {
            quantity: --quantity
          };
          const res = await mallAPI.patch(`/bags/${id}`, payload);
        }
        bagPage();
      });
      frag.querySelector(".item__title").textContent = item.title;
      totalPrice += Number(item.price * quantity);
      frag.querySelector(".item__price").textContent = item.price;
      quantityEl.value = quantity;
      frag.querySelector(".item__totalPrice").textContent =
        quantity * item.price;
      frag.querySelector(".item__img").src =
        item.descriptions[0].img;
      frag.querySelector(".delete").addEventListener("click", async e => {
        const res = await mallAPI.delete(`/bags/${id}`);
        bagPage();
      });
      listFrag.appendChild(frag);
    }
    title(`장바구니`);
    // 합계 보여줌
    const totalFrag = document.importNode(templates.totalPrice, true);
    totalFrag.querySelector(".total").textContent = totalPrice;
    totalFrag.querySelector(".buy").addEventListener("click", e => {
      orderPage(res.data, item, totalPrice);
    });

    listFrag.appendChild(totalFrag);
  }
  render(listFrag);
  title("장바구니");
}

// 주문 페이지 (장바구니에서 주문했을 시에 )
async function orderPage(res, item, totalPrice) {
  console.log("totalprice: " + totalPrice);
  const frag = document.importNode(templates.order, true);
  const orderList = frag.querySelector(".order-list");
  for (let i = 0; i < item.length; i++) {
    const itemFrag = document.importNode(templates.orderItem, true);
    console.log(item);
    itemFrag.querySelector(".item__img").src = item[i].itemImg;
    itemFrag.querySelector(".item__title").textContent = item[i].title;
    itemFrag.querySelector(".item__quantity").textContent = item[i].quantity;
    itemFrag.querySelector(".item__price").textContent = item[i].price;
    orderList.appendChild(itemFrag);
  }
  frag.querySelector(".order__form").addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name: e.target.elements.name.value,
      address: e.target.elements.address.value,
      tel: e.target.elements.tel.value,
      request: e.target.elements.request.value,
      created: new Date(),
      userId: localStorage.getItem("userId"),
      total: totalPrice,
      items: item
    };
    const orderRes = await mallAPI.post("/orderHistories", payload);

    //주문 완료 시 장바구니 비워주기

    for (const { id } of res) {
      await mallAPI.delete(`/bags/${id}`);
    }

    myPage();
  });
  frag.querySelector(".order__total").textContent = totalPrice;
  title("주문페이지");
  render(frag);
}
document.querySelector(".member__myPage").addEventListener("click", e => {
  myPage();
});
// 주문내역확인 페이지
async function myPage() {
  const frag = document.importNode(templates.myPage, true);
  const res = await mallAPI.get(
    `/orderHistories?userId=${localStorage.getItem("userId")}`
  );
  console.log(res.data.length);
  if (res.data.length === 0) {
    frag.querySelector(".mypage__message").textContent =
      "주문하신 상품이 없습니다.";
  } else {
    for (const { name, created, total, items, id, address, tel } of res.data) {
      const itemFrag = document.importNode(templates.myPageItem, true);
      itemFrag.querySelector(".itemImg").src = items[0].itemImg;
      itemFrag.querySelector(".date").textContent = created;
      itemFrag.querySelector(".title").textContent = `${
        items[0].title
      } 외 ${items.length - 1}개 주문하셨습니다.`;
      itemFrag.querySelector(".total").textContent = total;
      // 주문 상세페이지
      itemFrag.querySelector(".title").addEventListener("click", e => {
        console.log(res.data);

        orderHistoryPage(name, created, total, items, id, address, tel);
      });
      frag.appendChild(itemFrag);
    }
  }
  render(frag);
  title("마이페이지");
}

async function orderHistoryPage(name, created, total, items, id, address, tel) {
  console.log(address);
  const frag = document.importNode(templates.orderHistory, true);
  frag.querySelector(".date").textContent = created;
  frag.querySelector(".total").textContent = total;
  frag.querySelector(".name").textContent = name;
  frag.querySelector(".address").textContent = address;
  frag.querySelector(".phone").textContent = tel;
  const fragList = frag.querySelector(".orderHistories__list");
  for (let i = 0; i < items.length; i++) {
    const itemFrag = document.importNode(templates.orderHistoryItem, true);
    itemFrag.querySelector(".image").src = items[i].itemImg;
    itemFrag.querySelector(".title").textContent = items[i].title;
    itemFrag.querySelector(".quantity").textContent = items[i].quantity;
    itemFrag.querySelector(".price").textContent = items[i].price;
    fragList.appendChild(itemFrag);
  }
  render(frag);
  title("주문 내역");
}
// 새로고침 할 때 로그인했는지 안했는지 보기

//관리자용
// 상품등록 임시로 만들기
async function addItem() {
  const frag = document.importNode(templates.regist, true);

  frag.querySelector(".regist__form").addEventListener("submit", async e => {
    e.preventDefault();
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
          body: e.target.elements.subBody.value
        }
      ],
      likeCount: 0
    };
    console.log(payload);
    const res = await mallAPI.post("/items", payload);
    regist();
  });

  render(frag);
}
async function editItem(id, title, price, descriptions) {
  const frag = document.importNode(templates.regist, true);
  frag.querySelector('.category').value = category
  frag.querySelector('.title').textContent = title
  frag.querySelector('.price').textContent = price
  frag.querySelector('.mainImg').src = descriptions[0].img 
  frag.querySelector('.')
}
document.querySelector(".member__admin").addEventListener("click", e => {
  manageItem();
});
async function manageItem() {
  const frag = document.importNode(templates.administrator, true);
  frag.querySelector(".addItem").addEventListener("click", e => {
    addItem();
  });
  const tbodyEl = frag.querySelector(".tbody");
  const res = await mallAPI.get("/items?_sort=id&_order=desc");
  for (const { id, title, price, descriptions, category } of res.data) {
    const fragItem = document.importNode(templates.manageItem, true);
    fragItem.querySelector(".item-title").textContent = title;
    console.log(`/items/${id}`);
    fragItem
      .querySelector(".item-delete")
      .addEventListener("click", async e => {
        // 삭제는 되는데 에러발생... 왜일까
        const res = await mallAPI.delete(`/items/${id}`);
      });
    fragItem.querySelector(".item-edit").addEventListener("click", e => {
      editItem(id, titld, price, descriptions, category)
    });
    tbodyEl.appendChild(fragItem);
  }
  render(frag);
  title("관리자 페이지");
}
