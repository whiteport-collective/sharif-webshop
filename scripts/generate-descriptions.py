"""
Generate product descriptions for all Shopify tires.
Fetches products, generates descriptions from metafields, updates body_html.

Usage:
  python scripts/generate-descriptions.py
  python scripts/generate-descriptions.py --dry-run
"""

import json, os, sys, time, subprocess, requests

API_VERSION = "2024-10"

# Pattern descriptions — shared base text per tire pattern
PATTERN_DESCRIPTIONS = {
    "ADAMAS H/P": {
        "no": "Powertrac Adamas H/P er et pålitelig hverdagsdekk for personbiler. Designet for komfortabel kjøring på norske veier, med god balanse mellom pris og ytelse. Et populært valg for den som vil ha et solid dekk uten å betale for mye.",
        "en": "The Powertrac Adamas H/P is a reliable everyday tire for passenger cars. Designed for comfortable driving on Norwegian roads, with a good balance between price and performance. A popular choice for those who want a solid tire without overpaying.",
    },
    "CITYMARCH": {
        "no": "Powertrac CityMarch er utviklet for bykjøring og daglig pendling. Stille på veien og økonomisk i drift. Perfekt for den som kjører korte til middels avstander i urbane omgivelser.",
        "en": "The Powertrac CityMarch is developed for city driving and daily commuting. Quiet on the road and economical to run. Perfect for short to medium distances in urban environments.",
    },
    "CITYRACING": {
        "no": "Powertrac CityRacing leverer sporty kjøreegenskaper til en overkommelig pris. Med godt grep og responsiv styring passer dette dekket for den som ønsker litt mer av kjøreopplevelsen.",
        "en": "The Powertrac CityRacing delivers sporty driving characteristics at an affordable price. With good grip and responsive steering, this tire suits those who want a bit more from their driving experience.",
    },
    "CITYROVER": {
        "no": "Powertrac CityRover er et allsidig SUV-dekk som takler både asfalt og lettere terreng. Med robust konstruksjon og komfortabel kjørefølelse er det et trygt valg for SUV-eiere.",
        "en": "The Powertrac CityRover is a versatile SUV tire that handles both asphalt and light terrain. With robust construction and comfortable ride feel, it's a safe choice for SUV owners.",
    },
    "ECOSPORT X77": {
        "no": "Powertrac EcoSport X77 kombinerer lavt drivstofforbruk med godt veigrep. Et miljøbevisst valg som ikke går på kompromiss med sikkerhet. Populært blant bevisste bilister som vil spare på pumpa.",
        "en": "The Powertrac EcoSport X77 combines low fuel consumption with good road grip. An environmentally conscious choice that doesn't compromise on safety. Popular among conscious drivers who want to save at the pump.",
    },
    "VANTOUR": {
        "no": "Powertrac Vantour er et varebil-dekk bygget for last og lang levetid. Forsterket konstruksjon tåler tunge laster dag etter dag. Ideelt for håndverkere og varetransport.",
        "en": "The Powertrac Vantour is a van tire built for load and longevity. Reinforced construction handles heavy loads day after day. Ideal for tradespeople and cargo transport.",
    },
    "POWER LANDER A/T": {
        "no": "Powertrac Power Lander A/T er et terrengdekk som fungerer like godt på vei som i terrenget. Med aggressivt mønster og god selvrensing takler det gjørme, grus og snø.",
        "en": "The Powertrac Power Lander A/T is an all-terrain tire that works equally well on road and off-road. With aggressive tread and good self-cleaning, it handles mud, gravel, and snow.",
    },
    "POWER ROVER M/T": {
        "no": "Powertrac Power Rover M/T er et hardført terrenedekk for de som tar seg ut i krevende terreng. Ekstremt grep på løst underlag og robust nok for de tøffeste forholdene.",
        "en": "The Powertrac Power Rover M/T is a tough mud-terrain tire for those who venture into demanding terrain. Extreme grip on loose surfaces and robust enough for the toughest conditions.",
    },
    "WILDRANGER AT": {
        "no": "Powertrac WildRanger AT er designet for eventyreren som trenger et dekk som takler alt. Fra motorvei til skogsvei — dette dekket leverer trygg og komfortabel kjøring overalt.",
        "en": "The Powertrac WildRanger AT is designed for the adventurer who needs a tire that handles everything. From highway to forest road — this tire delivers safe and comfortable driving everywhere.",
    },
}

