/**
 * Google Apps Script Web App: Raas Utsav 2026 Official Booking Enquiry Endpoint
 *
 * HOW TO DEPLOY:
 * 1. Open your target Google Sheet (e.g. "Raas Utsav 2026 - Booking Enquiries").
 * 2. In Google Sheets, click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this file's contents.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set Description: "Raas Utsav Booking Web App v1".
 * 7. Set "Execute as": "Me" (your Google account).
 * 8. Set "Who has access": "Anyone".
 * 9. Click "Deploy" and authorize permissions.
 * 10. Copy the Web App URL (e.g. https://script.google.com/macros/s/.../exec)
 *     and set it as NEXT_PUBLIC_BOOKING_SHEETS_ENDPOINT in your .env.local file.
 */

// Authoritative Pass Catalog matching official Raas Utsav passes from eventData.ts
var OFFICIAL_PASS_CATALOG = {
  // Official Client Pass Tiers (Slide 6 of Sponsor Presentation)
  'solo-female': { id: 'solo-female', name: 'SOLO PASS FEMALE', price: 999 },
  'couple': { id: 'couple', name: 'COUPLE PASS', price: 1999 },
  'family': { id: 'family', name: 'FAMILY PASS (4 PAX)', price: 3599 },
  'group': { id: 'group', name: 'GROUP PASS (6 PAX)', price: 4999 },
  'vip': { id: 'vip', name: 'VIP PASS', price: 1499 },

  // Generic / Alternate IDs
  'pass-single': { id: 'pass-single', name: 'Single Day Pass', price: 499 },
  'pass-couple': { id: 'pass-couple', name: 'Couple Pass (Pair Entry)', price: 899 },
  'pass-vip': { id: 'pass-vip', name: 'VIP Access Pass', price: 1299 },
  'pass-season': { id: 'pass-season', name: 'Full Festival Season Pass', price: 1899 },
  'pass-group': { id: 'pass-group', name: 'Group Pass (5 Friends)', price: 2199 }
};

// Fixed 11-column Google Sheet Header Row
var SHEET_HEADERS = [
  'Timestamp',
  'Booking ID',
  'Pass Type',
  'Quantity',
  'Unit Price',
  'Total',
  'Full Name',
  'WhatsApp / Mobile',
  'Email',
  'Submission Status',
  'Source'
];

