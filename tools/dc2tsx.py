"""Convert a design-canvas .dc.html page into a React client component (TSX).

Template rules handled:
  {{ a.b }} holes in text and attributes, <sc-for list="{{ x }}" as="i">, event
  attributes (onClick="{{ fn }}"), inline style strings -> style objects, HTML/SVG
  attribute names -> React prop names. The page's logic class (setState /
  forceUpdate / lifecycle) is already React-compatible and is kept as-is.
"""
import re, json, sys
from html.parser import HTMLParser

VOID={'area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr'}
ATTR={'class':'className','for':'htmlFor','tabindex':'tabIndex','autoplay':'autoPlay','playsinline':'playsInline','readonly':'readOnly',
 'maxlength':'maxLength','crossorigin':'crossOrigin','srcset':'srcSet','colspan':'colSpan','rowspan':'rowSpan','autocomplete':'autoComplete',
 'viewbox':'viewBox','preserveaspectratio':'preserveAspectRatio','gradientunits':'gradientUnits','gradienttransform':'gradientTransform',
 'keypoints':'keyPoints','keytimes':'keyTimes','calcmode':'calcMode','keysplines':'keySplines','repeatcount':'repeatCount','attributename':'attributeName',
 'pathlength':'pathLength','patternunits':'patternUnits','markerwidth':'markerWidth','markerheight':'markerHeight','refx':'refX','refy':'refY',
 'stddeviation':'stdDeviation','textlength':'textLength','lengthadjust':'lengthAdjust','spellcheck':'spellCheck','contenteditable':'contentEditable',
 'xlink:href':'xlinkHref','xml:space':'xmlSpace'}
EVT={'onclick':'onClick','onscroll':'onScroll','oninput':'onInput','onchange':'onChange','onmouseenter':'onMouseEnter','onmouseleave':'onMouseLeave',
 'onmousemove':'onMouseMove','onmousedown':'onMouseDown','onmouseup':'onMouseUp','onkeydown':'onKeyDown','onkeyup':'onKeyUp','onfocus':'onFocus',
 'onblur':'onBlur','onsubmit':'onSubmit','onpointermove':'onPointerMove','onpointerleave':'onPointerLeave','onpointerenter':'onPointerEnter','onwheel':'onWheel'}
BOOL={'autoplay','muted','loop','playsinline','controls','disabled','checked','hidden','required','readonly','multiple','selected','open','defer','async','novalidate'}
HOLE=re.compile(r'\{\{\s*([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\s*\}\}')

def camel_css(p):
    if p.startswith('--'): return p
    if p.startswith('-ms-'): p=p[1:]
    parts=p.split('-')
    if parts[0]=='': parts=parts[1:]; parts[0]=parts[0].capitalize()  # -webkit-x -> WebkitX
    return parts[0]+''.join(x.capitalize() for x in parts[1:])

def camel_attr(n):
    if n in ATTR: return ATTR[n]
    if n.startswith('aria-') or n.startswith('data-'): return n
    if '-' in n:
        a=n.split('-'); return a[0]+''.join(x.capitalize() for x in a[1:])
    return n

class Conv(HTMLParser):
    def __init__(self, links):
        super().__init__(convert_charrefs=True)
        self.out=[]; self.loops=[]; self.links=links; self.stack=[]
    def expr(self,path):
        head=path.split('.')[0]
        return path if head in self.loops else 'v.'+path
    def strexpr(self,s):
        """attribute value with holes -> JS expression"""
        ms=list(HOLE.finditer(s))
        if not ms: return json.dumps(s)
        if len(ms)==1 and ms[0].group(0)==s.strip() and s.strip()==s: return self.expr(ms[0].group(1))
        parts=[]; pos=0
        for m in ms:
            parts.append(s[pos:m.start()].replace('\\','\\\\').replace('`','\\`').replace('${','\\${')); parts.append('${'+self.expr(m.group(1))+'}'); pos=m.end()
        parts.append(s[pos:].replace('\\','\\\\').replace('`','\\`').replace('${','\\${'))
        return '`'+''.join(parts)+'`'
    def style(self,s):
        decls=[]; buf=''; depth=0; q=None
        for ch in s:
            if q:
                buf+=ch
                if ch==q: q=None
                continue
            if ch in '"\'': q=ch; buf+=ch; continue
            if ch=='(': depth+=1
            if ch==')': depth-=1
            if ch==';' and depth==0: decls.append(buf); buf=''; continue
            buf+=ch
        decls.append(buf)
        items=[]
        for d in decls:
            if ':' not in d or not d.strip(): continue
            k,val=d.split(':',1); k=k.strip(); val=val.strip()
            # keep {{ }} holes intact when splitting on ':' (holes have no ':')
            items.append(f'{json.dumps(camel_css(k))}: {self.strexpr(val)}')
        return '{{' + ', '.join(items) + '}}'
    def attrs(self,tag,attrs):
        res=[]
        # Links that leave the site (other domains, PDFs, videos) always open in a new tab
        if tag=='a':
            href=dict(attrs).get('href') or ''
            for a,b in self.links.items(): href=href.replace(a,b)
            leaves=href.startswith(('http://','https://')) or href.split('?')[0].lower().endswith(('.pdf','.mp4','.webm','.mov'))
            if leaves:
                attrs=[(n,v) for n,v in attrs if n not in ('target','rel')]+[('target','_blank'),('rel','noopener noreferrer')]
        for n,v in attrs:
            if n in ('hint-placeholder-count',): continue
            if n in EVT:
                m=HOLE.fullmatch((v or '').strip())
                res.append(f'{EVT[n]}={{{self.expr(m.group(1))}}}'); continue
            if n=='style': res.append('style='+self.style(v or '')); continue
            if n in BOOL and (v is None or v=='' or v==n):
                res.append(camel_attr(n)); continue
            if n=='href' and v:
                for a,b in self.links.items(): v=v.replace(a,b)
            name=camel_attr(n)
            val=v if v is not None else ''
            e=self.strexpr(val)
            res.append(f'{name}={e}' if e.startswith('"') else f'{name}={{{e}}}')
        return (' '+' '.join(res)) if res else ''
    def handle_starttag(self,tag,attrs):
        if tag=='sc-for':
            d=dict(attrs); m=HOLE.fullmatch(d['list'].strip()); var=d['as']
            self.out.append(f'{{({self.expr(m.group(1))} || []).map(({var}: any, {var}__i: number) => (<React.Fragment key={{{var}__i}}>')
            self.loops.append(var); self.stack.append('sc-for'); return
        a=self.attrs(tag,attrs)
        if tag in VOID: self.out.append(f'<{tag}{a} />'); return
        self.out.append(f'<{tag}{a}>'); self.stack.append(tag)
    def handle_startendtag(self,tag,attrs):
        a=self.attrs(tag,attrs); self.out.append(f'<{tag}{a} />')
    def handle_endtag(self,tag):
        if tag in VOID: return
        t=self.stack.pop()
        if t=='sc-for': self.loops.pop(); self.out.append('</React.Fragment>))}'); return
        self.out.append(f'</{tag}>')
    def handle_data(self,data):
        if not data: return
        ms=list(HOLE.finditer(data)); pos=0
        for m in ms:
            if m.start()>pos: self.out.append('{'+json.dumps(data[pos:m.start()])+'}')
            self.out.append('{'+self.expr(m.group(1))+'}'); pos=m.end()
        if pos<len(data): self.out.append('{'+json.dumps(data[pos:])+'}')
    def handle_comment(self,data): pass

