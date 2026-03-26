import json, random, os

BASE = "c:/dev/Sharif/sharif-webshop/design-process/C-UX-Scenarios/01-harriets-tire-purchase"

def make_id():
    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', k=10))

def rect(x, y, w, h, stroke="#1e1e1e", bg="transparent", fill="solid", sw=2, r=0):
    return {
        "type": "rectangle",
        "version": 1,
        "versionNonce": random.randint(1, 999999999),
        "isDeleted": False,
        "id": make_id(),
        "fillStyle": fill,
        "strokeWidth": sw,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": x, "y": y,
        "strokeColor": stroke,
        "backgroundColor": bg,
        "width": w, "height": h,
        "seed": random.randint(1, 999999999),
        "groupIds": [],
        "frameId": None,
        "roundness": {"type": 3, "value": r} if r else None,
        "boundElements": [],
        "updated": 1,
        "link": None,
        "locked": False
    }

def text(x, y, t, size=16, color="#1e1e1e", align="left", family=3):
    lines = t.split('\n')
    h = len(lines) * int(size * 1.25)
    w = max(len(l) for l in lines) * size * 0.6
    return {
        "type": "text",
        "version": 1,
        "versionNonce": random.randint(1, 999999999),
        "isDeleted": False,
        "id": make_id(),
        "fillStyle": "solid",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 0,
        "opacity": 100,
        "angle": 0,
        "x": x, "y": y,
        "strokeColor": color,
        "backgroundColor": "transparent",
        "width": w, "height": h,
        "seed": random.randint(1, 999999999),
        "groupIds": [],
        "frameId": None,
        "roundness": None,
        "boundElements": [],
        "updated": 1,
        "link": None,
        "locked": False,
        "fontSize": size,
        "fontFamily": family,
        "text": t,
        "textAlign": align,
        "verticalAlign": "top",
        "containerId": None,
        "originalText": t,
        "lineHeight": 1.25,
        "baseline": size
    }