DEFAULT_PATTERN = {
    "no": "Powertrac produserer kvalitetsdekk med god ytelse til en konkurransedyktig pris. Alle dekk leveres med EU-merking og oppfyller europeiske sikkerhetskrav.",
    "en": "Powertrac produces quality tires with good performance at a competitive price. All tires come with EU labeling and meet European safety requirements.",
}

def eu_label_text(rr, wg, noise_db, lang="no"):
    """Generate EU label description text."""
    if not rr or rr == "None":
        return ""

    rr_texts = {
        "no": {"A": "svært lavt", "B": "lavt", "C": "middels", "D": "gjennomsnittlig", "E": "høyt"},
        "en": {"A": "very low", "B": "low", "C": "moderate", "D": "average", "E": "high"},
    }
    wg_texts = {
        "no": {"A": "utmerket", "B": "veldig godt", "C": "godt", "D": "tilfredsstillende", "E": "akseptabelt"},
        "en": {"A": "excellent", "B": "very good", "C": "good", "D": "satisfactory", "E": "acceptable"},
    }

    rr_desc = rr_texts.get(lang, rr_texts["en"]).get(str(rr), str(rr))
    wg_desc = wg_texts.get(lang, wg_texts["en"]).get(str(wg), str(wg))

    noise = int(noise_db) if noise_db and str(noise_db).isdigit() else 0
    if lang == "no":
        noise_desc = "lavt" if noise <= 68 else "normalt" if noise <= 72 else "noe høyere"
        return f"EU-merking: Drivstofforbruk klasse {rr} ({rr_desc}), veigrep klasse {wg} ({wg_desc}), støynivå {noise} dB ({noise_desc})."
    else:
        noise_desc = "low" if noise <= 68 else "normal" if noise <= 72 else "slightly higher"
        return f"EU Label: Fuel efficiency class {rr} ({rr_desc}), wet grip class {wg} ({wg_desc}), noise level {noise} dB ({noise_desc})."

def generate_description(product_data):
    """Generate bilingual HTML description for a tire product."""
    title = product_data.get("title", "")
    metafields = {}
    for mf in product_data.get("metafields", {}).get("edges", []):
        node = mf["node"]
        metafields[f"{node['namespace']}.{node['key']}"] = node["value"]

    pattern = metafields.get("tire.pattern", "")
    rr = metafields.get("tire.eu_rolling_resistance", "")
    wg = metafields.get("tire.eu_wet_grip", "")
    noise = metafields.get("tire.eu_noise_db", "")
    dimension = f"{metafields.get('tire.width', '')}/{metafields.get('tire.profile', '')}R{metafields.get('tire.rim', '')}"
    load_speed = metafields.get("tire.load_speed", "")
    season = metafields.get("tire.season", "summer")

    # Get pattern description
    pat_desc = PATTERN_DESCRIPTIONS.get(pattern, DEFAULT_PATTERN)

    # EU label text
    eu_no = eu_label_text(rr, wg, noise, "no")
    eu_en = eu_label_text(rr, wg, noise, "en")

    season_no = "sommer" if season == "summer" else "vinter" if season == "winter" else "helårs"
    season_en = season

    html = f"""<div class="product-description">
<h3>Powertrac {pattern} {dimension}</h3>
<p>{pat_desc['no']}</p>
<p>Dimensjon {dimension} med last/hastighetsindeks {load_speed}. Et {season_no}dekk som passer personbiler med denne felgstørrelsen.</p>
<p>{eu_no}</p>
<p>Montering inkludert ved bestilling hos Sharif. Alle dekk leveres med garanti og full sporbarhet via EAN-kode.</p>
<hr>
<details><summary>English description</summary>
<h3>Powertrac {pattern} {dimension}</h3>
<p>{pat_desc['en']}</p>
<p>Dimension {dimension} with load/speed index {load_speed}. A {season_en} tire that fits passenger cars with this rim size.</p>
<p>{eu_en}</p>
<p>Mounting included when ordering from Sharif. All tires come with warranty and full traceability via EAN code.</p>
</details>
</div>"""

    return html

