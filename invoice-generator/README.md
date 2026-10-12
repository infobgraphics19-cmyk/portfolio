# Pesto Marketing – Invoice Generator (Google Sheets + Docs)

Generate invoices in your own Google Drive. The layout matches the
PESTO MARKETING invoice. Each invoice gets an automatic number
(`PM-2026-0033`, `PM-2026-0034`, …), and you only type the parts that change.

```
Google Sheet (you type here)          Google Doc template           Output (Drive folder)
 ├─ Invoices  ← client, items, rate ─▶  {{placeholders}} + logo  ─▶  PM-2026-0033 - Client.gdoc
 ├─ Clients   ← saved once                                           PM-2026-0033 - Client.pdf
 └─ Settings  ← prefix, next number, logo, GSTIN, PAN, bank, LUT note
```

## One-time setup (about 5 minutes)

1. Go to <https://sheets.new> and name the sheet **Invoice Generator**.
2. Open **Extensions → Apps Script**. Delete the starter code and paste the whole
   [`Code.gs`](./Code.gs). Click **Save**.
3. *(Optional)* Change the `COMPANY` block at the top of the script (name, address, email, phone).
4. In the function dropdown, choose **`setup`** and click **Run**. Google asks for
   permission to use your Sheets, Docs and Drive. Click **Allow**.
   (You may see "Google hasn't verified this app". Choose *Advanced → Go to project*. You wrote this script yourself, so this is expected.)
5. Go back to the Sheet and reload it. A **🧾 Invoices** menu appears.
   Setup has created:
   - the **Invoices**, **Clients** and **Settings** tabs,
   - a Drive folder named **PESTO MARKETING – Invoices**,
   - the **Invoice Template** Google Doc in that folder.
6. Fill in the **Settings** tab:
   | Setting | What to put |
   |---|---|
   | Next Invoice Number | Your next number. If your last invoice was `PM-2026-0032`, enter `33`. |
   | Logo | Upload your logo (PNG/JPG) to Drive, then paste its **share link** |
   | GSTIN / PAN | Your GSTIN and PAN |
   | Bank Details | `State Bank of India, Current Account No: …, IFSC: …` |
   | LUT Note | `SUPPLY OF SERVICES MEANT FOR EXPORT UNDER LETTER OF UNDERTAKING (LUT) WITHOUT PAYMENT OF INTEGRATED TAX UNDER ARN … DATED …` (leave blank for domestic invoices and the box disappears) |

   These details stay in your private Sheet, not in the code.

## Creating an invoice

1. **Clients tab:** add each client once (name, Attn, two address lines, email, phone, place of supply, currency such as `USD` or `INR`).
2. **Invoices tab:** fill one row:
   - **Client** (pick from the dropdown), **Description**, **Details** (the small grey line), **SAC Code**, **Qty**, **Rate**
   - **Date of Issue** is optional (blank means today).
   - **Due Date** is optional (blank means today + *Default Due Days*).
   - **CGST / SGST / IGST %** (use 0 for export invoices, or e.g. 9 / 9 / 0 for Haryana clients and 0 / 0 / 18 for other states)
   - **Leave Invoice No empty.** It is filled in automatically.
3. Select the row and click **🧾 Invoices → Generate invoice from selected row(s)**.
4. The row gets the invoice number, **Status = Generated**, and links to the Google Doc and the PDF.

**Several items on one invoice:** put each item on its own row, directly below
each other, and fill the client, dates and tax % on the **first** row only. Select
all those rows, then click Generate. Each selected row becomes one line in the items table.

**Fixing a mistake:** edit the row, select it again and click Generate. Because
the row already has an invoice number, that **same number** is used again. Delete
the old Doc/PDF from the folder.

## Invoice numbering

- The format is `PREFIX-YEAR-NNNN` (prefix, digits and starting number are all in Settings).
- The counter is locked during generation, so two clicks can never get the same number.
- With *Reset Counter Every Year = Yes*, numbering starts again at `0001` on 1 January
  (calendar year, based on the Date of Issue). Set it to `No` to keep counting.

## Changing the design

Open **Invoice Template** in the Drive folder and edit it like any Google Doc
(fonts, colours, terms text, signature). Keep the `{{PLACEHOLDERS}}`, and keep the
items table's second row (`{{ITEM_DESC}}`…). That row is copied once for each item.
To start over from the default design, use **🧾 Invoices → Rebuild template Doc**.

Available placeholders:
`{{LOGO}} {{INVOICE_NO}} {{ISSUE_DATE}} {{DUE_DATE}} {{PLACE_OF_SUPPLY}} {{GSTIN}} {{PAN}}
{{BANK_DETAILS}} {{LUT_NOTE}} {{CLIENT_NAME}} {{CLIENT_ATTN}} {{CLIENT_ADDRESS_1}}
{{CLIENT_ADDRESS_2}} {{CLIENT_EMAIL}} {{CLIENT_PHONE}} {{CURRENCY}} {{SUBTOTAL}}
{{CGST_RATE}} {{CGST}} {{SGST_RATE}} {{SGST}} {{IGST_LABEL}} {{IGST}} {{TOTAL}}`
and in the items row `{{ITEM_DESC}} {{ITEM_DETAILS}} {{ITEM_SAC}} {{ITEM_QTY}} {{ITEM_RATE}} {{ITEM_TOTAL}}`.
