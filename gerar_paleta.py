from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
import math

OUTPUT = "paleta-cores-zima-cuidados.pdf"
W, H = A4  # 595 x 842 pt

# ── Paletas principais e mais usadas ──────────────────────────────────────────
PALETTES = [
    {
        "group": "Zima Blue — Accent Primário",
        "desc": "Cor central do design system SaaS. Usada em CTAs, links ativos, sidebar e foco.",
        "colors": [
            ("Blue Core",    "#3B82F6", "rgba(59,130,246,1.00)"),
            ("Blue Light",   "#60A5FA", "rgba(96,165,250,1.00)"),
            ("Blue Pale",    "#93C5FD", "rgba(147,197,253,1.00)"),
            ("Blue Intense", "#2563EB", "rgba(37,99,235,1.00)"),
            ("Blue 950",     "#172554", "rgba(23,37,84,1.00)"),
            ("Blue 900",     "#1E3A8A", "rgba(30,58,138,1.00)"),
            ("Blue 700",     "#1D4ED8", "rgba(29,78,216,1.00)"),
            ("Blue 100",     "#DBEAFE", "rgba(219,234,254,1.00)"),
            ("Blue 50",      "#EFF6FF", "rgba(239,246,255,1.00)"),
            ("Blue Glow",    None,      "rgba(59,130,246,0.15)"),
            ("Blue Subtle",  None,      "rgba(59,130,246,0.08)"),
        ],
    },
    {
        "group": "Zima — Backgrounds (Dark Layers)",
        "desc": "Sistema de profundidade dark-first. Cada camada eleva visualmente o elemento.",
        "colors": [
            ("BG Base",           "#07090E", "rgba(7,9,14,1.00)"),
            ("Surface 1",         "#0C1017", "rgba(12,16,23,1.00)"),
            ("Surface 2",         "#111520", "rgba(17,21,32,1.00)"),
            ("Surface 3",         "#161B28", "rgba(22,27,40,1.00)"),
            ("Surface Hover",     "#1A2030", "rgba(26,32,48,1.00)"),
            ("Surface Active",    "#1E2538", "rgba(30,37,56,1.00)"),
            ("Skeleton Base",     "#1A2030", "rgba(26,32,48,1.00)"),
            ("Skeleton Shine",    "#252D3D", "rgba(37,45,61,1.00)"),
        ],
    },
    {
        "group": "Zima — Hierarquia de Texto",
        "desc": "Tokens de tipografia. Cada nível comunica relevância da informação.",
        "colors": [
            ("Text Primary",   "#F1F5F9", "rgba(241,245,249,1.00)"),
            ("Text Secondary", "#94A3B8", "rgba(148,163,184,1.00)"),
            ("Text Muted",     "#64748B", "rgba(100,116,139,1.00)"),
            ("Text Disabled",  "#475569", "rgba(71,85,105,1.00)"),
            ("Text Inverse",   "#07090E", "rgba(7,9,14,1.00)"),
        ],
    },
    {
        "group": "Zima — Semânticas (Status)",
        "desc": "Usadas em badges, alertas e indicadores de estado em toda a plataforma.",
        "colors": [
            ("Success",         "#10B981", "rgba(16,185,129,1.00)"),
            ("Success Subtle",  None,      "rgba(16,185,129,0.10)"),
            ("Warning",         "#F59E0B", "rgba(245,158,11,1.00)"),
            ("Warning Subtle",  None,      "rgba(245,158,11,0.10)"),
            ("Danger",          "#EF4444", "rgba(239,68,68,1.00)"),
            ("Danger Subtle",   None,      "rgba(239,68,68,0.10)"),
            ("Info",            "#6366F1", "rgba(99,102,241,1.00)"),
            ("Info Subtle",     None,      "rgba(99,102,241,0.10)"),
        ],
    },
    {
        "group": "Cuidados — Primária (Teal)",
        "desc": "Identidade da marca Cuidados. Usada na landing page e componentes da marca.",
        "colors": [
            ("Primary 500",  "#14B8A6", "rgba(20,184,166,1.00)"),
            ("Primary 600",  "#0D9488", "rgba(13,148,136,1.00)"),
            ("Primary 700",  "#0F766E", "rgba(15,118,110,1.00)"),
            ("Primary 100",  "#CCFBEF", "rgba(204,251,239,1.00)"),
            ("Primary 50",   "#F0FDF9", "rgba(240,253,249,1.00)"),
        ],
    },
    {
        "group": "Cuidados — Neutras",
        "desc": "Escala de cinzas usada em fundos, bordas, textos e separadores.",
        "colors": [
            ("Neutral 900", "#111827", "rgba(17,24,39,1.00)"),
            ("Neutral 700", "#374151", "rgba(55,65,81,1.00)"),
            ("Neutral 500", "#6B7280", "rgba(107,114,128,1.00)"),
            ("Neutral 300", "#D1D5DB", "rgba(209,213,219,1.00)"),
            ("Neutral 100", "#F3F4F6", "rgba(243,244,246,1.00)"),
            ("Neutral 50",  "#F9FAFB", "rgba(249,250,251,1.00)"),
        ],
    },
    {
        "group": "Zima — Bordas e Divisores",
        "desc": "Baseadas em rgba para transparência sobre qualquer superfície.",
        "colors": [
            ("Border Default",  None, "rgba(148,163,184,0.08)"),
            ("Border Hover",    None, "rgba(148,163,184,0.15)"),
            ("Border Active",   None, "rgba(59,130,246,0.30)"),
            ("Border Divider",  None, "rgba(148,163,184,0.06)"),
            ("Border Modal",    None, "rgba(148,163,184,0.10)"),
        ],
    },
    {
        "group": "Landing — Themes Accent",
        "desc": "Variantes de acento usadas nos temas da landing page (Eclipse, Cobalt, Carbon, Light).",
        "colors": [
            ("Eclipse Accent",  "#3B82F6", "rgba(59,130,246,1.00)"),
            ("Cobalt Accent",   "#6366F1", "rgba(99,102,241,1.00)"),
            ("Carbon Accent",   "#22D3EE", "rgba(34,211,238,1.00)"),
            ("Light Accent",    "#2563EB", "rgba(37,99,235,1.00)"),
            ("Light BG",        "#F8F9FC", "rgba(248,249,252,1.00)"),
        ],
    },
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgba_str_to_color(rgba_str):
    inner = rgba_str.replace("rgba(", "").replace(")", "")
    parts = [p.strip() for p in inner.split(",")]
    r, g, b = int(parts[0]), int(parts[1]), int(parts[2])
    a = float(parts[3])
    return Color(r/255, g/255, b/255, alpha=a)

def get_color(hex_val, rgba_val):
    if hex_val:
        r, g, b = hex_to_rgb(hex_val)
        return HexColor(hex_val), (r + g + b) / 3
    c = rgba_str_to_color(rgba_val)
    lum = (c.red + c.green + c.blue) / 3
    return c, lum

def is_light(lum, alpha=1.0):
    return lum * alpha > 0.55

# ── Desenho ───────────────────────────────────────────────────────────────────
DARK_BG    = HexColor("#07090E")
PANEL_BG   = HexColor("#0C1017")
CARD_BG    = HexColor("#111520")
BLUE       = HexColor("#3B82F6")
TEXT_PRI   = HexColor("#F1F5F9")
TEXT_SEC   = HexColor("#94A3B8")
TEXT_MUT   = HexColor("#64748B")
BORDER     = Color(148/255, 163/255, 184/255, alpha=0.08)
DIVIDER    = Color(148/255, 163/255, 184/255, alpha=0.10)

SWATCH_W   = 44 * mm
SWATCH_H   = 28 * mm
COLS       = 4
GAP        = 4 * mm
MARGIN_L   = 18 * mm
MARGIN_R   = 18 * mm
MARGIN_T   = 16 * mm
MARGIN_BOT = 14 * mm
CONTENT_W  = W - MARGIN_L - MARGIN_R
GROUP_TITLE_H = 9 * mm
GROUP_DESC_H  = 6 * mm
GROUP_PAD_B   = 6 * mm

def draw_page_bg(c, page_num, total_pages):
    c.setFillColor(DARK_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

def draw_header(c):
    # Top bar
    c.setFillColor(PANEL_BG)
    c.rect(0, H - 18*mm, W, 18*mm, fill=1, stroke=0)

    c.setFillColor(BLUE)
    c.rect(0, H - 18*mm, 2*mm, 18*mm, fill=1, stroke=0)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(TEXT_PRI)
    c.drawString(MARGIN_L, H - 10*mm, "Paleta de Cores — Zima & Cuidados")

    c.setFont("Helvetica", 8)
    c.setFillColor(TEXT_MUT)
    c.drawRightString(W - MARGIN_R, H - 10*mm, "Design System · IM.AI · 2026")

def draw_footer(c, page_num, total_pages):
    c.setFillColor(PANEL_BG)
    c.rect(0, 0, W, 10*mm, fill=1, stroke=0)

    c.setFont("Helvetica", 7)
    c.setFillColor(TEXT_MUT)
    c.drawCentredString(W/2, 3.5*mm, f"Página {page_num} de {total_pages}")

def draw_swatch(c, x, y, name, hex_val, rgba_val):
    color, lum = get_color(hex_val, rgba_val)

    # Extrai alpha do rgba
    inner = rgba_val.replace("rgba(", "").replace(")", "")
    alpha = float(inner.split(",")[3].strip())

    # Fundo do card
    c.setFillColor(CARD_BG)
    c.roundRect(x, y, SWATCH_W, SWATCH_H, 3*mm, fill=1, stroke=0)

    # Borda sutil
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.5)
    c.roundRect(x, y, SWATCH_W, SWATCH_H, 3*mm, fill=0, stroke=1)

    # Amostra de cor (60% superior do card)
    PREVIEW_H = SWATCH_H * 0.60
    c.setFillColor(DARK_BG)
    c.rect(x + 1, y + SWATCH_H - PREVIEW_H - 1, SWATCH_W - 2, PREVIEW_H, fill=1, stroke=0)
    c.setFillColor(color)
    c.rect(x + 1, y + SWATCH_H - PREVIEW_H - 1, SWATCH_W - 2, PREVIEW_H, fill=1, stroke=0)

    # Label do nome
    info_y = y + SWATCH_H - PREVIEW_H - 6.5*mm
    c.setFont("Helvetica-Bold", 6.5)
    c.setFillColor(TEXT_PRI)
    c.drawString(x + 2.5*mm, info_y, name)

    # HEX
    c.setFont("Helvetica", 5.8)
    c.setFillColor(TEXT_SEC)
    if hex_val:
        c.drawString(x + 2.5*mm, info_y - 4*mm, hex_val.upper())
    else:
        c.drawString(x + 2.5*mm, info_y - 4*mm, "—")

    # RGBA
    c.setFillColor(TEXT_MUT)
    # Quebra o rgba em 2 linhas se necessário
    rgba_short = rgba_val
    c.setFont("Helvetica", 5.0)
    c.drawString(x + 2.5*mm, info_y - 7.5*mm, rgba_short)


def layout_pages(palettes):
    """Calcula quantas páginas serão necessárias e devolve lista de páginas."""
    pages = []
    current_page = []
    y_cursor = H - MARGIN_T - 18*mm  # abaixo do header

    for palette in palettes:
        colors = palette["colors"]
        rows = math.ceil(len(colors) / COLS)
        block_h = GROUP_TITLE_H + GROUP_DESC_H + rows * (SWATCH_H + GAP) + GROUP_PAD_B

        if y_cursor - block_h < MARGIN_BOT + 10*mm and current_page:
            pages.append(current_page)
            current_page = []
            y_cursor = H - MARGIN_T - 18*mm

        current_page.append((palette, y_cursor))
        y_cursor -= block_h

    if current_page:
        pages.append(current_page)

    return pages


def generate_pdf():
    c = canvas.Canvas(OUTPUT, pagesize=A4)
    c.setTitle("Paleta de Cores — Zima & Cuidados")
    c.setAuthor("IM.AI Design System")
    c.setSubject("Design Tokens — Cores principais")

    pages = layout_pages(PALETTES)
    total = len(pages)

    for page_num, page_items in enumerate(pages, 1):
        draw_page_bg(c, page_num, total)
        draw_header(c)
        draw_footer(c, page_num, total)

        for palette, y_start in page_items:
            y = y_start

            # Título do grupo
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(TEXT_PRI)
            c.drawString(MARGIN_L, y - 5*mm, palette["group"])

            # Descrição
            c.setFont("Helvetica", 7)
            c.setFillColor(TEXT_SEC)
            c.drawString(MARGIN_L, y - 5*mm - 4.5*mm, palette["desc"])

            # Linha separadora
            c.setStrokeColor(DIVIDER)
            c.setLineWidth(0.4)
            c.line(MARGIN_L, y - 5*mm - 6*mm, W - MARGIN_R, y - 5*mm - 6*mm)

            swatch_y = y - GROUP_TITLE_H - GROUP_DESC_H

            for i, (name, hex_val, rgba_val) in enumerate(palette["colors"]):
                col = i % COLS
                row = i // COLS
                sx = MARGIN_L + col * (SWATCH_W + GAP)
                sy = swatch_y - row * (SWATCH_H + GAP) - SWATCH_H
                draw_swatch(c, sx, sy, name, hex_val, rgba_val)

        c.showPage()

    c.save()
    print(f"PDF gerado: {OUTPUT}")


generate_pdf()
