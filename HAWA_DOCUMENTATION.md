# 🚛 HAWA CO — توثيق المشروع الكامل

> **آخر تحديث:** 8 مايو 2026
> **Owner:** Mido (@hawa_car_bot)
> **Live URL:** [https://hawa.gladiatorverse.net](https://hawa.gladiatorverse.net)

---

## 📑 الفهرس

1. [نظرة عامة](#1-نظرة-عامة)
2. [Stack & Resources](#2-stack--resources)
3. [Database Schema](#3-database-schema)
4. [App Settings](#4-app-settings)
5. [n8n Workflows](#5-n8n-workflows)
6. [Frontend Pages](#6-frontend-pages)
7. [Features Implemented](#7-features-implemented)
8. [Architectural Decisions](#8-architectural-decisions)
9. [Common Issues & Lessons Learned](#9-common-issues--lessons-learned)
10. [Maintenance Tasks](#10-maintenance-tasks)

---

## 1. نظرة عامة

**HAWA CO** هو نظام حجز دور تحميل عربيات لمخزنين فى مصر:
- 🏭 **مخزن السادات** (مدينة السادات)
- 🏭 **مخزن قليوب** (قليوب)

### الـ users:
- **العملاء** → يحجزوا دورهم عبر Telegram Mini App
- **الموظفين (Employees)** → يـ check-in الحجوزات اللى وصلت
- **الأدمن (Mido)** → إدارة كاملة للنظام

### الفكرة:
- العميل يفتح البوت `@hawa_car_bot` فى التليجرام
- يدخل بـ company_code + password
- يحجز يوم وميعاد للتحميل
- يستلم رسالة تأكيد فيها QR code
- يوم الحجز، يـ scan الـ QR عند الأمن
- الأمن يدخل الموظف، الموظف يـ check-in الحجز فى النظام

---

## 2. Stack & Resources

### Tech Stack
| الطبقة | التقنية |
|---|---|
| Frontend | HTML + Vanilla JS (مفيش framework) |
| Hosting | GitHub Pages |
| Database | Supabase (Postgres) |
| Automation | n8n (self-hosted على Hostinger VPS) |
| Bot | Telegram Bot API |
| Storage | Supabase Storage (broadcast media) |

### Resources

#### 🔑 Supabase
- **Project ID:** `oqsowwtjutpjdypjpcum`
- **URL:** `https://oqsowwtjutpjdypjpcum.supabase.co`
- **Anon Key:** فى الكود الـ frontend (public — آمن لـ client-side)
- **RLS:** معطّل على كل الجداول (الـ access control بيتم على مستوى الـ frontend)

#### 🤖 Telegram
- **Bot:** `@hawa_car_bot`
- **Bot ID:** `8693428718`
- **Mode:** Mini App (يفتح الـ frontend داخل التليجرام)
- **Mido's Telegram ID:** `1275834201`
- **BotFather domain:** `midoegypt213456789-png.github.io`

#### 🌐 n8n
- **URL:** `https://n8n.gladiatorverse.net`
- **Server:** Hostinger VPS srv1246734 (`72.62.134.224`)
- **Compose path:** `/docker/n8n/docker-compose.yml`
- **Backups:** `/docker/n8n/backups/` + cron daily 3AM
- **Auth:** admin (الـ password محفوظ خارج الـ repo)

#### 📦 GitHub Repo
- **Repo:** `midoegypt213456789-png/hawa-app`
- **Branch:** `main` → live على `hawa.gladiatorverse.net`

---

## 3. Database Schema

### 📋 `bookings` — الحجوزات (الجدول الرئيسى)

| العمود | النوع | الوصف |
|---|---|---|
| id | int (PK) | الـ ID الفريد |
| client_id | int | FK لـ clients |
| warehouse | text | اسم المخزن (السادات / قليوب) |
| vehicle_type | text | نوع العربية |
| count | int | عدد العربيات فى الحجز |
| loading_date | date | يوم التحميل |
| status | text | `قيد الانتظار` / `تم التنفيذ` / `ملغي` / `no-show` |
| time_slot | text | الموعد (مثال: `9:00 - 10:00`) |
| permit_number | text | رقم التصريح (15500-20000) |
| seq_number | int | المسلسل الشهرى (يتولّد تلقائياً بـ trigger) |
| checkin_alert_sent_at | timestamptz | متى تم إرسال إشعار التحميل لمدير المخزن |
| phone, district, governorate | text | بيانات العميل وقت الحجز |
| notes | text | ملاحظات |
| created_at | timestamp | تاريخ الإنشاء |

**Triggers:**
- `assign_booking_seq_number` (BEFORE INSERT) → يحدد seq_number تلقائياً

### 👥 `clients` — العملاء

| العمود | النوع | الوصف |
|---|---|---|
| id | int (PK) | |
| company_code | text | كود الشركة (4 أرقام مثلاً) — يستخدم للـ login |
| name, phone, governorate, city, address, district | text | بيانات العميل |
| username, password | text | اعتماد الدخول |
| telegram_id | text | الـ TG ID (يتربط بعد ضغط Start فى البوت) |
| is_blocked | bool | لو `true` ما يقدرش يحجز |
| no_show_count | int | عدد مرات الـ غياب |
| client_type | text | (نوع العميل) |
| is_active | bool | active/inactive (تتحدث تلقائياً حسب آخر حجز) |
| religion | text | (للـ broadcast filtering) |
| approval_status | text | pending / approved (للعملاء الجداد) |

### 🏭 `warehouses` — المخازن

| العمود | الوصف |
|---|---|
| id | 1 = السادات، 2 = قليوب |
| name | اسم المخزن |
| email | إيميل مدير المخزن (يستخدم فى التقارير) |

**القيم الحالية:**
- السادات → `makzanelsadat@gmail.com`
- قليوب → `makhzanqalyub@gmail.com`

### ⚙️ `app_settings` — الإعدادات (Key/Value)

شوف القسم [App Settings](#4-app-settings) للتفاصيل.

### 📅 `schedule` — جدول الأيام
- `date`, `is_open` (مفتوح/مغلق), `note`
- يستخدم لإغلاق أيام معينة (إجازات، صيانة)

### 📅 `schedule_rules` — قواعد الجدولة المتكررة
- `type` → نوع القاعدة (weekly/date_range/single)
- `day_of_week` (0=Sun .. 6=Sat)
- `start_date`, `end_date`
- `warehouses` (Array) — المخازن اللى القاعدة تنطبق عليها
- `vehicle_types` (Array) — أنواع العربيات

### 🚛 `vehicle_types` — أنواع العربيات
- `name`, `icon` (emoji), `capacity_per_hour`, `display_order`

### 👮 `employees` — الموظفين
- `name`, `username`, `password`, `role`

### 🔐 `admins` — الأدمن
- `name`, `username`, `password`, `is_active`

### 📜 `message_templates` — قوالب الـ broadcast
- `name`, `content`, `target_religion` (optional)

### 🕊️ `religions` — الديانات (للـ broadcast filtering)
### 👥 `client_types` — أنواع العملاء
### 📞 `extra_contacts` — جهات اتصال إضافية (مهندسين، مدراء)

---

## 4. App Settings

كل الإعدادات فى جدول `app_settings` (key/value text).

### ⏰ Working Hours
| Key | القيمة الحالية | الشرح |
|---|---|---|
| `working_hour_start` | `8` | بداية اليوم (8 صباحاً) |
| `working_hour_end` | `16` | نهاية اليوم (4 عصراً) |
| `daily_cutoff_hour` | `15` | الساعة اللى بعدها مش يقبل حجز لنفس اليوم |

### 🎫 Permits
| Key | القيمة | الشرح |
|---|---|---|
| `permit_min` | `15500` | أقل رقم تصريح مسموح |
| `permit_max` | `20000` | أكبر رقم تصريح مسموح |

### 📊 Daily Report Schedule
| Key | القيمة | الشرح |
|---|---|---|
| `report_schedule_type` | `daily` | `manual` / `daily` / `every-2-days` / `weekly` |
| `report_schedule_hour` | `1` | الساعة اللى يتبعت فيها التقرير (24h format) |
| `report_schedule_days` | `0,1,2,3,4,5,6` | أيام الأسبوع (لـ weekly فقط، 0=Sun) |

### 🔢 Sequence Number
| Key | القيمة | الشرح |
|---|---|---|
| `seq_apply_from_date` | `2026-06-01` | التاريخ اللى يبدأ منه الـ trigger يشتغل |
| `seq_reset_day_of_week` | `1` | يوم بداية الأسبوع للـ reset (1=Mon) |
| `seq_starting_value` | `1` | أول رقم فى الدورة |

### 🔔 Notifications & Inactivity
| Key | القيمة | الشرح |
|---|---|---|
| `notifications_enabled` | JSON array | الإشعارات اللى الأدمن يستقبلها |
| `inactive_period_value` | `1` | المدة اللى بعدها العميل يبقى inactive |
| `inactive_period_unit` | `month` | `day` / `week` / `month` |

### 📢 Broadcast
| Key | القيمة | الشرح |
|---|---|---|
| `broadcast_header` | فاضى | نص يضاف فوق كل broadcast |
| `broadcast_footer` | فاضى | نص يضاف تحت كل broadcast |

### 🎛️ Admin
| Key | القيمة | الشرح |
|---|---|---|
| `default_admin_page` | `clients` | الصفحة الافتراضية لما الأدمن يدخل |

---

## 5. n8n Workflows

### 5.1 ✅ `HAWA Booking Confirm`
**الوظيفة:** يبعت رسالة تأكيد للعميل + إيميل تقرير للمخزن لما يتم حجز/تعديل/check-in.

**Trigger:** Webhook `POST /webhook/booking-confirm`

**Payload:**
```json
{
  "action": "new" | "edit" | "done",
  "telegram_id": "...",
  "client_name": "...",
  "company_code": "...",
  "booking_id": 1234,
  "seq_number": 5,
  "warehouse": "قليوب",
  "vehicle_type": "...",
  "count": 1,
  "loading_date": "2026-05-09",
  "date_label": "...",
  "time_slot": "...",
  "is_edit": false
}
```

**Flow:**
```
Webhook → Resolve Warehouse Email (Code) → If (action=='done')
  ├─ true  → Send Email تحميل (للمخزن)
  └─ false → Send Telegram QR + Caption → Send Email تقرير محدث (للمخزن)
```

**ملاحظات:**
- الـ caption فى التليجرام يستخدم `seq_number || booking_id` (fallback)
- الـ QR code يستخدم `booking_id` (الـ unique)
- الإيميلات بتيجى من جدول `warehouses` (DB-driven، مش hardcoded)

---

### 5.2 🚫 `HAWA Cancel Notification`
**الوظيفة:** يبعت رسالة تليجرام للعميل لما حجزه يتلغى (سواء من admin أو من العميل نفسه).

**Trigger:** Webhook `POST /webhook/cancel-notification`

**Payload:**
```json
{ "booking_ids": [123, 456, ...] }
```

**Flow:**
```
Webhook → Split Booking IDs → Fetch Booking (Supabase)
  → Format Message (Code) → Send Telegram
```

**ملاحظات:**
- يدعم single + bulk cancel
- العميل اللى مالوش telegram_id يتم تخطيه silently
- `responseMode: onReceived` — الـ admin مش يستنى الرد

---

### 5.3 🔔 `HAWA Checkin Alert`
**الوظيفة:** يبعت إيميل summary لمدير المخزن كل ساعة بكل الـ check-ins الجديدة.

**Trigger:** Schedule (every hour)

**Flow:**
```
Every Hour → Build Per-Warehouse Emails (Code)
  - يجيب bookings: status='تم التنفيذ' AND checkin_alert_sent_at IS NULL
  - يجيب warehouses + emails من DB
  - يجمعهم per warehouse
  - يبنى HTML email
  → Send Alert Email (Gmail) → Mark Bookings as Alerted (PATCH checkin_alert_sent_at = NOW())
```

**ملاحظات:**
- لو الإيميل فشل (مثلاً bouncing)، الـ Mark as Alerted ما بيشتغلش → الحجوزات تتراكم لحد ما الإيميل يـ fix
- ساعة واحدة لكل summary، مش إيميل لكل check-in (أقل overhead للمخزن)

---

### 5.4 📋 `HAWA Daily Report v2`
**الوظيفة:** يبعت تقرير يومى لكل مخزن بحجوزات اليوم الجاى.

**Trigger:** Schedule (every hour) — يـ self-filter حسب settings

**Flow:**
```
Every Hour → Check Schedule + Build Reports (Code)
  - يقرأ app_settings: type / hour / days
  - لو manual → خروج
  - لو الساعة الحالية ≠ scheduleHour → خروج
  - لو weekly + day مش فى scheduleDays → خروج
  - لو every-2-days + يوم فردى → خروج
  - يحدد target date (today لو الـ trigger الصبح، tomorrow لو بعد الظهر)
  - يجيب bookings + warehouses
  - يبنى HTML email لكل warehouse
  → Send Daily Report Email (Gmail)
```

**ملاحظات:**
- التقرير عن **اليوم الجاى** (تحضير الأمن)
- لو ساعة 1 ص → التقرير عن نفس اليوم
- لو ساعة 22 (10 م) → التقرير عن بكرة
- يضمن الـ HTML stats: total, by status, by vehicle type + لينك للـ report page الكامل

---

### 5.5 📢 `HAWA Broadcast`
**الوظيفة:** يبعت رسائل جماعية للعملاء (مع مرفقات اختيارية).

**Trigger:** Webhook `POST /webhook/broadcast`

**Payload:**
```json
{
  "message": "نص الرسالة",
  "recipients": [{ "telegram_id": "..." }],
  "media_files": [{ "url": "...", "type": "photo|video|document|audio", "path": "..." }],
  "supabase_url": "...",
  "supabase_key": "..."
}
```

**Flow:**
```
Webhook → Plan Actions (Code: builds Telegram API calls per recipient)
  → Telegram API (HTTP) → Wait 150ms (rate limit)
  → Is Last? → (true) Build Delete URLs → Delete Files (cleanup Storage)
```

**ملاحظات:**
- بيرفع الملف على Supabase Storage الأول، يبعت URL لـ Telegram
- Telegram limit: 20MB للـ video/document via URL، 5MB للصور
- ⚠️ **Known limitation:** الملفات أكبر من 20MB ما تتبعتش عبر Telegram cloud (لازم Local Bot API Server للـ workaround)

---

## 6. Frontend Pages

### 6.1 `hawa_login.html`
صفحة الدخول. تستقبل company_code + password وتحفظ user data فى localStorage.

### 6.2 `hawa_booking.html` (Mini App)
الواجهة الرئيسية للعميل. تشمل:
- 📅 حجز جديد (5 خطوات: مخزن → عربية → عدد → يوم → ميعاد)
- 📋 حجوزاتى (قائمة الحجوزات السابقة + التعديل/الإلغاء)
- 🔗 ربط التليجرام (Banner لو مش مربوط)

**Webhook calls:**
- `/webhook/booking-confirm` بعد حجز جديد أو تعديل
- `/webhook/cancel-notification` بعد إلغاء العميل لحجزه

### 6.3 `hawa_admin.html`
صفحة الأدمن — أكبر صفحة فى المشروع (~325KB):
- 📋 حجوزات (مع bulk cancel، فلاتر، export)
- 👥 عملاء (CRUD + import + activity tracking)
- 📅 جدولة (schedule rules مع warehouse + vehicle filters)
- 👮 موظفين (CRUD)
- 📢 إرسال رسائل (broadcast مع multi-select filters)
- 📦 مخازن (إيميلات + add/remove)
- ⚙️ إعدادات عامة
- 🔔 تنبيهات (10 أنواع)

**Webhook calls:**
- `/webhook/cancel-notification` بعد single/bulk cancel
- `/webhook/broadcast` لإرسال الرسائل الجماعية
- `/webhook/test-warehouse-email` لاختبار إيميل المخزن

### 6.4 `hawa_employee.html`
صفحة الموظف لـ check-in الحجوزات:
- يدخل permit number أو يـ scan QR code
- يضغط "تم التنفيذ" → يـ PATCH الـ status
- ⚠️ ما بيـ trigger أى webhook (الـ Checkin Alert workflow بيـ poll الـ DB كل ساعة)

### 6.5 `hawa_report.html`
صفحة طباعة التقرير اليومى (يفتحها الأمن من اللينك فى الإيميل).

---

## 7. Features Implemented

### المراحل الأخيرة (مايو 2026)

#### ✅ Cancel Notification System
**التاريخ:** 8 مايو 2026

العميل يستلم رسالة تليجرام لما حجزه يتلغى — سواء من الأدمن أو من العميل من الموبايل.

**Files:**
- `HAWA_Cancel_Notification.json` (workflow جديد)
- `hawa_admin.html` — function `notifyClientCancellation()` فى `adminCancelBooking` و `bulkCancelBookings`
- `hawa_booking.html` — نفس الـ helper فى `doCancelBooking`

#### ✅ seq_number فى رسالة التأكيد
**التاريخ:** 8 مايو 2026

بدل ما الرسالة تعرض الـ Postgres ID (مثلاً #1048)، بقت تعرض الـ seq_number الشهرى (مثلاً #5) للعملاء يفهموه أحسن.

**Files:**
- `hawa_booking.html` — payload فيه `seq_number`
- `HAWA_Booking_Confirm.json` — caption: `#{{ seq_number || booking_id }}`
- الـ QR code فضل بـ booking_id (لأن الـ employee scanner يلاقى الحجز فى DB)

#### ✅ DB-Driven Warehouse Emails
**التاريخ:** 8 مايو 2026

كل الـ workflows بقت تجيب الإيميلات من جدول `warehouses` بدل ما تكون hardcoded. لو إيميل أى مخزن اتغير → UPDATE فى DB يكفى.

**Workflows refactored:**
- `HAWA_Booking_Confirm` — أضاف Code node `Resolve Warehouse Email`
- `HAWA_Checkin_Alert` — كان أصلاً DB-driven
- `HAWA_Daily_Report_v2` — built DB-driven from scratch

#### ✅ HAWA_Daily_Report_v2
**التاريخ:** 8 مايو 2026

نسخة جديدة من تقرير اليومى بميزات:
- Hourly trigger مع DB-driven schedule
- يدعم daily / every-2-days / weekly / manual
- Per-warehouse HTML email مع stats (by status, by vehicle type)
- Smart date selection (today صبحاً، tomorrow مساءً)

#### ✅ Checkin Alert
**التاريخ:** 8 مايو 2026

إيميل ساعتى لمدير المخزن بكل الـ check-ins الجديدة. يستخدم column `checkin_alert_sent_at` لمنع التكرار.

---

### المراحل السابقة (مايو 2026)

#### نظام التنبيهات (10 أنواع)
catalog 10 أنواع تنبيهات للأدمن مع add/remove + on/off + seen tracking.

#### Bulk Cancel
checkboxes فى صفحة الحجوزات + Cancel Selected / Cancel All buttons.

#### Schedule Rules مع Warehouse + Vehicle Filters
multi-select filters عشان قاعدة جدولة معينة تنطبق على مخزن/عربية محددة.

#### Auto-Approve للعملاء اللى الأدمن يضيفهم
لما الأدمن يضيف عميل يدوى، يبقى approved تلقائياً (مش pending).

#### إدارة نشاط العملاء
- Postgres function `refresh_client_activity()`
- Auto-reactivate on booking
- Settings: `inactive_period_value` + `inactive_period_unit`

#### المسلسل الشهرى للحجز (seq_number)
- Trigger: `assign_booking_seq_number` (BEFORE INSERT)
- Functions: `first_weekday_in_month()`, `cycle_start_for_date()`
- Settings: `seq_reset_day_of_week`, `seq_apply_from_date`, `seq_starting_value`

---

## 8. Architectural Decisions

### قرارات مهمة اتاخدت ولها أسباب:

#### 1. RLS معطّل
**ليه؟** الـ access control بيتم على مستوى الـ frontend logic. RLS هيعقد التطوير.
**التبعات:** أى حد يقدر يصل للـ DB بـ anon key يقدر يقرأ كل الجداول. المخاطرة مقبولة لأن البيانات مش حساسة بدرجة عالية.

#### 2. Single-page HTML files (مفيش framework)
**ليه؟** سرعة، بساطة، GitHub Pages يكفى.
**التبعات:** الملفات كبيرة (admin = 325K) لكن سهلة الـ deploy.

#### 3. n8n على VPS بدل cloud
**ليه؟** لا حدود رسائل، تحكم كامل، تكلفة أقل.

#### 4. webhook patterns موحدة
كل webhook يستخدم `responseMode: onReceived` للـ async work، الـ frontend ما يستناش الرد.

#### 5. Telegram Bot Token hardcoded فى Plan Actions code
**ملاحظة:** ده مش best practice. لو الـ token اتعرّض، لازم نـ regenerate من BotFather ونحدثه فى الـ workflow.

---

## 9. Common Issues & Lessons Learned

### 🐛 Bugs اتحلوا (للتذكر):

#### "fetch is not a function" فى n8n Code node
- **المشكلة:** الـ `fetch` API مش متاحة بثبات فى n8n self-hosted.
- **الحل:** استخدم `this.helpers.httpRequest({...})` بدلاً منها.

#### Booking JSON فى onclick attribute بيكسر الكود
- **المشكلة:** لو فى apostrophe فى الـ JSON (زى اسم بـ كلمة فيها '), الـ HTML يتكسر.
- **الحل:** استخدم cache object keyed by ID بدل embedding JSON فى الـ HTML.

#### Arabic strings فى REST API URLs
- **المشكلة:** Supabase REST يحتاج percent-encoding للنص العربى.
- **الحل:** `encodeURIComponent(value)` على كل value فى الـ query.

#### `exitEditMode()` بيمسح الـ payload قبل ما يتبعت
- **المشكلة:** الـ state-resetting functions يجب أن تـ fire بعد ما الـ payload يتبعت.
- **الحل:** بناء الـ payload أولاً، ثم استدعاء `sendTelegramConfirm()`، ثم `exitEditMode()`.

#### Browser cache بيخفى التحديثات
- أول diagnostic step: hard refresh (Ctrl+Shift+R).

#### Gmail nodes "Retry On Fail" يسبب loops
- **الحل:** عطّل Retry على Gmail nodes عشان مش يعيد إرسال failed messages لأبد.

#### Supabase MCP `execute_sql` يرجع نتيجة آخر statement فقط
- **الحل:** نفّذ كل statement بـ call منفصلة لو فى أكتر من واحد.

#### الـ HTTP Request response structure متغيرة
- **المشكلة:** أحياناً `$json` = array، أحياناً = object واحد، أحياناً = `$json[0]`.
- **الحل:** اعمل defensive check فى الكود:
  ```javascript
  let row = $input.first().json;
  if (Array.isArray(row)) row = row[0];
  if (row.data) row = row.data;
  if (Array.isArray(row)) row = row[0];
  ```

#### Telegram URL upload limit
- **المشكلة:** فيديو > 20MB لا يمكن إرساله عبر URL لـ Telegram cloud.
- **الحل غير المنفذ (للذكر):** Local Bot API Server يدعم 2GB.

#### Supabase Storage bucket file_size_limit
- **القيمة الحالية:** 50MB
- **مكان التعديل:** Supabase Dashboard → Storage → broadcast_media → Settings

#### Gmail OAuth re-auth بعد import workflow
- بعد كل import، الـ Gmail credential يجب re-auth.

---

## 10. Maintenance Tasks

### مهام دورية يمكن تحتاجها:

#### تحديث إيميل مخزن
```sql
UPDATE warehouses SET email = 'new@email.com' WHERE name = 'السادات';
-- مش محتاج تعديل أى workflow (DB-driven)
```

#### تغيير وقت التقرير اليومى
```sql
UPDATE app_settings SET value = '7' WHERE key = 'report_schedule_hour';
-- 7 يعنى الساعة 7 صباحاً
```

#### إيقاف التقرير اليومى مؤقتاً
```sql
UPDATE app_settings SET value = 'manual' WHERE key = 'report_schedule_type';
-- لاستئنافه: غير لـ 'daily'
```

#### اختبار إيميل المخزن من الأدمن
صفحة الأدمن → 📦 إيميلات المخازن → زر "Test Email"

#### Backfill checkin_alert_sent_at لو الـ column أتعطل
```sql
UPDATE bookings 
SET checkin_alert_sent_at = NOW()
WHERE status = 'تم التنفيذ' AND checkin_alert_sent_at IS NULL
  AND created_at < NOW() - INTERVAL '1 day';
```

#### Reset seq_number بعد دورة شهرية
الـ trigger بيعمل ده تلقائياً based on `seq_apply_from_date` و `seq_reset_day_of_week`.

#### Backup n8n workflows
```bash
# على الـ VPS
cd /docker/n8n/backups
ls -la  # backups daily 3AM
```

---

## 🚨 Security Notes

⚠️ **متحطش الحاجات دى فى الـ public repo:**
- n8n admin password
- Telegram Bot Token (`8693428718:AAE...`)
- VPS SSH keys
- Supabase Service Role Key (لو موجود)
- Gmail OAuth tokens

**اللى مسموح يكون public:**
- Supabase URL + Anon Key (هما meant to be public)
- n8n webhook URLs (مش مشكلة لأن الـ payload فيه validation)
- GitHub Pages URL

---

## 📞 الاتصال

- **Owner:** Mido (`@hawa_car_bot` admin)
- **Telegram:** `1275834201`
- **Repo:** [github.com/midoegypt213456789-png/hawa-app](https://github.com/midoegypt213456789-png/hawa-app)

---

> **آخر مراجعة:** 8 مايو 2026
> **Built with:** ❤️ + n8n + Supabase + Telegram
