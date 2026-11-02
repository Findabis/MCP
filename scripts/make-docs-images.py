"""Draws the README diagrams for Findabis/MCP as SVG, dark and light, from one palette.
Run: python3 make_docs_images.py <assets dir>. System font stacks only (GitHub serves SVGs without web fonts)."""
import sys, pathlib

OUT = pathlib.Path(sys.argv[1])
W = 1280
SANS = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif"
MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"

THEMES = {
    'dark': dict(bg='#090909', card='#ffffff', card_o=.05, stroke='#ffffff', stroke_o=.12, text='#ffffff',
                 muted='#a3aaa7', teal='#01c7a4', teal_text='#01c7a4', panel='#000000', panel_o=.35,
                 chip='#01c7a4', chip_o=.16, line='#ffffff', line_o=.28, skel='#ffffff', skel_o=.16,
                 modal='#111413', input='#000000', input_o=.35, bubble='#ffffff', bubble_o=.10, bad='#ff7a5c',
                 on_teal='#090909'),
    'light': dict(bg='#f6f8f7', card='#ffffff', card_o=1, stroke='#d6dcd9', stroke_o=1, text='#090909',
                  muted='#4a5451', teal='#01c7a4', teal_text='#0a6b5e', panel='#eaf0ed', panel_o=1,
                  chip='#01c7a4', chip_o=.14, line='#090909', line_o=.25, skel='#090909', skel_o=.12,
                  modal='#ffffff', input='#f1f4f2', input_o=1, bubble='#e6ecea', bubble_o=1, bad='#d6452a',
                  on_teal='#090909'),
}

# Marks: the assistants' own, from Lobe Icons (MIT), as the site's /mcp page shows them; the Findabis triangle.
CLAUDE = '<path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757"/>'
OPENAI = '<g fill-rule="evenodd"><path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"/></g>'
GEM_PATH = "M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
GEMINI = (f'<path d="{GEM_PATH}" fill="#3186FF"/><path d="{GEM_PATH}" fill="url(#gem0)"/><path d="{GEM_PATH}" fill="url(#gem1)"/><path d="{GEM_PATH}" fill="url(#gem2)"/>')
GEM_DEFS = ('<linearGradient gradientUnits="userSpaceOnUse" id="gem0" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962"/><stop offset="1" stop-color="#08B962" stop-opacity="0"/></linearGradient>'
            '<linearGradient gradientUnits="userSpaceOnUse" id="gem1" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543"/><stop offset="1" stop-color="#F94543" stop-opacity="0"/></linearGradient>'
            '<linearGradient gradientUnits="userSpaceOnUse" id="gem2" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12"/><stop offset=".46" stop-color="#FABC12" stop-opacity="0"/></linearGradient>')
