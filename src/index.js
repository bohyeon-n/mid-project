import axios from "axios";

const mallAPI = axios.create({
  baseURL: process.env.API_URL
});
const memberEl = document.querySelector(".member");
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
  manageItem: document.querySelector("#manageItem").content,
  simpleList: document.querySelector("#simpleList").content
};

function render(frag) {
  rootEl.textContent = "";
  rootEl.appendChild(frag);
}

async function login(token) {
  localStorage.setItem("token", token);
  mallAPI.defaults.headers["Authorization"] = `Bearer ${token}`;
  const meRes = await mallAPI.get("/me");
  localStorage.setItem("userId", meRes.data.id);
  memberEl.classList.add("authed");

  //41은 관리자 계정임
  if (Number(localStorage.getItem("userId")) === 41) {
    memberEl.classList.add("admin");
  }
}
function logout() {
  localStorage.removeItem("token");
  delete mallAPI.defaults.headers["Authorization"];
  localStorage.removeItem("userId");
  memberEl.classList.remove("authed");
  memberEl.classList.remove("admin");
}
document.querySelector(".member__login").addEventListener("click", e => {
  loginPage();
});
document.querySelector(".member__logout").addEventListener("click", e => {
  logout();
});

// 새로고침 시에 로그인 했는지 확인 하기
if (localStorage.getItem("token")) {
  const token = localStorage.getItem("token");
  login(token);
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

    const res = await mallAPI.post("/users/register", payload).then(
      response => {
        login(response.data.token);
        mainPage();
      },
      error => {
        alert("아이디를 다시 입력해주십시오.");
        joinPage();
      }
    );
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
    const res = await mallAPI.post("/users/login", payload).then(
      response => {
        login(response.data.token);
        mainPage();
      },
      error => {
        alert("로그인 정보가 맞지 않습니다. 다시 입력해주세요.");
        loginPage();
      }
    );
    // const idRes = await mallAPI.get(`users?username=${payload.username}`);
    // localStorage.setItem("userId", idRes.data[0].id);
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
  const userId = localStorage.getItem("userId");
  console.log(`id:${id}`);
  const res = await mallAPI.get(`bags?userId=${userId}&itemId=${id}`);
  if (res.data.length !== 0) {
    const payload = {
      quantity: res.data[0].quantity + 1
    };
    await mallAPI.patch(`/bags/${res.data[0].id}`, payload);
  } else {
    const payload = {
      itemId: id,
      userId: localStorage.getItem("userId"),
      quantity: 1,
      created: new Date()
    };
    await mallAPI.post("/bags", payload);
  }
  goToBag();
}

