document.addEventListener("DOMContentLoaded", () => {
  const orderForm = document.getElementById("orderForm");
  const resultEl = document.getElementById("result");
  const ordersList = document.getElementById("ordersList");

  const contactBtn = document.getElementById("contactBtn");
  const contactModal = document.getElementById("contactModal");
  const closeModal = document.getElementById("closeModal");

  // فتح وغلق Contact Modal
  contactBtn.addEventListener("click", () => contactModal.classList.remove("hidden"));
  closeModal.addEventListener("click", () => contactModal.classList.add("hidden"));
  window.addEventListener("click", e => { if(e.target===contactModal) contactModal.classList.add("hidden"); });

  // إرسال الطلب
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultEl.style.color = "black";
    resultEl.textContent = "جاري إرسال الطلب...";

    const fd = new FormData(orderForm);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if(res.ok){
        resultEl.style.color = "green";
        resultEl.textContent = "تم إنشاء الطلب: " + data.orderId;
        orderForm.reset();
        fetchOrders();
      } else {
        resultEl.style.color = "crimson";
        resultEl.textContent = "خطأ: " + (data.message || "حصل خطأ");
      }
    } catch(err){
      resultEl.style.color = "crimson";
      resultEl.textContent = "فشل بالاتصال بالخادم";
      console.error(err);
    }
  });

  // جلب الطلبات
  async function fetchOrders(){
    ordersList.innerHTML = "<p style='color:gray'>جاري جلب الطلبات...</p>";
    try{
      const res = await fetch("/api/orders");
      if(!res.ok) throw new Error("Fetch error");
      const arr = await res.json();
      renderOrders(arr || []);
    } catch(err){
      ordersList.innerHTML = "<p style='color:gray'>تعذر جلب الطلبات</p>";
      console.error(err);
    }
  }

  function renderOrders(list){
    if(!list || list.length===0){
      ordersList.innerHTML = "<p style='color:gray'>لا توجد طلبات بعد</p>";
      return;
    }
    ordersList.innerHTML = "";
    list.reverse().forEach(order=>{
      const d = document.createElement("div");
      d.className = "order-card";
      d.innerHTML = `
        <p><b>رقم الطلب:</b> ${order.orderId}</p>
        <p><b>ملف:</b> <a href="/uploads/${order.filename}" target="_blank">${order.origName || "—"}</a></p>
        <p><b>حجم الورق:</b> ${order.paperSize}</p>
        <p><b>نوع الطباعة:</b> ${order.printType}</p>
        <p><b>نوع العنصر:</b> ${order.itemType || '—'}</p>
        <p><b>تغليف:</b> ${order.packaging}</p>
        <p><b>توصيل:</b> ${order.delivery}</p>
        <p><b>الحالة:</b> ${order.status || 'جديد'}</p>
      `;
      ordersList.appendChild(d);
    });
  }

  // جلب الطلبات أول مرة
  fetchOrders();
});
