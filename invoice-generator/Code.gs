/**
 * Pesto Marketing – Invoice Generator v2 (Google Sheets + Google Docs + Apps Script)
 *
 * One Google Sheet holds your settings, clients, bank details and invoice rows.
 * One Google Doc is the template (built for you by "Setup").
 * Select an invoice row → menu "🧾 Invoices → Generate invoice" →
 * a filled Google Doc + PDF land in your Drive folder, and the invoice
 * number (PM-2026-0033, PM-2026-0034, …) is assigned automatically.
 *
 * The client's country decides the currency (USA → USD, Netherlands/Eurozone → EUR,
 * Australia → AUD) and which bank details are printed under "Remittance Instructions".
 *
 * Install / upgrade: see README.md in this folder.
 */

// ---------------------------------------------------------------------------
// Company details printed on every invoice (baked into the template).
// Edit these BEFORE running Setup, or edit the template Doc directly later.
// ---------------------------------------------------------------------------
const COMPANY = {
  name: 'PESTO MARKETING',
  tagline: 'Global E-Commerce & Digital Advertising Agency',
  lines: [
    ['USA Desk: ', '9169 W State St #4211, Garden City, 83714, Idaho, USA'],
    ['UK Desk: ', '182-184 High Street North, East Ham, London, E6 2JA'],
    ['Global Delivery & Tax Node: ', 'PKL-R2, HR, IN'],
  ],
  email: 'info@pestomarketing.com',
  phone: '+1 (208) 801-7080',
  signatory: 'PESTO MARKETING (India Node)',
  remittanceHeading: 'REMINDED REMITTANCE INSTRUCTIONS:',
  terms: [
    '1. All credit card processing fees, intermediary wire deductions, or transfer charges shall be ' +
      'borne solely by the payer.',
    '2. The Client is fully responsible for ensuring that the net invoiced amount ({{TOTAL}}) is ' +
      'realized by Pesto Marketing in full.',
    '3. These services are classified as Zero-Rated Service Exports under the Indian Foreign Exchange ' +
      'Management Act (FEMA).',
  ],
};

// Values that pre-fill the Settings and Banks tabs on Setup. Kept empty in the
// public repository; fill them here or type them into the Sheet after Setup.
const PRIVATE_DEFAULTS = {
  gstin: '',
  lutNote: '',
  banks: [], // [currency, field label, value]
};

// Brand
const FONT = 'Plus Jakarta Sans';
const GREEN = '#022d1d';      // brand green – headings, labels, totals
const TEXT = '#33463d';       // body text
const MUTED = '#5f7268';      // small print
const MINT = '#e7f4ec';       // light green highlight (LUT box, table header)
const LINE = '#d3e4da';       // table borders

const SHEETS = { settings: 'Settings', clients: 'Clients', banks: 'Banks', invoices: 'Invoices' };
const VERSION = 2;

// Invoices sheet columns (1-based).
const COL = {
  number: 1, issueDate: 2, client: 3, placeOfSupply: 4,
  service: 5, scope: 6, period: 7, sac: 8, qty: 9, rate: 10, lineTotal: 11,
  cgst: 12, sgst: 13, igst: 14, status: 15, docLink: 16, pdfLink: 17,
};
const INVOICE_HEADERS = [
  'Invoice No (auto)', 'Date of Issue', 'Client', 'Place of Supply (optional override)',
  'Service', 'Scope / Details', 'Billing Period', 'SAC Code', 'Qty', 'Rate', 'Line Total',
  'CGST %', 'SGST %', 'IGST %', 'Status', 'Google Doc', 'PDF',
];
const CLIENT_HEADERS = [
  'Company', 'Attention', 'Address Line 1', 'Address Line 2', 'Address Line 3', 'Country',
  'Email', 'Phone', 'Place of Supply', 'Currency (optional override)',
];
const BANK_HEADERS = ['Currency', 'Field', 'Value'];

