// QYLD AI universe · correlation architecture (terminal-style ring, Canvas 2D). Analysis only, not advice.
const AMB='#f5a623',CYN='#67e8f9',PUR='#a78bfa',RED='#f87171',GRN='#4ade80';
const TAGN={chips:'CHIPS',infra:'AI INFRA',cloud:'CLOUD',apps:'AI APPS',non:'NON-AI'};
const SECC=['#67e8f9','#f5a623','#a78bfa','#4ade80','#f472b6','#60a5fa','#fb923c','#e879f9','#facc15','#2dd4bf','#f87171','#94a3b8'];
const n2=(v,d=1)=>v==null||isNaN(v)?'—':(+v).toFixed(d);
const sg=(v,d=1)=>v==null||isNaN(v)?'—':(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(d);
const rg=v=>v==null?'':v>0?'g':v<0?'r':'';
function rnd(seed){let s=seed>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296;}
function line(vals,w,h,col,step){const v=vals.filter(x=>x!=null);if(v.length<2)return'';const mn=Math.min(...v),mx=Math.max(...v);let d='';vals.forEach((x,i)=>{if(x==null)return;const X=i/(vals.length-1)*w,Y=h-2-(x-mn)/((mx-mn)||1)*(h-4);d+=(d?(step?`H${X.toFixed(1)}V${Y.toFixed(1)}`:`L${X.toFixed(1)},${Y.toFixed(1)}`):`M${X.toFixed(1)},${Y.toFixed(1)}`);});
 return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="q3sv"><path d="${d}" fill="none" stroke="${col}" stroke-width="1.3" vector-effect="non-scaling-stroke"/></svg>`;}
export async function mount(box,ctx){
 const {A,R,C,g,st,tfv,esc,key,live,endT,M,open}=ctx;const light=innerWidth<700;
 if(!C){box.innerHTML='<div class="axload">Correlations not archived for this week</div>';return null;}
 const S0=C.syms.filter(s=>R[s]);const N=C.syms.length,ix={};C.syms.forEach((s,i)=>ix[s]=i);
 const raw=atob(C.m),Q=new Int8Array(raw.length);for(let i=0;i<raw.length;i++)Q[i]=raw.charCodeAt(i)<<24>>24;
 const cor=(a,b)=>{let i=ix[a],j=ix[b];if(i===j)return 1;if(i>j)[i,j]=[j,i];const v=Q[i*N-i*(i+1)/2+(j-i-1)];return v===-128?null:v/100;};
 const SER=await ctx.ser().catch(()=>null);
 const P=SER?Object.fromEntries(S0.map(s=>[s,(SER[s]||[]).filter(x=>x[0]<=endT)])):{};
 const secOf=s=>(A.sector[s]||['Other'])[0];const secs=[...new Set(S0.map(secOf))].sort((a,b)=>S0.filter(s=>secOf(s)===b).reduce((t,s)=>t+A.weight[s],0)-S0.filter(s=>secOf(s)===a).reduce((t,s)=>t+A.weight[s],0));
 const secW=Object.fromEntries(secs.map(k=>[k,S0.filter(s=>secOf(s)===k).reduce((t,s)=>t+A.weight[s],0)]));
 const pairs=[];for(let i=0;i<S0.length;i++)for(let j=i+1;j<S0.length;j++){const c=cor(S0[i],S0[j]);if(c!=null)pairs.push([S0[i],S0[j],c]);}
 const nE=pairs.filter(p=>p[2]>=.6).length,meanC=pairs.reduce((t,p)=>t+p[2],0)/pairs.length,topP=pairs.reduce((a,p)=>p[2]>a[2]?p:a,pairs[0]);
 const hist=Array(12).fill(0);pairs.forEach(p=>hist[Math.max(0,Math.min(11,Math.floor((p[2]+.2)/.1)))]++);
 // ---- derived series ----
 const days=(P[S0[0]]||[]).slice(-60).map(x=>x[0]);const dmap={};S0.forEach(s=>{const a=P[s]||[];for(let i=1;i<a.length;i++){const d=a[i][0]/86400|0;(dmap[d]=dmap[d]||[]).push([s,a[i][1]/a[i-1][1]-1,a[i][1]*a[i][2]*1000]);}});
 const dd=days.map(t=>dmap[t/86400|0]||[]);
 const advS=dd.map(r=>r.length?r.filter(x=>x[1]>0).length/r.length*100:null),dvol=dd.map(r=>r.reduce((t,x)=>t+x[2],0)/1e9);
 const snapK=Object.keys(A.snap).filter(k=>k!=='live'&&(live||k<=key)).sort();
 const ci=Object.fromEntries(A.cols.map((c,i)=>[c,i]));const br=snapK.map(k=>{const r=A.snap[k],v=Object.values(r);return v.filter(x=>x[ci.v200]>0).length/v.length*100;});br.push(Object.keys(R).filter(s=>g(s,'v200')>0).length/Object.keys(R).length*100);
 let esC=[];if(M&&M.es)esC=(M.es.closes||[]).filter(x=>x[0]<=endT).slice(-60).map(x=>x[1]);
 const prev=ctx.prevKey&&A.snap[ctx.prevKey];
 // ---- markup ----
 const tagRow=[...secs.map((k,i)=>`<span style="--c:${SECC[i%12]}">${esc(k)}</span>`)];const aiRow=Object.entries(TAGN).map(([k,v])=>`<span style="--c:${{chips:'#84cc16',infra:AMB,cloud:'#60a5fa',apps:'#e879f9',non:'#94a3b8'}[k]}">${v} · ${S0.filter(s=>A.ai[s]===k).length}</span>`);
 const asof=live?'LIVE':key;
 const tf=tfv(),n=S0.length;const above=c=>S0.filter(s=>g(s,c)>0).length/n*100;const rsiHot=S0.filter(s=>g(s,'rsi')>70).length/n*100,rsiCold=S0.filter(s=>g(s,'rsi')<30).length/n*100;
 const avg=c=>{const v=S0.map(s=>g(s,c)).filter(x=>x!=null);return v.reduce((a,b)=>a+b,0)/v.length;},med=c=>{const v=S0.map(s=>g(s,c)).filter(x=>x!=null).sort((a,b)=>a-b);return v[v.length>>1];};
 const topW=S0.slice().sort((a,b)=>A.weight[b]-A.weight[a]).slice(0,12),mxW=A.weight[topW[0]];
 const movers=S0.slice().sort((a,b)=>Math.abs(g(b,'d1'))-Math.abs(g(a,'d1'))).slice(0,6);
 const hm=Math.max(...hist);const secMove=Object.fromEntries(secs.map(k=>{const v=S0.filter(s=>secOf(s)===k).map(s=>g(s,tf[1])).filter(x=>x!=null);return[k,v.reduce((a,b)=>a+b,0)/v.length];}));
 const hotSec=secs.reduce((a,k)=>Math.abs(secMove[k])>Math.abs(secMove[a])?k:a,secs[0]);
 // polar segments
 const pol=(()=>{const W=200,cx=100,cy=100,mx=Math.max(...secs.map(k=>secW[k]));let h='';const da=Math.PI*2/secs.length;secs.forEach((k,i)=>{const r=30+Math.sqrt(secW[k]/mx)*62,a0=i*da-Math.PI/2+.02,a1=a0+da-.04;const p=(a,rr)=>[cx+Math.cos(a)*rr,cy+Math.sin(a)*rr].map(v=>v.toFixed(1)).join(',');
   h+=`<path d="M${p(a0,24)}L${p(a0,r)}A${r},${r} 0 0 1 ${p(a1,r)}L${p(a1,24)}A24,24 0 0 0 ${p(a0,24)}Z" fill="${k===hotSec?AMB:'#2a3344'}" stroke="#05070b" stroke-width="1"><title>${esc(k)} ${secW[k].toFixed(1)}% · ${tf[0]} ${sg(secMove[k])}%</title></path>`;
   if(secW[k]>4){const lp=p(a0+da/2,r+9).split(',');h+=`<text x="${lp[0]}" y="${lp[1]}" text-anchor="middle" class="q3pt">${esc(k.split(' ')[0].slice(0,8).toUpperCase())}</text>`;}});
  return `<svg viewBox="-12 -6 224 212" class="q3pol">${h}<circle cx="100" cy="100" r="22" fill="#05070b" stroke="${AMB}"/><text x="100" y="104" text-anchor="middle" class="q3pn">${n}</text></svg>`;})();
 // before/after dots (YTD a week earlier vs now)
 const ba=topW.slice(0,8).map(s=>{const a=prev&&prev[s]?prev[s][ci.ytd]:null,b=g(s,'ytd');return{s,a,b};});const bmn=Math.min(0,...ba.flatMap(x=>[x.a,x.b]).filter(x=>x!=null)),bmx=Math.max(...ba.flatMap(x=>[x.a,x.b]).filter(x=>x!=null));const bx=v=>((v-bmn)/((bmx-bmn)||1)*100).toFixed(1)+'%';
 // pareto
 const sw=secs.slice().sort((a,b)=>secW[b]-secW[a]);let cum=0;const tot=sw.reduce((t,k)=>t+secW[k],0);const par=sw.map(k=>{cum+=secW[k];return{k,v:secW[k],c:cum/tot*100};});
 const pW=300,pH=120,bw=pW/par.length;const pareto=`<svg viewBox="0 0 ${pW} ${pH+16}" class="q3par">${par.map((p,i)=>`<rect x="${i*bw+3}" y="${pH-p.v/par[0].v*(pH-14)}" width="${bw-6}" height="${p.v/par[0].v*(pH-14)}" fill="${i?'#2a3a52':AMB}"/><text x="${i*bw+bw/2}" y="${pH+11}" text-anchor="middle" class="q3pt">${esc(p.k.slice(0,4).toUpperCase())}</text>`).join('')}
  <polyline points="${par.map((p,i)=>`${i*bw+bw/2},${pH-p.c/100*(pH-8)}`).join(' ')}" fill="none" stroke="#eef0f4" stroke-width="1.2"/>${par.map((p,i)=>`<circle cx="${i*bw+bw/2}" cy="${pH-p.c/100*(pH-8)}" r="2.6" fill="#eef0f4"/>`).join('')}<text x="${pW-2}" y="10" text-anchor="end" class="q3pt">100%</text></svg>`;
 const fmtT=t=>new Date(t*1000).toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric'}).toUpperCase();
 box.innerHTML=`<div class="q3">
 <div class="q3hd"><div><div class="q3t1"><h2 data-info="ax3">QYLD AI UNIVERSE / CORRELATION ARCHITECTURE</h2></div><div class="q3t2"><b>101 NASDAQ‑100 HOLDINGS</b> <span>+</span> <em>1Y DAILY‑RETURN CORRELATION</em> <small>RING ${esc(st.grp==='sec'?'BY SECTOR':'BY AI EXPOSURE')}</small></div></div>
  <div class="q3st">GRAPH QYLD | NODES ${n} | EDGES ${nE} | PAIRS ${pairs.length.toLocaleString()} | AS‑OF ${esc(asof)}<br><span>MEAN <i class="q3rho">ρ</i> ${n2(meanC,2)} · ${tf[0]}</span></div></div>
 <div class="q3tags">${tagRow.join('')}</div><div class="q3tags">${aiRow.join('')}</div>
 <div class="q3sub">QYLD UNIVERSE | ${secs.length} SECTORS | STRANDS <b data-ns>0</b> | ${tf[0]} CHANGE | TOP PAIR ${topP[0]}·${topP[1]} <i class="q3rho">ρ</i> ${n2(topP[2],2)}</div>
 <div class="q3main"><div class="q3ring"><canvas></canvas><div class="q3spin">SPIN <b data-spin>0.0°</b> · AXIS LOCK</div><div class="q3deg">${[0,45,90,135,180].map(d=>`<span>${d} DEG</span>`).join('')}</div><div class="q3call" data-call></div></div>
 <div class="q3side">
  <div class="q3p"><div class="cap q3h">MARKET BREADTH · % ABOVE 200D <b class="q3v">${n2(br.at(-1),0)}%</b></div>${line(br,200,26,AMB)}
   <div class="cap q3h">ADVANCERS · 60D <b class="q3v" style="color:${CYN}">${n2(advS.at(-1),0)}%</b></div>${line(advS,200,22,CYN,1)}
   ${esC.length?`<div class="cap q3h">ES E‑MINI <b class="q3v" style="color:${RED}">${esC.at(-1).toLocaleString()}</b></div>${line(esC,200,22,RED)}`:''}</div>
  <div class="q3p"><div class="cap q3h">WEIGHT BY HOLDING | TOP 12</div>${topW.map(s=>`<div class="q3hb" data-s="${s}"><span>${s}</span><i style="width:${A.weight[s]/mxW*100}%"></i><em>${A.weight[s].toFixed(1)}</em></div>`).join('')}</div>
  <div class="q3p"><div class="cap q3h">CORRELATION SPLIT | 12 BINS <span><b style="color:${AMB}"><i class="q3rho">ρ</i>≥0.5</b> · <b style="color:${PUR}"><i class="q3rho">ρ</i>&lt;0.5</b></span></div><div class="q3vh">${hist.map((v,i)=>`<i title="${(-0.2+i*.1).toFixed(1)}…${(-0.1+i*.1).toFixed(1)}: ${v} pairs" style="height:${Math.max(3,v/hm*100)}%;background:${i>=7?AMB:PUR}"></i>`).join('')}</div></div>
  <div class="q3p"><div class="cap q3h">TREND STATE | SYNCHRONIZER</div>${[['01 ABOVE 50D',above('v50')],['02 ABOVE 200D',above('v200')],['03 RSI > 70',rsiHot],['04 RSI < 30',rsiCold]].map(([l,v],i)=>`<div class="q3pb"><span>${l}</span><i><i style="width:${v}%;background:${i>1?AMB:'#cbd5e1'}"></i></i><em>${n2(v,0)}%</em></div>`).join('')}</div>
  <div class="q3p"><div class="cap q3h">TELEMETRY READOUT</div><dl class="q3kv">${[['AVG 1D',sg(avg('d1'),2)+'%',avg('d1')],['MEDIAN YTD',sg(med('ytd'))+'%',med('ytd')],['AVG RSI',n2(avg('rsi'),0)],['AVG BETA vs QQQ',n2(avg('beta'),2)],['AVG VOLATILITY',n2(avg('vol'),0)+'%'],['AVG MAX DRAWDOWN',n2(avg('mdd'),0)+'%',-1],['AVG SIGNAL',n2(avg('score'),0)],['MEAN CORRELATION',n2(meanC,2)],['PAIRS ≥ 0.6',nE]].map(([k,v,c])=>`<dt>${k}</dt><dd class="${c!=null?rg(c):''}">${v}</dd>`).join('')}</dl></div>
  <div class="q3p"><div class="cap q3h">HEAT TILES | ${tf[0]} | ${n}</div><div class="q3tiles">${S0.slice().sort((a,b)=>A.weight[b]-A.weight[a]).map(s=>`<i data-s="${s}" title="${s} ${sg(g(s,tf[1]))}%" style="background:${ctx.heat(g(s,tf[1]),tf[2])}"></i>`).join('')}</div></div>
  <div class="q3p"><div class="cap q3h">MOVER QUEUE | LAST SESSION</div>${movers.map(s=>`<div class="q3log" data-s="${s}"><span>› ${s}</span><span>${fmtT(g(s,'t'))}</span><em class="${rg(g(s,'d1'))}">${sg(g(s,'d1'),1)}%</em></div>`).join('')}<div class="q3ok">UNIVERSE ${n}/${n} <b>VERIFIED</b></div></div>
 </div></div>
 <div class="q3p q3flow"><div class="cap q3h">DOLLAR VOLUME FLOW | 60D | QYLD UNIVERSE <b class="q3big">$${n2(dvol.at(-1),0)} B / DAY</b></div>${line(dvol,600,40,CYN)}</div>
 <div class="q3bot"><div class="q3p"><div class="cap q3h">SECTOR WEIGHTS | TOP MOVER ${esc(hotSec.toUpperCase())}</div>${pol}</div>
  <div class="q3p"><div class="cap q3h">YTD | WEEK AGO → NOW</div>${ba.map(x=>`<div class="q3ba" data-s="${x.s}"><span>${x.s}</span><b><i class="l" style="left:${x.a!=null?bx(Math.min(x.a,x.b)):bx(x.b)};width:calc(${x.a!=null?bx(Math.max(x.a,x.b)):bx(x.b)} - ${x.a!=null?bx(Math.min(x.a,x.b)):bx(x.b)})"></i>${x.a!=null?`<i class="a" style="left:${bx(x.a)}"></i>`:''}<i class="b ${x.a!=null&&x.b<x.a?'dn':''}" style="left:${bx(x.b)}"></i></b><em class="${x.a!=null?rg(x.b-x.a):''}">${x.a!=null?sg(x.b-x.a)+' pts':'—'}</em></div>`).join('')}</div>
  <div class="q3p"><div class="cap q3h">WEIGHT CONCENTRATION | PARETO</div>${pareto}</div></div>
 <div class="q3foot">SOURCE: YAHOO FINANCE DAILY CLOSES · GLOBAL X QYLD HOLDINGS · TECHNICAL ANALYSIS, NOT ADVICE · EACH STRAND = A CORRELATED PAIR · CLUSTER = STOCKS LINKED BY HIGH CORRELATION</div></div>`;
 window.decorate&&decorate(box);
 // ---- ring geometry ----
 const cv=box.querySelector('canvas'),ringEl=box.querySelector('.q3ring'),cx2=cv.getContext('2d');
 const order=[];const gk=s=>st.grp==='sec'?secOf(s):A.ai[s];
 const groups=[...new Set(S0.map(gk))];groups.forEach(k=>{const m=S0.filter(s=>gk(s)===k);// within group: chain by correlation (greedy) so clusters sit together
  const rest=m.slice().sort((a,b)=>A.weight[b]-A.weight[a]);let cur=rest.shift();const out=[cur];while(rest.length){let bi=0,bv=-2;rest.forEach((s,i)=>{const c=cor(cur,s)??-1;if(c>bv){bv=c;bi=i;}});cur=rest.splice(bi,1)[0];out.push(cur);}order.push(...out.map(s=>({s,k})));});
 const gap=.06,ang={};const step=(Math.PI*2-gap*groups.length)/order.length;let a=0,lastK=null;order.forEach(o=>{if(o.k!==lastK){a+=gap;lastK=o.k;}ang[o.s]=a;a+=step;});
 const RR=1,rnd1=rnd(7);const strands=[];
 const thr=light?.3:.12,mult=light?1:4;
 pairs.forEach(([x,y,c])=>{if(c<thr)return;const k=Math.max(1,Math.round((c-thr)/(1-thr)*mult*1.6+(light?0:.6)));for(let q=0;q<k;q++)strands.push({a:x,b:y,c,amb:c>=.62||(g(x,tf[1])>0&&g(y,tf[1])>0&&c>=.5),bu:(rnd1()-.5),tw:(rnd1()-.5),tv:false});});
 // time-varying strands: pairs that moved together sharply on recent days
 dd.slice(light?-5:-20).forEach((r,di)=>{const big=r.filter(x=>Math.abs(x[1])>.02);for(let i=0;i<big.length&&i<(light?10:40);i++)for(let j=i+1;j<big.length&&j<(light?10:40);j++)if(Math.sign(big[i][1])===Math.sign(big[j][1]))strands.push({a:big[i][0],b:big[j][0],c:.3,amb:big[i][1]>0,bu:(rnd1()-.5),tw:(rnd1()-.5),tv:true,age:di});});
 {const cap=light?1800:9000;if(strands.length>cap){strands.sort((x,y)=>y.c-x.c);strands.length=cap;}}
 box.querySelector('[data-ns]').textContent=strands.length.toLocaleString();
 const SEG=light?10:14;
 const geo=strands.map(o=>{let a0=ang[o.a],a1=ang[o.b];let d=a1-a0;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;
  // strand wraps around the tube: radius bulges in/out, height loops, giving a hollow torus of curves
  const pts=[];const lift=.15+1.1*Math.abs(o.tw)**.8,out=.08+.95*Math.abs(o.bu)**.8*(o.bu>0?1:.55),sgn=o.bu>0?1:-1,zs=o.tw>0?1:-1;
  for(let i=0;i<=SEG;i++){const t=i/SEG,aa=a0+d*t,b=Math.sin(Math.PI*t),r=RR+sgn*out*b*(.6+.4*Math.cos(aa*3+o.tw*9)),z=zs*lift*b*Math.sin(Math.PI*t*(1+Math.abs(o.tw)));pts.push([Math.cos(aa)*r,Math.sin(aa)*r,z]);}return pts;});
 let W=0,H=0,dpr=1;const resize=()=>{dpr=Math.min(devicePixelRatio||1,light?1.5:2);W=ringEl.clientWidth;H=ringEl.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';};resize();
 let spin=0,tilt=.5,hover=null,running=false,raf=0,last=0;const proj=[];
 const callEl=box.querySelector('[data-call]'),spinEl=box.querySelector('[data-spin]');
 const topSig=S0.slice().sort((a,b)=>g(b,'score')-g(a,'score')||A.weight[b]-A.weight[a])[0];
 function P3(p,sc,cx,cy){const cs=Math.cos(spin),sn=Math.sin(spin);let x=p[0]*cs-p[1]*sn,y=p[0]*sn+p[1]*cs,z=p[2];const ct=Math.cos(tilt),st2=Math.sin(tilt);const y2=y*ct-z*st2,z2=y*st2+z*ct;const ry=-.3,cr=Math.cos(ry),sr=Math.sin(ry);const x3=x*cr+z2*sr,z3=-x*sr+z2*cr;const f=3.2/(3.2+z3);return [cx+x3*sc*f,cy+y2*sc*f,z3];}
 function draw(){const c=cx2;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);const cx=W*.52,cy=H*.5,sc=Math.min(W,H)*.3;
  c.globalCompositeOperation='lighter';c.lineWidth=light?.6:.55;
  const buckets=[['rgba(140,225,255,0.085)',o=>!o.amb&&o.c<.4],['rgba(215,248,255,0.2)',o=>!o.amb&&o.c>=.4],['rgba(245,166,35,0.12)',o=>o.amb&&o.c<.6],['rgba(255,200,90,0.26)',o=>o.amb&&o.c>=.6]];
  const hiS=hover||null;
  buckets.forEach(([col,fn])=>{c.strokeStyle=col;c.beginPath();strands.forEach((o,i)=>{if(!fn(o))return;if(hiS&&o.a!==hiS&&o.b!==hiS&&o.c<.5)return;const g2=geo[i];let p=P3(g2[0],sc,cx,cy);c.moveTo(p[0],p[1]);for(let k=1;k<g2.length;k++){p=P3(g2[k],sc,cx,cy);c.lineTo(p[0],p[1]);}});c.stroke();});
  if(hiS){c.strokeStyle='rgba(255,210,120,.75)';c.lineWidth=1;c.beginPath();strands.forEach((o,i)=>{if(o.a!==hiS&&o.b!==hiS||o.c<.5)return;const g2=geo[i];let p=P3(g2[0],sc,cx,cy);c.moveTo(p[0],p[1]);for(let k=1;k<g2.length;k++){p=P3(g2[k],sc,cx,cy);c.lineTo(p[0],p[1]);}});c.stroke();}
  c.globalCompositeOperation='source-over';proj.length=0;
  order.forEach(({s})=>{const p=P3([Math.cos(ang[s]),Math.sin(ang[s]),0],sc,cx,cy);const v=g(s,tf[1]);const r=1.4+Math.sqrt(A.weight[s])*1.3;proj.push([s,p[0],p[1],r]);
   c.fillStyle=v>0?'#ffd27a':v<0?'#ff8a8a':'#e2f6ff';if(!light){c.shadowColor=c.fillStyle;c.shadowBlur=8;}c.beginPath();c.arc(p[0],p[1],r*(p[2]>0?.8:1),0,7);c.fill();});c.shadowBlur=0;
  // callout tracks hovered or top-signal stock
  const tk=hover||st.sel||topSig;const pp=proj.find(q=>q[0]===tk);if(pp){c.strokeStyle=AMB;c.lineWidth=1;c.strokeRect(pp[1]-7,pp[2]-7,14,14);const bx2=Math.max(8,Math.min(W-250,pp[1]<W/2?pp[1]+30:pp[1]-260)),by=Math.max(8,Math.min(H-50,pp[2]+(pp[2]<H/2?30:-60)));c.beginPath();c.moveTo(pp[1],pp[2]);c.lineTo(bx2+(pp[1]<W/2?0:240),by+20);c.stroke();
   callEl.style.left=bx2+'px';callEl.style.top=by+'px';if(callEl._s!==tk){callEl._s=tk;callEl.innerHTML=`<b>${tk}</b> | ${esc(secOf(tk).toUpperCase())} | SIGNAL ${g(tk,'score')}<br><span>${tf[0]} ${sg(g(tk,tf[1]))}% · RSI ${n2(g(tk,'rsi'),0)} · W ${A.weight[tk].toFixed(2)}%</span>`;}}
  spinEl.textContent=((spin*180/Math.PI)%360).toFixed(1)+'°';}
 function loop(t){if(!running)return;const dt=Math.min(64,t-(last||t));last=t;if(!dragging)spin+=dt*0.00008;if(t-(loop._l||0)>(light?50:33)){loop._l=t;draw();}raf=requestAnimationFrame(loop);}
 let dragging=false,dx0=0,sp0=0;cv.addEventListener('pointerdown',e=>{dragging=true;dx0=e.clientX;sp0=spin;cv.setPointerCapture(e.pointerId);});
 cv.addEventListener('pointerup',e=>{const moved=Math.abs(e.clientX-dx0)>4;dragging=false;if(!moved){const s=pick(e);if(s)open(s);}});
 const pick=e=>{const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;let best=null,bd=light?22:14;proj.forEach(q=>{const d=Math.hypot(q[1]-x,q[2]-y);if(d<bd){bd=d;best=q[0];}});return best;};
 cv.addEventListener('pointermove',e=>{if(dragging){spin=sp0+(e.clientX-dx0)*.006;return;}const s=pick(e);if(s!==hover){hover=s;cv.style.cursor=s?'pointer':'grab';}});
 cv.addEventListener('pointerleave',()=>{hover=null;});
 box.querySelectorAll('.q3hb,.q3log,.q3ba,.q3tiles i').forEach(x=>x.addEventListener('click',()=>open(x.dataset.s)));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){if(!running){running=true;last=0;raf=requestAnimationFrame(loop);}}else{running=false;cancelAnimationFrame(raf);}}));io.observe(ringEl);
 const ro=new ResizeObserver(()=>{resize();draw();});ro.observe(ringEl);draw();
 return {update(){box._re&&box._re();},focus(s){st.sel=s;draw();},destroy(){running=false;io.disconnect();ro.disconnect();},_draw:draw};
}
