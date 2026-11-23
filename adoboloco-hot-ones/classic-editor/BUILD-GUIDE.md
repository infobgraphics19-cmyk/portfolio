# Adoboloco Hot Ones: WordPress build guide (Classic editor)

Build everything as **Drafts**. Publish only after the client approves, and publish the 5-Pack product and both pages at the same time.

Files:

| File | What it is |
|---|---|
| `1-hot-ones-page/PASTE-INTO-CLASSIC-EDITOR.html` | **Paste this** for the main page, `/hot-ones/` |
| `2-hot-ones-sauce-list/PASTE-INTO-CLASSIC-EDITOR.html` | **Paste this** for the list page, `/hot-ones-hot-sauces-list/` |
| `*/page.html`, `*/page.css`, `*/page.js` | The same HTML, CSS and JS as separate, readable files (for reference and edits) |
| `../hot-ones-5-bottles.webp` | The 5 Hot Ones bottles image |

How it avoids clashes:

- Every class, ID and CSS variable starts with `adbho-`.
- All CSS sits under `#adbho-root #adbho-page`, so theme and plugin styles can't override it, and it can't touch anything outside the page.
- The JS is self-contained, creates no global variables, and only acts inside `#adbho-root`. It adds smooth jump links (offset for a sticky header) and keeps one FAQ answer open at a time.
- The paste file is one line and structured so WordPress's auto-formatting (`wpautop`) adds no `<p>` or `<br>` tags. This was tested with WordPress's own autop code.

---

## Step 1: Upload the 5-bottle image

1. **Media > Add New**, upload `hot-ones-5-bottles.webp`.
2. Alt text: `The five Adoboloco hot sauces featured on Hot Ones: Hamajang, Kolohe Kid!, Fiya! Fiya!, Island Wings and Jalapeño Chico`
3. Open the image and copy its **File URL**. It should be:
   `https://adoboloco.com/wp-content/uploads/2026/11/hot-ones-5-bottles.webp`
4. If WordPress gives a different URL (for example `hot-ones-5-bottles-1.webp`), replace it in `1-hot-ones-page/PASTE-INTO-CLASSIC-EDITOR.html` before pasting (use Find & Replace; it appears **twice**).


## Step 2: Create the Hot Ones 5-Pack product (WooCommerce)

**Products > Add New**

