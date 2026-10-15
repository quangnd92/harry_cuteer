# 🔮 Hướng Dẫn Cài Đặt Backend - Google Apps Script

> Backend xử lý đơn hàng cho dịch vụ Tarot Reading của Harry Cuteer.
> Nhận đơn hàng từ frontend → Lưu Google Sheets → Thông báo Telegram → Gửi Email.

---

## 📋 Mục Lục

1. [Tạo Google Spreadsheet](#1--tạo-google-spreadsheet)
2. [Tạo Google Apps Script](#2--tạo-google-apps-script)
3. [Tạo Telegram Bot](#3--tạo-telegram-bot)
4. [Lấy Telegram Chat ID](#4--lấy-telegram-chat-id)
5. [Cấu hình Code.gs](#5--cấu-hình-codegs)
6. [Deploy Web App](#6--deploy-web-app)
7. [Cập nhật URL vào Frontend](#7--cập-nhật-url-vào-frontend)
8. [Test thử](#8--test-thử)

---

## 1. 📊 Tạo Google Spreadsheet

Google Sheets sẽ là "database" lưu trữ tất cả đơn hàng.

### Các bước:

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Nhấn **"+ Blank"** (Bảng tính trống) để tạo spreadsheet mới
3. Đặt tên: **"Harry Cuteer - Đơn hàng Tarot"**
4. **Lấy Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID_Ở_ĐÂY]/edit
   ```
   - Ví dụ URL: `https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit`
   - Thì ID là: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`
5. **Copy lại ID** này, sẽ cần dùng ở bước cấu hình

> **💡 Lưu ý:** Không cần tạo headers thủ công. Code sẽ tự tạo headers khi nhận đơn hàng đầu tiên.

---

## 2. 📝 Tạo Google Apps Script

Google Apps Script là nơi chạy code backend.

### Các bước:

1. Truy cập [Google Apps Script](https://script.google.com)
2. Nhấn **"New project"** (Dự án mới)
3. Đặt tên dự án: Nhấn vào "Untitled project" ở góc trên bên trái → Đổi thành **"Harry Cuteer Backend"**
4. **Xóa toàn bộ code mặc định** trong file `Code.gs`
5. **Copy toàn bộ nội dung** từ file `Code.gs` trong thư mục này
6. **Paste** (dán) vào editor của Apps Script
7. Nhấn **Ctrl+S** (hoặc Cmd+S trên Mac) để lưu

> **⚠️ Quan trọng:** Chỉ paste đúng nội dung file `Code.gs`, không thêm bớt gì.

---

## 3. 🤖 Tạo Telegram Bot

Telegram Bot sẽ gửi thông báo đơn hàng mới đến bạn ngay lập tức.

### Các bước:

1. Mở ứng dụng **Telegram** (trên điện thoại hoặc máy tính)
2. Tìm kiếm **@BotFather** trong thanh search
3. Nhấn **Start** để bắt đầu chat với BotFather
4. Gửi lệnh: `/newbot`
5. BotFather sẽ hỏi **tên bot** → Nhập tên, ví dụ: `Harry Cuteer Tarot Bot`
6. BotFather sẽ hỏi **username** cho bot → Nhập username kết thúc bằng `bot`, ví dụ: `harry_cuteer_tarot_bot`
7. BotFather sẽ trả về **Bot Token** có dạng:
   ```
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
8. **Copy lại Token** này, sẽ cần dùng ở bước cấu hình

> **🔒 Bảo mật:** Token này rất quan trọng, KHÔNG chia sẻ với bất kỳ ai!

---

## 4. 💬 Lấy Telegram Chat ID

Chat ID là địa chỉ để bot gửi tin nhắn đến đúng tài khoản của bạn.

### Cách 1: Dùng @userinfobot (Đơn giản nhất)

1. Tìm kiếm **@userinfobot** trên Telegram
2. Nhấn **Start**
3. Bot sẽ trả về thông tin của bạn, bao gồm **Id** (Chat ID)
4. **Copy lại số Chat ID** này

### Cách 2: Dùng @RawDataBot

1. Tìm kiếm **@RawDataBot** trên Telegram
2. Nhấn **Start**
3. Bot sẽ trả về JSON data, tìm trường `"id"` trong phần `"chat"`
4. **Copy lại số ID** này

### Cách 3: Dùng API (Nâng cao)

1. Gửi một tin nhắn bất kỳ đến bot bạn vừa tạo
2. Truy cập URL sau trong trình duyệt (thay `YOUR_BOT_TOKEN` bằng token thật):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. Tìm trường `"chat":{"id": XXXXXX}` trong kết quả JSON
4. **Copy lại số ID** đó

> **💡 Lưu ý:** Chat ID thường là một số dương (ví dụ: `1234567890`). Nếu dùng cho group, nó sẽ là số âm.

---

## 5. ⚙️ Cấu Hình Code.gs

Bây giờ điền thông tin vào file Code.gs trên Google Apps Script.

### Các bước:

1. Mở lại project **Google Apps Script** đã tạo ở bước 2
2. Tìm phần `CONFIG` ở đầu file (khoảng dòng 12-22)
3. Thay thế các giá trị:

```javascript
const CONFIG = {
  // Paste Bot Token từ bước 3
  TELEGRAM_BOT_TOKEN: '7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

  // Paste Chat ID từ bước 4
  TELEGRAM_CHAT_ID: '1234567890',

  // Email của bạn (phải là email đang đăng nhập Google Apps Script)
  ADMIN_EMAIL: 'email-cua-ban@gmail.com',

  // Paste Spreadsheet ID từ bước 1
  SPREADSHEET_ID: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ'
};
```

4. Nhấn **Ctrl+S** để lưu

---

## 6. 🚀 Deploy Web App

Deploy (triển khai) để biến code thành một URL có thể nhận request từ frontend.

### Các bước:

1. Trong Google Apps Script Editor, nhấn nút **Deploy** (Triển khai) ở góc trên bên phải
2. Chọn **"New deployment"** (Triển khai mới)
3. Nhấn vào **biểu tượng bánh răng** ⚙️ bên cạnh "Select type"
4. Chọn **"Web app"** (Ứng dụng web)
5. Điền thông tin:
   - **Description** (Mô tả): `Harry Cuteer Tarot Backend v1`
   - **Execute as** (Thực thi dưới danh nghĩa): Chọn **"Me"** (Tôi)
   - **Who has access** (Ai có quyền truy cập): Chọn **"Anyone"** (Bất kỳ ai)
6. Nhấn **"Deploy"** (Triển khai)
7. Lần đầu tiên, Google sẽ yêu cầu **cấp quyền**:
   - Nhấn **"Authorize access"**
   - Chọn tài khoản Google của bạn
   - Nhấn **"Advanced"** (Nâng cao) → **"Go to Harry Cuteer Backend (unsafe)"**
   - Nhấn **"Allow"** (Cho phép)
8. Sau khi deploy xong, bạn sẽ nhận được **Web App URL** có dạng:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec
   ```
9. **Copy lại URL** này!

> **⚠️ Quan trọng:** Mỗi khi sửa code, bạn cần tạo deployment MỚI:
> - Deploy → Manage deployments → Edit (biểu tượng bút chì)
> - Chọn Version: **"New version"**
> - Nhấn Deploy

---

## 7. 🔗 Cập Nhật URL Vào Frontend

Sau khi có Web App URL, bạn cần cập nhật vào frontend.

### Các bước:

1. Mở file `js/checkout.js` trong dự án frontend
2. Tìm dòng chứa `GOOGLE_SCRIPT_URL` hoặc URL endpoint
3. Thay thế bằng URL Web App vừa copy:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec';
   ```
4. Lưu file

---

## 8. 🧪 Test Thử

### Test trong Apps Script Editor:

1. Mở Google Apps Script Editor
2. Chọn function **`testSaveToSheet`** từ dropdown ở thanh công cụ
3. Nhấn **▶ Run** (Chạy)
4. Kiểm tra Google Sheets → Tab "Orders" sẽ có dữ liệu test

5. Chọn function **`testTelegram`** → Nhấn **▶ Run**
6. Kiểm tra Telegram → Bot sẽ gửi tin nhắn test

7. Chọn function **`testEmail`** → Nhấn **▶ Run**
8. Kiểm tra Email → Sẽ nhận được email test

9. Chọn function **`testFullFlow`** → Nhấn **▶ Run**
10. Kiểm tra tất cả: Sheets + Telegram + Email

### Test bằng URL (sau khi deploy):

Mở trình duyệt, truy cập Web App URL:
```
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec
```

Bạn sẽ thấy response:
```json
{
  "status": "ok",
  "service": "Harry Cuteer - Tarot Backend",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "🔮 Server đang hoạt động bình thường!"
}
```

### Test bằng cURL (nâng cao):

```bash
curl -X POST \
  'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec' \
  -H 'Content-Type: application/json' \
  -d '{
    "orderCode": "TAROT-CURL-001",
    "packageName": "🌟 Gói Ánh Sáng",
    "price": "199.000đ",
    "name": "Test User",
    "phone": "0901234567",
    "dob": "15/08/1995",
    "gender": "Nam",
    "concern": "Tình yêu",
    "question": "Test question?",
    "contactMethod": "Zalo",
    "contactAccount": "0901234567",
    "paymentImage": ""
  }'
```

---

## 🔧 Xử Lý Lỗi Thường Gặp

### Lỗi "Authorization required"
- Chưa cấp quyền → Chạy lại function bất kỳ → Nhấn "Authorize"

### Lỗi "Script function not found: doPost"
- Kiểm tra lại code đã paste đúng và đầy đủ chưa

### Lỗi Telegram không gửi được
- Kiểm tra Bot Token đúng chưa
- Đã nhắn tin cho bot trước chưa (cần gửi `/start` cho bot)
- Chat ID đúng chưa

### Lỗi Spreadsheet không tìm thấy
- Kiểm tra Spreadsheet ID đúng chưa
- Spreadsheet có bị xóa không
- Tài khoản deploy có quyền truy cập spreadsheet không

### Lỗi CORS trên Frontend
- Google Apps Script Web App tự động xử lý CORS
- Nếu vẫn lỗi, kiểm tra deploy mode phải là **"Anyone"**

### Cập nhật code nhưng không có hiệu lực
- Phải tạo **New version** khi deploy lại
- Deploy → Manage deployments → Edit → Version: New version → Deploy

---

## 📁 Cấu Trúc Dữ Liệu

### Request Body (Frontend → Backend):

```json
{
  "orderCode": "TAROT-1234567890",
  "packageName": "🌟 Gói Ánh Sáng",
  "price": "199.000đ",
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "dob": "15/08/1995",
  "gender": "Nam",
  "concern": "Tình yêu",
  "question": "Câu hỏi của khách hàng",
  "contactMethod": "Zalo",
  "contactAccount": "0901234567",
  "paymentImage": "https://..."
}
```

### Response (Backend → Frontend):

```json
{
  "success": true,
  "message": "Đơn hàng đã được tiếp nhận thành công!",
  "orderCode": "TAROT-1234567890",
  "details": {
    "sheet": { "success": true, "row": 5 },
    "telegram": { "success": true, "messageId": 123 },
    "email": { "success": true }
  }
}
```

---

## 🎉 Hoàn Tất!

Sau khi làm xong tất cả các bước trên, hệ thống backend đã sẵn sàng hoạt động:

- ✅ **Google Sheets** - Lưu trữ đơn hàng
- ✅ **Telegram Bot** - Thông báo tức thời
- ✅ **Email** - Gửi email xác nhận
- ✅ **Web App URL** - API endpoint cho frontend

Mỗi khi khách hàng đặt đơn, bạn sẽ nhận được:
1. 📊 Một dòng mới trong Google Sheets
2. 📱 Một tin nhắn Telegram với đầy đủ thông tin
3. 📧 Một email HTML đẹp mắt với chi tiết đơn hàng

---

*Nếu cần hỗ trợ, hãy liên hệ developer! 🔮*
