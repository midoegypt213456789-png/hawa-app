# 🧪 HAWA CO — Pre-Deploy Test Checklist

> قبل أى رفع للـ HTML files على GitHub، نتبع الـ checklist ده.
> الهدف: نمنع الـ bugs اللى اتحلت قبل كده من الرجوع تانى.

---

## 🚀 الـ Critical Flows (لازم تشتغل قبل أى deploy):

### 1️⃣ حجز جديد (Booking Flow)
- [ ] افتح الـ Mini App → سجل دخول
- [ ] اضغط "حجز جديد"
- [ ] اختار: مخزن → عربية → عدد → يوم → موعد
- [ ] احفظ
- [ ] **تأكد:** رسالة تليجرام وصلت بكل التفاصيل (مفيش "Invalid Date" أو حقول فاضية)
- [ ] **تأكد:** الـ seq_number ظاهر فى الرسالة (مش الـ booking_id الكبير)
- [ ] **تأكد:** الـ QR code موجود وصحيح

### 2️⃣ تعديل حجز (Edit Flow — الـ flow اللى اتعطل قبل كده!)
- [ ] افتح "حجوزاتى"
- [ ] اضغط "✏️ تعديل" على حجز موجود
- [ ] **تأكد:** الـ form بيفتح بكل بيانات الحجز (مش فاضى)
- [ ] غير حاجة بسيطة (مثلاً الموعد)
- [ ] اضغط "حفظ التعديل"
- [ ] **تأكد:** رسالة التليجرام وصلت بـ:
  - ✅ المخزن (مش فاضى)
  - ✅ نوع العربية (مش فاضى)
  - ✅ يوم التحميل (مش "Invalid Date")
  - ✅ الموعد (مش فاضى)

### 3️⃣ إلغاء حجز (Cancel Flow)
- [ ] افتح "حجوزاتى"
- [ ] اضغط "❌ إلغاء"
- [ ] أكد الإلغاء
- [ ] **تأكد:** الحجز اختفى من اللست
- [ ] **تأكد:** رسالة إشعار الإلغاء وصلت على التليجرام

### 4️⃣ Admin Cancel (فردى + bulk)
- [ ] افتح صفحة الأدمن → الحجوزات
- [ ] ألغى حجز فردى → اتأكد إن العميل استلم إشعار
- [ ] اختار 3 حجوزات → bulk cancel → اتأكد إن الـ 3 عملاء استلموا إشعارات

### 5️⃣ Filters (Admin)
- [ ] فلتر التاريخ بيشتغل (من-إلى)
- [ ] الترتيب من الأقدم للأحدث
- [ ] فلتر المخزن
- [ ] فلتر النوع
- [ ] فلتر الحالة

---

## 🔍 Code Review Questions (قبل ما تـ commit)

لو عدلت فى `hawa_booking.html` أو `hawa_admin.html`، اسأل نفسك:

### State Management
- [ ] هل لمست function بتـ reset state (زى `exitEditMode`, `exitMode`)?
  - لو أيوه: **لازم تشوف كل callers** وتتأكد إن الـ snapshot pattern مستخدم
  - الـ pattern: `const snap = {...}; reset(); use(snap.field);` مش `reset(); use(state.field);`

### Async Operations
- [ ] هل بتـ depend على state global بعد `await`?
  - لو أيوه: التقط snapshot قبل الـ await

### URL Encoding
- [ ] هل بتـ build URL فيها نص عربى؟
  - لو أيوه: استخدم `encodeURIComponent(value)` لكل value

### HTML Templates
- [ ] هل بتـ embed JSON فى onclick attribute؟
  - لو أيوه: استخدم cache pattern بدل embedding
  - `<button data-id="${id}">` + event listener بدل `<button onclick="fn('${jsonStr}')">`

---

## 🐛 Bugs ماتت من قبل (متخليهاش ترجع!):

| Bug | الـ pattern اللى أصلحه | السطر |
|---|---|---|
| `CAP is not defined` | استخدم `allVehicleTypes.find(...)` بدل `CAP[...]` | startEdit |
| Telegram payload فيه null | Snapshot pattern قبل `exitEditMode()` | edit save |
| Booking JSON يكسر onclick | Cache pattern + data-attributes | bookings list |
| Arabic فى URL يرفض | `encodeURIComponent()` على كل value | loadMyBookings |
| Browser cache يخفى التحديثات | Hard refresh (Ctrl+Shift+R) أو incognito | كل deploy |

---

## 🧰 Tools للـ Debugging:

### Browser DevTools (F12)
- **Console:** لو فى error JS هيظهر هنا
- **Network:** شوف الـ webhook requests، الـ Supabase fetches
- **Application → Storage:** نظف الـ cache يدوياً لو هارد ريفريش مكفاش

### Supabase Dashboard
- **Logs → API:** شوف الـ requests اللى وصلتى
- **Table Editor → bookings:** اتأكد إن الـ data بيتحفظ صح

### n8n
- **Executions:** كل webhook trigger هيظهر هنا
- اضغط على execution → شوف الـ output من كل node

---

## 📅 آخر تحديث:

- **9 مايو 2026:** أضفت snapshot pattern لـ edit flow + checkin alert workflow.
- **8 مايو 2026:** إضافة cancel notification + seq_number + DB-driven emails.