| Field | Value |
|---|---|
| Product name | `Hot Ones 5-Pack` |
| Slug (permalink) | `hot-ones-5-pack` (the page's "Shop the 5-Pack" button links to `/shop/hot-ones-5-pack/`) |
| Product type | Simple product |
| Regular price | `70.95` |
| Sale price | `63.99` |
| SKU | `HOTONES-5PK` (or the client's own format) |
| Categories | Hot Ones (plus any bundle/gift-set category the site uses) |
| Product image | `hot-ones-5-bottles.webp` |
| Shipping class | **Copy it from an existing "Free Shipping" bundle** (e.g. the Build Your Own Trio or Case of 12 product, Shipping tab), so free shipping works the same way |

Short description:

> Every Adoboloco sauce from Hot Ones in one box: Hamajang (Season 5), Kolohe Kid! (Season 8), Fiya! Fiya! (Season 10), Island Wings (Season 18) and Jalapeño Chico (Season 21). Five 5 fl oz bottles. Free shipping.

Description:

> Taste the full Adoboloco Hot Ones run, from the mild, tropical Island Wings to the 11/10 Fiya! Fiya! This bundle includes one 5 fl oz (148 mL) bottle of each sauce featured on Hot Ones:
>
> - Hamajang Smoky Ghost & Unhinged Habanero (Season 5)
> - Kolohe Kid! (Season 8)
> - Fiya! Fiya! (Season 10)
> - Island Wings (Season 18)
> - Jalapeño Chico (Season 21)
>
> An easy gift for any Hot Ones fan.

Do **not** mention the future free bottle of the new sauce yet.

Click **Save Draft**.

Check with the client:

- Is free shipping USA-only, like the other free-shipping bundles? If so, add "USA" to the product name or description.
- Stock: a simple product does not reduce the stock of the five single bottles. If they track stock per sauce, they may want a bundle plugin or manual stock control.

## Step 3: Before pasting (once)

1. **Users > Profile**: tick **"Disable the visual editor when writing"** and save. The Visual tab rewrites code, so it must never be used on these pages. (Untick it again afterwards if you want it back for other pages.)
2. You need to be an **Administrator**: WordPress only keeps `<style>` and `<script>` tags for admins.

## Step 4: Build the main page

1. **Pages > Add New**. Title: `Adoboloco on Hot Ones`.
2. Permalink/slug: `hot-ones`. If WordPress changes it to `hot-ones-2`, a page or post already uses that slug; find it and rename or remove it first.
3. **Page Attributes > Template**: choose the theme's **Full Width / No Sidebar** template (name depends on the theme).
4. In the editor (Text/Code view), paste the **entire** contents of `1-hot-ones-page/PASTE-INTO-CLASSIC-EDITOR.html`. Paste nothing else.
5. **Save Draft**, then **Preview**.
6. If the theme prints the page title above the content, hide it (theme page options, or the theme's "hide title" setting). The page already has its own H1, and two titles look wrong and hurt SEO.

SEO fields (Yoast / Rank Math):

| Field | Value |
|---|---|
| SEO title | `Adoboloco on Hot Ones: 5 Seasons of Hawaiian Hot Sauce` |
| Meta description | `See every Adoboloco hot sauce featured on Hot Ones, from Hamajang in Season 5 to Jalapeño Chico in Season 21. Family-owned, established 2011 in Maui, Hawaiʻi. Shop the lineup.` |
| Focus keyword | `adoboloco hot ones` |

The FAQ schema is already inside the code. Don't add a second FAQ block from the SEO plugin.

## Step 5: Build the list page

Same as Step 4, with:

| Field | Value |
|---|---|
| Title | `Complete List of Hot Ones Hot Sauces` |
| Slug | `hot-ones-hot-sauces-list` |
| Code | entire contents of `2-hot-ones-sauce-list/PASTE-INTO-CLASSIC-EDITOR.html` |
| SEO title | `Complete List of Hot Ones Hot Sauces by Season \| Adoboloco` |
| Meta description | `Every hot sauce featured on Hot Ones, season by season, with wing order and Scoville ratings. Including Adoboloco's five appearances in Seasons 5, 8, 10, 18 and 21.` |

The list covers Seasons 1 to 29 (source: Sauce Mania, updated March 2026). Seasons 30 and 31 still need adding.

If saving fails or the code disappears: a security plugin (e.g. Wordfence) or firewall may be blocking `<script>` in page content. Allow it for this save, or ask the host.

## Step 6: Preview checklist (both pages, desktop and phone)

- [ ] Hero and 5-Pack show the 5-bottle image (5 bottles only)
- [ ] Hamajang shows the "Smoky Ghost" bottle; Jalapeño Chico shows the green/white bottle with the Hot Ones flag
- [ ] Section order: Hero, Story, 5 Seasons, **5-Pack**, **Trio**, Single bottles, Videos, FAQ, Complete list, Closing banner
- [ ] 5-Pack shows $63.99, $70.95 crossed out, Save $6.96, Free shipping
- [ ] Fonts (Helvetica headings, Arial text), red `#D50909`, white background
- [ ] "Explore the Featured Sauces" and "Get the Hot Ones 5-Pack" jump down the page and stop below the header
- [ ] No extra page title above the hero; no sidebar
- [ ] Product links open the right products; FAQ items open and close
- [ ] No sideways scrolling on a phone

## Step 7: Go live (after client approval)

1. Publish the **5-Pack product** first, then both pages.
2. Purge the cache (LiteSpeed Cache > Purge All).
3. Optional, with client approval: add a "See all our Hot Ones sauces" link from the Hot Ones section at the bottom of the homepage to `/hot-ones/`.
4. Video section: the five tiles are placeholders until the client picks the YouTube episodes.
