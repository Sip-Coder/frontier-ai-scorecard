// 3D correlation network for the AI stock analyzer (lazy-loaded module). Technical/analytical only, not advice.
const V='three@0.180.0';
const TAGC={chips:'#84cc16',infra:'#fbbf24',cloud:'#60a5fa',apps:'#e879f9',non:'#94a3b8'};
const SECP=['#22d3ee','#fbbf24','#a78bfa','#34d399','#f472b6','#60a5fa','#fb923c','#e879f9','#facc15','#2dd4bf','#f87171','#94a3b8'];
let LIB=null;
async function lib(light){if(!LIB)LIB=Promise.all([import(`https://esm.sh/3d-force-graph@1.80.1?deps=${V}`),import(`https://esm.sh/three-spritetext@1.10.0?deps=${V}`),import(`https://esm.sh/${V}/examples/jsm/postprocessing/UnrealBloomPass.js`)]);return LIB;}
function webgl(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch(e){return false;}}
export async function mount(box,ctx){
 const {A,C,g,st,heat,tfv,open,f,cls,esc}=ctx;const light=innerWidth<600;
 const gv=box.querySelector('[data-g3]'),side=box.querySelector('[data-g3s]'),sl=box.querySelector('[data-thr]'),tv=box.querySelector('[data-thrv]');
 if(!C){gv.innerHTML='<div class="axload">Correlations not archived for this week</div>';side.hidden=true;return null;}
 if(!webgl()){gv.innerHTML='<div class="axload">3D view needs WebGL</div>';}
 const syms=C.syms,R=ctx.R,E=C.e,idx={};syms.forEach((s,i)=>idx[s]=i);
 const all=[];for(let i=0;i<E.length;i+=3)if(R[syms[E[i]]]&&R[syms[E[i+1]]])all.push({a:syms[E[i]],b:syms[E[i+1]],c:E[i+2]/100});
 const peers={};all.forEach(e=>{(peers[e.a]=peers[e.a]||[]).push([e.b,e.c]);(peers[e.b]=peers[e.b]||[]).push([e.a,e.c]);});Object.values(peers).forEach(p=>p.sort((x,y)=>y[1]-x[1]));
 const grpOf=s=>st.grp==='sec'?(A.sector[s]||['Other'])[0]:A.ai[s];
 const gcol=()=>{const ks=[...new Set(syms.map(grpOf))].sort();const m={};ks.forEach((k,i)=>m[k]=st.grp==='sec'?SECP[i%SECP.length]:TAGC[k]);return m;};
 let thr=+sl.value/100,sel=null,G=null,GC=gcol();
 const edges=()=>{let L=all.filter(e=>e.c>=thr);if(light){const keep=new Set(),cnt={};L.sort((x,y)=>y.c-x.c).forEach((e,i)=>{if((cnt[e.a]||0)<3&&(cnt[e.b]||0)<3){keep.add(i);cnt[e.a]=(cnt[e.a]||0)+1;cnt[e.b]=(cnt[e.b]||0)+1;}});L=L.filter((_,i)=>keep.has(i));}return L;};
 function side_(L){tv.textContent=thr.toFixed(2);
  const h=C.h,mx=Math.max(...h),bins=h.map((v,i)=>{const lo=-0.2+i*0.1;return `<i title="${lo.toFixed(1)}–${(lo+.1).toFixed(1)}: ${v} pairs" class="${lo+.05>=thr?'on':''}" style="height:${Math.max(2,v/mx*100)}%"></i>`;}).join('');
  const par={};const fd=x=>par[x]===undefined?(par[x]=x):par[x]===x?x:(par[x]=fd(par[x]));L.forEach(e=>{const a=fd(e.a),b=fd(e.b);if(a!==b)par[a]=b;});
  const cl={};Object.keys(par).forEach(s=>{const r=fd(s);(cl[r]=cl[r]||[]).push(s);});
  const cs=Object.values(cl).filter(c=>c.length>1).map(c=>c.sort((x,y)=>A.weight[y]-A.weight[x])).sort((x,y)=>y.length-x.length).slice(0,7),cm=Math.max(1,...cs.map(c=>c.length));
  side.querySelector('[data-hist]').innerHTML=bins;
  side.querySelector('[data-cl]').innerHTML=cs.map(c=>`<div class="g3cl" data-s="${c[0]}"><span>${c.slice(0,3).join('·')}${c.length>3?' +'+(c.length-3):''}</span><b><i style="width:${c.length/cm*100}%"></i></b><em>${c.length}</em></div>`).join('')||'<div class="cap">No clusters at this threshold</div>';
  side.querySelector('[data-ne]').textContent=L.length+' links · '+(syms.length-new Set(L.flatMap(e=>[e.a,e.b])).size)+' unlinked';}
 const [{default:FG},{default:ST},{UnrealBloomPass}]=await lib();
 if(!gv.isConnected)return null;gv.innerHTML='';
 const nodes=syms.filter(s=>R[s]).map(s=>({id:s}));const nb=new Map();
 const data=()=>{const L=edges();nb.clear();L.forEach(e=>{(nb.get(e.a)||nb.set(e.a,new Set()).get(e.a)).add(e.b);(nb.get(e.b)||nb.set(e.b,new Set()).get(e.b)).add(e.a);});side_(L);return {nodes,links:L.map(e=>({source:e.a,target:e.b,c:e.c}))};};
 const isHi=n=>!sel||n===sel||(nb.get(sel)||new Set()).has(n);
 G=FG({controlType:'trackball'===''?'trackball':'orbit'})(gv).backgroundColor('#05070b').showNavInfo(false).width(gv.clientWidth).height(gv.clientHeight)
  .nodeRelSize(light?4:4.5).nodeVal(n=>Math.max(.4,(A.weight[n.id]||.1)*3)).nodeOpacity(.95).nodeResolution(light?8:14)
  .nodeColor(n=>isHi(n.id)?heat(g(n.id,tfv()[1]),tfv()[2],true):'#1b212c')
  .nodeLabel(n=>{const s=n.id,k=tfv()[1],v=g(s,k),p=(peers[s]||[]).slice(0,4);return `<div class="g3tip"><b>${s}</b> <em class="${cls(v)}">${tfv()[0]} ${f(v,1,1)}</em><br><small>${esc(A.names[s])}</small>${p.length?'<br>'+p.map(([q,c])=>`${q} <u>${c.toFixed(2)}</u>`).join(' · '):''}</div>`;})
  .nodeThreeObjectExtend(true).nodeThreeObject(n=>{if((A.weight[n.id]||0)<(light?2:1)&&n.id!==sel)return null;const t=new ST(n.id);t.fontFace='ui-monospace,Menlo,monospace';t.textHeight=light?9:8;t.color=GC[grpOf(n.id)]||'#7dd3fc';t.fontWeight='600';t.material.depthWrite=false;t.position.y=8+Math.sqrt(A.weight[n.id]||1)*3;return t;})
  .linkColor(l=>{const on=!sel||l.source.id===sel||l.target.id===sel||l.source===sel||l.target===sel;const a=on?Math.min(.95,.15+(l.c-.35)*1.6):.03;return `rgba(103,232,249,${a.toFixed(2)})`;})
  .linkWidth(l=>light?0:(sel&&(l.source.id===sel||l.target.id===sel)?1.2:0)).linkOpacity(1)
  .onNodeClick(n=>{sel=sel===n.id?null:n.id;refresh();if(sel){const d=90,r=1+d/Math.hypot(n.x,n.y,n.z||1);G.cameraPosition({x:n.x*r,y:n.y*r,z:n.z*r},n,800);}open(n.id,true);})
  .onBackgroundClick(()=>{sel=null;refresh();})
  .d3VelocityDecay(.3).warmupTicks(light?40:60).cooldownTicks(light?120:200);
 G.d3Force('link').distance(l=>60*(1.1-l.c)).strength(l=>l.c*.6);G.d3Force('charge').strength(-30).distanceMax(200);
 // pull each group toward its own anchor so sectors / AI tags form visible clusters
 const anch={};const grpForce=()=>{let ns;const fn=a=>{ns.forEach(n=>{const k=grpOf(n.id);const p=anch[k];if(!p)return;n.vx+=(p[0]-n.x)*.05*a;n.vy+=(p[1]-n.y)*.05*a;n.vz+=(p[2]-n.z)*.05*a;});};fn.initialize=x=>ns=x;return fn;};
 const setAnch=()=>{const ks=[...new Set(syms.map(grpOf))];ks.forEach((k,i)=>{const t=i/ks.length*Math.PI*2,y=1-2*(i+.5)/ks.length;anch[k]=[Math.cos(t)*90*Math.sqrt(1-y*y),y*70,Math.sin(t)*90*Math.sqrt(1-y*y)];});};
 setAnch();G.d3Force('grp',grpForce());
 G.graphData(data());
 if(!light){try{const b=new UnrealBloomPass();b.strength=.9;b.radius=.4;b.threshold=.5;G.postProcessingComposer().addPass(b);}catch(e){console.warn('bloom off',e);}}
 else G.renderer().setPixelRatio(Math.min(devicePixelRatio,1.5));
 const ctl=G.controls();ctl.autoRotate=true;ctl.autoRotateSpeed=.5;let it;ctl.addEventListener('start',()=>{ctl.autoRotate=false;clearTimeout(it);});ctl.addEventListener('end',()=>{clearTimeout(it);it=setTimeout(()=>ctl.autoRotate=true,4000);});
 let fit=0;const zf=()=>{G.zoomToFit(0,0);const c=G.camera().position;G.cameraPosition({x:c.x*.62,y:c.y*.62,z:c.z*.62},undefined,500);};G.onEngineStop(()=>{if(!fit++)zf();});setTimeout(()=>{if(!fit)zf();},light?1500:2500);
 function refresh(){G.nodeColor(G.nodeColor()).linkColor(G.linkColor()).linkWidth(G.linkWidth()).nodeThreeObject(G.nodeThreeObject());}
 sl.oninput=()=>{thr=+sl.value/100;G.graphData(data());refresh();};
 const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting?G.resumeAnimation():G.pauseAnimation()));io.observe(gv);
 const ro=new ResizeObserver(()=>{if(gv.clientWidth)G.width(gv.clientWidth).height(gv.clientHeight);});ro.observe(gv);
 side.querySelector('[data-cl]').onclick=e=>{const c=e.target.closest('[data-s]');if(c){const n=nodes.find(x=>x.id===c.dataset.s);if(n){sel=n.id;refresh();open(n.id,true);}}};
 return {update(){GC=gcol();setAnch();G.d3ReheatSimulation();refresh();},focus(s){sel=s;refresh();},destroy(){io.disconnect();ro.disconnect();G._destructor&&G._destructor();}};
}
