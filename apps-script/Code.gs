/**
 * KATHIR Project Tracking Dashboard — Google Apps Script Backend
 *
 * Provides:
 *   - autoSetup()        → bootstraps Sheets with headers & seed data
 *   - doGet(e)           → returns all module, sub-module + payment data as JSON
 *   - doPost(e)          → routes CRUD actions for modules, sub-modules, payments, and uploads
 */

// ──────────────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────────────
var FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';

var MODULES_SHEET     = 'Modules_Data';
var PAYMENTS_SHEET    = 'Payment_Milestones';
var SUB_MODULES_SHEET = 'Sub_Modules_Data';

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
  'Mapped_Milestone',
  'Allocated_Amount'
];

var SUB_MODULES_HEADERS = [
  'Sub_Module_ID',
  'Parent_Module_ID',
  'Sub_Module_Name',
  'Scope_Requirements',
  'UAT_Status',
  'UAT_Date',
  'UAT_Image_URLs',
  'Current_Blockers',
  'IT_Cell_Last_Action'
];

var PAYMENTS_HEADERS = [
  'Milestone_Name',
  'Amount',
  'Payment_Status',
  'Type'
];

var PAYMENTS_SEED = [
  ['MoU Signed', 0, 'Completed', 'CAPEX'],
  ['Milestone 1 - Initial Design & Setup (10% CAPEX)', 1492000, 'Pending', 'CAPEX'],
  ['Milestone 2 - Core Database & GIS Dev (10% CAPEX)', 1492000, 'Pending', 'CAPEX'],
  ['Milestone 3 - Mobile Apps Development (10% CAPEX)', 1492000, 'Pending', 'CAPEX'],
  ['Milestone 4 - Integration & Security Audit (10% CAPEX)', 1492000, 'Pending', 'CAPEX'],
  ['Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 8952000, 'Pending', 'CAPEX'],
  ['OPEX Year 1 - Operations & Maintenance', 20000000, 'Pending', 'OPEX'],
  ['OPEX Year 2 - Operations & Maintenance', 20000000, 'Pending', 'OPEX'],
  ['OPEX Year 3 - Operations & Maintenance', 20000000, 'Pending', 'OPEX'],
  ['OPEX Year 4 - Operations & Maintenance', 20000000, 'Pending', 'OPEX'],
  ['OPEX Year 5 - Operations & Maintenance', 20000000, 'Pending', 'OPEX']
];

var MODULES_SEED = [
  ['MOD_1', 'Geoportal', 'Core', 'Interactive GIS-based mapping platform for agricultural land parcels. Includes satellite imagery integration, cadastral map overlays, crop pattern visualization, and administrative boundary layers.', 'Completed', '2026-04-15', '', '', 'Final UAT sign-off completed.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 1500000],
  ['MOD_2', 'AI Field Boundary Detection', 'AI', 'Deep learning model for automatic delineation of agricultural field boundaries from high-resolution satellite imagery (Sentinel-2). Target accuracy: 92% IoU.', 'In Progress', '2026-05-20', '', 'Model accuracy at 88% IoU — needs improvement on fragmented holdings.', 'Initiated data collection from North-East India.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 1200000],
  ['MOD_3', 'Unified Farmer Database', 'Core', 'Centralized registry linking Aadhaar-authenticated farmer profiles with land records, bank accounts, and scheme enrollment data.', 'Completed', '2026-03-28', '', '', 'Database migrated to production. 12.3 million farmer records verified.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 1500000],
  ['MOD_4', 'Crop Survey Module', 'Core', 'Mobile-first crop cutting experiment (CCE) digitization platform. Offline-capable Android app for field enumerators.', 'In Progress', '2026-05-30', '', 'Offline sync failing intermittently on Android 12 devices.', 'Bug fix deployed for sync issue (v2.4.1). Testing in progress.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 1000000],
  ['MOD_5', 'Weather Intelligence', 'AI', 'AI-powered hyper-local weather forecasting (5km grid) integrating IMD data and AWS station networks.', 'Not Started', '', '', 'IMD API data agreement pending.', 'MoU draft sent to IMD for data sharing.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 1000000],
  ['MOD_6', 'Soil Health Dashboard', 'Core', 'Interactive dashboard displaying soil test results across all districts. Integrates with SHC portal data.', 'Completed', '2026-04-02', '', '', 'Dashboard deployed. Historical data loaded for 2021-2026.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 1000000],
  ['MOD_7', 'Market Price Predictor', 'AI', 'LSTM-based time series model predicting mandi prices for 15 key commodities across 200+ APMCs.', 'In Progress', '2026-05-25', '', '', 'LSTM model v3 deployed to staging.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 1000000],
  ['MOD_8', 'Subsidy Disbursement Tracker', 'Additional', 'End-to-end tracking of PM-KISAN and state-level subsidy disbursements.', 'Not Started', '', '', 'NPCI sandbox access pending approval.', 'Request submitted to NPCI for sandbox credentials.', 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', 752000]
];

var SUB_MODULES_SEED = [
  ['SUB_1', 'MOD_1', 'Interactive Map Interface', 'Frontend GIS interface with Leaflet/OpenLayers integration', 'Completed', '2026-04-10', 'https://placehold.co/400x300/0F766E/white?text=Geoportal+Map', '', 'Signed off'],
  ['SUB_2', 'MOD_1', 'Layer Management Component', 'Controls for enabling/disabling layers', 'Completed', '2026-04-12', 'https://placehold.co/400x300/065F46/white?text=Layer+Controls', '', 'Signed off'],
  ['SUB_3', 'MOD_1', 'Cadastral Map Vectorization Module', 'Backend script for vectorizing raster maps', 'Completed', '2026-04-15', '', '', 'Completed and tested'],
  ['SUB_4', 'MOD_2', 'Satellite Imagery API Downloader', 'Downloads Sentinel-2 imagery for selected areas', 'Completed', '2026-05-10', 'https://placehold.co/400x300/8B5CF6/white?text=API+Downloader', '', 'Tested successfully'],
  ['SUB_5', 'MOD_2', 'U-Net Boundary Detection Model', 'The main AI boundary detection neural network', 'In Progress', '2026-05-20', 'https://placehold.co/400x300/8B5CF6/white?text=AI+Boundary+Detection', 'Accuracy at 88% instead of 92%', 'Gathering North-East training data'],
  ['SUB_6', 'MOD_3', 'Aadhaar Auth Connector', 'Integration with UIDAI KYC gateway', 'Completed', '2026-03-25', '', '', 'Integrated and certified'],
  ['SUB_7', 'MOD_3', 'Land Registry Syncer', 'Syncs land records database with land revenue APIs', 'Completed', '2026-03-28', 'https://placehold.co/400x300/059669/white?text=Farmer+Database', '', 'Sync completed'],
  ['SUB_8', 'MOD_4', 'CCE Digital Form Builder', 'Form customization engine for CCE questions', 'Completed', '2026-05-20', '', '', 'Approved'],
  ['SUB_9', 'MOD_4', 'Offline Data Sync Manager', 'Sync queue for offline data store', 'In Progress', '2026-05-30', 'https://placehold.co/400x300/14B8A6/white?text=Crop+Survey+App', 'Sync failing on Android 12', 'Working on patch'],
  ['SUB_10', 'MOD_7', 'APMC Mandi Price Scraper', 'Scrapes price lists from APMC websites', 'Completed', '2026-05-20', '', '', 'Stable and running daily'],
  ['SUB_11', 'MOD_7', 'LSTM Predictor API', 'Flask/Python microservice running predictions', 'In Progress', '2026-05-25', 'https://placehold.co/400x300/8B5CF6/white?text=Price+Forecast', '', 'Model v3 deployed']
];

// ──────────────────────────────────────────────
// SETUP
// ──────────────────────────────────────────────

/**
 * Bootstraps Sheets with headers, autoformatting, and seed data.
 */
function autoSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  function deleteSheetIfExists(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) ss.deleteSheet(sheet);
  }

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
  deleteSheetIfExists(SUB_MODULES_SHEET);

  // Create Modules_Data and seed
  var modSheet = createSheet(MODULES_SHEET, MODULES_HEADERS);
  if (MODULES_SEED.length > 0) {
    modSheet.getRange(2, 1, MODULES_SEED.length, MODULES_HEADERS.length).setValues(MODULES_SEED);
    modSheet.autoResizeColumns(1, MODULES_HEADERS.length);
  }

  // Create Sub_Modules_Data and seed
  var subSheet = createSheet(SUB_MODULES_SHEET, SUB_MODULES_HEADERS);
  if (SUB_MODULES_SEED.length > 0) {
    subSheet.getRange(2, 1, SUB_MODULES_SEED.length, SUB_MODULES_HEADERS.length).setValues(SUB_MODULES_SEED);
    subSheet.autoResizeColumns(1, SUB_MODULES_HEADERS.length);
  }

  // Create Payment_Milestones and seed
  var paySheet = createSheet(PAYMENTS_SHEET, PAYMENTS_HEADERS);
  if (PAYMENTS_SEED.length > 0) {
    paySheet.getRange(2, 1, PAYMENTS_SEED.length, PAYMENTS_HEADERS.length).setValues(PAYMENTS_SEED);
    paySheet.autoResizeColumns(1, PAYMENTS_HEADERS.length);
  }

  SpreadsheetApp.flush();
  Logger.log('autoSetup complete — 3 sheets created and seeded.');
}

// ──────────────────────────────────────────────
// HTTP HANDLERS
// ──────────────────────────────────────────────

/**
 * GET handler — returns modules, submodules, and payments as JSON.
 */
function doGet(e) {
  try {
    var modules = sheetToObjects_(MODULES_SHEET);
    var payments = sheetToObjects_(PAYMENTS_SHEET);
    var subModules = [];
    try {
      subModules = sheetToObjects_(SUB_MODULES_SHEET);
    } catch (err) {
      // Return empty if sub-modules sheet is somehow absent
    }

    return jsonResponse_({
      status: 'success',
      data: {
        modules: modules,
        payments: payments,
        subModules: subModules
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
 * POST handler — routes actions: add_module, update_module, delete_module,
 * add_sub_module, update_sub_module, delete_sub_module, update_payment, upload_uat_image.
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
      case 'add_sub_module':
        return handleAddSubModule_(payload);
      case 'update_sub_module':
        return handleUpdateSubModule_(payload);
      case 'delete_sub_module':
        return handleDeleteSubModule_(payload);
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

function handleAddModule_(payload) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MODULES_SHEET);
  if (!sheet) throw new Error('Sheet "' + MODULES_SHEET + '" not found.');

  var lastRow  = sheet.getLastRow();
  var moduleId = 'MOD_' + lastRow;

  var newRow = [
    moduleId,
    payload.Module_Name || '',
    payload.Type || '',
    payload.Scope_Requirements || '',
    payload.UAT_Status || 'Not Started',
    payload.UAT_Date || '',
    payload.UAT_Image_URLs || '',
    payload.Current_Blockers || '',
    payload.IT_Cell_Last_Action || '',
    payload.Mapped_Milestone || '',
    Number(payload.Allocated_Amount) || 0
  ];

  sheet.appendRow(newRow);

  var moduleObj = rowToObject_(MODULES_HEADERS, newRow);
  return jsonResponse_({
    status: 'success',
    data: moduleObj
  });
}

function handleUpdateModule_(payload) {
  var moduleId = payload.Module_ID;
  if (!moduleId) throw new Error('Missing "Module_ID" in payload.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MODULES_SHEET);
  if (!sheet) throw new Error('Sheet "' + MODULES_SHEET + '" not found.');

  var rowIndex = findRowByColumnValue_(sheet, 1, moduleId);
  if (rowIndex === -1) throw new Error('Module not found: ' + moduleId);

  var range  = sheet.getRange(rowIndex, 1, 1, MODULES_HEADERS.length);
  var values = range.getValues()[0];

  for (var i = 0; i < MODULES_HEADERS.length; i++) {
    var key = MODULES_HEADERS[i];
    if (key !== 'Module_ID' && payload.hasOwnProperty(key)) {
      if (key === 'Allocated_Amount') {
        values[i] = Number(payload[key]) || 0;
      } else {
        values[i] = payload[key];
      }
    }
  }

  range.setValues([values]);

  var moduleObj = rowToObject_(MODULES_HEADERS, values);
  return jsonResponse_({
    status: 'success',
    data: moduleObj
  });
}

function handleDeleteModule_(payload) {
  var moduleId = payload.Module_ID;
  if (!moduleId) throw new Error('Missing "Module_ID" in payload.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(MODULES_SHEET);
  if (!sheet) throw new Error('Sheet "' + MODULES_SHEET + '" not found.');

  var rowIndex = findRowByColumnValue_(sheet, 1, moduleId);
  if (rowIndex === -1) throw new Error('Module not found: ' + moduleId);

  sheet.deleteRow(rowIndex);

  // Also clean up sub-modules belonging to this parent module
  var subSheet = ss.getSheetByName(SUB_MODULES_SHEET);
  if (subSheet) {
    var lastRow = subSheet.getLastRow();
    if (lastRow >= 2) {
      for (var r = lastRow; r >= 2; r--) {
        var parentId = subSheet.getRange(r, 2).getValue(); // Col 2 is Parent_Module_ID
        if (String(parentId).trim() === String(moduleId).trim()) {
          subSheet.deleteRow(r);
        }
      }
    }
  }

  return jsonResponse_({
    status: 'success',
    message: 'Module and its sub-modules deleted successfully.'
  });
}

function handleAddSubModule_(payload) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SUB_MODULES_SHEET);
  if (!sheet) throw new Error('Sheet "' + SUB_MODULES_SHEET + '" not found.');

  var lastRow     = sheet.getLastRow();
  var subModuleId = 'SUB_' + lastRow;

  var newRow = [
    subModuleId,
    payload.Parent_Module_ID || '',
    payload.Sub_Module_Name || '',
    payload.Scope_Requirements || '',
    payload.UAT_Status || 'Not Started',
    payload.UAT_Date || '',
    payload.UAT_Image_URLs || '',
    payload.Current_Blockers || '',
    payload.IT_Cell_Last_Action || ''
  ];

  sheet.appendRow(newRow);

  var subObj = rowToObject_(SUB_MODULES_HEADERS, newRow);
  return jsonResponse_({
    status: 'success',
    data: subObj
  });
}

function handleUpdateSubModule_(payload) {
  var subModuleId = payload.Sub_Module_ID;
  if (!subModuleId) throw new Error('Missing "Sub_Module_ID" in payload.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SUB_MODULES_SHEET);
  if (!sheet) throw new Error('Sheet "' + SUB_MODULES_SHEET + '" not found.');

  var rowIndex = findRowByColumnValue_(sheet, 1, subModuleId);
  if (rowIndex === -1) throw new Error('Sub-module not found: ' + subModuleId);

  var range  = sheet.getRange(rowIndex, 1, 1, SUB_MODULES_HEADERS.length);
  var values = range.getValues()[0];

  for (var i = 0; i < SUB_MODULES_HEADERS.length; i++) {
    var key = SUB_MODULES_HEADERS[i];
    if (key !== 'Sub_Module_ID' && payload.hasOwnProperty(key)) {
      values[i] = payload[key];
    }
  }

  range.setValues([values]);

  var subObj = rowToObject_(SUB_MODULES_HEADERS, values);
  return jsonResponse_({
    status: 'success',
    data: subObj
  });
}

function handleDeleteSubModule_(payload) {
  var subModuleId = payload.Sub_Module_ID;
  if (!subModuleId) throw new Error('Missing "Sub_Module_ID" in payload.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SUB_MODULES_SHEET);
  if (!sheet) throw new Error('Sheet "' + SUB_MODULES_SHEET + '" not found.');

  var rowIndex = findRowByColumnValue_(sheet, 1, subModuleId);
  if (rowIndex === -1) throw new Error('Sub-module not found: ' + subModuleId);

  sheet.deleteRow(rowIndex);

  return jsonResponse_({
    status: 'success',
    message: 'Sub-module deleted: ' + subModuleId
  });
}

function handleAddPayment_(payload) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PAYMENTS_SHEET);
  if (!sheet) throw new Error('Sheet "' + PAYMENTS_SHEET + '" not found.');

  var newRow = [
    payload.Milestone_Name || '',
    Number(payload.Amount) || 0,
    payload.Payment_Status || 'Pending',
    payload.Type           || 'CAPEX'
  ];

  sheet.appendRow(newRow);

  var paymentObj = rowToObject_(PAYMENTS_HEADERS, newRow);
  return jsonResponse_({
    status: 'success',
    data: paymentObj
  });
}

function handleUpdatePayment_(payload) {
  var milestoneName = payload.Milestone_Name;
  if (!milestoneName) throw new Error('Missing "Milestone_Name" in payload.');

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PAYMENTS_SHEET);
  if (!sheet) throw new Error('Sheet "' + PAYMENTS_SHEET + '" not found.');

  var rowIndex = findRowByColumnValue_(sheet, 1, milestoneName);
  if (rowIndex === -1) throw new Error('Milestone not found: ' + milestoneName);

  var statusCol = 3; // Payment_Status
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

function handleUploadUatImage_(payload) {
  var moduleId    = payload.moduleId;
  var subModuleId = payload.subModuleId;
  var imageData   = payload.imageData;
  var mimeType    = payload.mimeType;
  var fileName    = payload.fileName;

  if (!moduleId && !subModuleId) {
    throw new Error('Missing "moduleId" or "subModuleId" in upload request.');
  }
  if (!imageData) throw new Error('Missing "imageData".');
  if (!mimeType)  throw new Error('Missing "mimeType".');
  if (!fileName)  throw new Error('Missing "fileName".');

  if (FOLDER_ID === 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE') {
    throw new Error('FOLDER_ID is not configured in Code.gs.');
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(FOLDER_ID);
  } catch (driveErr) {
    throw new Error('Access denied to Drive folder: ' + driveErr.message);
  }

  var decoded  = Utilities.base64Decode(imageData);
  var blob     = Utilities.newBlob(decoded, mimeType, fileName);
  var file     = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var imageUrl = 'https://drive.google.com/uc?id=' + file.getId();

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (subModuleId) {
    var sheet = ss.getSheetByName(SUB_MODULES_SHEET);
    if (!sheet) throw new Error('Sheet "' + SUB_MODULES_SHEET + '" not found.');
    var rowIndex = findRowByColumnValue_(sheet, 1, subModuleId);
    if (rowIndex === -1) throw new Error('Sub-module not found: ' + subModuleId);

    var urlCol = SUB_MODULES_HEADERS.indexOf('UAT_Image_URLs') + 1;
    var currentUrls = sheet.getRange(rowIndex, urlCol).getValue();
    var updatedUrls = currentUrls ? currentUrls + ',' + imageUrl : imageUrl;
    sheet.getRange(rowIndex, urlCol).setValue(updatedUrls);
  } else {
    var sheet = ss.getSheetByName(MODULES_SHEET);
    if (!sheet) throw new Error('Sheet "' + MODULES_SHEET + '" not found.');
    var rowIndex = findRowByColumnValue_(sheet, 1, moduleId);
    if (rowIndex === -1) throw new Error('Module not found: ' + moduleId);

    var urlCol = MODULES_HEADERS.indexOf('UAT_Image_URLs') + 1;
    var currentUrls = sheet.getRange(rowIndex, urlCol).getValue();
    var updatedUrls = currentUrls ? currentUrls + ',' + imageUrl : imageUrl;
    sheet.getRange(rowIndex, urlCol).setValue(updatedUrls);
  }

  return jsonResponse_({
    status: 'success',
    imageUrl: imageUrl
  });
}

// ──────────────────────────────────────────────
// UTILITY HELPERS
// ──────────────────────────────────────────────

function sheetToObjects_(sheetName) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet "' + sheetName + '" not found.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

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

function rowToObject_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    obj[headers[i]] = (i < row.length) ? row[i] : '';
  }
  return obj;
}

function findRowByColumnValue_(sheet, colIndex, value) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var data = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(value).trim()) {
      return i + 2;
    }
  }
  return -1;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
