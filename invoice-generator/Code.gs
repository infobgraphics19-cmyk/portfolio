/**
 * Pesto Marketing – Invoice Generator (Google Sheets + Google Docs + Apps Script)
 *
 * One Google Sheet holds your settings, clients and invoice rows.
 * One Google Doc is the template (built for you by "Setup").
 * Select invoice row(s) → menu "🧾 Invoices → Generate invoice" →
 * a filled Google Doc + PDF land in your Drive folder, and the invoice
 * number (PM-2026-0033, PM-2026-0034, …) is assigned automatically.
 *
 * Install: see README.md in this folder.
 */

// ---------------------------------------------------------------------------
// Company details that are printed on every invoice (baked into the template).
// Edit these BEFORE running Setup, or edit the template Doc directly later.
// Sensitive values (GSTIN, PAN, bank details) live in the Settings sheet.
// ---------------------------------------------------------------------------
const COMPANY = {
  name: 'PESTO MARKETING',
  address: [
    '130-A, First Floor, Old Housing Board Colony,',
    'Sector 19, Panchkula, Haryana,',
    'India, Pin - 134113',
  ],
  email: 'info@pestomarketing.com',
  phone: '+91 76965 44580',
};

const NAVY = '#0f172a';
const GREY = '#475569';
const LIGHT = '#e2e8f0';
const SHEETS = { settings: 'Settings', clients: 'Clients', invoices: 'Invoices' };

// Invoices sheet columns (1-based).
const COL = {
  number: 1, issueDate: 2, dueDate: 3, client: 4, placeOfSupply: 5,
  description: 6, details: 7, sac: 8, qty: 9, rate: 10, lineTotal: 11,
  cgst: 12, sgst: 13, igst: 14, status: 15, docLink: 16, pdfLink: 17,
};
const INVOICE_HEADERS = [
  'Invoice No (auto)', 'Date of Issue', 'Due Date', 'Client', 'Place of Supply (optional override)',
  'Description of Service', 'Details (sub-line)', 'SAC Code', 'Qty', 'Rate', 'Line Total',
  'CGST %', 'SGST %', 'IGST %', 'Status', 'Google Doc', 'PDF',
];
const CLIENT_HEADERS = [
  'Client Name', 'Attn', 'Address Line 1', 'Address Line 2', 'Email', 'Phone', 'Place of Supply', 'Currency',
];
const SETTING_ROWS = [
  ['Invoice Prefix', 'PM', 'Invoice number = PREFIX-YEAR-0001'],
  ['Next Invoice Number', 1, 'Set this to your next number (e.g. 33 if your last was PM-2026-0032). Auto-increments.'],
  ['Counter Year', new Date().getFullYear(), 'Used for yearly reset. Do not edit normally.'],
  ['Reset Counter Every Year', 'Yes', 'Yes = numbering restarts at 0001 on 1 January'],
  ['Number Digits', 4, 'Zero padding: 4 → 0033'],
  ['Default Due Days', 5, 'Used when Due Date is left blank'],
  ['Date Format', 'dd/MM/yyyy', ''],
  ['Logo (Drive file URL or ID)', '', 'Upload your logo PNG/JPG to Drive and paste its link here'],
  ['Logo Width (px)', 150, ''],
  ['GSTIN', '', ''],
  ['PAN', '', ''],
  ['Bank Details', '', 'e.g. State Bank of India, Current Account No: XXXXXXXX, IFSC: XXXXXXX'],
  ['LUT Note', '', 'Printed in the box under the header for export invoices. Leave blank to hide the box.'],
  ['Template Doc ID', '', 'Filled by Setup'],
  ['Output Folder ID', '', 'Filled by Setup'],
];
const CURRENCY_SYMBOLS = { USD: '$', INR: '₹', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', AED: 'AED ', SGD: 'S$' };

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧾 Invoices')
    .addItem('Generate invoice from selected row(s)', 'generateInvoice')
    .addSeparator()
    .addItem('Setup (first time only)', 'setup')
    .addItem('Rebuild template Doc', 'rebuildTemplate')
    .addToUi();
}