function settingRows_() {
  return [
    ['Version', VERSION, 'Do not edit'],
    ['Invoice Prefix', 'PM', 'Invoice number = PREFIX-YEAR-0001'],
    ['Next Invoice Number', 1, 'Set this to your next number (e.g. 33 if your last was PM-2026-0032). Auto-increments.'],
    ['Counter Year', new Date().getFullYear(), 'Used for yearly reset. Do not edit normally.'],
    ['Reset Counter Every Year', 'Yes', 'Yes = numbering restarts at 0001 on 1 January'],
    ['Number Digits', 4, 'Zero padding: 4 → 0033'],
    ['Date Format', 'yyyy-MM-dd', 'e.g. yyyy-MM-dd → 2026-10-07, dd/MM/yyyy → 07/10/2026'],
    ['Default Currency', 'USD', 'Used when the client country is not recognised'],
    ['Logo (Drive file URL or ID)', '', 'Upload your logo PNG/JPG to Drive and paste its link here'],
    ['Logo Width (px)', 140, ''],
    ['Signature Image (Drive file URL or ID)', '', 'Optional – a PNG of your signature, printed above the line'],
    ['Signature Width (px)', 140, ''],
    ['GSTIN', PRIVATE_DEFAULTS.gstin, ''],
    ['LUT Note', PRIVATE_DEFAULTS.lutNote, 'Printed in the green box under the header. Leave blank to hide it.'],
    ['Template Doc ID', '', 'Filled by Setup'],
    ['Output Folder ID', '', 'Filled by Setup'],
  ];
}

// Settings carried over when upgrading from v1.
const CARRY_OVER = ['Invoice Prefix', 'Next Invoice Number', 'Counter Year', 'Reset Counter Every Year',
  'Number Digits', 'Logo (Drive URL or ID)', 'Logo (Drive file URL or ID)', 'GSTIN', 'LUT Note',
  'Output Folder ID'];

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', AUD: 'A$', GBP: '£', INR: '₹', CAD: 'C$', SGD: 'S$', AED: 'AED ' };
const COUNTRY_CURRENCY = {
  USD: ['usa', 'us', 'united states', 'united states of america', 'america'],
  EUR: ['netherlands', 'the netherlands', 'holland', 'germany', 'france', 'belgium', 'ireland', 'italy',
    'spain', 'portugal', 'austria', 'finland', 'luxembourg', 'greece', 'estonia', 'latvia', 'lithuania',
    'slovakia', 'slovenia', 'malta', 'cyprus', 'croatia'],
  AUD: ['australia'],
};

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧾 Invoices')
    .addItem('Generate invoice from selected row', 'generateInvoice')
    .addSeparator()
    .addItem('Setup / Upgrade', 'setup')
    .addItem('Rebuild template Doc', 'rebuildTemplate')
    .addToUi();
}

