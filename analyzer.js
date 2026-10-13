// ---------- AI stock analyzer (QYLD holdings · technical indicators, not advice) ----------
(function(){
const AXD={};const axGet=f=>AXD[f]||(AXD[f]=fetch('data/stocks/'+f+'.json').then(r=>r.json()));
const axSer=()=>AXD.ser||(AXD.ser=axGet('ax_series').then(o=>{for(const k in o){const a=o[k],p=[];let t=0;for(let i=0;i<a.length;i+=3){t+=a[i];p.push([t,a[i+1],a[i+2]]);}o[k]=p;}return o;}));
const TAGN={chips:'Chips',infra:'AI infra',cloud:'Cloud',apps:'AI apps',non:'Non‑AI'},TAGC={chips:'#84cc16',infra:'#fbbf24',cloud:'#60a5fa',apps:'#e879f9',non:'#566074'};
const TF=[['1D','d1',3],['5D','d5',6],['1M','m1',12],['YTD','ytd',40],['1Y','y1',60]];
const term=(k,t)=>`<span class="term" tabindex="0" role="button" aria-expanded="false" data-t="${k}">${t||k}</span>`;
const f=(v,d=1,s)=>v==null?'—':(s&&v>0?'+':'')+(v<0?'−':'')+Math.abs(v).toFixed(d)+(s?'%':'');
const cls=v=>v==null?'':v>0?'up':v<0?'dn':'';
function heat(v,lim,glow){if(v==null)return'#1b212c';const t=Math.max(-1,Math.min(1,v/lim)),a=glow?[120,140,170]:[38,44,56],b=t>0?[22,163,74]:[220,38,38],k=Math.abs(t)**.8;return `rgb(${a.map((x,i)=>Math.round(x+(b[i]-x)*k)).join(',')})`;}
function sq(it,x,y,w,h){const out=[];const T=it.reduce((s,q)=>s+q.v,0);if(!T||w<=0||h<=0)return out;let a=it.map(o=>({o,a:o.v*w*h/T}));
 while(a.length){const side=Math.min(w,h);const worst=r=>{const s=r.reduce((t,q)=>t+q.a,0),mx=Math.max(...r.map(q=>q.a)),mn=Math.min(...r.map(q=>q.a));return Math.max(side*side*mx/(s*s),s*s/(side*side*mn));};
  let row=[a[0]],i=1;while(i<a.length&&worst([...row,a[i]])<=worst(row)){row.push(a[i]);i++;}
  const s=row.reduce((t,q)=>t+q.a,0),th=s/side;let off=0;
  row.forEach(q=>{const l=q.a/th;out.push(w>=h?{o:q.o,x,y:y+off,w:th,h:l}:{o:q.o,x:x+off,y,w:l,h:th});off+=l;});
  if(w>=h){x+=th;w-=th;}else{y+=th;h-=th;}a=a.slice(i);}return out;}
function spark(p){if(!p||p.length<2)return'';const c=p.map(x=>x[1]),mn=Math.min(...c),mx=Math.max(...c),W=64,H=18;const pts=c.map((v,i)=>(i/(c.length-1)*W).toFixed(1)+','+(H-1-(v-mn)/((mx-mn)||1)*(H-2)).toFixed(1)).join(' ');
 return `<svg class="spk" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><polyline points="${pts}" fill="none" stroke="${c.at(-1)>=c[0]?'#4ade80':'#f87171'}" stroke-width="1.3"/></svg>`;}
const COLS=[['sym','Ticker'],['spk','3M'],['p','Price'],['d1','1D'],['m1','1M'],['ytd','YTD'],['rsi',term('RSI')],['v50','vs '+term('Moving average','50D')],['v200','vs 200D'],['hi','From '+term('52-week high','52w hi')],['lo','From 52w lo'],['vol',term('Volatility','Vol')],['mdd',term('Max drawdown','Max DD')],['beta',term('Beta')],['score',term('Technical signal','Signal')]];
async function render(el,S){
 if(el._ch)el._ch.forEach(c=>c.destroy());el._ch=[];if(el._g3){el._g3.destroy();el._g3=null;}
 const live=S.kind==='current';
 el.innerHTML=`<section class="ax" data-sec="ax"><div class="card s12"><h2 data-info="ax">AI stock analyzer · QYLD holdings <span class="badge">Technical signal, not advice</span></h2><div class="axbody"><div class="axload">Loading 101 stocks…</div></div></div></section>`;
 let A,M;try{[A,M]=await Promise.all([axGet('analyzer'),axGet('meta').catch(()=>null)]);}catch(e){el.querySelector('.axbody').innerHTML='<div class="axload">Couldn’t load stock data.</div>';return;}
 const key=live?'live':(A.snap[S.date]?S.date:null);const body=el.querySelector('.axbody');
 if(!key){body.innerHTML=`<div class="axload">Not archived for ${fd(S.date,1)}</div>`;decorate(el);return;}
 const R=A.snap[key],ci={};A.cols.forEach((c,i)=>ci[c]=i);const syms=Object.keys(R);const g=(s,c)=>R[s][ci[c]];
 const endT=live?Infinity:Date.parse(S.date+'T23:59:59Z')/1000;const st=el._st||(el._st={tf:'1D',grp:'sec',tag:'all',sort:'w',dir:-1,q:'',sel:null});
 const asof=live?'as of '+ptf(A.as_of,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' PT':'close '+new Date(Math.max(...syms.map(s=>g(s,'t')))*1000).toLocaleDateString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric'});
 // E-mini (same reference as the stocks chart)
 let es='';const E=M&&M.es;if(E){let p,c;if(live){p=E.price;c=E.prev;}else{const cc=(E.closes||[]).filter(x=>x[0]<=endT);if(cc.length&&endT-cc.at(-1)[0]<7*864e2){p=cc.at(-1)[1];c=cc.at(-2)?.[1];}}
  if(p!=null){const d=c?(p/c-1)*100:null;es=`<div class="axk"><span>${term('E-mini','ES E‑mini')}</span><b>${p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</b>${d!=null?`<em class="${cls(d)}">${f(d,2,1)}</em>`:''}</div>`;}}
 const n=syms.length,a200=syms.filter(s=>g(s,'v200')>0).length,adv=syms.filter(s=>g(s,'d1')>0).length,dec=syms.filter(s=>g(s,'d1')<0).length;
 body.innerHTML=`<div class="axstrip">
  <div class="axk"><span>${term('Market breadth','Breadth')} · above 200D</span><b>${Math.round(a200/n*100)}%</b><i class="axbar"><i style="width:${a200/n*100}%"></i></i></div>
  <div class="axk"><span>${term('Advancers / decliners','Adv / Dec')} · 1D</span><b><em class="up">${adv}</em> / <em class="dn">${dec}</em></b><i class="axbar ad"><i style="width:${adv/n*100}%"></i></i></div>
  <div class="axk axbw" data-best></div><div class="axk axbw" data-worst></div>${es}<div class="axk axas"><span>Prices</span><b>${asof}</b></div></div>
 <div class="axbar2"><div class="pills" data-tf>${TF.map(t=>`<button data-v="${t[0]}">${t[0]}</button>`).join('')}</div><div class="pills" data-grp><button data-v="sec">Sector</button><button data-v="ai">AI exposure</button></div><span class="cap axlg">Size = QYLD weight · colour = % change · <span class="axsc"><i style="background:${heat(-1,1)}"></i><i style="background:${heat(0,1)}"></i><i style="background:${heat(1,1)}"></i></span></span></div>
 <div class="axtm" data-tm></div><div class="axtip" hidden></div>
 <div class="g3"><h2 data-info="ax3" class="g3h">Correlation network · 3D <span class="ed" style="margin:0">drag to rotate · scroll or pinch to zoom · tap a node</span></h2>
 <div class="g3w"><div class="g3v" data-g3><div class="axload">Loading 3D view…</div></div><div class="g3s" data-g3s>
 <label class="g3k"><span>Link if correlation ≥ <b data-thrv>0.60</b></span><input type="range" min="40" max="90" step="5" value="60" data-thr aria-label="Correlation threshold"></label>
 <div class="g3k"><span>Pair correlations · 1Y</span><div class="g3hist" data-hist></div><div class="g3ax"><em>−0.2</em><em>0</em><em>0.5</em><em>1</em></div></div>
 <div class="g3k g3c"><span>Clusters · size</span><div data-cl></div><small class="cap" data-ne></small></div></div></div>
 <p class="cap">Each node is a stock, sized by QYLD weight and coloured by % change for the range above. Labels are tinted by group. Lines link stocks whose daily moves have a correlation at or above the threshold; brighter lines mean a stronger correlation. A cluster is a group of stocks connected by those lines.</p></div>
 <div class="axdet" data-det hidden></div>
 <div class="axbar2"><div class="pills" data-tag>${[['all','All'],...Object.entries(TAGN)].map(([k,v])=>`<button data-v="${k}">${v}</button>`).join('')}</div><input class="axq" type="search" placeholder="Filter ticker / name / sector" aria-label="Filter stocks" value="${esc(st.q)}"></div>
 <div class="tw axtw"><table class="axt"><thead><tr>${COLS.map(([k,l])=>`<th data-k="${k}">${l}</th>`).join('')}</tr></thead><tbody></tbody></table></div>
 <p class="cap">Indicators from daily closes · ${term('Beta')} vs QQQ over 1 year · signal = trend + momentum composite (0–100), a technical signal, not advice · tap a row or tile for its chart.</p>`;
 const tm=body.querySelector('[data-tm]'),tip=body.querySelector('.axtip'),tb=body.querySelector('tbody');let SER=null;
 const tfv=()=>TF.find(t=>t[0]===st.tf);
 const pills=()=>{body.querySelectorAll('[data-tf] button').forEach(b=>b.classList.toggle('on',b.dataset.v===st.tf));body.querySelectorAll('[data-grp] button').forEach(b=>b.classList.toggle('on',b.dataset.v===st.grp));body.querySelectorAll('[data-tag] button').forEach(b=>b.classList.toggle('on',b.dataset.v===st.tag));};
 function bw(){const [,k]=tfv();const o=syms.filter(s=>g(s,k)!=null).sort((x,y)=>g(y,k)-g(x,k));const li=a=>a.map(s=>`<a data-s="${s}"><u>${s}</u><em class="${cls(g(s,k))}">${f(g(s,k),1,1)}</em></a>`).join('');
  body.querySelector('[data-best]').innerHTML=`<span>Best · ${st.tf}</span><div>${li(o.slice(0,3))}</div>`;body.querySelector('[data-worst]').innerHTML=`<span>Worst · ${st.tf}</span><div>${li(o.slice(-3).reverse())}</div>`;}
 function treemap(){const [,k,lim]=tfv();const W=tm.clientWidth,H=tm.clientHeight;const grp={};
  syms.forEach(s=>{const gk=st.grp==='sec'?(A.sector[s]||['Other'])[0]:TAGN[A.ai[s]];(grp[gk]=grp[gk]||[]).push({s,v:A.weight[s]||.05});});
  const G=Object.entries(grp).map(([k2,a])=>({k:k2,a:a.sort((x,y)=>y.v-x.v),v:a.reduce((t,q)=>t+q.v,0)})).sort((x,y)=>y.v-x.v);
  let h='';sq(G,0,0,W,H).forEach(r=>{const hd=r.h>34&&r.w>40?14:0;h+=`<div class="axg" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px">${hd?`<b>${esc(r.o.k)}</b>`:''}</div>`;
   sq(r.o.a,r.x+1,r.y+hd+1,r.w-2,r.h-hd-2).forEach(q=>{const s=q.o.s,v=g(s,k),big=q.w>34&&q.h>22;
    h+=`<div class="axc${st.sel===s?' sel':''}" data-s="${s}" style="left:${q.x}px;top:${q.y}px;width:${Math.max(0,q.w-1)}px;height:${Math.max(0,q.h-1)}px;background:${heat(v,lim)}">${big?`<b style="font-size:${Math.max(9,Math.min(16,Math.sqrt(q.w*q.h)/5))}px">${s}</b>${q.h>36?`<em>${f(v,1,1)}</em>`:''}`:''}</div>`;});});
  tm.innerHTML=h;}
 function rows(){const q=st.q.trim().toLowerCase();let L=syms.filter(s=>(st.tag==='all'||A.ai[s]===st.tag)&&(!q||(s+' '+A.names[s]+' '+(A.sector[s]||[]).join(' ')).toLowerCase().includes(q)));
  const sv=s=>st.sort==='w'?A.weight[s]:st.sort==='sym'?s:st.sort==='spk'?g(s,'m1'):g(s,st.sort);
  L.sort((x,y)=>{const a=sv(x),b=sv(y);if(a==null)return 1;if(b==null)return-1;return (a<b?-1:a>b?1:0)*st.dir;});
  body.querySelectorAll('.axt th').forEach(th=>th.classList.toggle('so',th.dataset.k===st.sort));
  const sp=s=>SER&&SER[s]?spark(SER[s].filter(x=>x[0]<=endT).slice(-63)):'<i class="spk0"></i>';
  tb.innerHTML=L.map(s=>{const sc=g(s,'score');const pc=(c,d=1)=>`<td class="${cls(g(s,c))}">${f(g(s,c),d,1)}</td>`;
   return `<tr data-s="${s}" class="${st.sel===s?'sel':''}"><td class="tk"><b>${s}</b><i style="--c:${TAGC[A.ai[s]]}">${TAGN[A.ai[s]]}</i><small>${esc(A.names[s])} · ${A.weight[s].toFixed(2)}%</small></td><td>${sp(s)}</td><td>${f(g(s,'p'),2)}</td>${pc('d1',2)}${pc('m1')}${pc('ytd')}
   <td class="${g(s,'rsi')>70?'hot':g(s,'rsi')<30?'cold':''}">${f(g(s,'rsi'),0)}</td>${pc('v50')}${pc('v200')}${pc('hi')}${pc('lo')}<td>${f(g(s,'vol'),0)}%</td><td class="dn">${f(g(s,'mdd'),0)}%</td><td>${f(g(s,'beta'),2)}</td>
   <td><span class="axsig" style="--v:${sc}%;--c:${sc>=70?'#4ade80':sc>=40?'#fbbf24':'#f87171'}"><i></i>${sc}</span></td></tr>`;}).join('')||`<tr><td colspan="15" class="cap">No match</td></tr>`;}
 async function detail(s){st.sel=s;const d=body.querySelector('[data-det]');el._ch.forEach(c=>c.destroy());el._ch=[];if(!s){d.hidden=true;treemap();rows();return;}
  d.hidden=false;d.innerHTML=`<div class="axdh"><b>${s}</b><span>${esc(A.names[s])} · ${esc((A.sector[s]||[]).filter(Boolean).join(' · '))}</span><i style="--c:${TAGC[A.ai[s]]}">${TAGN[A.ai[s]]}</i><button class="axx" aria-label="Close chart">✕</button></div>
   <div class="axds">${[['Price',f(g(s,'p'),2)],['1D',f(g(s,'d1'),2,1),g(s,'d1')],['YTD',f(g(s,'ytd'),1,1),g(s,'ytd')],['RSI',f(g(s,'rsi'),0)],['vs 200D',f(g(s,'v200'),1,1),g(s,'v200')],['Beta',f(g(s,'beta'),2)],['Signal',g(s,'score')]].map(([k,v,c])=>`<span>${k} <b class="${c!=null?cls(c):''}">${v}</b></span>`).join('')}</div>
   <div class="cv axpc"><canvas></canvas></div><div class="cv axrc"><canvas></canvas></div>`;
  treemap();rows();d.querySelector('.axx').onclick=()=>detail(null);
  if(!SER)SER=await axSer().catch(()=>null);const P=(SER&&SER[s]||[]).filter(x=>x[0]<=endT);if(st.sel!==s||!P.length)return;
  const c=P.map(x=>x[1]),ma=n=>c.map((_,i)=>i>=n-1?c.slice(i-n+1,i+1).reduce((a,b)=>a+b,0)/n:null);const m50=ma(50),m200=ma(200);
  const rs=[];let ag=0,al=0;for(let i=1;i<c.length;i++){const ch=c[i]-c[i-1],gn=Math.max(ch,0),ls=Math.max(-ch,0);if(i<=14){ag+=gn/14;al+=ls/14;rs[i]=i===14?(al?100-100/(1+ag/al):100):null;}else{ag=(ag*13+gn)/14;al=(al*13+ls)/14;rs[i]=al?100-100/(1+ag/al):100;}}
  const k0=Math.max(0,P.length-252),sl=a=>a.slice(k0),lb=sl(P.map(x=>new Date(x[0]*1000).toLocaleDateString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric'})));const vmax=Math.max(...sl(P.map(x=>x[2])));
  const x={grid:{display:false},ticks:{maxTicksLimit:innerWidth<500?4:8,maxRotation:0}};
  el._ch.push(new Chart(d.querySelector('.axpc canvas'),{data:{labels:lb,datasets:[{type:'line',label:s,data:sl(c),borderColor:'#eef0f4',borderWidth:1.6,pointRadius:0,yAxisID:'y'},{type:'line',label:'50D MA',data:sl(m50),borderColor:'#7dd3fc',borderWidth:1.2,pointRadius:0,yAxisID:'y'},{type:'line',label:'200D MA',data:sl(m200),borderColor:'#fb923c',borderWidth:1.2,pointRadius:0,yAxisID:'y'},
   {type:'bar',label:'Volume',data:sl(P.map(x=>x[2]*1000)),backgroundColor:sl(P.map((x,i)=>i&&x[1]<P[i-1][1]?'#f8717155':'#4ade8055')),yAxisID:'v',barPercentage:1,categoryPercentage:1}]},
   options:{animation:false,interaction:{mode:'index',intersect:false},scales:{x:Object.assign({},x,{ticks:{display:false}}),y:{position:'right',grid:{color:'#1b212c'}},v:{display:false,min:0,max:vmax*1000*5}},plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:10,boxHeight:2,filter:i=>i.text!=='Volume'}},tooltip:{callbacks:{label:t=>t.dataset.label+': '+(t.dataset.label==='Volume'?(t.raw/1e6).toFixed(1)+'M':t.raw==null?'—':t.raw.toFixed(2))}}}}}));
  el._ch.push(new Chart(d.querySelector('.axrc canvas'),{type:'line',data:{labels:lb,datasets:[{label:'RSI(14)',data:sl(rs).map(v=>v==null?null:+v.toFixed(1)),borderColor:'#c4b5fd',borderWidth:1.3,pointRadius:0},{data:lb.map(()=>70),borderColor:'#f8717188',borderDash:[3,3],borderWidth:1,pointRadius:0},{data:lb.map(()=>30),borderColor:'#4ade8088',borderDash:[3,3],borderWidth:1,pointRadius:0}]},
   options:{animation:false,interaction:{mode:'index',intersect:false},scales:{x,y:{position:'right',min:0,max:100,ticks:{autoSkip:false},afterBuildTicks:a=>{a.ticks=[{value:30},{value:70}];},grid:{color:'#1b212c'}}},plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:10,boxHeight:2,filter:i=>i.datasetIndex===0}},tooltip:{filter:t=>t.datasetIndex===0}}}}));}
 function all(){pills();bw();treemap();rows();if(el._g3)el._g3.update();}
 const g3el=body.querySelector('.g3');const g3io=new IntersectionObserver(async es=>{if(!es.some(e=>e.isIntersecting))return;g3io.disconnect();
  try{const [m,C]=await Promise.all([import('./analyzer3d.js'),axGet('ax_corr').catch(()=>null)]);if(!g3el.isConnected)return;
   el._g3=await m.mount(g3el,{A,R,C:C&&C.snap[key]?Object.assign({syms:C.syms},C.snap[key]):null,g,st,heat,tfv,f,cls,esc,open:(s,keep)=>{detail(s);body.querySelector('[data-det]').scrollIntoView({block:'nearest',behavior:'smooth'});}});
   if(el._g3&&st.sel)el._g3.focus(st.sel);}catch(e){console.warn('3D view',e);g3el.querySelector('[data-g3]').innerHTML='<div class="axload">3D view unavailable</div>';}},{rootMargin:'400px 0px'});g3io.observe(g3el);
 body.querySelector('[data-tf]').onclick=e=>{const b=e.target.closest('button');if(b){st.tf=b.dataset.v;all();}};
 body.querySelector('[data-grp]').onclick=e=>{const b=e.target.closest('button');if(b){st.grp=b.dataset.v;all();}};
 body.querySelector('[data-tag]').onclick=e=>{const b=e.target.closest('button');if(b){st.tag=b.dataset.v;all();}};
 body.querySelector('.axq').oninput=e=>{st.q=e.target.value;rows();};
 body.querySelector('thead').onclick=e=>{if(e.target.closest('.term'))return;const th=e.target.closest('th');if(!th)return;const k=th.dataset.k;if(st.sort===k)st.dir*=-1;else{st.sort=k;st.dir=k==='sym'?1:-1;}rows();};
 const open=s=>{detail(st.sel===s?null:s);if(st.sel)body.querySelector('[data-det]').scrollIntoView({block:'nearest',behavior:'smooth'});};
 tb.onclick=e=>{const r=e.target.closest('tr[data-s]');if(r)open(r.dataset.s);};
 body.querySelector('.axstrip').onclick=e=>{const a=e.target.closest('a[data-s]');if(a)open(a.dataset.s);};
 tm.onclick=e=>{const c=e.target.closest('.axc');if(c)open(c.dataset.s);};
 tm.onmousemove=e=>{const c=e.target.closest('.axc');if(!c||!matchMedia('(hover:hover)').matches){tip.hidden=true;return;}const s=c.dataset.s;
  tip.innerHTML=`<b>${s}</b> ${esc(A.names[s])}<br>${TF.map(([l,k])=>`${l} <em class="${cls(g(s,k))}">${f(g(s,k),1,1)}</em>`).join(' · ')}<br>Weight ${A.weight[s].toFixed(2)}% · RSI ${f(g(s,'rsi'),0)} · signal ${g(s,'score')}`;
  tip.hidden=false;const br=body.getBoundingClientRect();let lx=e.clientX-br.left+14;if(lx+260>br.width)lx=e.clientX-br.left-274;tip.style.left=Math.max(0,lx)+'px';tip.style.top=(e.clientY-br.top+14)+'px';};
 tm.onmouseleave=()=>tip.hidden=true;
 all();decorate(el);
 new ResizeObserver(()=>{if(tm.isConnected&&tm._w!==tm.clientWidth){tm._w=tm.clientWidth;treemap();}}).observe(tm);
 axSer().then(o=>{SER=o;rows();if(st.sel)detail(st.sel);}).catch(()=>{});
 if(st.sel)detail(st.sel);}
// lazy: render only when the section is near the viewport
window.AX={mount(el,S){el._S=S;if(el._io)el._io.disconnect();if(!S){el.innerHTML='';return;}el.innerHTML='<section class="ax" data-sec="ax"><div class="card s12 axph"></div></section>';
 el._io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){el._io.disconnect();render(el,el._S);}},{rootMargin:'900px 0px'});el._io.observe(el);}};
})();