// ---------------------------------------------------------------------------
// Setup: creates the sheets, the output folder and the template Doc.
// ---------------------------------------------------------------------------
function setup() {
  const ss = SpreadsheetApp.getActive();

  let settings = ss.getSheetByName(SHEETS.settings);
  if (!settings) {
    settings = ss.insertSheet(SHEETS.settings);
    settings.getRange(1, 1, 1, 3).setValues([['Setting', 'Value', 'Notes']]).setFontWeight('bold');
    settings.getRange(2, 1, SETTING_ROWS.length, 3).setValues(SETTING_ROWS);
    settings.setColumnWidth(1, 220).setColumnWidth(2, 420).setColumnWidth(3, 520);
    settings.setFrozenRows(1);
  }

  let clients = ss.getSheetByName(SHEETS.clients);
  if (!clients) {
    clients = ss.insertSheet(SHEETS.clients);
    clients.getRange(1, 1, 1, CLIENT_HEADERS.length).setValues([CLIENT_HEADERS]).setFontWeight('bold');
    clients.appendRow(['Passion Is Beauty', 'Terry Lee', '4320 International Blvd NW, Norcross,',
      'Georgia, 30093, United States of America', 'ubx7004@gmail.com', '+1 678 313 1254',
      'Outside India (Export)', 'USD']);
    clients.setFrozenRows(1);
    clients.autoResizeColumns(1, CLIENT_HEADERS.length);
  }

  let invoices = ss.getSheetByName(SHEETS.invoices);
  if (!invoices) {
    invoices = ss.insertSheet(SHEETS.invoices, 0);
    invoices.getRange(1, 1, 1, INVOICE_HEADERS.length).setValues([INVOICE_HEADERS])
      .setFontWeight('bold').setBackground(NAVY).setFontColor('#ffffff');
    invoices.setFrozenRows(1);
    invoices.getRange('B2:C').setNumberFormat('dd/MM/yyyy');
    invoices.getRange('J2:K').setNumberFormat('#,##0.00');
    // Client dropdown sourced from the Clients sheet.
    invoices.getRange('D2:D').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInRange(clients.getRange('A2:A'), true).build());
    // Sample row (columns A–J and L–N; K is the Line Total formula).
    invoices.getRange(2, 1, 1, 10).setValues([['', '', '', 'Passion Is Beauty', '',
      'E-commerce Marketplace Advertising, Amazon PPC Campaign Optimization & Digital Store Management Services',
      'Charges for the duration of October 6, 2026, to November 5, 2026', '998311', 1, 1000]]);
    invoices.getRange(2, COL.cgst, 1, 3).setValues([[0, 0, 0]]);
    invoices.getRange('K2').setFormula('=ARRAYFORMULA(IF(I2:I="", "", I2:I * J2:J))');
    invoices.setColumnWidth(COL.description, 360).setColumnWidth(COL.details, 300);
  }

  const s = readSettings_();
  if (!s['Output Folder ID']) {
    const folder = DriveApp.createFolder(COMPANY.name + ' – Invoices');
    writeSetting_('Output Folder ID', folder.getId());
  }
  if (!s['Template Doc ID']) rebuildTemplate();

  SpreadsheetApp.getUi().alert(
    'Setup complete!\n\n1. Fill GSTIN, PAN, Bank Details, LUT Note and Logo in the Settings tab.\n' +
    '2. Set "Next Invoice Number".\n3. Add clients in the Clients tab.\n' +
    '4. Fill a row in Invoices, select it, then 🧾 Invoices → Generate.');
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
  if (sheet.getName() !== SHEETS.invoices) throw new Error('Select row(s) on the "Invoices" sheet first.');

  const range = sheet.getActiveRange();
  const firstRow = Math.max(range.getRow(), 2);
  const lastRow = range.getLastRow();
  if (lastRow < 2) throw new Error('Select the invoice row(s) (not the header).');

  // Every selected row is one line item; invoice-level fields come from the first row.
  const rows = sheet.getRange(firstRow, 1, lastRow - firstRow + 1, INVOICE_HEADERS.length).getValues();
  const head = rows[0];
  const items = rows.filter(r => r[COL.description - 1] !== '').map(r => ({
    desc: String(r[COL.description - 1]),
    details: String(r[COL.details - 1] || ''),
    sac: String(r[COL.sac - 1] || ''),
    qty: Number(r[COL.qty - 1] || 1),
    rate: Number(r[COL.rate - 1] || 0),
  }));
  if (!head[COL.client - 1]) throw new Error('The first selected row needs a Client.');
  if (!items.length) throw new Error('Add at least one Description of Service.');

  const s = readSettings_();
  const client = findClient_(String(head[COL.client - 1]));
  const tz = Session.getScriptTimeZone();
  const fmt = s['Date Format'] || 'dd/MM/yyyy';
  const issueDate = head[COL.issueDate - 1] instanceof Date ? head[COL.issueDate - 1] : new Date();
  const dueDate = head[COL.dueDate - 1] instanceof Date ? head[COL.dueDate - 1]
    : new Date(issueDate.getTime() + Number(s['Default Due Days'] || 0) * 86400000);

  // Reuse the number when regenerating a row; otherwise take the next one.
  const invoiceNo = head[COL.number - 1] || nextInvoiceNumber_(issueDate);

  const currency = (client.currency || 'USD').toUpperCase();
  const money = n => formatMoney_(n, currency);
  const cgstRate = Number(head[COL.cgst - 1] || 0);
  const sgstRate = Number(head[COL.sgst - 1] || 0);
  const igstRate = Number(head[COL.igst - 1] || 0);
  const subtotal = items.reduce((sum, it) => sum + it.qty * it.rate, 0);
  const cgst = round2_(subtotal * cgstRate / 100);
  const sgst = round2_(subtotal * sgstRate / 100);
  const igst = round2_(subtotal * igstRate / 100);
  const total = subtotal + cgst + sgst + igst;
  const lutNote = String(s['LUT Note'] || '');

  const values = {
    INVOICE_NO: invoiceNo,
    ISSUE_DATE: Utilities.formatDate(issueDate, tz, fmt),
    DUE_DATE: Utilities.formatDate(dueDate, tz, fmt),
    PLACE_OF_SUPPLY: String(head[COL.placeOfSupply - 1] || client.placeOfSupply || ''),
    GSTIN: String(s['GSTIN'] || ''),
    PAN: String(s['PAN'] || ''),
    BANK_DETAILS: String(s['Bank Details'] || ''),
    LUT_NOTE: lutNote,
    CLIENT_NAME: client.name,
    CLIENT_ATTN: client.attn,
    CLIENT_ADDRESS_1: client.address1,
    CLIENT_ADDRESS_2: client.address2,
    CLIENT_EMAIL: client.email,
    CLIENT_PHONE: client.phone,
    CURRENCY: currency,
    SUBTOTAL: money(subtotal),
    CGST_RATE: String(cgstRate),
    SGST_RATE: String(sgstRate),
    CGST: money(cgst),
    SGST: money(sgst),
    IGST_LABEL: igstRate === 0 && lutNote ? 'IGST (Export under LUT)' : 'IGST (' + igstRate + '%)',
    IGST: money(igst),
    TOTAL: money(total),
  };

  // Copy the template and fill it.
  const folder = DriveApp.getFolderById(s['Output Folder ID']);
  const fileName = invoiceNo + ' - ' + client.name;
  const copy = DriveApp.getFileById(s['Template Doc ID']).makeCopy(fileName, folder);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();

  fillItems_(body, items, money);
  if (!lutNote) removeEnclosingTable_(body, 'LUT_NOTE');
  Object.keys(values).forEach(k => replaceAll_(body, k, values[k]));
  insertLogo_(body, s['Logo (Drive file URL or ID)'], Number(s['Logo Width (px)'] || 150));
  doc.saveAndClose();

  const pdf = folder.createFile(copy.getAs(MimeType.PDF).setName(fileName + '.pdf'));

  // Write results back to every selected row.
  const n = lastRow - firstRow + 1;
  sheet.getRange(firstRow, COL.number, n, 1).setValue(invoiceNo);
  sheet.getRange(firstRow, COL.issueDate).setValue(issueDate);
  sheet.getRange(firstRow, COL.dueDate).setValue(dueDate);
  sheet.getRange(firstRow, COL.status, n, 1).setValue('Generated');
  sheet.getRange(firstRow, COL.docLink, n, 1).setValue(doc.getUrl());
  sheet.getRange(firstRow, COL.pdfLink, n, 1).setValue(pdf.getUrl());

  ss.toast(invoiceNo + ' created. PDF: ' + pdf.getUrl(), 'Invoices', 10);
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