// ---------------------------------------------------------------------------
// Setup: creates the tabs, the output folder and the template Doc.
// Running it on a v1 sheet keeps the old tabs as "… (v1)" and carries the
// invoice counter, logo, GSTIN, LUT note and folder over.
// ---------------------------------------------------------------------------
function setup() {
  const ss = SpreadsheetApp.getActive();
  let carried = {};

  const oldSettings = ss.getSheetByName(SHEETS.settings);
  if (oldSettings && !readSettings_().Version) {
    carried = readSettings_();
    [SHEETS.settings, SHEETS.clients, SHEETS.invoices].forEach(name => {
      const sh = ss.getSheetByName(name);
      if (sh) sh.setName(name + ' (v1)');
    });
  }

  let settings = ss.getSheetByName(SHEETS.settings);
  if (!settings) {
    settings = ss.insertSheet(SHEETS.settings);
    const rows = settingRows_();
    settings.getRange(1, 1, 1, 3).setValues([['Setting', 'Value', 'Notes']]).setFontWeight('bold');
    settings.getRange(2, 1, rows.length, 3).setValues(rows);
    settings.setColumnWidth(1, 260).setColumnWidth(2, 420).setColumnWidth(3, 520);
    settings.setFrozenRows(1);
    CARRY_OVER.forEach(key => {
      if (carried[key] !== undefined && carried[key] !== '') {
        writeSetting_(key === 'Logo (Drive URL or ID)' ? 'Logo (Drive file URL or ID)' : key, carried[key]);
      }
    });
  }

  let clients = ss.getSheetByName(SHEETS.clients);
  if (!clients) {
    clients = ss.insertSheet(SHEETS.clients);
    clients.getRange(1, 1, 1, CLIENT_HEADERS.length).setValues([CLIENT_HEADERS]).setFontWeight('bold');
    clients.getRange(2, 1, 1, CLIENT_HEADERS.length).setValues([['Passion Is Beauty', 'Terry Lee',
      '4320 International Blvd NW,', 'Norcross, Georgia, 30093,', '', 'United States of America',
      'ubx7004@gmail.com', '+16783131254', 'Outside India (Export)', '']]);
    clients.setFrozenRows(1);
    clients.autoResizeColumns(1, CLIENT_HEADERS.length);
  }

  let banks = ss.getSheetByName(SHEETS.banks);
  if (!banks) {
    banks = ss.insertSheet(SHEETS.banks);
    banks.getRange(1, 1, 1, 3).setValues([BANK_HEADERS]).setFontWeight('bold');
    if (PRIVATE_DEFAULTS.banks.length) {
      banks.getRange(2, 1, PRIVATE_DEFAULTS.banks.length, 3).setValues(PRIVATE_DEFAULTS.banks);
    }
    banks.setFrozenRows(1);
    banks.setColumnWidth(1, 90).setColumnWidth(2, 220).setColumnWidth(3, 460);
  }

  let invoices = ss.getSheetByName(SHEETS.invoices);
  if (!invoices) {
    invoices = ss.insertSheet(SHEETS.invoices, 0);
    invoices.getRange(1, 1, 1, INVOICE_HEADERS.length).setValues([INVOICE_HEADERS])
      .setFontWeight('bold').setBackground(GREEN).setFontColor('#ffffff');
    invoices.setFrozenRows(1);
    invoices.getRange('B2:B').setNumberFormat('yyyy-mm-dd');
    invoices.getRange('J2:K').setNumberFormat('#,##0.00');
    invoices.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInRange(clients.getRange('A2:A'), true).setAllowInvalid(false).build());
    // Sample invoice with two items: row 3 has no Client, so it belongs to row 2's invoice.
    invoices.getRange(2, 1, 2, 10).setValues([
      ['', '', 'Passion Is Beauty', '', 'E-commerce Marketplace Advertising & Account Operations',
        'Scope: Amazon & eBay Storefront Management, PPC Campaign Optimization.',
        'October 6, 2026, to November 5, 2026', '998311', 1, 1000],
      ['', '', '', '', 'Google Ads Management', 'Scope: Campaign setup, bidding and monthly optimisation.',
        'October 6, 2026, to November 5, 2026', '998311', 1, 500],
    ]);
    invoices.getRange(2, COL.cgst, 1, 3).setValues([[0, 0, 0]]);
    invoices.getRange('K2').setFormula('=ARRAYFORMULA(IF(I2:I="", "", I2:I * J2:J))');
    invoices.setColumnWidth(COL.service, 320).setColumnWidth(COL.scope, 340).setColumnWidth(COL.period, 240);
  }

  if (!readSettings_()['Output Folder ID']) {
    writeSetting_('Output Folder ID', DriveApp.createFolder(COMPANY.name + ' – Invoices').getId());
  }
  // A fresh (or upgraded) Settings tab has no template yet; later runs keep your edited template.
  if (!readSettings_()['Template Doc ID']) rebuildTemplate();

  SpreadsheetApp.getUi().alert(
    'Setup complete!\n\n1. Settings tab: check Logo, GSTIN, LUT Note and "Next Invoice Number".\n' +
    '2. Banks tab: bank details per currency (USD, EUR, AUD …).\n' +
    '3. Clients tab: add clients with their Country.\n' +
    '4. Invoices tab: fill a row (extra items go in the rows below with Client left empty),\n' +
    '   select the first row, then 🧾 Invoices → Generate.');
}