def save(name, elements):
    data = {
        "type": "excalidraw",
        "version": 2,
        "source": "wds-freya",
        "elements": elements,
        "appState": {"viewBackgroundColor": "#ffffff", "gridSize": None},
        "files": {}
    }
    path = os.path.join(BASE, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  Saved: {name}")

# === 01.1 DIMENSION INPUT ===
save("01.1-dimension-input/Sketches/01.1-dimension-input.excalidraw", [
    rect(0, 0, 390, 844, "#1e1e1e", "transparent", "solid", 2, 32),
    rect(20, 20, 100, 30, "#e03131", "#e03131", "solid", 0, 4),
    text(35, 24, "SHARIF", 16, "#ffffff"),
    text(30, 80, "Hva er st\u00f8rrelsen\np\u00e5 dekkene dine?", 26, "#1e1e1e"),
    text(30, 160, "Se p\u00e5 siden av dekket", 13, "#adb5bd"),
    rect(30, 200, 330, 150, "#dee2e6", "#f1f3f5", "solid", 1, 12),
    text(120, 260, "[ Dekkillustrasjon ]", 14, "#adb5bd"),
    text(30, 380, "Skriv eller lim inn:", 12, "#868e96"),
    rect(30, 405, 330, 50, "#ced4da", "#ffffff", "solid", 2, 8),
    text(45, 418, "205/55R16", 18, "#ced4da"),
    text(30, 475, "Eller velg:", 12, "#868e96"),
    rect(30, 500, 100, 44, "#ced4da", "#ffffff", "solid", 1, 8),
    text(42, 506, "Bredde\n205", 12, "#495057"),
    rect(145, 500, 100, 44, "#ced4da", "#ffffff", "solid", 1, 8),
    text(157, 506, "Profil\n55", 12, "#495057"),
    rect(260, 500, 100, 44, "#ced4da", "#ffffff", "solid", 1, 8),
    text(275, 506, "Felg\n16\"", 12, "#495057"),
    text(100, 575, "Hvor finner jeg dette?", 14, "#e03131"),
    rect(30, 630, 330, 56, "#e03131", "#e03131", "solid", 0, 12),
    text(130, 645, "Finn dekk", 20, "#ffffff"),
    text(55, 720, "60+ \u00e5r \u00b7 Montering inkl. \u00b7 Fra 499 kr", 11, "#adb5bd"),
])

# === 01.2 PRODUCT CARDS ===
save("01.2-product-cards/Sketches/01.2-product-cards.excalidraw", [
    rect(0, 0, 390, 844, "#1e1e1e", "transparent", "solid", 2, 32),
    rect(20, 16, 100, 24, "#e03131", "#e03131", "solid", 0, 4),
    text(35, 18, "SHARIF", 14, "#ffffff"),
    rect(20, 56, 350, 36, "#dee2e6", "#f8f9fa", "solid", 1, 8),
    text(34, 64, "185/65R15 \u00b7 Sommerdekk", 13, "#495057"),
    text(310, 64, "Endre", 12, "#e03131"),
    text(20, 110, "Sommerdekk til din bil", 22, "#1e1e1e"),
    text(20, 142, "12 dekk passer", 13, "#adb5bd"),
    rect(290, 136, 80, 30, "#dee2e6", "#f8f9fa", "solid", 1, 16),
    text(310, 142, "Filter", 13, "#495057"),
    rect(20, 185, 280, 450, "#dee2e6", "#ffffff", "solid", 2, 16),
    rect(50, 205, 220, 150, "#e9ecef", "#f1f3f5", "solid", 1, 8),
    text(110, 265, "[ Dekkbilde ]", 14, "#adb5bd"),
    text(40, 375, "POWERTRAC ADAMAS H/P", 15, "#1e1e1e"),
    text(40, 398, "185/65R15 88H", 12, "#868e96"),
    rect(40, 430, 100, 8, "transparent", "#51cf66", "solid", 0, 4),
    text(150, 425, "Fuel", 10, "#adb5bd"),
    rect(40, 448, 140, 8, "transparent", "#fcc419", "solid", 0, 4),
    text(190, 443, "Grip", 10, "#adb5bd"),
    rect(40, 466, 80, 8, "transparent", "#74c0fc", "solid", 0, 4),
    text(130, 461, "68 dB", 10, "#adb5bd"),
    text(40, 500, "499 kr/stk", 26, "#1e1e1e"),
    rect(40, 550, 80, 24, "#51cf66", "#ebfbee", "solid", 1, 12),
    text(50, 554, "P\u00e5 lager", 12, "#2b8a3e"),
    rect(320, 250, 60, 320, "#dee2e6", "#f8f9fa", "solid", 1, 12),
    text(328, 390, "Neste", 10, "#ced4da"),
    text(170, 650, "\u00b7 \u00b7 \u00b7 \u00b7", 20, "#ced4da"),
    text(90, 680, "\u2190 Sveip for flere \u2192", 13, "#adb5bd"),
])

# === 01.3 PRODUCT DETAIL OVERLAY ===
save("01.3-product-detail/Sketches/01.3-product-detail.excalidraw", [
    rect(0, 0, 390, 844, "#1e1e1e", "#00000033", "solid", 2, 32),
    rect(0, 130, 390, 714, "#dee2e6", "#ffffff", "solid", 2, 24),
    rect(170, 140, 50, 5, "transparent", "#ced4da", "solid", 0, 3),
    text(350, 150, "\u2715", 20, "#868e96"),
    rect(95, 175, 200, 140, "#e9ecef", "#f1f3f5", "solid", 1, 8),
    text(145, 230, "[ Dekkbilde ]", 14, "#adb5bd"),
    text(25, 335, "Powertrac Adamas H/P", 18, "#1e1e1e"),
    text(25, 365, "185/65R15 88H", 13, "#868e96"),
    text(280, 335, "499 kr", 22, "#1e1e1e"),
    text(295, 365, "per stk", 11, "#868e96"),
    rect(25, 395, 80, 24, "#51cf66", "#ebfbee", "solid", 1, 12),
    text(37, 399, "P\u00e5 lager", 12, "#2b8a3e"),
    rect(25, 435, 340, 70, "#e9ecef", "#f8f9fa", "solid", 1, 12),
    text(35, 445, "Et solid hverdagsdekk som ikke\ntapper lommeboken. Bra grep\ni regnet, normalt st\u00f8yniv\u00e5.", 12, "#495057"),
    text(25, 525, "EU-merking", 14, "#1e1e1e"),
    text(25, 555, "Drivstoff", 11, "#868e96"),
    rect(110, 558, 200, 10, "transparent", "#e9ecef", "solid", 0, 5),
    rect(110, 558, 100, 10, "transparent", "#fcc419", "solid", 0, 5),
    text(320, 553, "D", 11, "#868e96"),
    text(25, 580, "Veigrep", 11, "#868e96"),
    rect(110, 583, 200, 10, "transparent", "#e9ecef", "solid", 0, 5),
    rect(110, 583, 140, 10, "transparent", "#51cf66", "solid", 0, 5),
    text(320, 578, "C", 11, "#868e96"),
    text(25, 605, "St\u00f8y", 11, "#868e96"),
    rect(110, 608, 200, 10, "transparent", "#e9ecef", "solid", 0, 5),
    rect(110, 608, 80, 10, "transparent", "#74c0fc", "solid", 0, 5),
    text(320, 603, "70dB", 11, "#868e96"),
    rect(20, 760, 350, 56, "#e03131", "#e03131", "solid", 0, 12),
    text(115, 775, "Jeg tar disse", 20, "#ffffff"),
])

# === 01.4 QUANTITY & SHOP ===
save("01.4-quantity-and-shop/Sketches/01.4-quantity-and-shop.excalidraw", [
    rect(0, 0, 390, 844, "#1e1e1e", "transparent", "solid", 2, 32),
    rect(20, 20, 350, 65, "#dee2e6", "#f8f9fa", "solid", 1, 12),
    rect(30, 28, 48, 48, "#e9ecef", "#f1f3f5", "solid", 1, 6),
    text(88, 32, "Powertrac Adamas H/P", 14, "#1e1e1e"),
    text(88, 52, "185/65R15 \u00b7 499 kr/stk", 11, "#868e96"),
    text(20, 115, "Hvor mange?", 22, "#1e1e1e"),
    rect(20, 155, 170, 56, "#dee2e6", "#f8f9fa", "solid", 1, 12),
    text(75, 172, "2 dekk", 17, "#495057"),
    rect(200, 155, 170, 56, "#e03131", "#fff5f5", "solid", 2, 12),
    text(250, 172, "4 dekk", 17, "#e03131"),
    text(20, 245, "Hvor vil du montere?", 22, "#1e1e1e"),
    rect(20, 290, 350, 95, "#e03131", "#fff5f5", "solid", 2, 12),
    text(40, 305, "Fjellhamar", 17, "#1e1e1e"),
    text(40, 330, "Kloppaveien 16, 1472 Fjellhamar", 11, "#868e96"),
    text(40, 352, "Mange ledige tider denne uken", 11, "#51cf66"),
    rect(20, 400, 350, 95, "#dee2e6", "#f8f9fa", "solid", 1, 12),
    text(40, 415, "Drammen", 17, "#1e1e1e"),
    text(40, 440, "Tordenskiolds gate 73, Drammen", 11, "#868e96"),
    text(40, 462, "Ledige tider", 11, "#51cf66"),
    rect(20, 540, 350, 80, "#e9ecef", "#f8f9fa", "solid", 1, 12),
    text(40, 555, "Din bestilling", 12, "#868e96"),
    text(40, 578, "4x Powertrac Adamas H/P", 13, "#1e1e1e"),
    text(265, 555, "1 996 kr", 20, "#1e1e1e"),
    text(40, 600, "Montering inkl. \u00b7 Fjellhamar", 11, "#868e96"),
    rect(20, 660, 350, 56, "#e03131", "#e03131", "solid", 0, 12),
    text(80, 675, "Betal n\u00e5 \u2014 1 996 kr", 20, "#ffffff"),
])

# === 01.5 PAYMENT (external — wireframe shows redirect) ===
save("01.5-payment/Sketches/01.5-payment.excalidraw", [
    rect(0, 0, 390, 844, "#1e1e1e", "transparent", "solid", 2, 32),
    text(120, 50, "Betaling", 24, "#1e1e1e"),
    rect(20, 100, 350, 70, "#dee2e6", "#f8f9fa", "solid", 1, 12),
    text(40, 112, "4x Powertrac Adamas H/P", 13, "#1e1e1e"),
    text(40, 135, "Montering: Fjellhamar", 11, "#868e96"),
    text(280, 115, "1 996 kr", 18, "#1e1e1e"),
    rect(20, 200, 350, 420, "#dee2e6", "#f8f9fa", "solid", 1, 16),
    rect(120, 225, 150, 36, "#ffa8c5", "#ffa8c5", "solid", 0, 8),
    text(148, 232, "Klarna.", 18, "#1e1e1e"),
    text(60, 310, "[ Klarna/Qliro checkout\n  h\u00e5ndterer betaling,\n  adresse, privat/bedrift ]\n\n  Denne visningen styres\n  av betalingsleverand\u00f8ren\n  \u2014 ikke custom design.", 13, "#adb5bd"),
    text(90, 560, "Vipps \u00b7 Kort \u00b7 Faktura", 12, "#868e96"),
])

# === 01.6 BOOK MOUNTING ===
save("01.6-book-mounting/Sketches/01.6-book-mounting.excalidraw", [
    rect(0, 0, 390, 844, "#1e1e1e", "transparent", "solid", 2, 32),
    rect(20, 16, 100, 24, "#e03131", "#e03131", "solid", 0, 4),
    text(35, 18, "SHARIF", 14, "#ffffff"),
    text(55, 65, "Takk for\nbestillingen!", 30, "#1e1e1e"),
    rect(20, 160, 350, 65, "#dee2e6", "#f8f9fa", "solid", 1, 12),
    text(40, 172, "4x Powertrac Adamas H/P", 13, "#1e1e1e"),
    text(40, 195, "1 996 kr \u00b7 Fjellhamar", 11, "#868e96"),
    text(330, 175, "\u2713", 24, "#51cf66"),
    text(100, 260, "Finn din tid!", 24, "#1e1e1e"),
    text(140, 305, "April 2026", 15, "#1e1e1e"),
    text(20, 335, "Man  Tir  Ons  Tor  Fre  L\u00f8r", 11, "#868e96"),
    rect(20, 360, 350, 44, "#e9ecef", "#f8f9fa", "solid", 1, 8),
    text(28, 372, "  7     8     9    10    11    12", 13, "#495057"),
    rect(295, 362, 40, 40, "#e03131", "#fff5f5", "solid", 2, 8),
    rect(20, 414, 350, 44, "#e9ecef", "#f8f9fa", "solid", 1, 8),
    text(24, 426, " 14   15    16    17    18    19", 13, "#495057"),
    text(20, 485, "Ledige tider l\u00f8rdag 12. april:", 14, "#1e1e1e"),
    rect(20, 515, 110, 44, "#e03131", "#fff5f5", "solid", 2, 8),
    text(45, 528, "10:00", 16, "#e03131"),
    rect(140, 515, 110, 44, "#dee2e6", "#f8f9fa", "solid", 1, 8),
    text(168, 528, "11:00", 16, "#495057"),
    rect(260, 515, 110, 44, "#dee2e6", "#f8f9fa", "solid", 1, 8),
    text(288, 528, "12:00", 16, "#495057"),
    rect(20, 600, 350, 56, "#e03131", "#e03131", "solid", 0, 12),
    text(120, 616, "Bekreft tid", 20, "#ffffff"),
    text(120, 680, "Velg tid senere", 13, "#868e96"),
    text(160, 760, "Vi ses!", 16, "#868e96"),
])

print("\nAll 6 wireframes regenerated!")