// Replaces {{KEY}} everywhere, keeping the placeholder's formatting.
function replaceAll_(container, key, value) {
  const pattern = '\\{\\{' + key + '\\}\\}';
  let found = container.findText(pattern);
  while (found) {
    const text = found.getElement().asText();
    const start = found.getStartOffset();
    const end = found.getEndOffsetInclusive();
    if (value) text.insertText(end + 1, String(value));
    text.deleteText(start, end);
    found = container.findText(pattern);
  }
}

function ancestor_(element, type) {
  let el = element;
  while (el && el.getType() !== type) el = el.getParent();
  return el;
}

function removeEnclosingTable_(body, key) {
  const found = body.findText('\\{\\{' + key + '\\}\\}');
  if (found) ancestor_(found.getElement(), DocumentApp.ElementType.TABLE).removeFromParent();
}

// Duplicates the template item row once per line item.
function fillItems_(body, items, money) {
  const found = body.findText('\\{\\{ITEM_DESC\\}\\}');
  const tplRow = ancestor_(found.getElement(), DocumentApp.ElementType.TABLE_ROW).asTableRow();
  const table = tplRow.getParentTable();
  const tplIndex = table.getChildIndex(tplRow);

  items.forEach((it, i) => {
    const row = table.insertTableRow(tplIndex + 1 + i, tplRow.copy());
    replaceAll_(row, 'ITEM_DESC', it.desc);
    replaceAll_(row, 'ITEM_DETAILS', it.details);
    replaceAll_(row, 'ITEM_SAC', it.sac);
    replaceAll_(row, 'ITEM_QTY', String(it.qty));
    replaceAll_(row, 'ITEM_RATE', money(it.rate));
    replaceAll_(row, 'ITEM_TOTAL', money(it.qty * it.rate));
    // Drop the empty "details" line when there is none.
    const cell = row.getCell(0);
    for (let c = cell.getNumChildren() - 1; c >= 0 && cell.getNumChildren() > 1; c--) {
      const child = cell.getChild(c);
      if (child.getType() === DocumentApp.ElementType.PARAGRAPH && child.asParagraph().getText() === '') {
        child.removeFromParent();
      }
    }
  });
  table.removeRow(tplIndex);
}

