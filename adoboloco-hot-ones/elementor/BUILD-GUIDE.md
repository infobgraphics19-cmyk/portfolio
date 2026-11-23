# Adoboloco Hot Ones: WordPress build guide (Elementor)

Build everything as **Drafts**. Publish only after the client approves, and publish the 5-Pack product and both pages at the same time.

Files in this folder:

| File | What it is |
|---|---|
| `1-hot-ones-page.html` | Code for the main page, `/hot-ones/` |
| `2-hot-ones-sauce-list-page.html` | Code for the list page, `/hot-ones-hot-sauces-list/` |
| `../hot-ones-5-bottles.webp` | The 5 Hot Ones bottles image |

All CSS in the code is scoped to the page (`.hop`), so it does not change the theme, header, footer or any other page.

---

## Step 1: Upload the 5-bottle image

1. **Media > Add New**, upload `hot-ones-5-bottles.webp`.
2. Alt text: `The five Adoboloco hot sauces featured on Hot Ones: Hamajang, Kolohe Kid!, Fiya! Fiya!, Island Wings and Jalapeño Chico`
3. Open the image and copy its **File URL**. It should be:
   `https://adoboloco.com/wp-content/uploads/2026/11/hot-ones-5-bottles.webp`
4. If WordPress gives a different URL (for example `hot-ones-5-bottles-1.webp`), replace that URL in `1-hot-ones-page.html` before pasting. It appears **twice** (hero and 5-Pack section).


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

## Step 3: Build the main page

1. **Pages > Add New**. Title: `Adoboloco on Hot Ones`.
2. Permalink/slug: `hot-ones`. If WordPress changes it to `hot-ones-2`, a page or post already uses that slug; find it and rename or remove it first.
3. Page Attributes > Template: **Elementor Full Width** (keeps the site header and footer).
4. **Save Draft**, then **Edit with Elementor**.
5. Add a **Container** (or Section) and set:
   - Content Width: **Full Width**
   - Padding: **0** on all sides; Gap: **0**
6. Drag an **HTML** widget into it. Paste the **entire** contents of `1-hot-ones-page.html`.
7. Click the arrow next to **Publish** and choose **Save Draft**.
8. Open **Preview** (the Elementor editor canvas does not always render HTML widgets fully).

SEO fields (Yoast / Rank Math):

| Field | Value |
|---|---|
| SEO title | `Adoboloco on Hot Ones: 5 Seasons of Hawaiian Hot Sauce` |
| Meta description | `See every Adoboloco hot sauce featured on Hot Ones, from Hamajang in Season 5 to Jalapeño Chico in Season 21. Family-owned, established 2011 in Maui, Hawaiʻi. Shop the lineup.` |
| Focus keyword | `adoboloco hot ones` |

The FAQ schema is already inside the code. If the SEO plugin also adds an FAQ block, do not add a second one.

## Step 4: Build the list page

Same as Step 3, with:

| Field | Value |
|---|---|
| Title | `Complete List of Hot Ones Hot Sauces` |
| Slug | `hot-ones-hot-sauces-list` |
| Code | entire contents of `2-hot-ones-sauce-list-page.html` |
| SEO title | `Complete List of Hot Ones Hot Sauces by Season \| Adoboloco` |
| Meta description | `Every hot sauce featured on Hot Ones, season by season, with wing order and Scoville ratings. Including Adoboloco's five appearances in Seasons 5, 8, 10, 18 and 21.` |

The list covers Seasons 1 to 29 (source: Sauce Mania, updated March 2026). Seasons 30 and 31 still need adding.

## Step 5: Preview checklist (both pages, desktop and phone)

- [ ] Hero and 5-Pack show the 5-bottle image (5 bottles only)
- [ ] Hamajang shows the "Smoky Ghost" bottle; Jalapeño Chico shows the green/white bottle with the Hot Ones flag
- [ ] Section order: Hero, Story, 5 Seasons, **5-Pack**, **Trio**, Single bottles, Videos, FAQ, Complete list, Closing banner
- [ ] 5-Pack shows $63.99, $70.95 crossed out, Save $6.96, Free shipping
- [ ] Fonts (Helvetica headings, Arial text), red `#D50909`, white background
- [ ] "Explore the Featured Sauces" and "Get the Hot Ones 5-Pack" jump down the page
- [ ] Product links open the right products; FAQ items open and close
- [ ] No sideways scrolling on a phone

## Step 6: Go live (after client approval)

1. Publish the **5-Pack product** first, then both pages.
2. Purge the cache (LiteSpeed Cache > Purge All).
3. Optional, with client approval: add a "See all our Hot Ones sauces" link from the Hot Ones section at the bottom of the homepage to `/hot-ones/`.
4. Video section: the five tiles are placeholders until the client picks the YouTube episodes.