def convert(path, name, links, assets, gate=None):
    src=open(path).read()
    for a,b in assets.items(): src=src.replace('/_blob/'+a,b)
    helmet=re.search(r'<helmet>(.*?)</helmet>',src,re.S).group(1)
    css='\n'.join(re.findall(r'<style>(.*?)</style>',helmet,re.S))
    body=re.search(r'</helmet>(.*?)</x-dc>',src,re.S).group(1)
    m=re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>',src,re.S)
    logic=m.group(1) if m else 'class Component extends DCLogic { renderVals() { return {}; } }'
    for a,b in links.items(): logic=logic.replace(a,b)
    c=Conv(links); c.feed(body); c.close()
    jsx=''.join(c.out)
    logic=logic.replace('class Component extends DCLogic {','class Logic extends React.Component<any, any> {\n  state: any = {};',1)
    # React needs a render(); the canvas runtime called renderVals() for us
    idx=logic.rstrip().rfind('}')
    logic=logic[:idx]+'''  render() {
    const v: any = this.renderVals();
    return (<>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      __JSX__
    </>);
  }
}'''
    WRAP_GATE = """

// Renders on the client only: the page shows live clocks and timestamps,
// which would never match a build-time render.
export default function NAME() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // The page scrolls inside #home, so the browser can't restore the position by itself.
  // Coming back from a case study puts you exactly where you left (saved in transitions.tsx);
  // plain /#section links jump to that section.
  React.useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      const c = document.getElementById('home');
      if (!c) return;
      let saved: { path: string; scroll: number; card: string; at: number } | null = null;
      try { saved = JSON.parse(sessionStorage.getItem('home-return') || 'null'); } catch {}
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const returning = saved && saved.path === window.location.pathname && Date.now() - saved.at < 30 * 60 * 1000 &&
        (window.location.hash === '#projects' || nav?.type === 'back_forward');
      const prev = c.style.scrollSnapType;
      c.style.scrollSnapType = 'none';
      if (returning && saved) {
        c.scrollTop = saved.scroll;
        const card = document.querySelector<HTMLElement>('a.pcard[href="' + saved.card + '"]');
        if (card) { card.classList.add('just-returned'); setTimeout(() => card.classList.remove('just-returned'), 1600); }
        sessionStorage.removeItem('home-return');
      } else {
        const id = decodeURIComponent(window.location.hash.slice(1));
        const el = id ? document.getElementById(id) : null;
        if (el) c.scrollTop = el.offsetTop;
      }
      requestAnimationFrame(() => { c.style.scrollSnapType = prev; c.dispatchEvent(new Event('scroll')); });
      if (window.location.hash) history.replaceState(null, '', window.location.pathname);
    }, 40);
    return () => clearTimeout(t);
  }, [mounted]);
  return mounted ? <div className="dc-enter"><Logic /></div> : <div style={{ height: '100vh', background: 'GATE' }} />;
}
"""
    WRAP = """

export default function NAME() {
  return <Logic />;
}
"""
    tail = (WRAP_GATE.replace('GATE', gate) if gate else WRAP).replace('NAME', name)
    out=('// @ts-nocheck\n// Generated from the design canvas (' + path.split('/')[-1] + ') by tools/dc2tsx.py. Edit the design, then regenerate.\n'
         "'use client';\nimport React from 'react';\n\nconst CSS = " + json.dumps(css) + ';\n\n' + logic.replace('__JSX__',jsx) + tail)
    return out

if __name__=='__main__':
    pass