function insertLogo_(body, logoSetting, width) {
  const found = body.findText('\\{\\{LOGO\\}\\}');
  if (!found) return;
  const paragraph = ancestor_(found.getElement(), DocumentApp.ElementType.PARAGRAPH).asParagraph();
  const id = extractDriveId_(logoSetting);
  if (!id) {
    paragraph.removeFromParent();
    return;
  }
  paragraph.clear();
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
// Template builder – recreates the layout of the PESTO MARKETING invoice.
// ---------------------------------------------------------------------------
function buildTemplate_(folder) {
  const doc = DocumentApp.create(COMPANY.name + ' – Invoice Template');
  const body = doc.getBody();
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(40).setMarginRight(40);

  // Header: company (left) | INVOICE + meta (right)
  const header = body.appendTable([['', '']]);
  noBorders_(header);
  header.setColumnWidth(0, 290).setColumnWidth(1, 242);
  const left = header.getCell(0, 0);
  const right = header.getCell(0, 1);

  para_(left, '{{LOGO}}', {});
  para_(left, COMPANY.name, { bold: true, size: 20, color: NAVY });
  COMPANY.address.forEach(line => para_(left, line, { size: 9, color: GREY }));
  rich_(left, [['Email: ', { bold: true, color: NAVY }], [COMPANY.email, {}]], { size: 9, color: GREY, before: 6 });
  rich_(left, [['Phone: ', { bold: true, color: NAVY }], [COMPANY.phone, {}]], { size: 9, color: GREY });
  para_(left, 'GSTIN: {{GSTIN}}', { bold: true, size: 9, color: NAVY, before: 6 });
  para_(left, 'PAN: {{PAN}}', { bold: true, size: 9, color: NAVY });
  dropFirst_(left);

  para_(right, 'INVOICE', { bold: true, size: 20, color: NAVY, align: DocumentApp.HorizontalAlignment.RIGHT });
  const meta = right.appendTable([
    ['Invoice Number:', '{{INVOICE_NO}}'],
    ['Date of Issue:', '{{ISSUE_DATE}}'],
    ['Due Date:', '{{DUE_DATE}}'],
    ['Place of Supply:', '{{PLACE_OF_SUPPLY}}'],
  ]);
  noBorders_(meta);
  meta.setColumnWidth(0, 95).setColumnWidth(1, 135);
  forEachCell_(meta, (cell, r, c) => styleCell_(cell, c === 0
    ? { bold: true, size: 9, color: NAVY } : { size: 9, color: GREY }));
  dropFirst_(right);

  spacer_(body);

  // LUT note box
  const lut = body.appendTable([['{{LUT_NOTE}}']]);
  lut.setBorderColor(NAVY).setBorderWidth(1);
  styleCell_(lut.getCell(0, 0), { bold: true, italic: true, size: 8, color: NAVY,
    align: DocumentApp.HorizontalAlignment.CENTER });
  pad_(lut.getCell(0, 0), 8);

  spacer_(body);

  // Bill to
  const bill = body.appendTable([['']]);
  bill.setBorderColor(LIGHT).setBorderWidth(1);
  const billCell = bill.getCell(0, 0).setBackgroundColor('#f8fafc');
  pad_(billCell, 8);
  para_(billCell, 'BILL TO:', { bold: true, size: 9, color: NAVY, after: 6 });
  para_(billCell, '{{CLIENT_NAME}}', { bold: true, size: 9, color: NAVY });
  para_(billCell, 'Attn: {{CLIENT_ATTN}}', { size: 9, color: GREY });
  para_(billCell, '{{CLIENT_ADDRESS_1}}', { size: 9, color: GREY });
  para_(billCell, '{{CLIENT_ADDRESS_2}}', { size: 9, color: GREY });
  para_(billCell, 'Email: {{CLIENT_EMAIL}} | Phone: {{CLIENT_PHONE}}', { size: 9, color: GREY });
  dropFirst_(billCell);

  spacer_(body);

  // Line items: header row + one template row (duplicated per item on generate)
  const items = body.appendTable([
    ['Description of Services', 'SAC Code', 'Qty', 'Rate ({{CURRENCY}})', 'Total ({{CURRENCY}})'],
    ['', '{{ITEM_SAC}}', '{{ITEM_QTY}}', '{{ITEM_RATE}}', '{{ITEM_TOTAL}}'],
  ]);
  items.setBorderColor(LIGHT).setBorderWidth(1);
  [250, 70, 40, 85, 87].forEach((w, i) => items.setColumnWidth(i, w));
  const right3 = c => (c >= 3 ? DocumentApp.HorizontalAlignment.RIGHT : DocumentApp.HorizontalAlignment.LEFT);
  forEachCell_(items, (cell, r, c) => {
    pad_(cell, 6);
    if (r === 0) {
      cell.setBackgroundColor(NAVY);
      styleCell_(cell, { bold: true, size: 9, color: '#ffffff', align: right3(c) });
    } else {
      styleCell_(cell, { size: 9, color: NAVY, align: right3(c) });
    }
  });
  const descCell = items.getCell(1, 0);
  para_(descCell, '{{ITEM_DESC}}', { bold: true, size: 9, color: NAVY });
  para_(descCell, '{{ITEM_DETAILS}}', { size: 8, color: '#64748b' });
  dropFirst_(descCell);

  spacer_(body);

  // Totals, pushed to the right via a borderless wrapper table
  const wrap = body.appendTable([['', '']]);
  noBorders_(wrap);
  wrap.setColumnWidth(0, 290).setColumnWidth(1, 242);
  const totals = wrap.getCell(0, 1).appendTable([
    ['Subtotal:', '{{SUBTOTAL}}'],
    ['CGST ({{CGST_RATE}}%):', '{{CGST}}'],
    ['SGST ({{SGST_RATE}}%):', '{{SGST}}'],
    ['{{IGST_LABEL}}:', '{{IGST}}'],
    ['Net Total Payable:', '{{TOTAL}}'],
  ]);
  totals.setBorderColor(LIGHT).setBorderWidth(1);
  totals.setColumnWidth(0, 140).setColumnWidth(1, 90);
  forEachCell_(totals, (cell, r, c) => {
    pad_(cell, 4);
    styleCell_(cell, { bold: r === 4, size: 9, color: NAVY,
      align: c === 1 ? DocumentApp.HorizontalAlignment.RIGHT : DocumentApp.HorizontalAlignment.LEFT });
  });
  dropFirst_(wrap.getCell(0, 1));

  // Terms
  body.appendHorizontalRule();
  para_(body, 'TERMS & REMITTANCE INSTRUCTIONS:', { bold: true, size: 9, color: NAVY, after: 4 });
  const terms = { size: 9, color: GREY };
  para_(body, '1. All credit card processing fees, intermediary bank commissions, and operational charges ' +
    'shall be borne solely by the payer.', terms);
  para_(body, '2. The Client is strictly responsible for ensuring that the full net invoiced amount ' +
    '({{TOTAL}}) is safely realized by Pesto Marketing without deductions.', terms);
  rich_(body, [['3. Inbound remittance must clear through Authorized Dealer channels utilizing RBI Purpose Code ', {}],
    ['P1007', { bold: true }], ['.', {}]], terms);
  rich_(body, [['4. ', {}], ['Bank Remittance Anchor: ', { bold: true }], ['{{BANK_DETAILS}}', {}]], terms);

  // Signature
  const rightAlign = DocumentApp.HorizontalAlignment.RIGHT;
  rich_(body, [['For ', {}], [COMPANY.name, { bold: true }]], { size: 9, color: NAVY, align: rightAlign, before: 18 });
  para_(body, '', { size: 9 });
  para_(body, '', { size: 9 });
  para_(body, 'Authorized Signatory', { size: 9, color: NAVY, align: rightAlign });

  // Shrink the empty paragraph every new Doc starts with.
  body.getChild(0).asParagraph().setAttributes(attrs_({ size: 1 })).setSpacingAfter(0);
  doc.saveAndClose();
  DriveApp.getFileById(doc.getId()).moveTo(folder);
  return doc.getId();
}

// --- small formatting helpers ---------------------------------------------

function attrs_(o) {
  const A = DocumentApp.Attribute;
  const a = { [A.FONT_FAMILY]: 'Arial' };
  if (o.bold !== undefined) a[A.BOLD] = o.bold;
  if (o.italic !== undefined) a[A.ITALIC] = o.italic;
  if (o.size) a[A.FONT_SIZE] = o.size;
  if (o.color) a[A.FOREGROUND_COLOR] = o.color;
  return a;
}

function paraLayout_(p, o) {
  if (o.align) p.setAlignment(o.align);
  p.setSpacingBefore(o.before || 0).setSpacingAfter(o.after || 0).setLineSpacing(1.15);
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
  runs.forEach(([text, o]) => p.appendText(text).setAttributes(attrs_(Object.assign({}, base, o))));
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
  forEachCell_(table, cell => cell.setPaddingLeft(0).setPaddingRight(0));
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
  return {
    name: String(r[0]), attn: String(r[1]), address1: String(r[2]), address2: String(r[3]),
    email: String(r[4]), phone: String(r[5]), placeOfSupply: String(r[6]), currency: String(r[7]),
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
