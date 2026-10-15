// ============================================================
// 🔮 HARRY CUTEER - TAROT READING SERVICE
// Google Apps Script Backend
// ============================================================
// Deploy as Web App to receive orders from frontend,
// save to Google Sheets, notify via Telegram & Email.
// ============================================================

// ─── CẤU HÌNH - Điền thông tin của bạn vào đây ─────────────
const CONFIG = {
  // Token của Telegram Bot (lấy từ @BotFather)
  TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN',

  // Chat ID của bạn trên Telegram (lấy từ @userinfobot)
  TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID',

  // Email admin nhận thông báo đơn hàng
  ADMIN_EMAIL: 'your-email@gmail.com',

  // ID của Google Spreadsheet lưu đơn hàng
  // (lấy từ URL: https://docs.google.com/spreadsheets/d/{ID}/edit)
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID'
};

// ─── Headers cho bảng tính ──────────────────────────────────
const SHEET_HEADERS = [
  'Timestamp',
  'Mã đơn',
  'Gói dịch vụ',
  'Giá',
  'Họ tên',
  'Số điện thoại',
  'Ngày sinh',
  'Giới tính',
  'Vấn đề quan tâm',
  'Câu hỏi',
  'Phương thức liên lạc',
  'Tài khoản liên lạc',
  'Ảnh chuyển khoản',
  'Trạng thái'
];


// ============================================================
// 📨 doPost - Xử lý POST request từ frontend
// ============================================================
function doPost(e) {
  try {
    // Parse dữ liệu JSON từ request body
    const data = JSON.parse(e.postData.contents);

    // Validate dữ liệu bắt buộc
    if (!data.orderCode || !data.name || !data.phone) {
      return createJsonResponse({
        success: false,
        error: 'Thiếu thông tin bắt buộc (orderCode, name, phone)'
      }, 400);
    }

    // Lưu vào Google Sheets
    const sheetResult = saveToSheet(data);

    // Gửi thông báo Telegram
    const telegramResult = sendTelegramNotification(data);

    // Gửi email thông báo
    const emailResult = sendEmailNotification(data);

    // Trả về kết quả
    return createJsonResponse({
      success: true,
      message: 'Đơn hàng đã được tiếp nhận thành công!',
      orderCode: data.orderCode,
      details: {
        sheet: sheetResult,
        telegram: telegramResult,
        email: emailResult
      }
    });

  } catch (error) {
    // Log lỗi để debug
    console.error('doPost error:', error.message, error.stack);

    return createJsonResponse({
      success: false,
      error: 'Có lỗi xảy ra khi xử lý đơn hàng: ' + error.message
    }, 500);
  }
}


// ============================================================
// 🏥 doGet - Health check endpoint
// ============================================================
function doGet(e) {
  return createJsonResponse({
    status: 'ok',
    service: 'Harry Cuteer - Tarot Backend',
    timestamp: new Date().toISOString(),
    message: '🔮 Server đang hoạt động bình thường!'
  });
}


// ============================================================
// 📊 saveToSheet - Lưu đơn hàng vào Google Sheets
// ============================================================
function saveToSheet(data) {
  try {
    // Mở spreadsheet theo ID
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    // Lấy hoặc tạo sheet "Orders"
    let sheet = spreadsheet.getSheetByName('Orders');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Orders');
    }

    // Nếu sheet trống, thêm headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SHEET_HEADERS);

      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#2d1b69');
      headerRange.setFontColor('#f5d060');
      headerRange.setHorizontalAlignment('center');

      // Đặt độ rộng cột hợp lý
      sheet.setColumnWidth(1, 180);  // Timestamp
      sheet.setColumnWidth(2, 140);  // Mã đơn
      sheet.setColumnWidth(3, 160);  // Gói dịch vụ
      sheet.setColumnWidth(4, 120);  // Giá
      sheet.setColumnWidth(5, 160);  // Họ tên
      sheet.setColumnWidth(6, 130);  // SĐT
      sheet.setColumnWidth(7, 120);  // Ngày sinh
      sheet.setColumnWidth(8, 100);  // Giới tính
      sheet.setColumnWidth(9, 200);  // Vấn đề
      sheet.setColumnWidth(10, 300); // Câu hỏi
      sheet.setColumnWidth(11, 150); // PT liên lạc
      sheet.setColumnWidth(12, 160); // TK liên lạc
      sheet.setColumnWidth(13, 250); // Ảnh CK
      sheet.setColumnWidth(14, 120); // Trạng thái

      // Freeze header row
      sheet.setFrozenRows(1);
    }

    // Tạo timestamp theo múi giờ Việt Nam
    const timestamp = Utilities.formatDate(
      new Date(),
      'Asia/Ho_Chi_Minh',
      'dd/MM/yyyy HH:mm:ss'
    );

    // Chuẩn bị dữ liệu row
    const rowData = [
      timestamp,
      data.orderCode || '',
      data.packageName || '',
      data.price || '',
      data.name || '',
      data.phone || '',
      data.dob || '',
      data.gender || '',
      data.concern || '',
      data.question || '',
      data.contactMethod || '',
      data.contactAccount || '',
      data.paymentImage || '',
      'Mới'  // Trạng thái mặc định
    ];

    // Thêm row mới
    sheet.appendRow(rowData);

    // Highlight row mới với màu nền nhạt
    const lastRow = sheet.getLastRow();
    const newRowRange = sheet.getRange(lastRow, 1, 1, SHEET_HEADERS.length);
    if (lastRow % 2 === 0) {
      newRowRange.setBackground('#f3f0ff');
    }

    return { success: true, row: lastRow };

  } catch (error) {
    console.error('saveToSheet error:', error.message);
    return { success: false, error: error.message };
  }
}


