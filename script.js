// Tabs Switch Logic
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const msg = document.getElementById("msg");

if (loginTab) {
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    msg.textContent = "";
  });

  registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    msg.textContent = "";
  });
}

// REGISTER FUNCTION
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Check if email already exists
    if (users.some((u) => u.email === email)) {
      msg.textContent = "⚠️ Email already registered!";
      return;
    }

    users.push({ name, email, password });
    localStorage.setItem("users", JSON.stringify(users));
    msg.textContent = "✅ Registered successfully! Please login.";
    registerForm.reset();
  });
}

// LOGIN FUNCTION
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const validUser = users.find((u) => u.email === email && u.password === password);

    if (validUser) {
      localStorage.setItem("loggedUser", JSON.stringify(validUser));
      window.location.href = "dashboard.html";
    } else {
      msg.textContent = "❌ Invalid email or password!";
    }
  });
}
// DASHBOARD LOGIC
document.addEventListener("DOMContentLoaded", () => {
  const userName = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");

  const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

  // If user not logged in → redirect to login page
  if (userName && !loggedUser) {
    window.location.href = "login.html";
  }

  // Display logged user's name
  if (loggedUser && userName) {
    userName.textContent = loggedUser.name;
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedUser");
      window.location.href = "login.html";
    });
  }
});
// SELL DATA LOGIC
document.addEventListener("DOMContentLoaded", () => {
  const sellForm = document.getElementById("sellForm");
  const sellMsg = document.getElementById("sellMsg");

  if (sellForm) {
    sellForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const dataAmount = document.getElementById("dataAmount").value.trim();
      const dataPrice = document.getElementById("dataPrice").value.trim();
      const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));

      if (!loggedUser) {
        alert("⚠️ Please login first!");
        window.location.href = "login.html";
        return;
      }

      if (dataAmount <= 0 || dataPrice <= 0) {
        sellMsg.textContent = "⚠️ Enter valid data amount and price!";
        return;
      }

      // Get existing offers
      let offers = JSON.parse(localStorage.getItem("offers")) || [];

      // Add new offer
      offers.push({
        seller: loggedUser.name || loggedUser.email,
        data: dataAmount,
        price: dataPrice
      });

      localStorage.setItem("offers", JSON.stringify(offers));

      sellMsg.textContent = "✅ Offer posted successfully!";
      sellForm.reset();
    });
  }
});
// ===== Common Helpers =====
function getLoggedUserSafe() {
  const raw = localStorage.getItem("loggedUser");
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && (obj.email || obj.name)) return obj;
  } catch (e) {}
  // stored as plain email string
  return { email: raw };
}

function getDisplayName(user) {
  if (!user) return "Guest";
  return user.name || user.email || "User";
}

function readOffers() {
  return JSON.parse(localStorage.getItem("offers")) || [];
}
function writeOffers(list) {
  localStorage.setItem("offers", JSON.stringify(list));
}

function pushOrder(order) {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));
}

// ===== BUY PAGE LOGIC =====
document.addEventListener("DOMContentLoaded", () => {
  const offersGrid = document.getElementById("offersGrid");
  const searchBox   = document.getElementById("searchBox");
  const buyMsg      = document.getElementById("buyMsg");

  if (!offersGrid) return; // not on buy.html

  const user = getLoggedUserSafe();
  if (!user) {
    alert("Please login to continue.");
    window.location.href = "login.html";
    return;
  }

  let offers = readOffers();

  function render(list) {
    offersGrid.innerHTML = "";
    if (!list.length) {
      buyMsg.textContent = "No offers right now. Check again later!";
      return;
    }
    buyMsg.textContent = "";

    list.forEach((o, idx) => {
      const card = document.createElement("div");
      card.className = "offer-card";

      const sellerName = o.seller || "Anonymous";
      const priceInfo = `₹${o.price} / 100MB`;
      const totalPrice = Math.ceil(Number(o.data) / 100) * Number(o.price);

      card.innerHTML = `
        <h3>Seller: ${sellerName}</h3>
        <p class="offer-meta">Available: <strong>${o.data} MB</strong></p>
        <p class="offer-meta">Price: <strong>${priceInfo}</strong></p>
        <p class="offer-meta">Approx. full-offer cost: <strong>₹${totalPrice}</strong></p>
        <div class="offer-actions">
          <input type="number" min="50" step="50" value="100" placeholder="Buy MB" id="qty-${idx}" />
          <button class="btn" id="buy-${idx}">Buy Now</button>
        </div>
      `;

      // Attach buy handler
      card.querySelector(`#buy-${idx}`).addEventListener("click", () => {
        const qtyInput = card.querySelector(`#qty-${idx}`);
        const qty = parseInt(qtyInput.value || "0", 10);

        if (isNaN(qty) || qty <= 0) {
          alert("Enter valid MB to buy.");
          return;
        }
        if (qty > Number(o.data)) {
          alert("Requested MB exceeds seller's available amount.");
          return;
        }

        // Calculate price in multiples of 100MB
        const blocks = Math.ceil(qty / 100);
        const payable = blocks * Number(o.price);

        if (!confirm(`Buy ${qty} MB from ${sellerName} for ₹${payable}?`)) return;

        // Update offer stock
        o.data = String(Number(o.data) - qty);
        if (Number(o.data) <= 0) {
          // remove offer
          offers = offers.filter((_, i) => i !== idx);
        }
        writeOffers(offers);

        // Save order history
        pushOrder({
          buyer: getDisplayName(user),
          seller: sellerName,
          qtyMB: qty,
          pricePaid: payable,
          pricePer100: Number(o.price),
          ts: new Date().toISOString()
        });

        render(offers);
        buyMsg.textContent = "✅ Purchase successful (simulated)!";
        setTimeout(() => (buyMsg.textContent = ""), 2000);
      });

      offersGrid.appendChild(card);
    });
  }

  // Search filter
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = offers.filter(o =>
        (o.seller || "").toLowerCase().includes(q) ||
        String(o.price).toLowerCase().includes(q)
      );
      render(filtered);
    });
  }

  render(offers);
});
// PROFILE PAGE LOGIC
document.addEventListener("DOMContentLoaded", () => {
  const pName = document.getElementById("pName");
  const pEmail = document.getElementById("pEmail");
  const pSold = document.getElementById("pSold");
  const pBought = document.getElementById("pBought");
  const pWallet = document.getElementById("pWallet");

  if (pName && pEmail) {
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Display basic info
    pName.textContent = user.name || "Anonymous";
    pEmail.textContent = user.email || "Not Provided";

    // Calculate totals
    const soldOffers = JSON.parse(localStorage.getItem("soldData")) || [];
    const boughtData = JSON.parse(localStorage.getItem("boughtData")) || [];

    let totalSold = soldOffers.reduce((sum, item) => sum + parseInt(item.data), 0);
    let totalBought = boughtData.reduce((sum, item) => sum + parseInt(item.data), 0);

    pSold.textContent = totalSold + " MB";
    pBought.textContent = totalBought + " MB";

    // Wallet Calculation (₹3 per 100MB sold)
    let walletBalance = Math.round((totalSold / 100) * 3);
    pWallet.textContent = walletBalance;
  }
});
