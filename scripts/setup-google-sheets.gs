/**
 * YouTube Automation — إعداد Google Sheet كامل
 *
 * طريقة التشغيل (مرة واحدة):
 * 1. افتح: https://docs.google.com/spreadsheets/d/1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0/edit
 * 2. Extensions → Apps Script
 * 3. احذف كل الكود → الصق هذا الملف بالكامل
 * 4. Run → setupAllSheets
 * 5. اسمح بالصلاحيات عند الطلب
 */

var SPREADSHEET_ID = '1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0';

var SHEETS = {
  Queue: [
    'queue_id', 'status', 'topic', 'source', 'priority', 'retry_count',
    'scheduled_at', 'started_at', 'completed_at', 'error_message'
  ],
  Content: [
    'video_id', 'queue_id', 'status', 'topic', 'viral_title', 'short_script',
    'long_script', 'scenes_json', 'scene_assets_json', 'voiceover_short_url',
    'voiceover_long_url', 'captions_srt', 'thumbnail_prompt', 'thumbnail_url',
    'seo_title', 'seo_description', 'seo_tags', 'creatomate_short_render_id',
    'creatomate_long_render_id', 'final_short_url', 'final_long_url',
    'youtube_short_id', 'youtube_long_id', 'youtube_short_url', 'youtube_long_url',
    'created_at', 'updated_at'
  ],
  Errors: [
    'error_id', 'timestamp', 'workflow', 'node_name', 'queue_id', 'video_id',
    'error_message', 'stack_trace', 'retry_count'
  ],
  Logs: [
    'log_id', 'timestamp', 'level', 'workflow', 'message', 'metadata_json'
  ]
};

var DEFAULT_SHEET_NAMES = ['Sheet1', 'Feuille 1', 'Hoja 1', 'Foglio 1'];

function setupAllSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  Object.keys(SHEETS).forEach(function(name) {
    setupSheet_(ss, name, SHEETS[name]);
  });

  removeDefaultSheets_(ss);
  ss.rename('YouTube Automation');

  SpreadsheetApp.getUi().alert(
    'تم الإعداد بنجاح!\n\n' +
    'الأوراق الجاهزة:\n' +
    '• Queue\n' +
    '• Content\n' +
    '• Errors\n' +
    '• Logs\n\n' +
    'ارجع إلى n8n واضغط Retry في عقد Google Sheets.'
  );
}

function setupSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 32);

  for (var i = 0; i < headers.length; i++) {
    sheet.setColumnWidth(i + 1, getColumnWidth_(headers[i]));
  }

  if (name === 'Queue') {
    applyQueueValidation_(sheet);
  }

  if (name === 'Logs') {
    applyLogsValidation_(sheet);
  }
}

function getColumnWidth_(header) {
  if (header.indexOf('_json') !== -1 || header.indexOf('_script') !== -1) return 220;
  if (header.indexOf('_url') !== -1 || header === 'error_message' || header === 'stack_trace') return 180;
  if (header === 'topic' || header === 'message' || header === 'seo_description') return 200;
  if (header === 'queue_id' || header === 'video_id' || header === 'error_id' || header === 'log_id') return 260;
  return 120;
}

function applyQueueValidation_(sheet) {
  var statusCol = 2;
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['pending', 'processing', 'completed', 'failed', 'retry'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, statusCol, 999, 1).setDataValidation(statusRule);
}

function applyLogsValidation_(sheet) {
  var levelCol = 3;
  var levelRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['info', 'warn', 'error'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, levelCol, 999, 1).setDataValidation(levelRule);
}

function removeDefaultSheets_(ss) {
  DEFAULT_SHEET_NAMES.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet && ss.getSheets().length > Object.keys(SHEETS).length) {
      ss.deleteSheet(sheet);
    }
  });
}