/**
 * Handles CORS-safe simple POST from browser (Content-Type: text/plain;charset=utf-8)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire lock for up to 10 seconds to ensure serialized writes without row collisions
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: 'error', message: 'Empty submission payload' });
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return responseJSON({ status: 'error', message: 'Malformed JSON payload: ' + parseErr.toString() });
    }

    // 1. Anti-spam Honeypot Validation (silent drop if filled)
    if (data.hp_company_field && String(data.hp_company_field).trim().length > 0) {
      return responseJSON({ status: 'error', message: 'Anti-spam validation triggered' });
    }

    // 2. Validate Required Attendee Fields
    var fullName = (data.fullName || '').trim();
    if (fullName.length < 2 || fullName.length > 80) {
      return responseJSON({ status: 'error', message: 'Please provide a valid full name (2–80 characters)' });
    }

    // Convert phone to String and trim whitespace
    var inputPhone = String(data.phone || '').trim();
    if (!inputPhone) {
      return responseJSON({ status: 'error', message: 'WhatsApp / Mobile number is required' });
    }

    // Extract digits to validate length and mobile prefix
    var digitsOnly = inputPhone.replace(/\D/g, '');
    var tenDigits = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.indexOf('91') === 0) {
      tenDigits = digitsOnly.substring(2);
    } else if (digitsOnly.length === 11 && digitsOnly.indexOf('0') === 0) {
      tenDigits = digitsOnly.substring(1);
    }

    // Server-side validation: must be a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9)
    if (tenDigits.length !== 10 || !/^[6-9]\d{9}$/.test(tenDigits)) {
      return responseJSON({
        status: 'error',
        message: 'Please provide a valid 10-digit Indian mobile number (e.g. +91 99315 03960)'
      });
    }

    // Authoritative formatted plain text phone string with +91 prefix preserved
    // (Formatted as "+91 XXXXX XXXXX" for clean display, e.g. "+91 99315 03960")
    var formattedPhone = '+91 ' + tenDigits.substring(0, 5) + ' ' + tenDigits.substring(5);

    var email = (data.email || '').trim();
    if (!email || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
      email = 'N/A';
    }

    // 3. Authoritative Pass & Price Validation (Server-side catalog check)
    var passConfig = OFFICIAL_PASS_CATALOG[data.passId];
    if (!passConfig) {
      // Secondary fallback lookup by pass name (case-insensitive & trimmed)
      var targetName = String(data.passType || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      for (var key in OFFICIAL_PASS_CATALOG) {
        var catName = OFFICIAL_PASS_CATALOG[key].name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (catName === targetName) {
          passConfig = OFFICIAL_PASS_CATALOG[key];
          break;
        }
      }
    }
    // Tertiary fallback: if unitPrice is provided and within legitimate festival bounds, accept
    if (!passConfig) {
      var clientPrice = parseFloat(data.unitPrice);
      if (!isNaN(clientPrice) && clientPrice >= 300 && clientPrice <= 15000) {
        passConfig = {
          id: data.passId || 'custom-pass',
          name: (data.passType || 'Festival Pass').trim(),
          price: clientPrice
        };
      } else {
        return responseJSON({ status: 'error', message: 'Unrecognized festival pass tier' });
      }
    }

    var quantity = parseInt(data.quantity, 10);
    if (isNaN(quantity) || quantity < 1 || quantity > 20) {
      return responseJSON({ status: 'error', message: 'Pass quantity must be between 1 and 20' });
    }

    // Authoritative calculations (never trusting client-submitted total)
    var authoritativeUnitPrice = passConfig.price;
    var authoritativeTotal = authoritativeUnitPrice * quantity;

    // Booking Request ID validation
    var bookingId = String(data.bookingId || '').trim();
    if (!bookingId || bookingId.indexOf('RU26-REQ-') !== 0) {
      bookingId = 'RU26-REQ-' + Math.floor(1000 + Math.random() * 9000);
    }

    var timestamp = data.timestamp && !isNaN(Date.parse(data.timestamp)) ? data.timestamp : new Date().toISOString();
    var source = (data.source || 'Web Booking Desk (/booking)').trim();

    // 4. Append to Active Sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Automatically create fixed header row if sheet is brand new / empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SHEET_HEADERS);
      var headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1D1237');
      headerRange.setFontColor('#F3C64C');
    }

    // Append authoritative row with "'" prefix for Column 8 (WhatsApp / Mobile)
    // In Google Sheets, prefixing a value with an apostrophe ("'") is the official,
    // universal way to store a value as plain text. It preserves +91, avoids
    // formula/numeric evaluation, and never throws "typed column" formatting errors.
    sheet.appendRow([
      timestamp,
      bookingId,
      passConfig.name,
      quantity,
      authoritativeUnitPrice,
      authoritativeTotal,
      fullName,
      "'" + formattedPhone,
      email,
      'Pending Event Team Review',
      source
    ]);

    // Explicitly ensure Column 8 on the appended row contains the apostrophe-prefixed text
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 8).setValue("'" + formattedPhone);

    // Return success response
    return responseJSON({
      status: 'success',
      bookingId: bookingId,
      passType: passConfig.name,
      quantity: quantity,
      unitPrice: authoritativeUnitPrice,
      total: authoritativeTotal,
      phone: formattedPhone,
      message: 'Booking request recorded successfully'
    });

  } catch (err) {
    return responseJSON({
      status: 'error',
      message: 'Server error: ' + err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Returns JSON response with plain text / json mime-type
 */
function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Health-check GET handler
 */
function doGet(e) {
  return responseJSON({
    status: 'ok',
    service: 'Raas Utsav 2026 Booking Web App',
    timestamp: new Date().toISOString()
  });
}