def get_shopify_creds():
    token = os.environ.get("SHOPIFY_TOKEN")
    if token:
        return {"store": "sharif-no.myshopify.com", "token": token}
    bw_session = os.environ.get("BW_SESSION")
    if not bw_session:
        print("ERROR: Set SHOPIFY_TOKEN or BW_SESSION")
        sys.exit(1)
    token = subprocess.check_output(
        ["bw", "get", "password", "Shopify - Sharif-NO Dev Store", "--session", bw_session],
        text=True, shell=True
    ).strip()
    return {"store": "sharif-no.myshopify.com", "token": token}

def fetch_products_graphql(creds, cursor=None):
    """Fetch products with metafields via GraphQL."""
    after = f', after: "{cursor}"' if cursor else ""
    query = f"""{{
      products(first: 50{after}) {{
        edges {{
          cursor
          node {{
            id
            title
            bodyHtml
            metafields(first: 15) {{
              edges {{
                node {{
                  namespace
                  key
                  value
                }}
              }}
            }}
          }}
        }}
        pageInfo {{ hasNextPage }}
      }}
    }}"""

    resp = requests.post(
        f"https://{creds['store']}/admin/api/{API_VERSION}/graphql.json",
        json={"query": query},
        headers={
            "X-Shopify-Access-Token": creds["token"],
            "Content-Type": "application/json",
        }
    )
    return resp.json()

def update_product_html(creds, product_id, html):
    """Update product body_html via GraphQL."""
    # Extract numeric ID from GID
    numeric_id = product_id.split("/")[-1]
    resp = requests.put(
        f"https://{creds['store']}/admin/api/{API_VERSION}/products/{numeric_id}.json",
        json={"product": {"id": int(numeric_id), "body_html": html}},
        headers={
            "X-Shopify-Access-Token": creds["token"],
            "Content-Type": "application/json",
        }
    )
    return resp.status_code == 200

def main():
    dry_run = "--dry-run" in sys.argv
    creds = None if dry_run else get_shopify_creds()

    if not dry_run:
        print(f"Store: {creds['store']}")

    print("Fetching products...")
    all_products = []
    cursor = None
    while True:
        data = fetch_products_graphql(creds or get_shopify_creds(), cursor)
        products_data = data.get("data", {}).get("products", {})
        edges = products_data.get("edges", [])
        all_products.extend(edges)
        if not products_data.get("pageInfo", {}).get("hasNextPage"):
            break
        cursor = edges[-1]["cursor"]
        print(f"  Fetched {len(all_products)} so far...")

    print(f"Total products: {len(all_products)}")

    updated = 0
    skipped = 0
    for i, edge in enumerate(all_products):
        product = edge["node"]

        # Skip if already has description
        if product.get("bodyHtml") and len(product["bodyHtml"]) > 100:
            skipped += 1
            continue

        html = generate_description(product)

        if dry_run:
            if updated < 3:
                print(f"\n--- {product['title']} ---")
                print(html[:300] + "...")
            updated += 1
        else:
            ok = update_product_html(creds, product["id"], html)
            if ok:
                updated += 1
            else:
                print(f"  FAILED: {product['title']}")
            time.sleep(0.5)

        if (i + 1) % 50 == 0:
            print(f"  Progress: {i+1}/{len(all_products)} ({updated} updated, {skipped} skipped)")

    print(f"\nDone! {updated} updated, {skipped} skipped (already had descriptions).")

if __name__ == "__main__":
    main()