function rebuildTemplate() {
  const folder = DriveApp.getFolderById(readSettings_()['Output Folder ID']);
  const id = buildTemplate_(folder);
  writeSetting_('Template Doc ID', id);
  SpreadsheetApp.getActive().toast('Template created: ' + DocumentApp.openById(id).getUrl(), 'Invoices', 10);
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------
function generateInvoice() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();
  if (sheet.getName() !== SHEETS.invoices) throw new Error('Select a row on the "Invoices" sheet first.');
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Add an invoice row first.');

  const data = sheet.getRange(2, 1, lastRow - 1, INVOICE_HEADERS.length).getValues();
  const cell = (i, col) => data[i][col - 1];

  // The invoice starts at the nearest row (at or above the selection) that has a Client,
  // and continues through the following rows that have a Service but no Client.
  let start = sheet.getActiveRange().getRow() - 2;
  if (start < 0) throw new Error('Select an invoice row (not the header).');
  while (start > 0 && !cell(start, COL.client) && cell(start, COL.service)) start--;
  if (!cell(start, COL.client)) throw new Error('The selected row needs a Client.');
  let end = start;
  while (end + 1 < data.length && !cell(end + 1, COL.client) && cell(end + 1, COL.service)) end++;

  const items = [];
  for (let i = start; i <= end; i++) {
    if (!cell(i, COL.service)) continue;
    items.push({
      title: String(cell(i, COL.service)),
      scope: String(cell(i, COL.scope) || ''),
      period: String(cell(i, COL.period) || ''),
      sac: String(cell(i, COL.sac) || ''),
      qty: Number(cell(i, COL.qty) || 1),
      rate: Number(cell(i, COL.rate) || 0),
    });
  }
  if (!items.length) throw new Error('Add at least one Service.');

  const s = readSettings_();
  const client = findClient_(String(cell(start, COL.client)));
  const currency = currencyFor_(client, s);
  const bankLines = bankLinesFor_(currency);
  const money = n => formatMoney_(n, currency);

  const tz = Session.getScriptTimeZone();
  const issueDate = cell(start, COL.issueDate) instanceof Date ? cell(start, COL.issueDate) : new Date();
  // Reuse the number when regenerating; otherwise take the next one.
  const invoiceNo = cell(start, COL.number) || nextInvoiceNumber_(issueDate);

  const cgstRate = Number(cell(start, COL.cgst) || 0);
  const sgstRate = Number(cell(start, COL.sgst) || 0);
  const igstRate = Number(cell(start, COL.igst) || 0);
  const subtotal = items.reduce((sum, it) => sum + it.qty * it.rate, 0);
  const cgst = round2_(subtotal * cgstRate / 100);
  const sgst = round2_(subtotal * sgstRate / 100);
  const igst = round2_(subtotal * igstRate / 100);
  const total = subtotal + cgst + sgst + igst;
  const lutNote = String(s['LUT Note'] || '');

  const values = {
    INVOICE_NO: invoiceNo,
    ISSUE_DATE: Utilities.formatDate(issueDate, tz, s['Date Format'] || 'yyyy-MM-dd'),
    PLACE_OF_SUPPLY: String(cell(start, COL.placeOfSupply) || client.placeOfSupply || ''),
    CURRENCY: currency,
    CURRENCY_LABEL: currency + ' (' + (CURRENCY_SYMBOLS[currency] || currency).trim() + ')',
    GSTIN: String(s['GSTIN'] || ''),
    LUT_NOTE: lutNote,
    SUBTOTAL: money(subtotal),
    CGST_RATE: String(cgstRate),
    SGST_RATE: String(sgstRate),
    CGST: money(cgst),
    SGST: money(sgst),
    IGST_LABEL: igstRate === 0 ? 'IGST (Export under LUT 0%)' : 'IGST (' + igstRate + '%)',
    IGST: money(igst),
    TOTAL: money(total),
  };

  const billTo = [
    ['Company: ', client.name], ['Attention: ', client.attn], ['Address: ', client.address1],
    ['', client.address2], ['', client.address3], ['', client.country],
    ['Email: ', client.email], ['Phone: ', client.phone],
  ].filter(([, v]) => v);
  // Address lines 2+ hang under line 1 when line 1 is empty.
  if (!client.address1) {
    const firstAddr = billTo.findIndex(([label, v]) => label === '' && v);
    if (firstAddr !== -1) billTo[firstAddr][0] = 'Address: ';
  }

  // Copy the template and fill it.
  const folder = DriveApp.getFolderById(s['Output Folder ID']);
  const fileName = invoiceNo + ' - ' + client.name;
  const copy = DriveApp.getFileById(s['Template Doc ID']).makeCopy(fileName, folder);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();

  fillItems_(body, items, money);
  fillLines_(body, 'BILL_TO', billTo);
  fillLines_(body, 'REMITTANCE', bankLines);
  if (!lutNote) removeEnclosingTable_(body, 'LUT_NOTE');
  Object.keys(values).forEach(k => replaceAll_(body, k, values[k]));
  insertImage_(body, 'LOGO', s['Logo (Drive file URL or ID)'], Number(s['Logo Width (px)'] || 140));
  insertImage_(body, 'SIGNATURE', s['Signature Image (Drive file URL or ID)'], Number(s['Signature Width (px)'] || 140));
  doc.saveAndClose();

  const pdf = folder.createFile(copy.getAs(MimeType.PDF).setName(fileName + '.pdf'));

  // Write results back to every row of this invoice.
  const firstRow = start + 2;
  const n = end - start + 1;
  sheet.getRange(firstRow, COL.number, n, 1).setValue(invoiceNo);
  sheet.getRange(firstRow, COL.issueDate).setValue(issueDate);
  sheet.getRange(firstRow, COL.status, n, 1).setValue('Generated');
  sheet.getRange(firstRow, COL.docLink, n, 1).setValue(doc.getUrl());
  sheet.getRange(firstRow, COL.pdfLink, n, 1).setValue(pdf.getUrl());

  ss.toast(invoiceNo + ' (' + currency + ' ' + money(total) + ') created.', 'Invoices', 10);
}

