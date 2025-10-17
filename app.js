document.addEventListener("DOMContentLoaded", () => {

  const heroForm = document.getElementById("heroForm");
  if (heroForm) {
    const emailInput = document.getElementById("emailInput");
    heroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email || !email.includes("@")) {
        alert("رجاءً أدخلي بريد إلكتروني صحيح");
        return;
      }
      alert("شكراً! تم استقبال بريدك للاطلاع على النسخة التجريبية.");
      console.log("Hero signup:", email);
      emailInput.value = "";
    });
  }

  const orderForm = document.getElementById("orderForm");
  const resultEl = document.getElementById("result");
  const ordersList = document.getElementById("ordersList");
  const contactBtn = document.getElementById("contactBtn");
  const contactModal = document.getElementById("contactModal");
  const closeModal = document.getElementById("closeModal");
  const itemTypeSelect = document.getElementById("itemTypeSelect");
  const paperSizeSelect = document.getElementById("paperSizeSelect");
  const printTypeSelect = document.getElementById("printTypeSelect");
  const pagesInput = document.getElementById("pagesInput");
  const notesInput = document.getElementById("notesInput");
  const sizeHintInput = document.getElementById("sizeHint");

  function preselectFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('type') || params.get('itemType');
      const size = params.get('size') || params.get('sizeHint');
      const pages = params.get('pages');
      const color = params.get('color'); // expect 'color' or 'bw'
      const notes = params.get('notes');

      if (t && itemTypeSelect) {
        const map = {
          image: 'image',
          poster: 'poster',
          magazine: 'magazine',
          notebook: 'notebook',
          document: 'document',
          packaging: 'packaging',
          delivery: 'delivery'
        };
        const val = map[t] || t;
        const opt = Array.from(itemTypeSelect.options).find(o => o.value === val);
        if (opt) itemTypeSelect.value = val;
      }

      if (size && paperSizeSelect) {
        const optSize = Array.from(paperSizeSelect.options).find(o => o.value.toLowerCase() === size.toLowerCase());
        if (optSize) paperSizeSelect.value = optSize.value;
        sizeHintInput.value = size;
      }

      if (color && printTypeSelect) {
        const c = color.toLowerCase() === 'color' ? 'color' : 'bw';
        const optC = Array.from(printTypeSelect.options).find(o => o.value === c);
        if (optC) printTypeSelect.value = c;
      }

      if (pages && pagesInput) pagesInput.value = pages;
      if (notes && notesInput) notesInput.value = notes;
    } catch (e) {
      console.debug("preselect error", e);
    }
  }
  preselectFromQuery();

  // --- إضافة تحكم عدد النسخ (إن لم يكن موجود في HTML) ---
  function ensureCopiesControls() {
    // إذا موجود بالفعل، ما نسوي شي
    if (document.getElementById('copiesInput')) return;

    // حاول نضيف بعد حقل itemTypeSelect لو متوفر، وإلا نضيف آخر الفورم
    const container = document.createElement('div');
    container.className = 'row';
    container.innerHTML = `
      <div class="field">
        <label>عدد النسخ</label>
        <div class="qty" style="display:flex;align-items:center;gap:8px">
          <button type="button" id="decBtn" class="qty-btn" aria-label="نقص">−</button>
          <input type="number" name="copies" id="copiesInput" value="1" min="1" required style="width:72px;text-align:center;padding:6px;border-radius:6px;border:1px solid #ddd">
          <button type="button" id="incBtn" class="qty-btn" aria-label="زيادة">+</button>
        </div>
      </div>
    `;

    if (itemTypeSelect && itemTypeSelect.parentElement && itemTypeSelect.parentElement.parentElement) {
      // حاول نضع بعد السطر اللي يحتوي itemTypeSelect
      const rowElem = itemTypeSelect.closest('.row') || itemTypeSelect.parentElement;
      if (rowElem && rowElem.parentElement) {
        rowElem.parentElement.insertBefore(container, rowElem.nextSibling);
        return;
      }
    }

    // fallback: ضعه قبل زر الإرسال
    const submitBtn = orderForm.querySelector('button[type="submit"]');
    orderForm.insertBefore(container, submitBtn);
  }

  // استدعاء التضمين
  if (orderForm) ensureCopiesControls();

  // الآن اربط أحداث الأزرار والتحقق
  function setupCopiesBehavior() {
    const inc = document.getElementById('incBtn');
    const dec = document.getElementById('decBtn');
    const copies = document.getElementById('copiesInput');

    if (!copies) return;

    // زيادة ونقصان بالضغط
    if (inc) inc.addEventListener('click', () => {
      copies.value = Math.max(1, parseInt(copies.value || '0', 10) + 1);
      copies.dispatchEvent(new Event('change'));
    });
    if (dec) dec.addEventListener('click', () => {
      copies.value = Math.max(1, parseInt(copies.value || '1', 10) - 1);
      copies.dispatchEvent(new Event('change'));
    });

    // منع قيمة أقل من 1 عند الكتابة يدويًا
    copies.addEventListener('input', () => {
      if (copies.value === '') return;
      const v = parseInt(copies.value, 10);
      if (isNaN(v) || v < 1) copies.value = 1;
    });
  }
  setupCopiesBehavior();
 

  if (contactBtn && contactModal && closeModal) {
    contactBtn.addEventListener("click", () => contactModal.classList.remove("hidden"));
    closeModal.addEventListener("click", () => contactModal.classList.add("hidden"));
    window.addEventListener("click", (e) => { if (e.target === contactModal) contactModal.classList.add("hidden"); });
  }

  if (orderForm) {
    orderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!resultEl) return;
      resultEl.style.color = "black";
      resultEl.textContent = "جاري إرسال الطلب...";

      
      const copiesEl = document.getElementById('copiesInput');
      if (copiesEl && (!copiesEl.value || parseInt(copiesEl.value, 10) < 1)) {
        copiesEl.value = 1;
      }

      const fd = new FormData(orderForm);

      const file = fd.get("file");
      if (!file) {
        resultEl.style.color = "crimson";
        resultEl.textContent = "اختاري ملف قبل الإرسال";
        return;
      }

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        resultEl.style.color = "crimson";
        resultEl.textContent = "مسموح PDF أو صور (JPEG/PNG/GIF)";
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        resultEl.style.color = "crimson";
        resultEl.textContent = "حجم الملف أكبر من 20MB";
        return;
      }

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
          resultEl.style.color = "green";
          resultEl.textContent = "تم إنشاء الطلب: " + data.orderId;
          orderForm.reset();
          // بعد reset نعيد القيمة الافتراضية للنسخ الى 1
          const afterCopies = document.getElementById('copiesInput');
          if (afterCopies) afterCopies.value = 1;
          history.replaceState({}, '', window.location.pathname); // remove query params to avoid re-preselect
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
      if (!ordersList) return;
      ordersList.innerHTML = "<p style='color:gray'>جاري جلب الطلبات...</p>";
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Fetch error");
        const arr = await res.json();
        renderOrders(arr || []);
      } catch (err) {
        ordersList.innerHTML = "<p style='color:gray'>تعذر جلب الطلبات</p>";
        console.error(err);
      }
    }

    function renderOrders(list) {
      if (!ordersList) return;
      if (!list || list.length === 0) {
        ordersList.innerHTML = "<p style='color:gray'>لا توجد طلبات بعد</p>";
        return;
      }
      ordersList.innerHTML = "";
      list.slice().reverse().forEach(order => {
        const d = document.createElement("div");
        d.className = "order-card";
        const ext = (order.origName || order.filename || '').split('.').pop()?.toLowerCase() || '';
        let fileHtml = `<a href="/uploads/${order.filename}" target="_blank">${order.origName || order.filename || 'ملف'}</a>`;
        if (['jpg','jpeg','png','gif'].includes(ext)) {
          fileHtml = `<a href="/uploads/${order.filename}" target="_blank"><img src="/uploads/${order.filename}" alt="${order.origName||''}" style="max-width:100%;height:auto;border-radius:6px;display:block;margin-bottom:6px"></a>`;
        }

        d.innerHTML = `
          <p><b>رقم الطلب:</b> ${order.orderId}</p>
          <div>${fileHtml}</div>
          <p><b>حجم الورق:</b> ${order.paperSize || '—'}${order.sizeHint ? ' ('+order.sizeHint+')' : ''}</p>
          <p><b>نوع الطباعة:</b> ${order.printType || '—'}</p>
          <p><b>نوع العنصر:</b> ${order.itemType || '—'}</p>
          ${order.pages ? `<p><b>عدد الصفحات:</b> ${order.pages}</p>` : ''}
          ${order.notes ? `<p><b>ملاحظة:</b> ${order.notes}</p>` : ''}
          <p><b>تغليف:</b> ${order.packaging || '—'}</p>
          <p><b>توصيل:</b> ${order.delivery || '—'}</p>
          ${order.copies ? `<p><b>عدد النسخ:</b> ${order.copies}</p>` : ''}
          ${order.phone ? `<p><b>هاتف العميل:</b> ${order.phone}</p>` : ''}
          ${order.address ? `<p><b>عنوان العميل:</b> ${order.address}</p>` : ''}
          <p><b>الحالة:</b> ${order.status || 'جديد'}</p>
        `;
        ordersList.appendChild(d);
      });
    }

    fetchOrders();
  }
});