// 장바구니에 담지 않고 바로구매했을 시에 바로구매 함수
async function buyNow(id, title, descriptions, price) {
  const frag = document.importNode(templates.order, true);
  const fragItem = document.importNode(templates.orderItem, true);
  const orderList = frag.querySelector(".order-list");
  console.log(id, title, descriptions, price);
  fragItem.querySelector(".item__img").src = descriptions[0].img;
  fragItem.querySelector(".item__title").textContent = `상품: ${title}`;
  fragItem.querySelector(".item__price").textContent = `가격: ${price}`;
  fragItem.querySelector(".item__quantity").textContent = `수량: 1`;
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
  title("주문서 작성");
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

function itemRender(res, list) {
  for (const { id, title, descriptions, price, likeCount } of res) {
    const frag = document.importNode(templates.itemEl, true);
    frag.querySelector(".item__title").textContent = title;
    frag.querySelector(".item__img").src = descriptions[0].img;
    frag.querySelector(".like").addEventListener("click", async e => {
      console.log("sldkfj");
      const userId = localStorage.getItem("userId");
      const res = await mallAPI.get(`/likes?userId=${userId}&itemId=${id}`);
      if (res.data.length === 0) {
        const payload = {
          userId: userId,
          itemId: id,
          created: new Date()
        };
        const patchPayload = {
          likeCount: likeCount + 1
        };
        const likesRes = await mallAPI.post("/likes", payload);
        const likeCountRes = await mallAPI.patch(`items/${id}`, patchPayload);
      }
    });
    frag.querySelector(".image").addEventListener("click", e => {
      detailPage(id, title, descriptions, price);
    });
    frag.querySelector(".item__price").textContent = price;
  
    frag.querySelector(".inBag").addEventListener("click", async e => {
      isOverlapItem(id);
    });
    frag.querySelector(".buying").addEventListener("click", e => {
      buyNow(id, title, descriptions, price);
    });
    list.appendChild(frag);
  }

}

// 상품 메인 페이지
async function mainPage(category = "all", sort = "id", order = "desc") {
  const listFrag = document.importNode(templates.list, true);
  const list = listFrag.querySelector(".columns");
  let url = `items?_sort=${sort}&_order=${order}`;
  if (category !== "all") {
    url = `items?category=${category}&_sort=${sort}&_order=${order}`;
  } else {
    title("new arrivals");
  }
  listFrag.querySelector(".latest").addEventListener("click", async e => {
    mainPage((category = `${category}`));
  });
  listFrag
    .querySelector(".sortedPriceAsc")
    .addEventListener("click", async e => {
      mainPage((category = `${category}`), (sort = "price"), (order = "asc"));
    });
  listFrag
    .querySelector(".sortedPriceDesc")
    .addEventListener("click", async e => {
      mainPage((category = `${category}`), (sort = "price"), (order = "desc"));
    });
  listFrag.querySelector(".bestAsc").addEventListener("click", async e => {
    mainPage((category = `${category}`), (sort = "likeCount"), (order = "asc"));
  });
  const res = await mallAPI.get(url);
  itemRender(res.data,list)
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
  const listFrag = document.importNode(templates.simpleList, true);
  const userId = localStorage.getItem("userId");
  const res = await mallAPI.get(`/bags?userId=${userId}&_expand=item`);
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
      totalPrice += item.price * quantity;
      frag.querySelector(".item__price").textContent = item.price;
      quantityEl.value = quantity;
      frag.querySelector(".item__totalPrice").textContent =
        quantity * item.price;
      frag.querySelector(".item__img").src = item.descriptions[0].img;
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
      console.log(`item:   ${res.data[0].item.descriptions[0].img}`);
      orderPage(res.data, totalPrice);
    });

    listFrag.appendChild(totalFrag);
  }
  render(listFrag);
  title("장바구니");
}

// 주문 페이지 (장바구니에서 주문했을 시에 )
async function orderPage(res, totalPrice) {
  console.log("totalprice: " + totalPrice);
  const frag = document.importNode(templates.order, true);
  const orderList = frag.querySelector(".order-list");
  const item = [];
  console.log(`length: ${res.length}`);

  for (let i = 0; i < res.length; i++) {
    const itemFrag = document.importNode(templates.orderItem, true);
    itemFrag.querySelector(".item__img").src = res[i].item.descriptions[0].img;
    itemFrag.querySelector(".item__title").textContent = res[i].item.title;
    itemFrag.querySelector(".item__quantity").textContent = res[i].quantity;
    itemFrag.querySelector(".item__price").textContent = res[i].price;
    item.push({
      title: res[i].item.title,
      itemImg: res[i].item.descriptions[0].img,
      itemId: res[i].item.id,
      price: res[i].item.price,
      quantity: res[i].quantity
    });
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
    console.log(item)
    console.log(payload);
    const orderRes = await mallAPI.post("/orderHistories", payload);

    //주문 완료 시 장바구니 비워주기

    for (const { id } of res) {
      await mallAPI.delete(`/bags/${id}`);
    }

    myPage();
  });
  frag.querySelector(".order__total").textContent = totalPrice;
  title("주문서 작성");
  render(frag);
}
document.querySelector(".member__myPage").addEventListener("click", e => {
  myPage();
});
//wishlist페이지

