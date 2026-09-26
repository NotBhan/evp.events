/**
 * Google Apps Script Web App: Raas Utsav 2026 Official Booking Enquiry Endpoint
 *
 * HOW TO DEPLOY:
 * 1. Open your target Google Sheet (e.g. "Raas Utsav 2026 - Booking Enquiries").
 * 2. In Google Sheets, click Extensions > Apps Script.
 * 3. Replace all code in Code.gs with this file's contents.
 * 4. Click "Deploy" > "New deployment" (or "Manage deployments" > edit > "Deploy").
 * 5. Select type: "Web app".
 * 6. Set Description: "Raas Utsav Booking Web App v2 (14 columns)".
 * 7. Set "Execute as": "Me" (your Google account).
 * 8. Set "Who has access": "Anyone".
 * 9. Click "Deploy" and authorize permissions.
 * 10. Copy the Web App URL (e.g. https://script.google.com/macros/s/.../exec)
 *     and set it as BOOKING_SHEETS_ENDPOINT in your .env.local file (server-side only).
 *
 * SCHEMA: 14 columns (A–N). Columns L/M/N carry the entry state mirrored from the
 * authoritative Neon check-in (Entry Taken / Entry Time / Scanned By). Deployment
 * runs a safe header repair+extend: existing rows are preserved, never cleared,
 * and the spreadsheet is never recreated.
 */

// Authoritative destination spreadsheet and tab (gid=0)
var BOOKING_SPREADSHEET_ID = '1wxctnQdchiufXzt25hfW5OCf8i08fJJPk78xkGo9RRM';
var BOOKING_SHEET_TAB_NAME = 'Sheet1';

// Authoritative Pass Catalog matching official Raas Utsav passes from eventData.ts
var OFFICIAL_PASS_CATALOG = {
  // Official Client Pass Tiers (Slide 6 of Sponsor Presentation)
  'solo-female': { id: 'solo-female', name: 'SOLO PASS FEMALE', price: 999 },
  'couple': { id: 'couple', name: 'COUPLE PASS', price: 1599 },
  'family': { id: 'family', name: 'FAMILY PASS (4 PAX)', price: 3099 },
  'group': { id: 'group', name: 'GROUP PASS (6 PAX)', price: 4599 },
  'vip': { id: 'vip', name: 'VIP PASS', price: 1499 },

  // Generic / Alternate IDs
  'pass-single': { id: 'pass-single', name: 'Single Day Pass', price: 499 },
  'pass-couple': { id: 'pass-couple', name: 'Couple Pass (Pair Entry)', price: 899 },
  'pass-vip': { id: 'pass-vip', name: 'VIP Access Pass', price: 1299 },
  'pass-season': { id: 'pass-season', name: 'Full Festival Season Pass', price: 1899 },
  'pass-group': { id: 'pass-group', name: 'Group Pass (5 Friends)', price: 2199 }
};

// Fixed 14-column Google Sheet Header Row (A–N)
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
  'Source',
  'Entry Taken',
  'Entry Time',
  'Scanned By'
];

/**
 * Resolves the pinned destination sheet by explicit spreadsheet id + tab name.
 * Never relies on the ambient active spreadsheet/active tab.
 */
function getBookingSheet() {
  var ss = SpreadsheetApp.openById(BOOKING_SPREADSHEET_ID);
  if (!ss) {
    throw new Error('Unable to open spreadsheet by id.');
  }
  var sheet = ss.getSheetByName(BOOKING_SHEET_TAB_NAME);
  if (!sheet) {
    throw new Error('Target sheet tab not found: ' + BOOKING_SHEET_TAB_NAME);
  }
  return sheet;
}

/**
 * Ensures the header row matches the 14-column schema.
 * - Brand new/empty sheet: writes and styles the full header row.
 * - Existing sheet: repairs/extends only the header row (row 1); data rows 2+ are
 *   never modified, cleared or reordered.
 */