// ---------------------------------------------------------------------------
// Currency & bank details
// ---------------------------------------------------------------------------
function currencyFor_(client, s) {
  if (client.currency) return client.currency.toUpperCase();
  const country = client.country.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  const match = Object.keys(COUNTRY_CURRENCY).find(cur => COUNTRY_CURRENCY[cur].indexOf(country) !== -1);
  return match || String(s['Default Currency'] || 'USD').toUpperCase();
}

function bankLinesFor_(currency) {
  const rows = SpreadsheetApp.getActive().getSheetByName(SHEETS.banks).getDataRange().getValues().slice(1);
  const lines = rows
    .filter(r => String(r[0]).trim().toUpperCase() === currency && r[1] !== '')
    .map(r => [String(r[1]).trim().replace(/:?$/, ': '), String(r[2])]);
  if (!lines.length) throw new Error('No bank details for ' + currency + ' in the Banks sheet.');
  return lines;
}

// ---------------------------------------------------------------------------
// Invoice number: PREFIX-YEAR-0001, locked so two clicks can't share a number.
// ---------------------------------------------------------------------------
function nextInvoiceNumber_(issueDate) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    const s = readSettings_();
    const year = issueDate.getFullYear();
    let next = Number(s['Next Invoice Number'] || 1);
    if (String(s['Reset Counter Every Year']).toLowerCase() === 'yes' && Number(s['Counter Year']) !== year) {
      next = 1;
    }
    writeSetting_('Next Invoice Number', next + 1);
    writeSetting_('Counter Year', year);
    SpreadsheetApp.flush();
    const digits = Number(s['Number Digits'] || 4);
    return s['Invoice Prefix'] + '-' + year + '-' + String(next).padStart(digits, '0');
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Doc helpers
// ---------------------------------------------------------------------------
function placeholder_(key) {
  return '\\{\\{' + key + '\\}\\}';
}

// Replaces {{KEY}} everywhere, keeping the placeholder's formatting.
function replaceAll_(container, key, value) {
  let found = container.findText(placeholder_(key));
  while (found) {
    const text = found.getElement().asText();
    const start = found.getStartOffset();
    const end = found.getEndOffsetInclusive();
    if (value) text.insertText(end + 1, String(value));
    text.deleteText(start, end);
    found = container.findText(placeholder_(key));
  }
}

function ancestor_(element, type) {
  let el = element;
  while (el && el.getType() !== type) el = el.getParent();
  return el;
}

function paragraphOf_(container, key) {
  const found = container.findText(placeholder_(key));
  return found ? ancestor_(found.getElement(), DocumentApp.ElementType.PARAGRAPH).asParagraph() : null;
}

function removeEnclosingTable_(body, key) {
  const found = body.findText(placeholder_(key));
  if (found) ancestor_(found.getElement(), DocumentApp.ElementType.TABLE).removeFromParent();
}

// Replaces the {{KEY}} paragraph with "Label: value" lines (label bold, brand green).
function fillLines_(body, key, lines) {
  const p = paragraphOf_(body, key);
  if (!p) return;
  const parent = p.getParent();
  let idx = parent.getChildIndex(p);
  lines.forEach(([label, value]) => {
    const np = parent.insertParagraph(++idx, '');
    paraLayout_(np, {});
    if (label) np.appendText(label).setAttributes(attrs_({ bold: true, size: 9, color: GREEN }));
    np.appendText(String(value)).setAttributes(attrs_({ bold: false, size: 9, color: TEXT }));
  });
  p.removeFromParent();
}