// ============================================================
// 📱 sendTelegramNotification - Gửi thông báo qua Telegram
// ============================================================
function sendTelegramNotification(data) {
  try {
    const token = CONFIG.TELEGRAM_BOT_TOKEN;
    const chatId = CONFIG.TELEGRAM_CHAT_ID;

    // Kiểm tra cấu hình
    if (token === 'YOUR_BOT_TOKEN' || chatId === 'YOUR_CHAT_ID') {
      console.warn('Telegram chưa được cấu hình');
      return { success: false, error: 'Telegram chưa được cấu hình' };
    }

    // ── Format tin nhắn đẹp với emoji ──
    const message = [
      '🔮 *ĐƠN HÀNG MỚI \\- TAROT*',
      '━━━━━━━━━━━━━━━━━━',
      '',
      '📦 *Gói:* ' + escapeMarkdownV2(data.packageName || 'N/A'),
      '💰 *Giá:* ' + escapeMarkdownV2(data.price || 'N/A'),
      '',
      '👤 *Khách hàng:*',
      '• Họ tên: ' + escapeMarkdownV2(data.name || 'N/A'),
      '• SĐT: ' + escapeMarkdownV2(data.phone || 'N/A'),
      '• Ngày sinh: ' + escapeMarkdownV2(data.dob || 'N/A'),
      '• Giới tính: ' + escapeMarkdownV2(data.gender || 'N/A'),
      '',
      '❓ *Vấn đề:* ' + escapeMarkdownV2(data.concern || 'N/A'),
      '📝 *Câu hỏi:* ' + escapeMarkdownV2(data.question || 'N/A'),
      '',
      '📱 *Liên lạc qua:* ' + escapeMarkdownV2(data.contactMethod || 'N/A') + ' \\- ' + escapeMarkdownV2(data.contactAccount || 'N/A'),
      '🧾 *Mã đơn:* `' + escapeMarkdownV2(data.orderCode || 'N/A') + '`',
      '',
      '━━━━━━━━━━━━━━━━━━',
      '⏰ ' + escapeMarkdownV2(Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss'))
    ].join('\n');

    // Gửi tin nhắn text
    const sendMessageUrl = 'https://api.telegram.org/bot' + token + '/sendMessage';
    const textPayload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'MarkdownV2'
    };

    const textResponse = UrlFetchApp.fetch(sendMessageUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(textPayload),
      muteHttpExceptions: true
    });

    const textResult = JSON.parse(textResponse.getContentText());

    // ── Gửi ảnh chuyển khoản nếu có ──
    let photoResult = null;
    if (data.paymentImage && data.paymentImage.startsWith('http')) {
      const sendPhotoUrl = 'https://api.telegram.org/bot' + token + '/sendPhoto';
      const photoPayload = {
        chat_id: chatId,
        photo: data.paymentImage,
        caption: '🖼️ Ảnh chuyển khoản - Mã đơn: ' + (data.orderCode || 'N/A')
      };

      const photoResponse = UrlFetchApp.fetch(sendPhotoUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(photoPayload),
        muteHttpExceptions: true
      });

      photoResult = JSON.parse(photoResponse.getContentText());
    }

    return {
      success: textResult.ok === true,
      messageId: textResult.result ? textResult.result.message_id : null,
      photoSent: photoResult ? photoResult.ok === true : false
    };

  } catch (error) {
    console.error('sendTelegramNotification error:', error.message);
    return { success: false, error: error.message };
  }
}