COPILOT = '<g fill-rule="evenodd"><path d="M19.245 5.364c1.322 1.36 1.877 3.216 2.11 5.817.622 0 1.2.135 1.592.654l.73.964c.21.278.323.61.323.955v2.62c0 .339-.173.669-.453.868C20.239 19.602 16.157 21.5 12 21.5c-4.6 0-9.205-2.583-11.547-4.258-.28-.2-.452-.53-.453-.868v-2.62c0-.345.113-.679.321-.956l.73-.963c.392-.517.974-.654 1.593-.654l.029-.297c.25-2.446.81-4.213 2.082-5.52 2.461-2.54 5.71-2.851 7.146-2.864h.198c1.436.013 4.685.323 7.146 2.864zm-7.244 4.328c-.284 0-.613.016-.962.05-.123.447-.305.85-.57 1.108-1.05 1.023-2.316 1.18-2.994 1.18-.638 0-1.306-.13-1.851-.464-.516.165-1.012.403-1.044.996a65.882 65.882 0 00-.063 2.884l-.002.48c-.002.563-.005 1.126-.013 1.69.002.326.204.63.51.765 2.482 1.102 4.83 1.657 6.99 1.657 2.156 0 4.504-.555 6.985-1.657a.854.854 0 00.51-.766c.03-1.682.006-3.372-.076-5.053-.031-.596-.528-.83-1.046-.996-.546.333-1.212.464-1.85.464-.677 0-1.942-.157-2.993-1.18-.266-.258-.447-.661-.57-1.108-.32-.032-.64-.049-.96-.05zm-2.525 4.013c.539 0 .976.426.976.95v1.753c0 .525-.437.95-.976.95a.964.964 0 01-.976-.95v-1.752c0-.525.437-.951.976-.951zm5 0c.539 0 .976.426.976.95v1.753c0 .525-.437.95-.976.95a.964.964 0 01-.976-.95v-1.752c0-.525.437-.951.976-.951zM7.635 5.087c-1.05.102-1.935.438-2.385.906-.975 1.037-.765 3.668-.21 4.224.405.394 1.17.657 1.995.657h.09c.649-.013 1.785-.176 2.73-1.11.435-.41.705-1.433.675-2.47-.03-.834-.27-1.52-.63-1.813-.39-.336-1.275-.482-2.265-.394zm6.465.394c-.36.292-.6.98-.63 1.813-.03 1.037.24 2.06.675 2.47.968.957 2.136 1.104 2.776 1.11h.044c.825 0 1.59-.263 1.995-.657.555-.556.765-3.187-.21-4.224-.45-.468-1.335-.804-2.385-.906-.99-.088-1.875.058-2.265.394zM12 7.615c-.24 0-.525.015-.84.044.03.16.045.336.06.526l-.001.159a2.94 2.94 0 01-.014.25c.225-.022.425-.027.612-.028h.366c.187 0 .387.006.612.028-.015-.146-.015-.277-.015-.409.015-.19.03-.365.06-.526a9.29 9.29 0 00-.84-.044z"/></g>'
CURSOR = '<g fill-rule="evenodd"><path d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z"/></g>'
MCP = '<g fill-rule="evenodd"><path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z"/><path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z"/></g>'
FB = '<path d="M534.72,557.57H29.23A29.24,29.24,0,0,1,3.15,515.14L255.89,16a29.24,29.24,0,0,1,52.16,0L560.8,515.14a29.24,29.24,0,0,1-26.08,42.43ZM76.79,499.12H487.16L282,93.93Z"/><rect x="186.25" y="274.42" width="58.47" height="271.33" transform="translate(-173.33 158.23) rotate(-29.35)"/><rect x="210.66" y="380.86" width="271.33" height="58.47" transform="translate(-180.88 510.94) rotate(-60.65)"/>'

SYMBOLS = {'claude': CLAUDE, 'openai': OPENAI, 'gemini': GEMINI, 'copilot': COPILOT, 'cursor': CURSOR, 'mcp': MCP}


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def width_of(s, size, mono=False, bold=False):
    f = 0.62 if mono else (0.57 if bold else 0.53)
    return len(s) * size * f