// Duplicates the template item row once per line item.
function fillItems_(body, items, money) {
  const found = body.findText(placeholder_('ITEM_TITLE'));
  const tplRow = ancestor_(found.getElement(), DocumentApp.ElementType.TABLE_ROW).asTableRow();
  const table = tplRow.getParentTable();
  const tplIndex = table.getChildIndex(tplRow);

  items.forEach((it, i) => {
    const row = table.insertTableRow(tplIndex + 1 + i, tplRow.copy());
    // Optional lines disappear when empty.
    [['ITEM_SCOPE', it.scope], ['ITEM_PERIOD', it.period]].forEach(([key, value]) => {
      if (!value) {
        const p = paragraphOf_(row, key);
        if (p) p.removeFromParent();
      }
    });
    replaceAll_(row, 'ITEM_TITLE', it.title);
    replaceAll_(row, 'ITEM_SCOPE', it.scope);
    replaceAll_(row, 'ITEM_PERIOD', it.period);
    replaceAll_(row, 'ITEM_SAC', it.sac);
    replaceAll_(row, 'ITEM_QTY', String(it.qty));
    replaceAll_(row, 'ITEM_RATE', money(it.rate));
    replaceAll_(row, 'ITEM_TOTAL', money(it.qty * it.rate));
  });
  table.removeRow(tplIndex);
}

function insertImage_(body, key, setting, width) {
  const paragraph = paragraphOf_(body, key);
  if (!paragraph) return;
  const id = extractDriveId_(setting);
  if (!id && key === 'LOGO') {
    paragraph.removeFromParent();
    return;
  }
  paragraph.clear();
  if (!id) return; // keep the empty line as space to sign by hand
  const img = paragraph.appendInlineImage(DriveApp.getFileById(id).getBlob());
  const ratio = img.getHeight() / img.getWidth();
  img.setWidth(width).setHeight(Math.round(width * ratio));
}

function extractDriveId_(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const m = v.match(/[-\w]{25,}/);
  return m ? m[0] : v;
}

