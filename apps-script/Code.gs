/**
 * Agristack Project Tracking Dashboard — Google Apps Script Backend
 *
 * Provides:
 *   - autoSetup()        → bootstraps Sheets with headers & seed data
 *   - doGet(e)           → returns all module + payment data as JSON
 *   - doPost(e)          → routes add_module, update_module, update_payment, upload_uat_image
 */

// ──────────────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────────────
var FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';

var MODULES_SHEET   = 'Modules_Data';
var PAYMENTS_SHEET  = 'Payment_Milestones';

var MODULES_HEADERS = [
  'Module_ID',
  'Module_Name',
  'Type',
  'Scope_Requirements',
  'UAT_Status',
  'UAT_Date',
  'UAT_Image_URLs',
  'Current_Blockers',
  'IT_Cell_Last_Action',
  'Sub_Modules',
  'Mapped_Milestone'
];

var PAYMENTS_HEADERS = [
  'Milestone_Name',
  'Amount',
  'Payment_Status'
];

var PAYMENTS_SEED = [
  ['MoU Signed',                   0,        'Completed'],
  ['CAPEX 50:50 GoK/NABCONS',     15000000,  'Pending'],
  ['OPEX Phase 1',                 8000000,   'Pending'],
  ['OPEX Phase 2',                12000000,   'Pending'],
  ['UAT Completion Milestone',     5000000,   'Pending']
];

// ──────────────────────────────────────────────
// SETUP
// ──────────────────────────────────────────────

/**
 * Deletes existing Modules_Data and Payment_Milestones sheets (if any),
 * recreates them with headers, formatting, and seed data.
 */
function autoSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- helper: delete sheet by name (silently skips if absent) ---
  function deleteSheetIfExists(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.deleteSheet(sheet);
    }
  }

  // --- helper: create sheet, write headers, format ---
  function createSheet(name, headers) {
    var sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    return sheet;
  }

  // Remove old sheets
  deleteSheetIfExists(MODULES_SHEET);
  deleteSheetIfExists(PAYMENTS_SHEET);

  // Create Modules_Data
  createSheet(MODULES_SHEET, MODULES_HEADERS);

  // Create Payment_Milestones and seed data
  var paySheet = createSheet(PAYMENTS_SHEET, PAYMENTS_HEADERS);
  if (PAYMENTS_SEED.length > 0) {
    paySheet
      .getRange(2, 1, PAYMENTS_SEED.length, PAYMENTS_HEADERS.length)
      .setValues(PAYMENTS_SEED);
    paySheet.autoResizeColumns(1, PAYMENTS_HEADERS.length);
  }

  SpreadsheetApp.flush();
  Logger.log('autoSetup complete — sheets created and seeded.');
}

// ──────────────────────────────────────────────
// HTTP HANDLERS
// ──────────────────────────────────────────────

/**
 * GET handler — returns all modules and payment milestones as JSON.
 */
function doGet(e) {
  try {
    var modules  = sheetToObjects_(MODULES_SHEET);
    var payments = sheetToObjects_(PAYMENTS_SHEET);

    return jsonResponse_({
      status: 'success',
      data: {
        modules:  modules,
        payments: payments
      }
    });
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err.message
    });
  }
}

/**
 * POST handler — routes actions: add_module, update_module,
 * update_payment, upload_uat_image.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST body received.');
    }

    var payload = JSON.parse(e.postData.contents);
    var action  = payload.action;

    if (!action) {
      throw new Error('Missing "action" field in request body.');
    }

    switch (action) {
      case 'add_module':
        return handleAddModule_(payload);
      case 'update_module':
        return handleUpdateModule_(payload);
      case 'delete_module':
        return handleDeleteModule_(payload);
      case 'add_payment':
        return handleAddPayment_(payload);
      case 'update_payment':
        return handleUpdatePayment_(payload);
      case 'upload_uat_image':
        return handleUploadUatImage_(payload);
      default:
        throw new Error('Unknown action: ' + action);
    }
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: err.message
    });
  }
}

// ──────────────────────────────────────────────
// ACTION HANDLERS
// ──────────────────────────────────────────────

/**
 * Appends a new module row. Auto-generates Module_ID as MOD_<rowNumber>.
 */