function ensureSheetHeaders(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  var existing = headerRange.getValues()[0];

  var needsWrite = false;
  for (var i = 0; i < SHEET_HEADERS.length; i++) {
    if (String(existing[i] || '').trim() !== SHEET_HEADERS[i]) {
      needsWrite = true;
      break;
    }
  }

  if (needsWrite) {
    headerRange.setValues([SHEET_HEADERS]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1D1237');
    headerRange.setFontColor('#F3C64C');
  }

  return needsWrite;
}

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

    // Authoritative Booking ID validation
    var bookingId = String(data.bookingId || data.publicId || '').trim();
    if (!bookingId) {
      bookingId = 'RU26-REQ-' + Math.floor(1000 + Math.random() * 9000);
    }

    var timestamp = data.timestamp && !isNaN(Date.parse(data.timestamp)) ? data.timestamp : new Date().toISOString();
    var source = (data.source || 'Web Booking Desk (/booking)').trim();
    var submissionStatus = String(data.submissionStatus || data.status || 'CONFIRMED').trim();

    // Entry state (mirrored from the authoritative Neon check-in).
    // Invariants: CHECKED_IN => YES + entry time + scanned-by; anything else => NO + blanks.
    var entryTaken = String(data.entryTaken || '').trim().toUpperCase() === 'YES' ? 'YES' : 'NO';
    var entryTime = entryTaken === 'YES' && data.entryTime ? String(data.entryTime).trim() : '';
    var scannedBy = entryTaken === 'YES' && data.scannedBy ? String(data.scannedBy).trim() : '';

    // 4. Append or Update in Authoritative Destination Sheet (Upsert by Booking ID in Column B)
    var sheet;
    try {
      sheet = getBookingSheet();
    } catch (sheetErr) {
      return responseJSON({ status: 'error', message: 'Target sheet unavailable: ' + sheetErr.toString() });
    }
    var lastRow = sheet.getLastRow();

    // Ensure the 14-column header row exists / is repaired (data rows are never touched)
    ensureSheetHeaders(sheet);
    if (lastRow === 0) {
      lastRow = 1;
    }

    // Search Column B for existing bookingId (Column 2, rows 2 to lastRow)
    var targetRow = -1;
    if (lastRow > 1) {
      var idValues = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < idValues.length; i++) {
        if (String(idValues[i][0]).trim() === bookingId) {
          targetRow = i + 2; // Convert 0-indexed loop to 1-indexed sheet row
          break;
        }
      }
    }

    // Row values exactly matching the 14-column SHEET_HEADERS layout (full-row upsert):
    // [0] Timestamp, [1] Booking ID, [2] Pass Type, [3] Quantity, [4] Unit Price,
    // [5] Total, [6] Full Name, [7] WhatsApp / Mobile, [8] Email, [9] Submission Status,
    // [10] Source, [11] Entry Taken, [12] Entry Time, [13] Scanned By
    var rowValues = [
      timestamp,
      bookingId,
      passConfig.name,
      quantity,
      authoritativeUnitPrice,
      authoritativeTotal,
      fullName,
      "'" + formattedPhone,
      email,
      submissionStatus,
      source,
      entryTaken,
      entryTime,
      scannedBy
    ];

    // Out-of-order protection: Apps Script executions can finish after a client
    // timeout, so a delayed/replayed sync must never downgrade entry columns once
    // a pass has been admitted. Entry state is monotonic: NO -> YES only.
    if (targetRow > 1 && entryTaken === 'NO') {
      var existingEntry = sheet.getRange(targetRow, 12, 1, 3).getValues()[0];
      if (String(existingEntry[0] || '').trim().toUpperCase() === 'YES') {
        rowValues[11] = 'YES';
        rowValues[12] = existingEntry[1];
        rowValues[13] = existingEntry[2];
      }
    }

    if (targetRow > 1) {
      // Upsert: Update existing row with authoritative values
      sheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      sheet.getRange(targetRow, 8).setValue("'" + formattedPhone);
    } else {
      // Upsert: Append new row
      sheet.appendRow(rowValues);
      var newRow = sheet.getLastRow();
      sheet.getRange(newRow, 8).setValue("'" + formattedPhone);
    }

    // Return success response preserving contract
    return responseJSON({
      status: 'success',
      action: targetRow > 1 ? 'updated' : 'inserted',
      bookingId: bookingId,
      passType: passConfig.name,
      quantity: quantity,
      unitPrice: authoritativeUnitPrice,
      total: authoritativeTotal,
      phone: formattedPhone,
      message: targetRow > 1 ? 'Booking registration updated successfully' : 'Booking request recorded successfully'
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
 * Health-check GET handler with sheet connectivity probe
 */
function doGet(e) {
  var sheetStatus = 'unknown';
  var sheetName = null;
  var sheetError = null;
  try {
    var sheet = getBookingSheet();
    sheetStatus = 'connected';
    sheetName = sheet.getName();
  } catch (err) {
    sheetStatus = 'error';
    sheetError = err.toString();
  }

  return responseJSON({
    status: 'ok',
    service: 'Raas Utsav 2026 Booking Web App',
    schemaColumns: SHEET_HEADERS.length,
    sheetStatus: sheetStatus,
    sheetName: sheetName,
    sheetError: sheetError,
    timestamp: new Date().toISOString()
  });
}

/**
 * Manual test function to authorize permissions in Apps Script editor
 */
function testAuth() {
  var sheet = getBookingSheet();
  Logger.log('Connected sheet: ' + sheet.getName() + ', total rows: ' + sheet.getLastRow());
}