// ============================================================
// 📧 sendEmailNotification - Gửi email thông báo
// ============================================================
function sendEmailNotification(data) {
  try {
    const adminEmail = CONFIG.ADMIN_EMAIL;

    // Kiểm tra cấu hình
    if (adminEmail === 'your-email@gmail.com') {
      console.warn('Email admin chưa được cấu hình');
      return { success: false, error: 'Email admin chưa được cấu hình' };
    }

    const subject = '[Tarot] Đơn hàng mới - ' + (data.orderCode || 'N/A');

    // ── HTML Email template ──
    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #1a0533;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1a0533 0%, #2d1b69 100%);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }
        .header {
          background: linear-gradient(135deg, #d4af37 0%, #f5d060 100%);
          padding: 24px;
          text-align: center;
        }
        .header h1 {
          color: #1a0533;
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .header p {
          color: #2d1b69;
          margin: 8px 0 0;
          font-size: 14px;
        }
        .body-content {
          padding: 24px;
          color: #e8e0f0;
        }
        .section {
          margin-bottom: 20px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        .section-title {
          color: #f5d060;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(212, 175, 55, 0.2);
        }
        .info-row {
          display: flex;
          padding: 6px 0;
          font-size: 14px;
        }
        .info-label {
          color: #b8a0d0;
          min-width: 140px;
          font-weight: 500;
        }
        .info-value {
          color: #ffffff;
          font-weight: 400;
        }
        .order-code {
          background: rgba(212, 175, 55, 0.15);
          color: #f5d060;
          padding: 4px 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .footer {
          padding: 16px 24px;
          text-align: center;
          color: #8a7a9a;
          font-size: 12px;
          border-top: 1px solid rgba(212, 175, 55, 0.1);
        }
        .payment-img {
          max-width: 100%;
          border-radius: 8px;
          margin-top: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 6px 0;
          font-size: 14px;
          vertical-align: top;
        }
        td.label {
          color: #b8a0d0;
          width: 140px;
          font-weight: 500;
        }
        td.value {
          color: #ffffff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🔮 ĐƠN HÀNG MỚI</h1>
          <p>Harry Cuteer - Tarot Reading Service</p>
        </div>

        <div class="body-content">
          <!-- Mã đơn hàng -->
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="order-code">${data.orderCode || 'N/A'}</span>
          </div>

          <!-- Thông tin gói -->
          <div class="section">
            <div class="section-title">📦 Thông tin đơn hàng</div>
            <table>
              <tr>
                <td class="label">Gói dịch vụ:</td>
                <td class="value">${data.packageName || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Giá:</td>
                <td class="value" style="color: #f5d060; font-weight: 600;">${data.price || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Thông tin khách hàng -->
          <div class="section">
            <div class="section-title">👤 Thông tin khách hàng</div>
            <table>
              <tr>
                <td class="label">Họ tên:</td>
                <td class="value">${data.name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Số điện thoại:</td>
                <td class="value">${data.phone || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Ngày sinh:</td>
                <td class="value">${data.dob || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Giới tính:</td>
                <td class="value">${data.gender || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Vấn đề & câu hỏi -->
          <div class="section">
            <div class="section-title">❓ Vấn đề & Câu hỏi</div>
            <table>
              <tr>
                <td class="label">Vấn đề:</td>
                <td class="value">${data.concern || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Câu hỏi:</td>
                <td class="value">${data.question || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Liên lạc -->
          <div class="section">
            <div class="section-title">📱 Phương thức liên lạc</div>
            <table>
              <tr>
                <td class="label">Liên lạc qua:</td>
                <td class="value">${data.contactMethod || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Tài khoản:</td>
                <td class="value">${data.contactAccount || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Ảnh chuyển khoản -->
          ${data.paymentImage ? `
          <div class="section">
            <div class="section-title">🖼️ Ảnh chuyển khoản</div>
            <img src="${data.paymentImage}" alt="Ảnh chuyển khoản" class="payment-img" />
          </div>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
          Đơn hàng được gửi lúc ${Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss')}<br>
          Harry Cuteer - Tarot Reading Service 🔮
        </div>
      </div>
    </body>
    </html>
    `;

    // Gửi email
    GmailApp.sendEmail(adminEmail, subject, '', {
      htmlBody: htmlBody,
      name: 'Harry Cuteer - Tarot'
    });

    return { success: true };

  } catch (error) {
    console.error('sendEmailNotification error:', error.message);
    return { success: false, error: error.message };
  }
}


// ============================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================

/**
 * Tạo JSON response với CORS headers
 * @param {Object} data - Dữ liệu trả về
 * @param {number} statusCode - HTTP status code (không dùng trong GAS nhưng giữ để reference)
 * @returns {ContentService.TextOutput}
 */
function createJsonResponse(data, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  return output;
}

/**
 * Escape ký tự đặc biệt cho Telegram MarkdownV2
 * @param {string} text - Chuỗi cần escape
 * @returns {string} Chuỗi đã escape
 */
function escapeMarkdownV2(text) {
  if (!text) return 'N/A';
  // Các ký tự cần escape trong MarkdownV2
  return String(text).replace(/([_\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}


// ============================================================
// 🧪 TEST FUNCTIONS - Dùng để test trong Apps Script Editor
// ============================================================

/**
 * Test hàm saveToSheet với dữ liệu mẫu
 */
function testSaveToSheet() {
  const testData = {
    orderCode: 'TAROT-TEST-001',
    packageName: '🌟 Gói Ánh Sáng',
    price: '199.000đ',
    name: 'Nguyễn Văn Test',
    phone: '0901234567',
    dob: '15/08/1995',
    gender: 'Nam',
    concern: 'Tình yêu',
    question: 'Mối quan hệ hiện tại sẽ phát triển như thế nào?',
    contactMethod: 'Zalo',
    contactAccount: '0901234567',
    paymentImage: 'https://example.com/payment.jpg'
  };

  const result = saveToSheet(testData);
  console.log('saveToSheet result:', JSON.stringify(result));
}

/**
 * Test hàm sendTelegramNotification với dữ liệu mẫu
 */
function testTelegram() {
  const testData = {
    orderCode: 'TAROT-TEST-001',
    packageName: '🌟 Gói Ánh Sáng',
    price: '199.000đ',
    name: 'Nguyễn Văn Test',
    phone: '0901234567',
    dob: '15/08/1995',
    gender: 'Nam',
    concern: 'Tình yêu',
    question: 'Mối quan hệ hiện tại sẽ phát triển như thế nào?',
    contactMethod: 'Zalo',
    contactAccount: '0901234567',
    paymentImage: ''
  };

  const result = sendTelegramNotification(testData);
  console.log('Telegram result:', JSON.stringify(result));
}

/**
 * Test hàm sendEmailNotification với dữ liệu mẫu
 */
function testEmail() {
  const testData = {
    orderCode: 'TAROT-TEST-001',
    packageName: '🌟 Gói Ánh Sáng',
    price: '199.000đ',
    name: 'Nguyễn Văn Test',
    phone: '0901234567',
    dob: '15/08/1995',
    gender: 'Nam',
    concern: 'Tình yêu',
    question: 'Mối quan hệ hiện tại sẽ phát triển như thế nào?',
    contactMethod: 'Zalo',
    contactAccount: '0901234567',
    paymentImage: 'https://example.com/payment.jpg'
  };

  const result = sendEmailNotification(testData);
  console.log('Email result:', JSON.stringify(result));
}

/**
 * Test full flow - doPost simulation
 */
function testFullFlow() {
  const testEvent = {
    postData: {
      contents: JSON.stringify({
        orderCode: 'TAROT-FULL-001',
        packageName: '✨ Gói Vũ Trụ',
        price: '499.000đ',
        name: 'Trần Thị Full Test',
        phone: '0987654321',
        dob: '20/12/1998',
        gender: 'Nữ',
        concern: 'Sự nghiệp',
        question: 'Năm tới tôi có nên chuyển việc không?',
        contactMethod: 'Instagram',
        contactAccount: '@fulltest',
        paymentImage: ''
      })
    }
  };

  const result = doPost(testEvent);
  console.log('Full flow result:', result.getContent());
}