async function wishlistPage() {
  const userId = localStorage.getItem("userId");
  const listFrag = document.importNode(templates.simpleList, true);
  const res = await mallAPI.get(`/likes?userId=${userId}&_expand=item`);
  console.log(res.data);
  if (res.data[0].length === 0) {
    alert("위시 리스트에 없다.");
  }
  for (const { item, id } of res.data) {
    const frag = document.importNode(templates.itemEl, true);
    const likeEl = frag.querySelector(".like");
    frag.querySelector(".item__title").textContent = item.title;
    frag.querySelector(".item__price").textContent = item.price;
    frag.querySelector(".item__img").src = item.descriptions[0].img;
    likeEl.textContent = "위시리스트삭제";
    likeEl.addEventListener("click", async e => {
      console.log(item.title);
      const payload = {
        likeCount: item.likeCount - 1
      };
      console.log(id);
      const patchres = await mallAPI.patch(`/items/${item.id}`, payload);
      const deleteres = await mallAPI.delete(`/likes/${id}`);
      wishlistPage();
    });
    frag.querySelector(".inBag").addEventListener("click", async e => {
      isOverlapItem(item.id);
      const deleteRes = await mallAPI.delete(`/likes/${id}`);
    });
    frag.querySelector(".buying").addEventListener("click", async e => {
      buyNow(item.id, item.titl, item.descriptions, item.price);
      console.log(item.id, item.title, item.descriptions, item.price);
    });
    listFrag.appendChild(frag);
  }
  render(listFrag);
  title("wishlist");
}
// 주문내역확인 페이지
async function myPage() {
  const frag = document.importNode(templates.myPage, true);
  frag.querySelector(".wishlist").addEventListener("click", e => {
    wishlistPage();
  });
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
  console.log(name, created, total, items, id, address, tel);
  console.log(address);
  const frag = document.importNode(templates.orderHistory, true);
  frag.querySelector(".date").textContent = `주문 일자: ${created}`;
  frag.querySelector(".total").textContent = `합계: ${total}`;
  frag.querySelector(".name").textContent = `주문자: ${name}`;
  frag.querySelector(".address").textContent = `주소: ${address}`;
  frag.querySelector(".phone").textContent = `연락처: ${tel}`;
  const fragList = frag.querySelector(".orderHistories__list");
  for (let i = 0; i < items.length; i++) {
    const itemFrag = document.importNode(templates.orderHistoryItem, true);
    itemFrag.querySelector(".image").src = items[i].itemImg;
    itemFrag.querySelector(".item__title").textContent = `상품: ${
      items[i].title
    }`;
    itemFrag.querySelector(".quantity").textContent = `주문수량: ${
      items[i].quantity
    }`;
    itemFrag.querySelector(".price").textContent = `가격: ${items[i].price}`;
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
      price: Number(e.target.elements.price.value),
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
    addItem();
  });
  render(frag);
}

async function editItem(id, title, price, descriptions, category) {
  const frag = document.importNode(templates.regist, true);
  frag.querySelector(".category").value = category;
  frag.querySelector(".title").value = title;
  frag.querySelector(".price").value = price;
  frag.querySelector(".mainImg").value = descriptions[0].img;
  frag.querySelector(".mainBody").value = descriptions[0].body;
  frag.querySelector(".subImg").value = descriptions[1].img;
  frag.querySelector(".subBody").value = descriptions[1].body;
  frag.querySelector(".regist__form").addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      category: e.target.elements.category.value,
      title: e.target.elements.title.value,
      price: Number(e.target.elements.price.value),
      descriptions: [
        {
          img: e.target.elements.mainImg.value,
          body: e.target.elements.mainBody.value
        },
        {
          img: e.target.elements.subImg.value,
          body: e.target.elements.subBody.value
        }
      ]
    };

    const res = await mallAPI.patch(`/items/${id}`, payload);
    manageItem();
  });
  render(frag);
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
  for (const {
    id,
    title,
    price,
    descriptions,
    category,
    likeCount
  } of res.data) {
    const fragItem = document.importNode(templates.manageItem, true);
    fragItem.querySelector(".item-title").textContent = title;
    fragItem.querySelector(".item-price").textContent = price;
    fragItem.querySelector(".item-category").textContent = category;
    fragItem.querySelector(".item-like").textContent = likeCount;
    fragItem
      .querySelector(".item-delete")
      .addEventListener("click", async e => {
        const res = await mallAPI.delete(`/items/${id}`);
      });
    fragItem.querySelector(".item-edit").addEventListener("click", e => {
      editItem(id, title, price, descriptions, category);
    });
    tbodyEl.appendChild(fragItem);
  }
  render(frag);
  title("관리자 페이지");
}

// 검색기능
document.querySelector(".search").addEventListener("submit", async e => {
  e.preventDefault();
  const inputText = (e.target.elements.search.value).replace(/\s/g," ")
  const res = await mallAPI.get('/items')
  const itemRes = res.data.filter(res => {
    if(res.title.replace(/\s/g," ").match(inputText)) {
      return true
    }
  })
  const listFrag = document.importNode(templates.simpleList, true);
  const list = listFrag.querySelector(".columns")
  listFrag.querySelector('.alert').textContent = `${itemRes.length}개의 상품이 검색되었습니다.`
  itemRender(itemRes, list)
  render(listFrag)
  title('')
});


