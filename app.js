// تبديل بين الواجهة و الفورم + رفع الطلب و جلب الطلبات
document.addEventListener("DOMContentLoaded", () => {
  const landing = document.getElementById("landing");
  const printForm = document.getElementById("printForm");
  const startBtn = document.getElementById("startBtn");
  const backBtn = document.getElementById("backBtn");
  const aboutBtn = document.getElementById("aboutBtn");
  const orderForm = document.getElementById("orderForm");
  const resultEl = document.getElementById("result");
  const ordersList = document.getElementById("ordersList");

  function showLanding() {
    landing.classList.add("visible");
    printForm.classList.remove("visible");
  }
  function showForm() {
    landing.classList.remove("visible");
    printForm.classList.add("visible");
    fetchOrders();
  }

  startBtn.addEventListener("click", showForm);
  backBtn.addEventListener("click", showLanding);
  aboutBtn.addEventListener("click", () => {
    alert("نقدر نطبع ملفات PDF، نغلفها ونوصلها أو تراجعيها من الفرع.");
  });

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultEl.textContent = "جاري الرفع...";
    const fd = new FormData(orderForm);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        resultEl.style.color = "green";
        resultEl.textContent = "تم إنشاء الطلب: " + data.orderId;
        orderForm.reset();
        fetchOrders();
      } else {
        resultEl.style.color = "crimson";
        resultEl.textContent = "خطأ: " + (data.message || "حصل خطأ");
      }
    } catch (err) {
      resultEl.style.color = "crimson";
      resultEl.textContent = "فشل بالاتصال بالخادم";
      console.error(err);
    }
  });

  async function fetchOrders() {
    ordersList.innerHTML = "<p style='color:var(--muted)'>جاري جلب الطلبات...</p>";
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Fetch error");
      const arr = await res.json();
      renderOrders(arr || []);
    } catch (err) {
      ordersList.innerHTML = "<p style='color:var(--muted)'>تعذر جلب الطلبات</p>";
      console.error(err);
    }
  }

  function renderOrders(list) {
    if (!list || list.length === 0) {
      ordersList.innerHTML = "<p style='color:var(--muted)'>لا توجد طلبات بعد</p>";
      return;
    }
    ordersList.innerHTML = "";
    list.reverse().forEach(order => {
      const d = document.createElement("div");
      d.className = "order-card";
      d.innerHTML = `
        <p><b>رقم الطلب:</b> ${order.orderId}</p>
        <p><b>ملف:</b> ${order.filename || "—"}</p>
        <p><b>حجم الورق:</b> ${order.paperSize}</p>
        <p><b>نوع الطباعة:</b> ${order.printType}</p>
        <p><b>تغليف:</b> ${order.packaging}</p>
        <p><b>توصيل:</b> ${order.delivery}</p>
        <p><b>الحالة:</b> ${order.status || 'جديد'}</p>
      `;
      ordersList.appendChild(d);
    });
  }

  // إظهار الواجهة بالبداية
  showLanding();
});