// ---------------------------------------------------------------------------
// Template builder – the PESTO MARKETING layout in brand green.
// Page: US Letter, 40pt margins → 532pt content width.
// ---------------------------------------------------------------------------
function buildTemplate_(folder) {
  const doc = DocumentApp.create(COMPANY.name + ' – Invoice Template');
  const body = doc.getBody();
  body.setMarginTop(32).setMarginBottom(32).setMarginLeft(40).setMarginRight(40);
  const RIGHT = DocumentApp.HorizontalAlignment.RIGHT;
  const CENTER = DocumentApp.HorizontalAlignment.CENTER;
  const label = { bold: true, color: GREEN };

  // Header: logo + company (left) | INVOICE + meta (right)
  const header = body.appendTable([['', '']]);
  noBorders_(header);
  header.setColumnWidth(0, 330).setColumnWidth(1, 202);
  const left = header.getCell(0, 0);
  const right = header.getCell(0, 1);

  para_(left, '{{LOGO}}', { after: 6 });
  para_(left, COMPANY.name, { bold: true, size: 13, color: GREEN });
  para_(left, COMPANY.tagline, { bold: true, size: 10, color: MUTED, after: 8 });
  COMPANY.lines.forEach(([l, v]) => rich_(left, [[l, label], [v, {}]], { size: 8.5, color: TEXT }));
  rich_(left, [['GSTIN: ', label], ['{{GSTIN}}', {}]], { size: 8.5, color: TEXT });
  rich_(left, [['Email: ', label], [COMPANY.email + ' | ', {}], ['Phone: ', label], [COMPANY.phone, {}]],
    { size: 8.5, color: TEXT });
  dropFirst_(left);

  para_(right, 'INVOICE', { bold: true, size: 13, color: GREEN, after: 10 });
  [['Invoice No: ', '{{INVOICE_NO}}'], ['Date of Issue: ', '{{ISSUE_DATE}}'],
    ['Place of Supply: ', '{{PLACE_OF_SUPPLY}}'], ['Currency: ', '{{CURRENCY_LABEL}}']]
    .forEach(([l, v]) => rich_(right, [[l, label], [v, {}]], { size: 8.5, color: TEXT }));
  dropFirst_(right);

  spacer_(body);

  // LUT note – light green highlight
  const lut = body.appendTable([['{{LUT_NOTE}}']]);
  lut.setBorderColor(MINT).setBorderWidth(0);
  const lutCell = lut.getCell(0, 0).setBackgroundColor(MINT);
  pad_(lutCell, 8);
  styleCell_(lutCell, { bold: true, size: 7.5, color: GREEN, align: CENTER });

  spacer_(body);

  // Bill to | Remittance instructions
  const parties = body.appendTable([['', '']]);
  noBorders_(parties);
  parties.setColumnWidth(0, 250).setColumnWidth(1, 282);
  const bill = parties.getCell(0, 0);
  const remit = parties.getCell(0, 1);
  para_(bill, 'BILL TO:', { bold: true, size: 9, color: GREEN, after: 3 });
  para_(bill, '{{BILL_TO}}', { size: 9, color: TEXT });
  dropFirst_(bill);
  para_(remit, COMPANY.remittanceHeading, { bold: true, size: 9, color: GREEN, after: 3 });
  para_(remit, '{{REMITTANCE}}', { size: 9, color: TEXT });
  dropFirst_(remit);

  spacer_(body);

  // Line items: header row + one template row (duplicated per item on generate)
  const widths = [262, 62, 38, 82, 88];
  const items = body.appendTable([
    ['Description of Services', 'SAC Code', 'Qty', 'Rate ({{CURRENCY}})', 'Total ({{CURRENCY}})'],
    ['', '{{ITEM_SAC}}', '{{ITEM_QTY}}', '{{ITEM_RATE}}', '{{ITEM_TOTAL}}'],
  ]);
  items.setBorderColor(LINE).setBorderWidth(1);
  widths.forEach((w, i) => items.setColumnWidth(i, w));
  forEachCell_(items, (cell, r) => {
    pad_(cell, 6);
    cell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER);
    if (r === 0) {
      cell.setBackgroundColor(MINT);
      styleCell_(cell, { bold: true, size: 8.5, color: GREEN });
    } else {
      styleCell_(cell, { size: 8.5, color: TEXT });
    }
  });
  const desc = items.getCell(1, 0);
  para_(desc, '{{ITEM_TITLE}}', { bold: true, size: 8.5, color: GREEN, after: 2 });
  para_(desc, 'Scope: {{ITEM_SCOPE}}', { size: 7.5, color: MUTED });
  para_(desc, 'Billing Period: {{ITEM_PERIOD}}', { size: 7.5, color: MUTED });
  dropFirst_(desc);

  // Totals, aligned to the items table's last column
  const totals = body.appendTable([
    ['Subtotal:', '{{SUBTOTAL}}'],
    ['CGST ({{CGST_RATE}}%):', '{{CGST}}'],
    ['SGST ({{SGST_RATE}}%):', '{{SGST}}'],
    ['{{IGST_LABEL}}:', '{{IGST}}'],
    ['Net Payable Amount:', '{{TOTAL}}'],
  ]);
  totals.setBorderColor(LINE).setBorderWidth(1);
  totals.setColumnWidth(0, 532 - widths[4]).setColumnWidth(1, widths[4]);
  forEachCell_(totals, (cell, r) => {
    pad_(cell, 5);
    const strong = r === 0 || r === 4;
    if (r === 4) cell.setBackgroundColor(MINT);
    styleCell_(cell, { bold: strong, size: 8.5, color: strong ? GREEN : TEXT });
  });

  spacer_(body);
  spacer_(body);

  // Terms (left) | Signature (right)
  const footer = body.appendTable([['', '']]);
  noBorders_(footer);
  footer.setColumnWidth(0, 320).setColumnWidth(1, 212);
  const terms = footer.getCell(0, 0);
  const sign = footer.getCell(0, 1);
  para_(terms, 'Terms & Understandings:', { bold: true, size: 9, color: GREEN, after: 3 });
  COMPANY.terms.forEach(t => para_(terms, t, { size: 8, color: TEXT }));
  dropFirst_(terms);
  sign.setVerticalAlignment(DocumentApp.VerticalAlignment.BOTTOM);
  para_(sign, '{{SIGNATURE}}', { align: RIGHT });
  para_(sign, '______________________________', { size: 9, color: GREEN, align: RIGHT, before: 4 });
  para_(sign, 'Authorized Signatory', { bold: true, size: 9, color: GREEN, align: RIGHT, before: 4 });
  para_(sign, COMPANY.signatory, { size: 8.5, color: TEXT, align: RIGHT });
  dropFirst_(sign);

  // Shrink the empty paragraph every new Doc starts with.
  body.getChild(0).asParagraph().setAttributes(attrs_({ size: 1 })).setSpacingAfter(0);
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(folder);
  return doc.getId();
}