def wrap(s, size, maxw, mono=False, bold=False):
    words, lines, cur = s.split(' '), [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if cur and width_of(trial, size, mono, bold) > maxw:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines


class Svg:
    def __init__(self, t, h, label):
        self.t, self.h, self.parts = t, h, []
        self.label = label

    def add(self, s):
        self.parts.append(s)

    def text(self, x, y, s, size=14, fill=None, bold=False, mono=False, anchor='start', opacity=None, upper=False, spacing=None):
        fill = fill or self.t['text']
        attrs = [f'x="{x}" y="{y}"', f'font-size="{size}"', f'fill="{fill}"', f'text-anchor="{anchor}"',
                 f'font-family="{MONO if mono else SANS}"']
        if bold:
            attrs.append('font-weight="700"')
        if opacity is not None:
            attrs.append(f'fill-opacity="{opacity}"')
        if spacing:
            attrs.append(f'letter-spacing="{spacing}"')
        body = esc(s.upper() if upper else s)
        self.add(f'<text {" ".join(attrs)}>{body}</text>')

    def para(self, x, y, s, size, maxw, lh=None, **kw):
        lh = lh or round(size * 1.4)
        lines = wrap(s, size, maxw, kw.get('mono', False), kw.get('bold', False))
        for i, line in enumerate(lines):
            self.text(x, y + i * lh, line, size, **kw)
        return y + (len(lines) - 1) * lh  # baseline of the last line

    def rect(self, x, y, w, h, rx=12, fill=None, fo=None, stroke=None, so=None, sw=1):
        a = [f'x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"', f'fill="{fill or "none"}"']
        if fo is not None:
            a.append(f'fill-opacity="{fo}"')
        if stroke:
            a.append(f'stroke="{stroke}" stroke-width="{sw}"')
            if so is not None:
                a.append(f'stroke-opacity="{so}"')
        self.add(f'<rect {" ".join(a)}/>')

    def card(self, x, y, w, h, rx=16):
        t = self.t
        self.rect(x, y, w, h, rx, t['card'], t['card_o'], t['stroke'], t['stroke_o'])

    def panel(self, x, y, w, h, rx=12):
        t = self.t
        self.rect(x, y, w, h, rx, t['panel'], t['panel_o'])

    def use(self, sym, x, y, size, fill=None):
        f = f' fill="{fill}"' if fill else ''
        self.add(f'<use href="#{sym}" xlink:href="#{sym}" x="{x}" y="{y}" width="{size}" height="{size}"{f}/>')

    def badge(self, cx, cy, n, r=13):
        t = self.t
        self.add(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{t["teal"]}"/>')
        self.text(cx, cy + 4.5, str(n), 13, t['on_teal'], bold=True, anchor='middle')

    def arrow(self, x1, y1, x2, y2, teal=False, dashed=False):
        t = self.t
        color = t['teal'] if teal else t['line']
        op = '' if teal else f' stroke-opacity="{t["line_o"]}"'
        dash = ' stroke-dasharray="5 5"' if dashed else ''
        m = 'arrT' if teal else 'arr'
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.8"{op}{dash} marker-end="url(#{m})"/>')

    def chip(self, x, y, s, size=12, mono=False):
        t = self.t
        w = width_of(s, size, mono, True) + 20
        self.rect(x, y, w, size + 12, (size + 12) / 2, t['chip'], t['chip_o'])
        self.text(x + 10, y + size + 2.5, s, size, t['teal_text'], bold=True, mono=mono)
        return w

    def skeleton(self, x, y, w, h=14):
        t = self.t
        self.rect(x, y, w, h, h / 2, t['skel'], t['skel_o'])

    def render(self):
        t, h = self.t, self.h
        syms = ''.join(f'<symbol id="{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in SYMBOLS.items())
        syms += f'<symbol id="fb" viewBox="0 0 563.95 557.57">{FB}</symbol>'
        defs = (f'<defs>{GEM_DEFS}{syms}'
                f'<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="{t["teal"]}" fill-opacity=".18"/></pattern>'
                f'<linearGradient id="glow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{t["teal"]}" stop-opacity=".2"/><stop offset="1" stop-color="{t["teal"]}" stop-opacity="0"/></linearGradient>'
                f'<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="{t["line"]}" fill-opacity="{min(1, t["line_o"] + .3)}"/></marker>'
                f'<marker id="arrT" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="{t["teal"]}"/></marker>'
                f'</defs>')
        bg = (f'<rect width="{W}" height="{h}" rx="28" fill="{t["bg"]}"/>'
              f'<rect width="{W}" height="{h}" rx="28" fill="url(#dots)"/>'
              f'<circle cx="1180" cy="20" r="260" fill="url(#glow)"/>')
        return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {h}" '
                f'width="{W}" height="{h}" role="img" aria-label="{esc(self.label)}">\n{defs}\n{bg}\n' + '\n'.join(self.parts) + '\n</svg>\n')


def title(s, x, y, heading, sub=None, size=30):
    s.text(x, y, heading, size, bold=True)
    if sub:
        s.text(x, y + 32, sub, 16, s.t['muted'])


# ---------------------------------------------------------------- 1. how it works
def how_it_works(theme):
    t = THEMES[theme]
    s = Svg(t, 600, 'How the Findabis MCP works: you ask, your assistant calls a Findabis tool, the live directory answers, the assistant replies with links')
    title(s, 48, 64, 'How it works', 'Your assistant does the reasoning. Findabis supplies the facts — live, read-only, from the same directory as the website.')
    nodes = [
        ('you', 'You', 'Ask a question in plain English'),
        ('assistant', 'Your assistant', 'Picks a Findabis tool and calls it'),
        ('mcp', 'Findabis MCP', 'findabis.com/api/mcp · 10 read-only tools · no login'),
        ('data', 'Live directory', 'Clinics, pharmacies, products, strains and brands'),
    ]
    xs, y, w, h = [48, 364, 680, 996], 136, 236, 176
    for i, (key, name, text) in enumerate(nodes):
        x = xs[i]
        cx = x + w / 2
        s.card(x, y, w, h)
        if key == 'you':
            s.add(f'<circle cx="{cx}" cy="{y + 46}" r="21" fill="{t["skel"]}" fill-opacity="{t["skel_o"] + .06}"/>')
            s.text(cx, y + 50.5, 'YOU', 11, bold=True, mono=True, anchor='middle')
        elif key == 'assistant':
            marks = ['claude', 'openai', 'gemini', 'copilot', 'cursor']
            size, gap = 26, 10
            total = len(marks) * size + (len(marks) - 1) * gap
            mx = cx - total / 2
            for j, m in enumerate(marks):
                fill = None if m in ('claude', 'gemini') else t['text']
                s.use(m, mx + j * (size + gap), y + 33, size, fill)
        elif key == 'mcp':
            s.use('mcp', cx - 21, y + 25, 42, t['text'])
        else:
            s.use('fb', cx - 21, y + 25, 42, t['teal'])
        s.text(cx, y + 100, name, 19, bold=True, anchor='middle')
        s.para(cx, y + 126, text, 14, w - 28, lh=19, fill=t['muted'], anchor='middle')
    fwd = ['question', 'tool call', 'reads']
    back = ['answer + links', 'typed result', 'public rows']
    for i in range(3):
        x1, x2 = xs[i] + w + 8, xs[i + 1] - 8
        mid = (x1 + x2) / 2
        s.arrow(x1, y + 66, x2, y + 66)
        s.text(mid, y + 56, fwd[i], 11.5, t['muted'], mono=True, anchor='middle')
        s.arrow(x2, y + 104, x1, y + 104, teal=True, dashed=True)
        s.text(mid, y + 124, back[i], 11.5, t['teal_text'], mono=True, anchor='middle')
    # the exchange
    py = 344
    s.panel(48, py, 1184, 206, 16)
    s.text(72, py + 28, 'An example exchange', 11, t['muted'], mono=True, upper=True, spacing=1.5)
    lines = [
        ('You', '“Which clinics near Leeds do video consultations, and what’s the first appointment?”', False, t['text']),
        ('Assistant → Findabis', 'find_clinics({ near: "Leeds", consultationType: "ONLINE" })', True, t['teal_text']),
        ('Findabis → Assistant', 'Clinics nearest first — miles, first-consultation fee, consultation types and a page link for each', False, t['muted']),
        ('Assistant', '“Clinics near Leeds that consult by video, nearest first…” with a link for each, and a reminder that only a specialist can prescribe', False, t['text']),
    ]
    yy = py + 60
    for who, text, mono, fill in lines:
        s.text(72, yy, who, 10.5, t['muted'], mono=True, upper=True, spacing=1.2)
        last = s.para(284, yy, text, 16, 930, lh=22, fill=fill, mono=mono)
        yy = last + 34
    s.text(48, 582, 'MCP is an open standard. Your assistant never sends your chat to Findabis — only the tool call, the same request the website itself makes.', 13.5, t['muted'])
    return s


# ---------------------------------------------------------------- 2. connect Claude
def connect_claude(theme):
    t = THEMES[theme]
    s = Svg(t, 660, 'Where the connector setting lives in Claude: Settings, Connectors, Add custom connector, then the name Findabis and the server address')
    title(s, 48, 56, 'Connecting Claude', 'Web, desktop and mobile share one screen. Schematic, not a screenshot: menu names move between releases; the address never does.', 28)
    wx, wy, ww, wh = 48, 116, 740, 500
    s.card(wx, wy, ww, wh, 14)
    for i, dx in enumerate((22, 40, 58)):
        s.add(f'<circle cx="{wx + dx}" cy="{wy + 18}" r="5" fill="{t["skel"]}" fill-opacity="{t["skel_o"] + .1}"/>')
    s.text(wx + ww / 2, wy + 22, 'Settings', 12, t['muted'], anchor='middle')
    s.add(f'<line x1="{wx}" y1="{wy + 36}" x2="{wx + ww}" y2="{wy + 36}" stroke="{t["stroke"]}" stroke-opacity="{t["stroke_o"]}"/>')
    s.add(f'<line x1="{wx + 184}" y1="{wy + 36}" x2="{wx + 184}" y2="{wy + wh}" stroke="{t["stroke"]}" stroke-opacity="{t["stroke_o"]}"/>')
    items = ['Profile', 'Appearance', 'Privacy', 'Connectors', 'Capabilities', 'Billing']
    for i, it in enumerate(items):
        iy = wy + 64 + i * 32
        if it == 'Connectors':
            s.rect(wx + 14, iy - 19, 156, 28, 8, t['chip'], t['chip_o'])
            s.text(wx + 26, iy, it, 13.5, t['teal_text'], bold=True)
            s.badge(wx + 184 + 14, iy - 5, 1)
        else:
            s.text(wx + 26, iy, it, 13.5, t['muted'])
    mx = wx + 212
    s.text(mx, wy + 76, 'Connectors', 18, bold=True)
    s.text(mx, wy + 98, 'Connect Claude to tools and data you already use', 12.5, t['muted'])
    s.rect(mx, wy + 118, 212, 34, 8, None, None, t['teal'], 1, 1.5)
    s.text(mx + 106, wy + 140, '+  Add custom connector', 13, t['teal_text'], bold=True, anchor='middle')
    s.badge(mx + 212 + 22, wy + 135, 2)
    for i, sw in enumerate((230, 180, 260)):
        ry = wy + 184 + i * 40
        s.add(f'<circle cx="{mx + 12}" cy="{ry}" r="9" fill="{t["skel"]}" fill-opacity="{t["skel_o"]}"/>')
        s.skeleton(mx + 32, ry - 7, sw)
    # the dialog
    dx, dy, dw, dh = wx + 300, wy + 160, 426, 310
    s.rect(dx + 4, dy + 6, dw, dh, 14, '#000000', .25 if theme == 'dark' else .08)
    s.rect(dx, dy, dw, dh, 14, t['modal'], 1, t['stroke'], t['stroke_o'])
    s.text(dx + 24, dy + 38, 'Add custom connector', 17, bold=True)
    s.text(dx + 24, dy + 74, 'Name', 12, t['muted'])
    s.rect(dx + 24, dy + 84, dw - 48, 38, 8, t['input'], t['input_o'], t['stroke'], t['stroke_o'])
    s.text(dx + 38, dy + 108, 'Findabis', 14)
    s.text(dx + 24, dy + 148, 'Remote MCP server URL', 12, t['muted'])
    s.rect(dx + 24, dy + 158, dw - 48, 38, 8, t['input'], t['input_o'], t['stroke'], t['stroke_o'])
    s.text(dx + 38, dy + 182, 'https://findabis.com/api/mcp', 13.5, t['teal_text'], mono=True)
    s.text(dx + 24, dy + 222, 'Advanced: OAuth client ID and secret — leave empty. No login or key is needed.', 11.5, t['muted'])
    s.text(dx + dw - 150, dy + 272, 'Cancel', 13, t['muted'], anchor='middle')
    s.rect(dx + dw - 112, dy + 252, 88, 32, 8, t['teal'])
    s.text(dx + dw - 68, dy + 273, 'Add', 13.5, t['on_teal'], bold=True, anchor='middle')
    s.badge(dx + dw - 6, dy + 248, 3)
    # the steps
    sx = 828
    steps = [
        'Open Settings → Connectors.',
        'Choose Add custom connector.',
        'Name it Findabis, paste https://findabis.com/api/mcp and press Add.',
        'In a new chat, open the tools menu, turn Findabis on, and ask your question.',
    ]
    sy = 136
    for i, st in enumerate(steps):
        s.badge(sx + 13, sy - 5, i + 1)
        last = s.para(sx + 40, sy, st, 16, 364, lh=22)
        sy = last + 48
    s.panel(sx, 436, 404, 180, 12)
    s.text(sx + 20, 462, 'Elsewhere', 11, t['muted'], mono=True, upper=True, spacing=1.5)
    y2 = s.para(sx + 20, 488, 'ChatGPT: Settings → Apps & Connectors → Advanced (developer mode) → create a connector, no authentication.', 14, 364, lh=20)
    y3 = s.para(sx + 20, y2 + 30, 'Claude Code, one command:', 14, 364, lh=20)
    s.para(sx + 20, y3 + 24, 'claude mcp add --transport http findabis https://findabis.com/api/mcp', 12.5, 364, lh=18, mono=True, fill=t['teal_text'])
    return s


# ---------------------------------------------------------------- 3. which tool
TOOLS = [
    ('find_clinics', '“Which clinics near Leeds do video consultations?”', 'Nearest first with miles, fees, a year-one estimate, CQC rating and reviews'),
    ('find_pharmacies', '“Which pharmacies near SW1A deliver?”', 'Nearest first with delivery, collection and reviews'),
    ('find_products', '“Which oils does this brand list?”', 'Dose form, THC and CBD, and the latest published UK price'),
    ('get_product', '“What’s in this oil — carrier, allergens, strength?”', 'Terpenes, contents, leaflets, FAQs and the public price range'),
    ('find_strains', '“Is Blue Dream an indica or a sativa?”', 'Genetics and THC/CBD ranges — never effects or uses'),
    ('find_brands', '“Who makes capsules for the UK market?”', 'Brands by name or dose form, with how many products each lists'),
    ('get_listing', '“Tell me about this clinic.”', 'Fees, policy, CQC or GPhC record, FAQs, opening hours, partners'),
    ('compare_providers', '“Which of these three is cheapest in year one?”', 'Two to six clinics or pharmacies side by side, services only'),
    ('search_findabis', '“What’s Tilray?”', 'Anything by name: kind, slug, page link and a one-line summary'),
    ('get_directory_facts', '“How many clinics are listed, and what’s a typical first fee?”', 'Counts, fee range and median, delivery counts, last-updated dates'),
]


def pick_a_tool(theme):
    t = THEMES[theme]
    s = Svg(t, 840, 'The ten Findabis tools, each with the question it answers and what it returns')
    title(s, 48, 60, 'Which tool answers what', 'Your assistant chooses these itself. This is what each one is for, and what it gives back.', 28)
    w, h = 580, 120
    for i, (name, q, r) in enumerate(TOOLS):
        x = 48 if i % 2 == 0 else 652
        y = 120 + (i // 2) * 132
        s.card(x, y, w, h, 14)
        s.text(x + 22, y + 36, name, 17, t['teal_text'], bold=True, mono=True)
        s.text(x + 22, y + 65, q, 16)
        s.para(x + 22, y + 92, r, 15, w - 44, lh=19, fill=t['muted'])
    s.text(48, 798, 'Also three prompts, shown as slash-commands: find_care_near · product_facts · check_provider', 14, t['muted'])
    s.text(48, 820, 'And three guides the assistant can read: how to get a prescription in the UK · who clinics take · about Findabis and its data', 14, t['muted'])
    return s


# ---------------------------------------------------------------- 4. an answer
def example_answer(theme):
    t = THEMES[theme]
    s = Svg(t, 690, 'What an answer looks like: the question, the Findabis tool call, three clinics with distance, consultation types, fees and page links, and the disclaimer')
    title(s, 48, 56, 'What an answer looks like', 'Illustration — names are blanked and figures are examples. Every real answer carries each listing’s Findabis page link.', 28)
    cx, cy, cw, ch = 48, 116, 1184, 540
    s.card(cx, cy, cw, ch, 16)
    s.text(cx + 28, cy + 26, 'Claude', 13, bold=True)
    s.chip(cx + 92, cy + 8, 'Findabis connected', 11)
    s.text(cx + cw - 28, cy + 26, 'MCP · read-only', 11, t['muted'], mono=True, anchor='end')
    s.add(f'<line x1="{cx}" y1="{cy + 42}" x2="{cx + cw}" y2="{cy + 42}" stroke="{t["stroke"]}" stroke-opacity="{t["stroke_o"]}"/>')
    bx, by, bw = cx + cw - 28 - 600, cy + 62, 600
    s.rect(bx, by, bw, 66, 18, t['bubble'], t['bubble_o'])
    s.para(bx + 24, by + 28, '“Which clinics near Leeds do video consultations, and what’s the first appointment?”', 16, bw - 48, lh=22)
    rx, ry = cx + 32, cy + 150
    s.rect(rx, ry, 620, 40, 10, t['panel'], t['panel_o'], t['stroke'], t['stroke_o'])
    s.use('mcp', rx + 14, ry + 11, 18, t['muted'])
    s.text(rx + 42, ry + 25, 'find_clinics', 13, t['teal_text'], bold=True, mono=True)
    s.text(rx + 150, ry + 25, 'near: "Leeds" · consultationType: "ONLINE"', 12, t['muted'], mono=True)
    s.chip(rx + 620 - 94, ry + 7, '✓ Findabis', 11)
    ay = cy + 228
    s.text(rx, ay, 'Clinics near Leeds that consult by video, nearest first:', 16)
    rows = [(190, '2.1 mi · video and in person · first consult £150 · follow-up £65'),
            (150, '4.8 mi · video · first consult £99 · follow-up £49'),
            (215, '9.3 mi · video and phone · first consult £120 · follow-up £60')]
    for i, (nw, line) in enumerate(rows):
        yy = ay + 40 + i * 58
        s.skeleton(rx, yy - 13, nw, 16)
        s.text(rx + nw + 12, yy, '· ' + line, 15)
        s.text(rx, yy + 22, 'findabis.com/clinics/…', 13, t['teal_text'], mono=True)
    s.para(rx, ay + 224, 'Findabis is a directory, not medical advice. Only a specialist can decide whether anyone can be prescribed, and a pharmacy dispenses only against a prescription a clinic has issued.', 14, 1100, lh=20, fill=t['muted'])
    s.text(rx, cy + ch - 26, 'Each link opens the clinic’s Findabis page, where the fees above are published.', 12.5, t['muted'], mono=True)
    return s


# ---------------------------------------------------------------- 5. what it sees
def what_it_sees(theme):
    t = THEMES[theme]
    s = Svg(t, 432, 'What the server can see — public listings — and what it never sees or does: accounts, patients, stock, per-pharmacy prices, bookings')
    title(s, 48, 56, 'What it can and can’t see', None, 28)
    s.card(48, 92, 580, 276, 16)
    s.card(652, 92, 580, 276, 16)
    s.add(f'<circle cx="80" cy="126" r="7" fill="{t["teal"]}"/>')
    s.text(96, 131, 'It sees', 18, bold=True)
    s.text(96, 152, 'what anyone can read on findabis.com', 12.5, t['muted'])
    sees = ['Clinics and pharmacies: fees, consultation types, delivery, CQC and GPhC records, FAQs, opening hours',
            'Products: dose form, THC and CBD, contents and allergens, leaflets, the latest published UK price',
            'Strains and brands, and the directory’s counts and fee ranges']
    yy = 188
    for item in sees:
        s.text(80, yy, '✓', 15, t['teal'], bold=True)
        last = s.para(104, yy, item, 15.5, 500, lh=22)
        yy = last + 34
    s.add(f'<circle cx="684" cy="126" r="7" fill="{t["bad"]}"/>')
    s.text(700, 131, 'It never sees or does', 18, bold=True)
    s.text(700, 152, 'no account, no key, no writes', 12.5, t['muted'])
    never = ['Accounts, patients, prescriptions or any personal data',
             'Stock, which pharmacy holds what, or per-pharmacy prices',
             'Booking, buying, changing or sending anything',
             'Ranking by sponsorship — results come by distance, name, fee or rating']
    yy = 188
    for item in never:
        s.text(684, yy, '✗', 15, t['bad'], bold=True)
        last = s.para(708, yy, item, 15.5, 500, lh=22)
        yy = last + 34
    s.text(640, 404, 'Read-only · 60 requests a minute per client · the medical disclaimer is sent to every session', 14, t['muted'], anchor='middle')
    return s


IMAGES = {'how-it-works': how_it_works, 'connect-claude': connect_claude, 'pick-a-tool': pick_a_tool,
          'example-answer': example_answer, 'what-it-sees': what_it_sees}

for name, fn in IMAGES.items():
    for theme in THEMES:
        path = OUT / f'{name}-{theme}.svg'
        path.write_text(fn(theme).render())
        print(f'wrote {path.name} ({path.stat().st_size} bytes)')