function handleAddModule_(payload) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MODULES_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + MODULES_SHEET + '" not found. Run autoSetup() first.');
  }

  var lastRow  = sheet.getLastRow(); // includes header
  var moduleId = 'MOD_' + (lastRow); // header is row 1, so first data row yields MOD_1

  var newRow = [
    moduleId,
    payload.Module_Name        || '',
    payload.Type               || '',
    payload.Scope_Requirements || '',
    payload.UAT_Status         || '',
    payload.UAT_Date           || '',
    payload.UAT_Image_URLs     || '',
    payload.Current_Blockers   || '',
    payload.IT_Cell_Last_Action|| '',
    payload.Sub_Modules        || '',
    payload.Mapped_Milestone   || ''
  ];

  sheet.appendRow(newRow);

  var moduleObj = rowToObject_(MODULES_HEADERS, newRow);
  return jsonResponse_({
    status: 'success',
    data: moduleObj
  });
}

/**
 * Updates an existing module row found by Module_ID.
 * Only overwrites fields that are present in the payload.
 */
function handleUpdateModule_(payload) {
  var moduleId = payload.Module_ID;
  if (!moduleId) {
    throw new Error('Missing "Module_ID" in payload.');
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MODULES_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + MODULES_SHEET + '" not found. Run autoSetup() first.');
  }

  var rowIndex = findRowByColumnValue_(sheet, 1, moduleId); // col 1 = Module_ID
  if (rowIndex === -1) {
    throw new Error('Module not found: ' + moduleId);
  }

  var range  = sheet.getRange(rowIndex, 1, 1, MODULES_HEADERS.length);
  var values = range.getValues()[0];

  // Update each field if provided in payload
  for (var i = 0; i < MODULES_HEADERS.length; i++) {
    var key = MODULES_HEADERS[i];
    if (key !== 'Module_ID' && payload.hasOwnProperty(key)) {
      values[i] = payload[key];
    }
  }

  range.setValues([values]);

  var moduleObj = rowToObject_(MODULES_HEADERS, values);
  return jsonResponse_({
    status: 'success',
    data: moduleObj
  });
}

/**
 * Updates Payment_Status for a milestone matched by Milestone_Name.
 */
function handleUpdatePayment_(payload) {
  var milestoneName = payload.Milestone_Name;
  if (!milestoneName) {
    throw new Error('Missing "Milestone_Name" in payload.');
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PAYMENTS_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + PAYMENTS_SHEET + '" not found. Run autoSetup() first.');
  }

  var rowIndex = findRowByColumnValue_(sheet, 1, milestoneName); // col 1 = Milestone_Name
  if (rowIndex === -1) {
    throw new Error('Milestone not found: ' + milestoneName);
  }

  var statusCol = 3; // Payment_Status is the 3rd column
  if (payload.hasOwnProperty('Payment_Status')) {
    sheet.getRange(rowIndex, statusCol).setValue(payload.Payment_Status);
  }

  var range  = sheet.getRange(rowIndex, 1, 1, PAYMENTS_HEADERS.length);
  var values = range.getValues()[0];

  var paymentObj = rowToObject_(PAYMENTS_HEADERS, values);
  return jsonResponse_({
    status: 'success',
    data: paymentObj
  });
}

/**
 * Appends a new payment milestone row.
 */
function handleAddPayment_(payload) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PAYMENTS_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + PAYMENTS_SHEET + '" not found. Run autoSetup() first.');
  }

  var newRow = [
    payload.Milestone_Name || '',
    Number(payload.Amount) || 0,
    payload.Payment_Status || 'Pending'
  ];

  sheet.appendRow(newRow);

  var paymentObj = rowToObject_(PAYMENTS_HEADERS, newRow);
  return jsonResponse_({
    status: 'success',
    data: paymentObj
  });
}