// --- small formatting helpers ---------------------------------------------

function attrs_(o) {
  const A = DocumentApp.Attribute;
  const a = { [A.FONT_FAMILY]: FONT };
  if (o.bold !== undefined) a[A.BOLD] = o.bold;
  if (o.italic !== undefined) a[A.ITALIC] = o.italic;
  if (o.size) a[A.FONT_SIZE] = o.size;
  if (o.color) a[A.FOREGROUND_COLOR] = o.color;
  return a;
}

function paraLayout_(p, o) {
  if (o.align) p.setAlignment(o.align);
  p.setSpacingBefore(o.before || 0).setSpacingAfter(o.after || 0).setLineSpacing(1.2);
  return p;
}

function para_(container, text, o) {
  const p = container.appendParagraph(text);
  p.setAttributes(attrs_(o));
  return paraLayout_(p, o);
}

// A paragraph made of differently-styled runs: [[text, style], ...]
function rich_(container, runs, base) {
  const p = container.appendParagraph('');
  runs.forEach(([text, o]) => p.appendText(text).setAttributes(attrs_(Object.assign({ bold: false }, base, o))));
  return paraLayout_(p, base);
}

function styleCell_(cell, o) {
  for (let i = 0; i < cell.getNumChildren(); i++) {
    const child = cell.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      child.asParagraph().setAttributes(attrs_(o));
      paraLayout_(child.asParagraph(), o);
    }
  }
}

function forEachCell_(table, fn) {
  for (let r = 0; r < table.getNumRows(); r++) {
    for (let c = 0; c < table.getRow(r).getNumCells(); c++) fn(table.getCell(r, c), r, c);
  }
}

function pad_(cell, pt) {
  cell.setPaddingTop(pt).setPaddingBottom(pt).setPaddingLeft(pt).setPaddingRight(pt);
}

function noBorders_(table) {
  table.setBorderWidth(0).setBorderColor('#ffffff');
  forEachCell_(table, cell => {
    cell.setPaddingLeft(0).setPaddingRight(0).setPaddingTop(0).setPaddingBottom(0);
    cell.setVerticalAlignment(DocumentApp.VerticalAlignment.TOP);
  });
}

function spacer_(body) {
  para_(body, '', { size: 6 });
}

// New bodies/cells start with an empty paragraph; remove it once content exists.
function dropFirst_(container) {
  const first = container.getChild(0);
  if (container.getNumChildren() > 1 && first.getType() === DocumentApp.ElementType.PARAGRAPH &&
      first.asParagraph().getText() === '') {
    first.removeFromParent();
  }
}

// ---------------------------------------------------------------------------
// Sheet helpers
// ---------------------------------------------------------------------------
function readSettings_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.settings);
  const out = {};
  if (!sheet) return out;
  sheet.getDataRange().getValues().slice(1).forEach(r => { if (r[0]) out[String(r[0]).trim()] = r[1]; });
  return out;
}

function writeSetting_(key, value) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEETS.settings);
  const keys = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues().map(r => String(r[0]).trim());
  const idx = keys.indexOf(key);
  if (idx === -1) sheet.appendRow([key, value]);
  else sheet.getRange(idx + 1, 2).setValue(value);
}

function findClient_(name) {
  const rows = SpreadsheetApp.getActive().getSheetByName(SHEETS.clients).getDataRange().getValues().slice(1);
  const r = rows.find(row => String(row[0]).trim() === name.trim());
  if (!r) throw new Error('Client "' + name + '" not found in the Clients sheet.');
  const v = i => String(r[i] || '').trim();
  return {
    name: v(0), attn: v(1), address1: v(2), address2: v(3), address3: v(4), country: v(5),
    email: v(6), phone: v(7), placeOfSupply: v(8), currency: v(9),
  };
}

function round2_(n) {
  return Math.round(n * 100) / 100;
}

function formatMoney_(n, currency) {
  const symbol = CURRENCY_SYMBOLS[currency] !== undefined ? CURRENCY_SYMBOLS[currency] : currency + ' ';
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  const grouped = currency === 'INR'
    ? int.replace(/(\d)(?=(\d\d)+\d$)/g, '$1,')          // 1,00,000.00
    : int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');          // 100,000.00
  return (n < 0 ? '-' : '') + symbol + grouped + '.' + dec;
}
