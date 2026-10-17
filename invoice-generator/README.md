# Pesto Marketing – Invoice Generator v2 (Google Sheets + Docs)

Generate invoices in your own Google Drive. The layout matches the PESTO MARKETING
invoice: brand green `#022d1d`, the **Plus Jakarta Sans** font and your logo in the
top-left corner. Each invoice gets an automatic number (`PM-2026-0033`, …).

```
Google Sheet (you type here)               Google Doc template            Output (Drive folder)
 ├─ Invoices ← client, services, rates ─▶   {{placeholders}} + logo   ─▶   PM-2026-0033 - Client.gdoc
 ├─ Clients  ← saved once, with Country                                    PM-2026-0033 - Client.pdf
 ├─ Banks    ← bank details per currency (USD / EUR / AUD …)
 └─ Settings ← prefix, next number, logo, signature, GSTIN, LUT note
```

## What changes automatically

| Client country | Currency everywhere | Remittance instructions |
|---|---|---|
| USA / United States (of America) | USD ($) | the **USD** rows in the Banks tab (Citibank) |
| Netherlands (and other Eurozone countries) | EUR (€) | the **EUR** rows (Banking Circle S.A.) |
| Australia | AUD (A$) | the **AUD** rows (BC Payments) |
| Anything else | *Default Currency* in Settings | that currency's rows |

You can force a currency for one client in the Clients tab's **Currency (optional override)** column.
To support another currency (for example GBP), add `GBP` rows to the Banks tab.

These parts are always the same:
- the green "SUPPLY OF SERVICES…" box (*LUT Note* in Settings)
- the Terms & Understandings. The amount in term 2 always equals the invoice's Net Payable Amount.
- the signature block. Add a signature image in Settings whenever you're ready.

## Install (new Sheet)

1. Go to <https://sheets.new> and open **Extensions → Apps Script**.
2. Paste the whole `Code.gs`, then click **Save**.
3. In the function dropdown, choose **`setup`** and click **▶ Run**. Click **Allow** when Google asks.
   Then switch to the Sheet tab and click **OK** on "Setup complete!".
4. Reload the Sheet. The **🧾 Invoices** menu appears.

## Upgrade from v1 (the Sheet you already have)

1. Open **Extensions → Apps Script**, select all the old code, delete it, paste the new `Code.gs`, and click **Save**.
2. Run **`setup`** again, then click OK in the Sheet tab.
   - Your old tabs are kept and renamed to **Settings (v1)**, **Clients (v1)** and **Invoices (v1)**.
   - New tabs are created. Your invoice counter, logo, GSTIN, LUT note and Drive folder are carried over.
   - A new green template Doc is created in the same Drive folder.
3. Re-enter your clients in the new **Clients** tab. It now has a **Country** column. Then delete the "(v1)" tabs whenever you like.

## Settings to check once

| Setting | What to put |
|---|---|
| Next Invoice Number | Your next number. If your last invoice was `PM-2026-0032`, enter `33`. |
| Logo | Upload your logo PNG to Drive, then paste its share link. It is placed in the top-left corner. |
| Signature Image | Optional. A PNG of your signature, placed above the signature line. |
| GSTIN / LUT Note | Your GSTIN and the "SUPPLY OF SERVICES … ARN … DATED …" sentence |
| Banks tab | One row per line: `Currency` · `Field` (for example *IBAN*) · `Value` |

## Creating an invoice (one or many services)

On the **Invoices** tab:

| Invoice No | Date | **Client** | … | **Service** | Scope / Details | Billing Period | SAC | Qty | Rate |
|---|---|---|---|---|---|---|---|---|---|
| *(auto)* | | Acme BV | | Web Development | Scope: 5-page site | Oct 6 – Nov 5 | 998311 | 1 | 1200 |
| | | *(empty)* | | Google Ads | Scope: setup + bidding | Oct 6 – Nov 5 | 998311 | 1 | 400 |
| | | *(empty)* | | SEO | Scope: on-page + links | Oct 6 – Nov 5 | 998311 | 1 | 600 |

- Fill the **Client** only on the first row. Each row below it with a Service and an
  empty Client becomes another line on the **same invoice**.
- Put any **tax %** on the first row. Leave everything at 0 for export invoices.
- Select any row of the invoice, then click **🧾 Invoices → Generate invoice from selected row**.
- To fix a mistake, edit the rows and click Generate again. The same invoice number is used again.

## Changing the design

Edit the `COMPANY` block or the brand colours at the top of `Code.gs`, then run
**🧾 Invoices → Rebuild template Doc**. You can also open **Invoice Template** in the
Drive folder and edit it directly. Keep the `{{PLACEHOLDERS}}`, and keep the items
table's second row: it is copied once for each service.