/**
 * Decodes a Base64 image, saves it to a Drive folder, appends the
 * public URL to the module's UAT_Image_URLs column.
 */
function handleUploadUatImage_(payload) {
  var moduleId  = payload.moduleId;
  var imageData = payload.imageData;
  var mimeType  = payload.mimeType;
  var fileName  = payload.fileName;

  if (!moduleId)  throw new Error('Missing "moduleId" in payload.');
  if (!imageData) throw new Error('Missing "imageData" (Base64) in payload.');
  if (!mimeType)  throw new Error('Missing "mimeType" in payload.');
  if (!fileName)  throw new Error('Missing "fileName" in payload.');

  // --- Save file to Drive ---
  if (FOLDER_ID === 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE') {
    throw new Error('FOLDER_ID has not been configured. Update it in Code.gs and redeploy.');
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(FOLDER_ID);
  } catch (driveErr) {
    throw new Error('Cannot access Drive folder. Check FOLDER_ID. ' + driveErr.message);
  }

  var decoded = Utilities.base64Decode(imageData);
  var blob    = Utilities.newBlob(decoded, mimeType, fileName);
  var file    = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var imageUrl = 'https://drive.google.com/uc?id=' + file.getId();

  // --- Append URL to module row ---
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MODULES_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + MODULES_SHEET + '" not found. Run autoSetup() first.');
  }

  var rowIndex = findRowByColumnValue_(sheet, 1, moduleId);
  if (rowIndex === -1) {
    throw new Error('Module not found: ' + moduleId);
  }

  var urlCol      = MODULES_HEADERS.indexOf('UAT_Image_URLs') + 1; // 1-indexed
  var currentUrls = sheet.getRange(rowIndex, urlCol).getValue();
  var updatedUrls = currentUrls
    ? currentUrls + ',' + imageUrl
    : imageUrl;

  sheet.getRange(rowIndex, urlCol).setValue(updatedUrls);

  return jsonResponse_({
    status: 'success',
    imageUrl: imageUrl
  });
}

/**
 * Deletes a module row matching Module_ID.
 */
function handleDeleteModule_(payload) {
  var moduleId = payload.Module_ID;
  if (!moduleId) {
    throw new Error('Missing "Module_ID" in payload.');
  }

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MODULES_SHEET);

  if (!sheet) {
    throw new Error('Sheet "' + MODULES_SHEET + '" not found. Run autoSetup() first.');
  }

  var rowIndex = findRowByColumnValue_(sheet, 1, moduleId); // col 1 = Module_ID
  if (rowIndex === -1) {
    throw new Error('Module not found: ' + moduleId);
  }

  sheet.deleteRow(rowIndex);

  return jsonResponse_({
    status: 'success',
    message: 'Module deleted: ' + moduleId
  });
}

// ──────────────────────────────────────────────
// UTILITY HELPERS
// ──────────────────────────────────────────────

/**
 * Reads an entire sheet and returns an array of objects keyed by header names.
 * Returns [] if the sheet is empty or has only headers.
 */
function sheetToObjects_(sheetName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Sheet "' + sheetName + '" not found. Run autoSetup() first.');
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return []; // no data rows
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data    = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var result  = [];

  for (var r = 0; r < data.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = data[r][c];
    }
    result.push(obj);
  }

  return result;
}

/**
 * Converts a single row array + headers array into a key-value object.
 */
function rowToObject_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = (i < row.length) ? row[i] : '';
  }
  return obj;
}

/**
 * Searches a column for a value and returns the 1-indexed row number,
 * or -1 if not found.
 */
function findRowByColumnValue_(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var data = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(value).trim()) {
      return i + 2; // convert 0-based to 1-based + header offset
    }
  }
  return -1;
}

/**
 * Returns a CORS-friendly JSON text output.
 */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
