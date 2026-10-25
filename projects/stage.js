/* Shared stage engine: <div class="stage" id="stage"> + <script type="application/json" id="scene-data">{model,en,cn}</script>.
   Page calls Stage.setLang("en"|"cn") on every language change; Stage.replay() restarts. */
(function(){
  var root = document.getElementById("stage"), dataEl = document.getElementById("scene-data");
  if(!root || !dataEl){ window.Stage = {setLang:function(){}, replay:function(){}}; return; }
  var DATA = JSON.parse(dataEl.textContent), SC = {en:DATA.en, cn:DATA.cn};
  function $(id){ return root.querySelector("#" + id); }
  var NS = "http://www.w3.org/2000/svg";
  var lang = "en", idx = 0, run = 0, timers = [];
  var log = $("log"), bar = $("bar"), dgBox = $("dg");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DELAY = {head:380, cmd:520, sub:380, ok:420, gate:900, dim:600, prog:260};
  var nodes = {};
  function clear(){ run++; timers.forEach(clearTimeout); timers = []; }
  function later(fn, ms){ var r = run; timers.push(setTimeout(function(){ if(r===run) fn(); }, ms)); }
  function L(x){ return typeof x === "string" ? x : (x[lang] || x.en); }
  function el(tag, attrs){ var e = document.createElementNS(NS, tag); for(var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  /* ---- model ---- */
  function route(a, b){
    var ac = {x:a.x+a.w/2, y:a.y+a.h/2}, bc = {x:b.x+b.w/2, y:b.y+b.h/2};
    var dx = bc.x-ac.x, dy = bc.y-ac.y;
    if(Math.abs(dx) > Math.abs(dy)){
      var sx = dx>0 ? a.x+a.w : a.x, ex = dx>0 ? b.x : b.x+b.w;
      var ey = Math.min(Math.max(ac.y, b.y+6), b.y+b.h-6), mx = (sx+ex)/2;
      return ey===ac.y ? "M"+sx+","+ac.y+" L"+ex+","+ey : "M"+sx+","+ac.y+" L"+mx+","+ac.y+" L"+mx+","+ey+" L"+ex+","+ey;
    }
    var sy = dy>0 ? a.y+a.h : a.y, ey2 = dy>0 ? b.y : b.y+b.h;
    var ex2 = Math.min(Math.max(ac.x, b.x+8), b.x+b.w-8), my = (sy+ey2)/2;
    return ex2===ac.x ? "M"+ac.x+","+sy+" L"+ex2+","+ey2 : "M"+ac.x+","+sy+" L"+ac.x+","+my+" L"+ex2+","+my+" L"+ex2+","+ey2;
  }
  function drawModel(m){
    nodes = {}; var fit = [];
    var svg = el("svg", {viewBox:m.vb, "class":"dg"});
    var defs = el("defs", {}), mk = el("marker", {id:"arr", viewBox:"0 0 8 8", refX:"7", refY:"4", markerWidth:"7", markerHeight:"7", orient:"auto"});
    mk.appendChild(el("path", {d:"M0,0.5 L7,4 L0,7.5 z", fill:"#b5b5b5"})); defs.appendChild(mk); svg.appendChild(defs);
    var map = {}; m.nodes.forEach(function(n){ map[n[0]] = {x:n[1], y:n[2], w:n[3], h:n[4]}; });
    m.edges.forEach(function(e){
      var o = e[2] || "", d = o.indexOf("M")>=0 ? o.slice(o.indexOf("M")) : route(map[e[0]], map[e[1]]);
      svg.appendChild(el("path", {d:d, "class":"eg" + (o.charAt(0)==="d" ? " d" : ""), "marker-end":"url(#arr)"}));
    });
    (m.labels||[]).forEach(function(t){ var x = el("text", {x:t[0], y:t[1], "class":"lb"}); x.textContent = L(t[2]); svg.appendChild(x); });
    m.nodes.forEach(function(n){
      var kind = n[6] || "", g = el("g", {"class":"nd idle " + kind, "data-id":n[0]});
      g.appendChild(el("rect", {x:n[1], y:n[2], width:n[3], height:n[4], rx: kind==="human" ? 15 : (kind==="store" ? 1 : 4)}));
      var lines = L(n[5]).split("\n"), cx = n[1]+n[3]/2, y0 = n[2]+n[4]/2 - (lines.length-1)*6 + 3.8;
      lines.forEach(function(s, i){ var t = el("text", {x:cx, y:y0+i*12, "text-anchor":"middle"}); t.textContent = s; g.appendChild(t); });
      fit.push([g, n[3]-8]);
      g.addEventListener("mouseenter", function(){ hlNode(n[0], true); });
      g.addEventListener("mouseleave", function(){ hlNode(n[0], false); });
      svg.appendChild(g); nodes[n[0]] = {g:g, kind:kind};
    });
    dgBox.textContent = ""; dgBox.appendChild(svg);
    /* squeeze any label wider than its box instead of letting it spill */
    fit.forEach(function(f){ f[0].querySelectorAll("text").forEach(function(t){ try{ if(t.getComputedTextLength() > f[1]){ t.setAttribute("textLength", f[1]); t.setAttribute("lengthAdjust", "spacingAndGlyphs"); } }catch(e){} }); });
  }
  function setState(id, st){ var n = nodes[id]; if(n) n.g.setAttribute("class", "nd " + st + " " + n.kind + (n.g.classList.contains("hl") ? " hl" : "")); }
  function applyStates(spec){ (spec||"").split(" ").forEach(function(s){ if(!s) return; var p = s.split(":"); setState(p[0], p[1]); }); }

  /* ---- cross reference: hover a line → its nodes light up; hover a node → its lines ---- */
  function hlNode(id, on){
    if(nodes[id]) nodes[id].g.classList.toggle("hl", on);
    log.querySelectorAll(".ln").forEach(function(l){ if((" "+l.getAttribute("data-n")+" ").indexOf(" "+id+" ")>=0) l.classList.toggle("hl", on); });
  }
  function hlLine(l, on){
    l.classList.toggle("hl", on);
    (l.getAttribute("data-n")||"").split(" ").forEach(function(id){ if(id && nodes[id]) nodes[id].g.classList.toggle("hl", on); });
  }

  /* ---- run ---- */
  function lineEl(l){
    var d = document.createElement("div");
    d.className = "ln " + l[0];
    var ids = (l[3]||"").replace(/\|/g," ").split(" ").map(function(s){ return s.split(":")[0]; }).filter(Boolean);
    d.setAttribute("data-n", ids.join(" "));
    var t = document.createElement("span"); t.className = "t"; t.textContent = l[1];
    var s = document.createElement("span"); s.className = "s";
    s.textContent = Array.isArray(l[2]) ? l[2][l[2].length-1] : l[2];
    d.appendChild(t); d.appendChild(s);
    d.addEventListener("mouseenter", function(){ hlLine(d, true); });
    d.addEventListener("mouseleave", function(){ hlLine(d, false); });
    return d;
  }
  function play(i){
    clear();
    idx = 0;
    var sc = SC[lang], lines = sc.lines;
    $("rtitle").textContent = sc.title;
        $("rsrc").textContent = sc.src;
    var f = $("rfoot"); f.textContent = sc.foot[0];
    for(var k = 1; k < sc.foot.length; k += 2){
      if(k > 1) f.appendChild(document.createTextNode(" · "));
      var a = document.createElement("a"); a.href = sc.foot[k]; a.target = "_blank"; a.rel = "noopener"; a.textContent = sc.foot[k+1]; f.appendChild(a);
    }
    drawModel(DATA.model);
    log.textContent = "";
    bar.style.transition = "none"; bar.style.width = "0";

    if(reduced){
      lines.forEach(function(l){ log.appendChild(lineEl(l)); applyStates((l[3]||"").split("|").pop()); });
      bar.style.width = "100%"; return;
    }
    var t = 0, total = 0;
    lines.forEach(function(l){ total += DELAY[l[0]] + (l[0]==="prog" ? l[2].length*DELAY.prog : 0); });
    later(function(){ bar.style.transition = "width " + total + "ms linear"; bar.style.width = "100%"; }, 30);

    lines.forEach(function(l, n){
      t += DELAY[l[0]];
      later(function(){
        var e = lineEl(l), st = (l[3]||"").split("|");
        applyStates(st[0]);
        if(l[0]==="prog"){
          var steps = l[2], s = e.querySelector(".s"); s.textContent = ""; e.classList.add("cur");
          steps.forEach(function(x, k){ later(function(){ s.textContent = x; if(k===steps.length-1){ e.classList.remove("cur"); applyStates(st[1]); } }, (k+1)*DELAY.prog); });
        }
        var prev = log.lastElementChild; if(prev) prev.classList.remove("cur");
        if(l[0]!=="prog" && n < lines.length-1) e.classList.add("cur");
        log.appendChild(e);
      }, t);
      if(l[0]==="prog") t += l[2].length*DELAY.prog;
    });
    /* plays once and stays; a card or ↻ replays */
  }


  $("replay").addEventListener("click", function(e){ e.preventDefault(); play(0); });
  window.Stage = {setLang:function(l){ lang = l; play(0); }, replay:function(){ play(0); }};
})();
