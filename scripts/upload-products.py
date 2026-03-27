"""
Upload Powertrac tire products to Shopify from Excel price list.
Reads credentials from Bitwarden.

Usage:
  python scripts/upload-products.py
  python scripts/upload-products.py --dry-run
"""

import json
import sys
import os
import re
import time
import subprocess
import openpyxl
import requests

EXCEL_PATH = "design-process/A-Product-Brief/reference-data/Powertrac-Summer-Tyre-Price-List.xlsx"
SHEET_NAME = "Summer"
API_VERSION = "2024-10"
MARKUP = 3.5  # Rough markup from FOB USD to retail NOK (includes shipping, margin, VAT)

def get_shopify_creds():
    """Fetch Shopify credentials from env var or Bitwarden."""
    # Direct env var (for scripts/background tasks)
    token = os.environ.get("SHOPIFY_TOKEN")
    if token:
        return {"store": "sharif-no.myshopify.com", "token": token}

    # Bitwarden fallback
    bw_session = os.environ.get("BW_SESSION")
    if not bw_session:
        print("ERROR: Set SHOPIFY_TOKEN or BW_SESSION environment variable")
        sys.exit(1)

    token = subprocess.check_output(
        ["bw", "get", "password", "Shopify - Sharif-NO Dev Store", "--session", bw_session],
        text=True, shell=True
    ).strip()

    return {"store": "sharif-no.myshopify.com", "token": token}

def parse_dimension(size_str):
    """Parse tire dimension string into components. Handles R, ZR, C variants."""
    size_str = str(size_str).strip()

    # Standard format: 205/55R16, 205/55ZR16, 205/55R16C
    match = re.match(r"(\d+)/(\d+)\s*(ZR|R|C)(\d+)\s*(LT|C)?", size_str, re.IGNORECASE)
    if match:
        letter = match.group(3).upper()
        suffix = match.group(5) or ""
        return {
            "width": int(match.group(1)),
            "profile": int(match.group(2)),
            "rim": int(match.group(4)),
            "letter": letter,
            "suffix": suffix,
            "full": f"{match.group(1)}/{match.group(2)}{letter}{match.group(4)}{suffix}"
        }

    # Commercial format: 155R12C, 195R14C
    match = re.match(r"(\d+)\s*(R|ZR|C)(\d+)\s*(C|LT)?", size_str, re.IGNORECASE)
    if match:
        letter = match.group(2).upper()
        suffix = match.group(4) or ""
        return {
            "width": int(match.group(1)),
            "profile": 0,
            "rim": int(match.group(3)),
            "letter": letter,
            "suffix": suffix + "C" if "C" in size_str.upper() and suffix != "C" else suffix,
            "full": size_str.strip()
        }

    # P or LT prefix format: P205/75R15, LT215/85R16
    match = re.match(r"[PpLlTt]{1,2}\s*(\d+)/(\d+)\s*(R|ZR)(\d+)\s*(\(POR\))?", size_str, re.IGNORECASE)
    if match:
        letter = match.group(3).upper()
        prefix = size_str[0:2].strip().upper()
        if prefix.startswith("P"):
            prefix = "P"
        return {
            "width": int(match.group(1)),
            "profile": int(match.group(2)),
            "rim": int(match.group(4)),
            "letter": letter,
            "suffix": prefix,
            "full": size_str.strip().replace("(POR)", "").strip()
        }

    # LT-prefix format: LT215/85R16, LT235/75R15
    match = re.match(r"LT\s*(\d+)/(\d+)\s*(R|ZR)(\d+)\s*(\(POR\))?", size_str, re.IGNORECASE)
    if match:
        letter = match.group(3).upper()
        return {
            "width": int(match.group(1)),
            "profile": int(match.group(2)),
            "rim": int(match.group(4)),
            "letter": letter,
            "suffix": "LT",
            "full": size_str.strip().replace("(POR)", "").strip()
        }

    # Off-road format: 31x10.50R15LT, 33x12.50R17LT
    match = re.match(r"(\d+)[x\xd7](\d+\.?\d*)\s*(R|ZR)(\d+)\s*(LT)?", size_str, re.IGNORECASE)
    if match:
        return {
            "width": int(float(match.group(2)) * 25.4),  # Convert inches to mm approx
            "profile": 0,
            "rim": int(match.group(4)),
            "letter": match.group(3).upper(),
            "suffix": "LT",
            "full": size_str.strip().replace("×", "x")
        }

    return None

