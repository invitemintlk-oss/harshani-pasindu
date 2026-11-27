/**
 * Harshani & Pasindu — Wedding RSVP → Google Sheet
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1vlL8XAfFZiNYPjlzv18rlY6pJGnRzpKEpXmx0Wqeff8/edit
 *
 * Setup:
 *  1. Open the sheet → Extensions → Apps Script.
 *  2. Replace everything in Code.gs with this file and Save.
 *  3. Deploy → New deployment → type "Web app"
 *       Execute as:      Me
 *       Who has access:  Anyone
 *     → Deploy → Authorize → copy the Web app URL (ends in /exec).
 *  4. Paste that URL into GOOGLE_SCRIPT_URL in src/App.tsx.
 *
 * After editing this script later: Deploy → Manage deployments → Edit (pencil)
 * → Version: "New version" → Deploy. The /exec URL stays the same.
 */

const SPREADSHEET_ID = "1vlL8XAfFZiNYPjlzv18rlY6pJGnRzpKEpXmx0Wqeff8";
const RSVP_SHEET_NAME = "RSVP";

const RSVP_HEADERS = [
  "Timestamp",
  "Name",
  "Attending",
  "Guests",
  "Invited As",
  "Invitation Link",
  "Notes",
];

function doPost(e) {
  return handleRequest_(e);
}

/* Visiting the /exec URL in a browser shows this — handy to test the deployment. */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleRequest_(e);
  }
  return jsonResponse_({ ok: true, message: "RSVP endpoint is running" });
}

function handleRequest_(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    const params = (e && e.parameter) || {};
    const action = String(params.action || "").trim().toLowerCase();

    if (action !== "rsvp") {
      return jsonResponse_({ ok: false, message: "Invalid action" });
    }

    return jsonResponse_(saveRsvp_(params));
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error && error.message ? error.message : "Unexpected error",
    });
  } finally {
    lock.releaseLock();
  }
}

function saveRsvp_(params) {
  const name = clean_(params.name, 120);
  if (!name) {
    return { ok: false, message: "Name is required" };
  }

  const guests = clean_(params.guests, 3) || "1";
  const attending = guests === "0" ? "No" : "Yes";

  const sheet = getSheet_();
  sheet.appendRow([
    new Date(),
    name,
    attending,
    guests === "0" ? 0 : Number(guests) || 1,
    clean_(params.invitedAs, 60),
    clean_(params.link, 500),
    clean_(params.notes, 500),
  ]);

  return { ok: true, message: "RSVP saved" };
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(RSVP_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(RSVP_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    sheet.getRange(1, 1, 1, RSVP_HEADERS.length).setFontWeight("bold").setBackground("#f4e6c4");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm");
  }
  return sheet;
}

/* Trim, cap length, and stop spreadsheet formula injection (=, +, -, @). */
function clean_(value, maxLength) {
  let text = String(value == null ? "" : value).trim().slice(0, maxLength);
  if (/^[=+\-@]/.test(text)) {
    text = "'" + text;
  }
  return text;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
