import { google } from 'googleapis';
import { config } from '../config.js';

let sheetsClient = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!config.serviceAccount) {
    throw new Error(
      'Google Service Account غير مُعد. أضف GOOGLE_SERVICE_ACCOUNT_KEY_PATH أو GOOGLE_SERVICE_ACCOUNT_JSON في .env'
    );
  }

  const auth = new google.auth.GoogleAuth({
    credentials: config.serviceAccount,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function rowsToObjects(headers, rows) {
  return rows
    .filter((row) => row.some((cell) => cell !== '' && cell != null))
    .map((row) => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] ?? '';
      });
      return obj;
    });
}

export async function readSheet(tabName) {
  const sheets = getSheetsClient();
  const range = `${tabName}!A:ZZ`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheets.documentId,
    range,
  });

  const values = response.data.values || [];
  if (values.length === 0) return [];

  const [headers, ...rows] = values;
  return rowsToObjects(headers, rows);
}

export async function appendRow(tabName, rowValues) {
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.sheets.documentId,
    range: `${tabName}!A:ZZ`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [rowValues] },
  });
}

export async function updateRowByKey(tabName, keyColumn, keyValue, updates) {
  const sheets = getSheetsClient();
  const range = `${tabName}!A:ZZ`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheets.documentId,
    range,
  });

  const values = response.data.values || [];
  if (values.length < 2) {
    throw new Error('لا توجد بيانات في الورقة');
  }

  const [headers, ...rows] = values;
  const keyIndex = headers.indexOf(keyColumn);
  if (keyIndex === -1) {
    throw new Error(`العمود ${keyColumn} غير موجود`);
  }

  const rowIndex = rows.findIndex((row) => row[keyIndex] === keyValue);
  if (rowIndex === -1) {
    throw new Error('العنصر غير موجود');
  }

  const updatedRow = [...rows[rowIndex]];
  for (const [col, val] of Object.entries(updates)) {
    const colIndex = headers.indexOf(col);
    if (colIndex !== -1) {
      updatedRow[colIndex] = val;
    }
  }

  const sheetRowNumber = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.sheets.documentId,
    range: `${tabName}!A${sheetRowNumber}:ZZ${sheetRowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [updatedRow] },
  });

  return rowsToObjects(headers, [updatedRow])[0];
}

export async function getHeaders(tabName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheets.documentId,
    range: `${tabName}!1:1`,
  });
  return response.data.values?.[0] || [];
}
