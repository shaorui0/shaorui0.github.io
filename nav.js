/* Shared top bar: Home · Projects ▾ · AI · Résumé · Blog.
   Include on every page with <script src="nav.js" defer></script> (from projects/: src="../nav.js").
   Paths are resolved against this script's own location, so the same file works from any depth.
   Language follows the page hash (#/en, #/cn), else localStorage "resume-lang". */
(function(){
  var me = document.currentScript || document.querySelector('script[src$="nav.js"]');
  var base = me.src.replace(/nav\.js(\?.*)?$/, "");
  var MENU = [
    {key:"projects", label:{en:"Projects", cn:"项目"}, items:[
      {href:"projects/k8s-upgrade.html", name:"K8s Upgrade Framework", desc:{en:"Upgrade framework that took 50 clusters from 1.24 to 1.29", cn:"50 集群 1.24→1.29 的升级框架"}},
      {href:"projects/doris.html", name:"Doris Platform", desc:{en:"ClickHouse → Doris, compute–storage separation", cn:"ClickHouse→Doris 存算分离"}},
      {href:"projects/oncall-triage.html", name:"Oncall Triage Agent", desc:{en:"Investigates alerts on its own", cn:"告警自主排查 agent"}},
      {href:"projects/finops-agent.html", name:"FinOps Agent", desc:{en:"Finds AWS cost waste, with evidence", cn:"AWS 成本浪费检测 agent"}},
      {sep:true},
      {href:"projects/aha-moment.html", name:"Aha Moment", tag:"personal", desc:{en:"Voice → local transcription → knowledge base", cn:"语音→本地转写→知识库"}}
    ]}
  ];
  /* AI is a direct link to the blog's AI category, where the AI writing lives */
  var AI = {en:"https://shaorui0.github.io/tech-en/categories/AI-Agent/", cn:"https://shaorui0.github.io/tech/categories/AI-Agent/"};

  function lang(){
    var m = (location.hash||"").match(/^#\/(en|cn)/); if(m) return m[1];
    try{ var v = localStorage.getItem("resume-lang"); if(v==="en"||v==="cn") return v; }catch(e){}
    return (navigator.language||"").toLowerCase().indexOf("zh")===0 ? "cn" : "en";
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

  var css = ''
   +'.snav{border-bottom:1px solid #ececec;background:#fff;position:sticky;top:0;z-index:50;font-family:-apple-system,"Helvetica Neue","Segoe UI","PingFang SC","Hiragino Sans GB",Roboto,sans-serif}'
   +'.snav .in{max-width:58rem;margin:0 auto;padding:0 16px;display:flex;gap:4px;align-items:center;height:44px;font-size:14px}'
   +'.snav a{color:#1a1a1a;text-decoration:none}'
   +'.snav .it{position:relative}'
   +'.snav .tb{display:block;padding:12px 10px;color:#4a4a4a;cursor:pointer;background:none;border:0;font:inherit}'
   +'.snav .tb:hover,.snav .it.open .tb,.snav .tb.on{color:#1a1a1a}'
   +'.snav .tb .car{font-size:10px;margin-left:3px;color:#9a9a9a}'
   +'.snav .dd{display:none;position:absolute;left:0;top:100%;min-width:300px;background:#fff;border:1px solid #e2e2e2;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.08);padding:6px}'
   +'.snav .it:hover .dd,.snav .it.open .dd{display:block}'
   +'.snav .dd a{display:block;padding:8px 10px;border-radius:6px}'
   +'.snav .dd a:hover,.snav .dd a.cur{background:#f4f4f2}'
   +'.snav .dd .nm{font-weight:600;font-size:14px}'
   +'.snav .dd .tg{font-size:11px;color:#9a9a9a;margin-left:6px;font-weight:400;letter-spacing:.04em}'
   +'.snav .dd .ds{display:block;font-size:12.5px;color:#767676;margin-top:1px}'
   +'.snav .dd hr{border:0;border-top:1px solid #efefef;margin:4px 6px}'
   +'@media(max-width:560px){.snav .dd{position:fixed;left:8px;right:8px;top:44px;min-width:0}.snav .it:hover .dd{display:none}.snav .it.open .dd{display:block}}';

  function render(){
    var l = lang(), here = location.pathname.replace(/\/+$/, "");
    var h = '<div class="in">';
    var onHome = here === "" || /\/index\.html$/.test(here) || base.replace(/^[a-z]+:\/\/[^\/]+/, "").replace(/\/+$/, "") === here;
    h += '<a class="tb'+(onHome?' on':'')+'" href="'+base+'#/'+l+'">'+(l==="cn"?"首页":"Home")+'</a>';
    MENU.forEach(function(g){
      var dd = g.items.map(function(x){
        if(x.sep) return "<hr>";
        var href = base + x.href, cur = here.slice(-x.href.length) === x.href;
        return '<a href="'+esc(href)+'#/'+l+'"'+(cur?' class="cur"':'')+'><span class="nm">'+esc(x.name)+'</span>'
          +(x.tag?'<span class="tg">'+esc(x.tag)+'</span>':'')+'<span class="ds">'+esc(x.desc[l])+'</span></a>';
      }).join("");
      h += '<div class="it" data-k="'+g.key+'"><button class="tb" type="button">'+esc(g.label[l])+'<span class="car">▾</span></button><div class="dd">'+dd+'</div></div>';
    });
    h += '<a class="tb" href="'+AI[l]+'">AI</a>';
    var onDeep = /deep\.html$/.test(here);
    h += '<a class="tb'+(onDeep?' on':'')+'" href="'+base+'deep.html#/'+l+'">'+(l==="cn"?"简历":"Résumé")+'</a>';
    h += '<a class="tb" href="https://shaorui0.github.io/'+(l==="cn"?"tech/":"tech-en/")+'">'+(l==="cn"?"博客":"Blog")+'</a>';
    h += '</div>';
    nav.innerHTML = h;
  }

  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var nav = document.createElement("nav"); nav.className = "snav";
  document.body.insertBefore(nav, document.body.firstChild);
  render();
  /* touch: tap a heading to toggle its menu; tap elsewhere closes */
  nav.addEventListener("click", function(e){
    var b = e.target.closest(".tb"); if(!b || b.tagName !== "BUTTON") return;
    var it = b.parentNode, was = it.classList.contains("open");
    nav.querySelectorAll(".it.open").forEach(function(x){ x.classList.remove("open"); });
    if(!was) it.classList.add("open");
  });
  document.addEventListener("click", function(e){ if(!nav.contains(e.target)) nav.querySelectorAll(".it.open").forEach(function(x){ x.classList.remove("open"); }); });
  window.addEventListener("hashchange", render);
})();