def parse_excel():
    """Parse the Powertrac Excel file into product dicts."""
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb[SHEET_NAME]
    products = []

    for row in ws.iter_rows(min_row=4, values_only=True):
        item_no = row[0]
        size = row[1]
        load_speed = row[2]
        pattern = row[3]
        rr = row[4]  # Rolling Resistance
        wg = row[5]  # Wet Grip
        noise_db = row[6]  # Noise dB
        noise_class = row[7]  # Noise class
        tire_class = row[8]  # C1, C2, etc.
        ean = row[9]
        three_pmsf = row[10]
        ms = row[11]
        container_load = row[12]
        fob_price = row[13]

        if not item_no or not size:
            continue

        dim = parse_dimension(str(size))
        if not dim:
            print(f"  SKIP: Can't parse dimension '{size}' for {item_no}")
            continue

        # Calculate retail price (rough estimate)
        retail_nok = round(float(fob_price) * MARKUP * 10.5, -1) if fob_price else 499  # 10.5 NOK/USD approx

        products.append({
            "item_number": str(item_no),
            "size": str(size).strip(),
            "dimension": dim,
            "load_speed": str(load_speed) if load_speed else "",
            "pattern": str(pattern) if pattern else "POWERTRAC",
            "eu_rr": str(rr) if rr else "",
            "eu_wg": str(wg) if wg else "",
            "eu_noise_db": int(noise_db) if noise_db else 0,
            "eu_noise_class": str(noise_class) if noise_class else "",
            "tire_class": str(tire_class) if tire_class else "C1",
            "ean": str(int(ean)) if ean else "",
            "season": "summer",
            "retail_nok": retail_nok,
        })

    return products

def create_product(creds, product, dry_run=False):
    """Create a single product in Shopify with metafields."""
    dim = product["dimension"]
    title = f"Powertrac {product['pattern']} {dim['full']}"

    payload = {
        "product": {
            "title": title,
            "vendor": "Powertrac",
            "product_type": "Tire",
            "tags": [
                f"width-{dim['width']}",
                f"profile-{dim['profile']}",
                f"rim-{dim['rim']}",
                f"dimension-{dim['full']}",
                f"pattern-{product['pattern']}",
                f"season-{product['season']}",
                product["tire_class"],
            ],
            "variants": [{
                "price": str(product["retail_nok"]),
                "sku": product["item_number"],
                "barcode": product["ean"],
                "inventory_management": "shopify",
                "inventory_quantity": 10,
                "requires_shipping": True,
                "weight": 8.0,
                "weight_unit": "kg",
            }],
            "metafields": [
                {"namespace": "tire", "key": "width", "value": str(dim["width"]), "type": "number_integer"},
                {"namespace": "tire", "key": "profile", "value": str(dim["profile"]), "type": "number_integer"},
                {"namespace": "tire", "key": "rim", "value": str(dim["rim"]), "type": "number_integer"},
                {"namespace": "tire", "key": "load_speed", "value": product["load_speed"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "pattern", "value": product["pattern"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "eu_rolling_resistance", "value": product["eu_rr"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "eu_wet_grip", "value": product["eu_wg"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "eu_noise_db", "value": str(product["eu_noise_db"]), "type": "number_integer"},
                {"namespace": "tire", "key": "eu_noise_class", "value": product["eu_noise_class"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "ean", "value": product["ean"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "season", "value": product["season"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "vehicle_class", "value": product["tire_class"], "type": "single_line_text_field"},
                {"namespace": "tire", "key": "item_number", "value": product["item_number"], "type": "single_line_text_field"},
            ],
        }
    }

    # Remove metafields with empty values
    payload["product"]["metafields"] = [
        m for m in payload["product"]["metafields"]
        if m["value"] and m["value"] != "0" and m["value"] != ""
    ]

    if dry_run:
        print(f"  DRY RUN: {title} - {product['retail_nok']} NOK - SKU: {product['item_number']}")
        return True

    url = f"https://{creds['store']}/admin/api/{API_VERSION}/products.json"
    headers = {
        "X-Shopify-Access-Token": creds["token"],
        "Content-Type": "application/json",
    }

    resp = requests.post(url, json=payload, headers=headers)

    if resp.status_code == 201:
        return True
    elif resp.status_code == 429:
        # Rate limited — wait and retry
        retry_after = float(resp.headers.get("Retry-After", 2))
        print(f"  Rate limited. Waiting {retry_after}s...")
        time.sleep(retry_after)
        resp = requests.post(url, json=payload, headers=headers)
        return resp.status_code == 201
    else:
        print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
        return False

def main():
    dry_run = "--dry-run" in sys.argv

    print("Parsing Powertrac Excel...")
    products = parse_excel()
    print(f"Found {len(products)} products")

    if not dry_run:
        print("Loading Shopify credentials from Bitwarden...")
        creds = get_shopify_creds()
        print(f"Store: {creds['store']}")
    else:
        creds = None
        print("DRY RUN — no Shopify connection")

    print()
    print(f"Uploading {len(products)} products...")

    success = 0
    failed = 0
    for i, product in enumerate(products):
        ok = create_product(creds, product, dry_run=dry_run)
        if ok:
            success += 1
        else:
            failed += 1

        # Progress every 50
        if (i + 1) % 50 == 0:
            print(f"  Progress: {i+1}/{len(products)} ({success} ok, {failed} failed)")

        # Rate limit: ~2 requests per second for REST API
        if not dry_run:
            time.sleep(0.5)

    print()
    print(f"Done! {success} uploaded, {failed} failed out of {len(products)} total.")

if __name__ == "__main__":
    main()
