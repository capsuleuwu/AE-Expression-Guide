// ================= AE 表達式引擎 =================
// 以 acorn 解析，再以樹走訪直譯，模擬 After Effects 的表達式語意：
// 陣列 + - * / 運算、最後一行即結果、未宣告變數自動成為區域變數。
var AE = (function(){
"use strict";
const COMP = { w:1920, h:1080, fps:30, dur:6 };
const isArr = Array.isArray;
const FD = () => 1/COMP.fps;

// ---------- 向量運算 ----------
function at(a,i){ return isArr(a) ? (a[i]===undefined?0:+a[i]) : +a; }
function vlen(a){ return isArr(a)?a.length:1; }
function vmap2(a,b,f){ const n=Math.max(vlen(a),vlen(b)); const r=new Array(n); for(let i=0;i<n;i++) r[i]=f(at(a,i),at(b,i)); return r; }
function arith(o,x,y){ switch(o){case '+':return x+y;case '-':return x-y;case '*':return x*y;case '/':return x/y;case '%':return x%y;} }
function op(o,a,b){
  const A=isArr(a), B=isArr(b);
  if(!A && !B) return arith(o,a,b);
  if(o==='+' && (typeof a==='string'||typeof b==='string')) return a+b;
  if(A && B) return vmap2(a,b,(x,y)=>arith(o,x,y));
  if(A){ const s=+b; return a.map(x=>arith(o,+x,s)); }
  const s=+a; return b.map(y=>arith(o,s,+y));
}
function neg(a){ return isArr(a)? a.map(x=>-x) : -a; }
function clone(v){ return isArr(v)? v.slice() : v; }
function lerpV(a,b,f){
  if(typeof a==='string'||typeof b==='string') return f<1?a:b;
  if(isArr(a)||isArr(b)) return vmap2(a,b,(x,y)=>x+(y-x)*f);
  return +a + (+b - +a)*f;
}

// ---------- 雜湊 / 雜訊 / 亂數 ----------
function hashInts(){ let h=0x811c9dc5; for(let i=0;i<arguments.length;i++){ let k=(arguments[i]|0); h=Math.imul(h^k,0x01000193); h^=h>>>13; h=Math.imul(h,0x5bd1e995); h^=h>>>15; } return h>>>0; }
function h01(i,s){ return hashInts(i,s,0x9e37)/4294967295; }
function vnoise(x,s){ // Catmull-Rom 平滑的數值雜訊，範圍約 -1..1
  const i=Math.floor(x), f=x-i;
  const p0=h01(i-1,s)*2-1, p1=h01(i,s)*2-1, p2=h01(i+1,s)*2-1, p3=h01(i+2,s)*2-1;
  const f2=f*f, f3=f2*f;
  return 0.5*((2*p1)+(-p0+p2)*f+(2*p0-5*p1+4*p2-p3)*f2+(-p0+3*p1-3*p2+p3)*f3);
}
function fbm(x,s,oct,mult){ let sum=0, a=1, fr=1; oct=Math.max(1,Math.floor(oct)); for(let k=0;k<oct;k++){ sum+=a*vnoise(x*fr,s+k*101); a*=mult; fr*=2; } return sum; }
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// ---------- 緩動 ----------
function bez(x1,y1,x2,y2){ return function(x){ let s=x; for(let i=0;i<10;i++){ const cx=3*x1*s*(1-s)*(1-s)+3*x2*s*s*(1-s)+s*s*s-x; const dx=3*x1*(1-s)*(1-s)+6*(x2-x1)*s*(1-s)+3*(1-x2)*s*s; if(Math.abs(dx)<1e-6) break; s-=cx/dx; s=Math.min(1,Math.max(0,s)); } return 3*y1*s*(1-s)*(1-s)+3*y2*s*s*(1-s)+s*s*s; }; }
const EASE = { linear:f=>f, ease:bez(.333,0,.667,1), in:f=>f*f, out:f=>1-(1-f)*(1-f), hold:()=>0 };

// ---------- 屬性與圖層 ----------
let UID=1;
const PROP_INFO = {
  position:{dims:2,label:'位置'}, scale:{dims:2,label:'縮放'}, rotation:{dims:1,label:'旋轉'},
  opacity:{dims:1,label:'不透明度'}, anchorPoint:{dims:2,label:'錨點'}, color:{dims:4,label:'填色 › 顏色'},
  sourceText:{dims:'text',label:'來源文字'}, path:{dims:'path',label:'路徑'}, amount:{dims:'amount',label:'表達式選取器 › 數量'}
};
class Prop {
  constructor(layer,name,base,keys,expr){
    this.layer=layer; this.name=name; this.dims=PROP_INFO[name].dims; this.label=PROP_INFO[name].label;
    this.base=base; this.keys=(keys||[]).map((k,i)=>({t:k[0], v:k[1], e:k[2]||'ease'}));
    this.expr=expr||null; this.uid=UID++; this.err=null;
  }
  pre(t){
    const K=this.keys; if(!K.length) return clone(this.base);
    if(t<=K[0].t) return clone(K[0].v);
    const L=K[K.length-1]; if(t>=L.t) return clone(L.v);
    for(let i=0;i<K.length-1;i++){ const a=K[i], b=K[i+1];
      if(t>=a.t && t<b.t){ if(a.e==='hold'||typeof a.v==='string') return clone(a.v);
        if(this.dims==='path') return lerpPath(a.v,b.v,EASE[a.e]((t-a.t)/(b.t-a.t)));
        return lerpV(a.v,b.v,EASE[a.e]((t-a.t)/(b.t-a.t))); } }
    return clone(L.v);
  }
}

function lerpPath(A,B,f){ if(!A||!B||A.points.length!==B.points.length) return f<1?A:B;
  const L=(p,q)=>(p||[]).map((x,i)=>[x[0]+((q[i]||[0,0])[0]-x[0])*f, x[1]+((q[i]||[0,0])[1]-x[1])*f]);
  return {__path:true, points:L(A.points,B.points), inTangents:L(A.inTangents,B.inTangents), outTangents:L(A.outTangents,B.outTangents), closed:A.closed}; }
function defaultPath(){ return {__path:true, points:[[-120,-120],[120,-120],[120,120],[-120,120]], inTangents:[], outTangents:[], closed:true}; }

class Layer {
  constructor(spec, index){
    this.spec=spec; this.name=spec.name; this.index=index; this.shape=spec.shape||'rect';
    this.size=spec.size||160; this.inPoint=spec.inPoint||0; this.outPoint=spec.outPoint==null?COMP.dur:spec.outPoint;
    this.fontSize=spec.fontSize||96; this.user=!!spec.user; this.label=spec.label||null; this.stroke=spec.stroke||null;
    const b=spec.base||{}, k=spec.keys||{}, e=spec.expr||{};
    const dflt = { position:[COMP.w/2,COMP.h/2], scale:[100,100], rotation:0, opacity:100, anchorPoint:[0,0],
      color:(spec.color||[0.24,0.61,0.94]).concat([1]).slice(0,4), sourceText:spec.text||'', path:defaultPath(), amount:[100,100] };
    this.animScale=spec.animScale==null?0:spec.animScale;
    // 文字動畫製作工具的屬性（未指定時沿用舊的「縮放 0%」設定）
    this.anim=spec.anim||{scale:this.animScale};
    this.blend=spec.blend||null;
    this.props={};
    for(const name in PROP_INFO){ this.props[name]=new Prop(this,name, b[name]!==undefined?b[name]:dflt[name], k[name], e[name]); }
    this.markers=(spec.markers||[]).map((m,i)=>({time:m[0], comment:m[1]||'', index:i+1, duration:0}));
    this.effects=spec.effects||[];
    this.api=null;
  }
}

class Scene {
  constructor(layerSpecs){ this.layers=layerSpecs.map((s,i)=>new Layer(s,i+1)); this.markers=[]; this.api=null; }
  userLayers(){ return this.layers.filter(l=>l.user); }
}

// ---------- 執行環境 ----------
const STACK=[];
let SCENE=null;
function cur(){ return STACK[STACK.length-1]; }
function aeErr(msg){ const e=new Error(msg); e.ae=true; return e; }

function makeFrame(prop,t){
  const L=prop.layer; const frame=Math.floor(t*COMP.fps+1e-6);
  return { layer:L, prop, t, frame, seedBase:hashInts(L.index,prop.uid), rng:mulberry(hashInts(L.index,prop.uid,frame)), store:null };
}

function evalProp(prop,t,extra){
  if(!prop.expr) return prop.pre(t);
  const c=compile(prop.expr);
  if(c.error){ prop.err=c.error; return prop.pre(t); }
  if(STACK.length>24){ throw aeErr('表達式引用層數過深，可能有循環引用'); }
  const fr=makeFrame(prop,t); if(extra){ Object.assign(fr,extra); fr.rng=mulberry(hashInts(prop.layer.index,prop.uid,fr.frame,extra.textIndex||0)); } STACK.push(fr);
  try{
    const store=Object.create(STATIC); fr.store=store;
    store.time=t; store.value=prop.pre(t);
    const r=runProgram(c.ast, store);
    const v=coerce(prop,r); prop.err=null; return v;
  }catch(e){ prop.err=fmtErr(e); return prop.pre(t); }
  finally{ STACK.pop(); }
}

function unwrap(v){
  if(v instanceof Number) return +v;
  if(v instanceof String) return ''+v;
  if(isArr(v)) return v.map(x=> (x instanceof Number)? +x : x);
  return v;
}
function coerce(prop,r){
  r=unwrap(r); const d=prop.dims;
  if(r===undefined) throw aeErr('表達式結果未定義：最後一行必須產生一個值');
  if(d==='text'){ if(isArr(r)) return r.join(','); if(r!==null && typeof r==='object') return String(r); return String(r); }
  if(d==='path'){ if(r && r.__path) return r; throw aeErr('路徑屬性需要 createPath() 的結果'); }
  if(d==='amount'){ if(isArr(r)){ if(!r.length) throw aeErr('數量需要數值或 [x, y]'); const a=+r[0], b=r.length>1?+r[1]:+r[0]; if(isNaN(a)||isNaN(b)) throw aeErr('結果不是數字 (NaN)'); return [a,b]; } r=+r; if(isNaN(r)) throw aeErr('結果不是數字 (NaN)'); return [r,r]; }
  if(d===1){
    if(isArr(r)) throw aeErr(prop.label+' 需要單一數值，但結果是 '+r.length+' 維陣列');
    r=+r; if(typeof r!=='number'||isNaN(r)) throw aeErr('結果不是數字 (NaN)'); return r;
  }
  if(!isArr(r)) throw aeErr(prop.label+' 需要 '+d+' 維陣列，例如 '+(d===4?'[R, G, B, A]':'[x, y]')+'，但結果是單一數值');
  if(r.length<d) throw aeErr(prop.label+' 需要 '+d+' 個數值，但只有 '+r.length+' 個'+(d===4?'（顏色要包含 Alpha）':''));
  const out=r.slice(0,d).map(Number); if(out.some(isNaN)) throw aeErr('陣列中有非數字 (NaN)'); return out;
}

function fmtErr(e){
  let m = e && e.message ? e.message : String(e);
  if(!e || !e.ae){
    m = m.replace(/^(\w+) is not defined$/,'$1 未定義')
         .replace(/is not a function/,'不是函式')
         .replace(/Cannot read properties of (undefined|null) \(reading '(.+)'\)/,'無法讀取 $1 的屬性 "$2"');
  }
  const line = e && e.aeLine ? e.aeLine : null;
  return { msg:m, line };
}

// ---------- 屬性值包裝 ----------
function defHidden(o,k,v){ Object.defineProperty(o,k,{value:v,enumerable:false,configurable:true,writable:true}); }
function defGetter(o,k,g){ Object.defineProperty(o,k,{get:g,enumerable:false,configurable:true}); }
function postOrPre(prop,t){ const c=cur(); return (c && c.prop===prop)? prop.pre(t) : evalProp(prop,t); }
function velAt(fn,t){ const h=0.0005; const a=fn(t-h), b=fn(t+h); return isArr(a)? vmap2(b,a,(x,y)=>(x-y)/(2*h)) : (b-a)/(2*h); }
function keyObj(prop,i){ const K=prop.keys; if(i<1||i>K.length) throw aeErr('關鍵影格索引 '+i+' 超出範圍（共 '+K.length+' 個）'); const k=K[i-1]; return {time:k.t, value:clone(k.v), index:i}; }
function nearestKeyObj(prop,t){ const K=prop.keys; if(!K.length) throw aeErr('此屬性沒有關鍵影格'); let bi=0, bd=Infinity; K.forEach((k,i)=>{ const d=Math.abs(k.t-t); if(d<bd){bd=d;bi=i;} }); return keyObj(prop,bi+1); }
function attachPropMethods(o,prop){
  const vat=(tt)=>postOrPre(prop,+tt);
  defHidden(o,'valueAtTime',vat);
  defHidden(o,'velocityAtTime',(tt)=>velAt(vat,+tt));
  defGetter(o,'velocity',()=>velAt(vat,cur().t));
  defGetter(o,'speed',()=>{ const v=velAt(vat,cur().t); return isArr(v)?Math.hypot.apply(null,v):Math.abs(v); });
  defGetter(o,'value',()=>postOrPre(prop,cur().t));
  defGetter(o,'numKeys',()=>prop.keys.length);
  defHidden(o,'key',(i)=>keyObj(prop,i));
  defHidden(o,'nearestKey',(tt)=>nearestKeyObj(prop,+tt));
  defHidden(o,'name',prop.label);
  return o;
}
function clonePath(p){ return {__path:true, points:p.points.map(x=>x.slice()), inTangents:(p.inTangents||[]).map(x=>x.slice()), outTangents:(p.outTangents||[]).map(x=>x.slice()), closed:p.closed}; }
function attachPathMethods(o,prop){
  const at_=(tt)=>{ tt = tt===undefined? cur().t : +tt; const v=postOrPre(prop,tt); return v; };
  defHidden(o,'points',(tt)=>at_(tt).points.map(x=>x.slice()));
  defHidden(o,'inTangents',(tt)=>{ const v=at_(tt); return v.points.map((_,i)=>(v.inTangents[i]||[0,0]).slice()); });
  defHidden(o,'outTangents',(tt)=>{ const v=at_(tt); return v.points.map((_,i)=>(v.outTangents[i]||[0,0]).slice()); });
  defHidden(o,'isClosed',()=>!!at_().closed);
  defHidden(o,'createPath',STATIC.createPath);
  return o;
}
function propValue(prop){
  const c=cur(); const v=postOrPre(prop,c.t);
  if(prop.dims==='text') return v;
  if(prop.dims==='path'){ const o=clonePath(v); attachPropMethods(o,prop); return attachPathMethods(o,prop); }
  const o = isArr(v)? v.slice() : new Number(v);
  return attachPropMethods(o,prop);
}

// ---------- 圖層 / 合成 API ----------
function markerAPI(list){
  return {
    get numKeys(){ return list.length; },
    key(i){ if(typeof i==='string'){ const m=list.find(x=>x.comment===i); if(!m) throw aeErr('找不到標記 "'+i+'"'); return Object.assign({},m); }
      if(i<1||i>list.length) throw aeErr('標記索引 '+i+' 超出範圍（共 '+list.length+' 個）'); return Object.assign({},list[i-1]); },
    nearestKey(t){ if(!list.length) throw aeErr('沒有任何標記'); let b=list[0]; for(const m of list) if(Math.abs(m.time-t)<Math.abs(b.time-t)) b=m; return Object.assign({},b); }
  };
}
function findByName(list,n,aliasKey){ return list.find(x=>x.name===n || (x.alias && x.alias===n)); }
function effectFn(L,n){
  let fx = typeof n==='number' ? L.effects[n-1] : findByName(L.effects,n);
  if(!fx) throw aeErr('找不到效果 "'+n+'"，請確認效果名稱與「效果控制」面板一致');
  const f=function(p){
    let par = typeof p==='number' ? fx.params[p-1] : findByName(fx.params,p);
    if(!par) throw aeErr('效果 "'+fx.name+'" 沒有參數 "'+p+'"');
    return clone(par.v);
  };
  f.name_=fx.name; return f;
}
function rot2(p,deg){ const r=deg*Math.PI/180, c=Math.cos(r), s=Math.sin(r); return [p[0]*c-p[1]*s, p[0]*s+p[1]*c]; }
function layerAPI(L){
  if(L.api) return L.api;
  const api={ name:L.name, index:L.index, inPoint:L.inPoint, outPoint:L.outPoint, marker:markerAPI(L.markers),
    effect:(n)=>effectFn(L,n),
    toComp(p){ const P=propValue(L.props.position), A=L.props.anchorPoint.pre(cur().t), S=postOrPre(L.props.scale,cur().t), R=postOrPre(L.props.rotation,cur().t);
      const q=rot2([(at(p,0)-A[0])*S[0]/100,(at(p,1)-A[1])*S[1]/100],R); return [q[0]+P[0],q[1]+P[1]]; },
    fromComp(p){ const P=propValue(L.props.position), A=L.props.anchorPoint.pre(cur().t), S=postOrPre(L.props.scale,cur().t), R=postOrPre(L.props.rotation,cur().t);
      const q=rot2([at(p,0)-P[0],at(p,1)-P[1]],-R); return [q[0]*100/S[0]+A[0], q[1]*100/S[1]+A[1]]; }
  };
  const tf={};
  for(const k of ['position','scale','rotation','opacity','anchorPoint']){
    defGetter(tf,k,()=>propValue(L.props[k])); defGetter(api,k,()=>propValue(L.props[k]));
  }
  api.transform=tf;
  api.text={}; defGetter(api.text,'sourceText',()=>propValue(L.props.sourceText));
  api.content=function(n){ const g={}; defGetter(g,'color',()=>propValue(L.props.color)); g.content=()=>g; defGetter(g,'path',()=>propValue(L.props.path)); return g; };
  L.api=api; return api;
}
function compAPI(){
  const S=SCENE;
  if(S.api) return S.api;
  S.api={ name:'合成 1', width:COMP.w, height:COMP.h, duration:COMP.dur, frameDuration:1/COMP.fps,
    get numLayers(){ return S.layers.length; },
    layer(x){ let L = typeof x==='number' ? S.layers[x-1] : S.layers.find(l=>l.name===x);
      if(!L) throw aeErr('找不到圖層 '+(typeof x==='number'? '#'+x : '"'+x+'"')); return layerAPI(L); },
    marker:markerAPI(S.markers) };
  return S.api;
}

// ---------- 色彩 ----------
function hslToRgb(c){ let h=at(c,0)%1, s=at(c,1), l=at(c,2), a=isArr(c)&&c.length>3?+c[3]:1; if(h<0)h+=1;
  if(s===0) return [l,l,l,a];
  const q=l<.5?l*(1+s):l+s-l*s, p=2*l-q;
  const f=t=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
  return [f(h+1/3),f(h),f(h-1/3),a]; }
function rgbToHsl(c){ const r=at(c,0),g=at(c,1),b=at(c,2),a=isArr(c)&&c.length>3?+c[3]:1; const mx=Math.max(r,g,b), mn=Math.min(r,g,b); let h=0,s=0; const l=(mx+mn)/2;
  if(mx!==mn){ const d=mx-mn; s=l>.5?d/(2-mx-mn):d/(mx+mn); h= mx===r?(g-b)/d+(g<b?6:0) : mx===g?(b-r)/d+2 : (r-g)/d+4; h/=6; } return [h,s,l,a]; }
function hexToRgb(hex){ hex=String(hex).replace('#','').replace(/^0x/i,''); if(hex.length===3) hex=hex.split('').map(c=>c+c).join('');
  const n=parseInt(hex.slice(0,6),16); if(isNaN(n)) throw aeErr('hexToRgb 需要像 "#FF5A36" 的色碼'); return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255,1]; }

// ---------- 插值 ----------
function interp(fn){ return function(t,a,b,c,d){
  t=+t; let tMin,tMax,v1,v2;
  if(c===undefined){ tMin=0;tMax=1;v1=a;v2=b; } else { tMin=+a;tMax=+b;v1=c;v2=d; }
  if(v1===undefined||v2===undefined) throw aeErr('插值函式參數不足：linear(t, tMin, tMax, value1, value2)');
  if(tMin>tMax){ [tMin,tMax]=[tMax,tMin]; [v1,v2]=[v2,v1]; }
  let f = tMax===tMin ? (t>=tMax?1:0) : (t-tMin)/(tMax-tMin);
  f=Math.min(1,Math.max(0,f));
  return lerpV(unwrap(v1),unwrap(v2),fn(f)); }; }

// ---------- loopOut / loopIn ----------
function loopImpl(dir,type,n){
  const c=cur(), P=c.prop, K=P.keys, t=c.t; type=type||'cycle'; n=+n||0;
  if(K.length<2) return P.pre(t);
  let tA,tB;
  if(dir==='out'){ tB=K[K.length-1].t; if(t<=tB) return P.pre(t); tA=K[n>0?Math.max(0,K.length-1-n):0].t; }
  else { tA=K[0].t; if(t>=tA) return P.pre(t); tB=K[n>0?Math.min(K.length-1,n):K.length-1].t; }
  const dur=tB-tA; if(dur<=0) return P.pre(t);
  const mod=(x,m)=>((x%m)+m)%m;
  if(type==='cycle') return P.pre(tA+mod(t-tA,dur));
  if(type==='pingpong'){ const k=Math.floor((dir==='out'?t-tB:tA-t)/dur); const loc=mod(dir==='out'?t-tB:tA-t,dur);
    if(dir==='out') return P.pre(k%2===0? tB-loc : tA+loc); return P.pre(k%2===0? tA+loc : tB-loc); }
  if(type==='offset'){ const cyc=Math.floor((t-tA)/dur); const delta=op('-',P.pre(tB),P.pre(tA)); return op('+',P.pre(tA+mod(t-tA,dur)),op('*',delta,cyc)); }
  if(type==='continue'){ if(dir==='out'){ const v=velAt(x=>P.pre(x),tB-0.001); return op('+',P.pre(tB),op('*',v,t-tB)); }
    const v=velAt(x=>P.pre(x),tA+0.001); return op('+',P.pre(tA),op('*',v,t-tA)); }
  throw aeErr('loop 類型必須是 "cycle"、"pingpong"、"offset" 或 "continue"');
}

// ---------- 內建函式（STATIC） ----------
function rndArgs(gen,a,b){
  if(a===undefined) return gen();
  a=unwrap(a); b=unwrap(b);
  if(b===undefined) return isArr(a)? a.map(v=>gen()*v) : gen()*a;
  if(isArr(a)||isArr(b)){ const n=Math.max(vlen(a),vlen(b)); return Array.from({length:n},(_,i)=>{ const lo=at(a,i),hi=at(b,i); return lo+gen()*(hi-lo); }); }
  return +a + gen()*(b-a);
}
function gauss(){ const r=cur().rng; let u=0,v=0; while(u===0)u=r(); v=r(); const n=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); return 0.5+n*0.304; }
function pad2(n){ return (n<10?'0':'')+n; }

const STATIC = Object.assign(Object.create(null), {
  __op:op, __neg:neg,
  wiggle(freq,amp,oct,mult,t){
    const c=cur(); oct=oct===undefined?1:oct; mult=mult===undefined?0.5:mult; t=t===undefined?c.store.time:+t;
    const v=unwrap(c.prop.pre(t)); const x=t*(+freq);
    if(isArr(v)) return v.map((val,d)=>val+fbm(x,c.seedBase+d*7919,oct,mult)*amp);
    return v+fbm(x,c.seedBase,oct,mult)*amp;
  },
  random(a,b){ return rndArgs(()=>cur().rng(),a,b); },
  gaussRandom(a,b){ return rndArgs(gauss,a,b); },
  seedRandom(seed,timeless){ const c=cur(); const s=Math.floor((+seed)*1000);
    c.seedBase=hashInts(s,c.layer.index,c.prop.uid,7); c.rng=mulberry(hashInts(s,timeless?0:c.frame+1,c.layer.index,c.prop.uid)); },
  noise(v){ v=unwrap(v); if(isArr(v)){ let x=0; v.forEach((q,i)=>x+=q*(1+i*0.618)); return vnoise(x,977)*0.9; } return vnoise(+v,977)*0.9; },
  linear:interp(EASE.linear), ease:interp(f=>0.5-0.5*Math.cos(Math.PI*f)),
  easeIn:interp(f=>1-Math.cos(f*Math.PI/2)), easeOut:interp(f=>Math.sin(f*Math.PI/2)),
  clamp(v,a,b){ v=unwrap(v); if(isArr(v)||isArr(a)||isArr(b)) return vmap2(vmap2(v,a,Math.max),b,Math.min); return Math.min(Math.max(+v,+a),+b); },
  length(a,b){ a=unwrap(a); if(b!==undefined) a=op('-',a,unwrap(b)); return isArr(a)? Math.hypot.apply(null,a.map(Number)) : Math.abs(a); },
  normalize(v){ v=unwrap(v); const l=isArr(v)?Math.hypot.apply(null,v):Math.abs(v); return l===0? op('*',v,0) : op('/',v,l); },
  dot(a,b){ let s=0; for(let i=0;i<Math.max(vlen(a),vlen(b));i++) s+=at(a,i)*at(b,i); return s; },
  cross(a,b){ return [at(a,1)*at(b,2)-at(a,2)*at(b,1), at(a,2)*at(b,0)-at(a,0)*at(b,2), at(a,0)*at(b,1)-at(a,1)*at(b,0)]; },
  add(a,b){ return op('+',unwrap(a),unwrap(b)); }, sub(a,b){ return op('-',unwrap(a),unwrap(b)); },
  mul(a,b){ return op('*',unwrap(a),unwrap(b)); }, div(a,b){ return op('/',unwrap(a),unwrap(b)); },
  lookAt(from,to){ const d=op('-',unwrap(to),unwrap(from)); const x=at(d,0),y=at(d,1),z=at(d,2);
    return [ -Math.atan2(y,Math.hypot(x,z))*180/Math.PI, Math.atan2(x,z)*180/Math.PI, 0 ]; },
  degreesToRadians:(d)=>d*Math.PI/180, radiansToDegrees:(r)=>r*180/Math.PI,
  timeToFrames(t,fps){ t=t===undefined?cur().store.time:+t; fps=fps||COMP.fps; return Math.floor(t*fps+1e-6); },
  framesToTime(f,fps){ return (+f)/(fps||COMP.fps); },
  timeToTimecode(t,base){ t=t===undefined?cur().store.time:+t; base=base||COMP.fps; const tf=Math.floor(t*base+1e-6);
    const ff=tf%base, s=Math.floor(tf/base)%60, m=Math.floor(tf/base/60)%60, h=Math.floor(tf/base/3600); return h+':'+pad2(m)+':'+pad2(s)+':'+pad2(ff); },
  timeToCurrentFormat(t){ return STATIC.timeToTimecode(t); },
  hslToRgb:(c)=>hslToRgb(unwrap(c)), rgbToHsl:(c)=>rgbToHsl(unwrap(c)), hexToRgb,
  loopOut:(type,n)=>loopImpl('out',type,n), loopIn:(type,n)=>loopImpl('in',type,n),
  loopOutDuration(type,d){ return loopImpl('out',type,0); }, loopInDuration(type,d){ return loopImpl('in',type,0); },
  key:(i)=>keyObj(cur().prop,i), nearestKey:(t)=>nearestKeyObj(cur().prop,+t),
  valueAtTime:(t)=>cur().prop.pre(+t), velocityAtTime:(t)=>velAt(x=>cur().prop.pre(x),+t),
  posterizeTime(fps){ const c=cur(); fps=+fps; if(fps>0){ c.t=Math.floor(c.t*fps+1e-6)/fps; c.store.time=c.t; c.store.value=c.prop.pre(c.t); c.frame=Math.floor(c.t*COMP.fps+1e-6); c.rng=mulberry(hashInts(c.layer.index,c.prop.uid,c.frame)); } },
  createPath(points,inT,outT,closed){
    points=unwrap(points)||[]; return {__path:true, points:points.map(p=>[at(p,0),at(p,1)]), inTangents:(inT||[]).map(p=>[at(p,0),at(p,1)]), outTangents:(outT||[]).map(p=>[at(p,0),at(p,1)]), closed:closed===undefined?true:!!closed}; },
  comp(n){ return compAPI(); }
});

// 依目前執行環境動態取得的名稱
const DYN = {
  thisComp:()=>compAPI(), thisLayer:()=>layerAPI(cur().layer),
  thisProperty:()=>{ const c=cur(); const P=c.prop; const o={}; attachPropMethods(o,P);
    o.loopOut=STATIC.loopOut; o.loopIn=STATIC.loopIn; if(P.dims==='path') attachPathMethods(o,P); return o; },
  index:()=>cur().layer.index, inPoint:()=>cur().layer.inPoint, outPoint:()=>cur().layer.outPoint,
  numKeys:()=>cur().prop.keys.length,
  velocity:()=>velAt(x=>cur().prop.pre(x),cur().t),
  speed:()=>{ const v=velAt(x=>cur().prop.pre(x),cur().t); return isArr(v)?Math.hypot.apply(null,v):Math.abs(v); },
  marker:()=>layerAPI(cur().layer).marker,
  effect:()=>layerAPI(cur().layer).effect,
  transform:()=>layerAPI(cur().layer).transform,
  position:()=>propValue(cur().layer.props.position), scale:()=>propValue(cur().layer.props.scale),
  rotation:()=>propValue(cur().layer.props.rotation), opacity:()=>propValue(cur().layer.props.opacity),
  anchorPoint:()=>propValue(cur().layer.props.anchorPoint),
  text:()=>layerAPI(cur().layer).text, content:()=>layerAPI(cur().layer).content,
  toComp:()=>layerAPI(cur().layer).toComp, fromComp:()=>layerAPI(cur().layer).fromComp,
  name:()=>cur().layer.name,
  textIndex:()=>{ const c=cur(); if(c.textIndex==null) throw aeErr('textIndex 只能用在文字動畫的「表達式選取器」裡'); return c.textIndex; },
  textTotal:()=>{ const c=cur(); if(c.textTotal==null) throw aeErr('textTotal 只能用在文字動畫的「表達式選取器」裡'); return c.textTotal; },
  selectorValue:()=>{ const c=cur(); return [100,100,100]; }
};
const SAFE = new Set(['Math','Number','String','Array','Object','JSON','parseInt','parseFloat','isNaN','isFinite','Boolean','Date','RegExp','Error','undefined','NaN','Infinity','encodeURIComponent','decodeURIComponent']);

// ================= 直譯器 =================
const CACHE=new Map();
function compile(code){
  let c=CACHE.get(code); if(c) return c;
  try{
    if(typeof acorn==='undefined') throw {message:'語法解析器載入失敗，請重新整理頁面'};
    const ast=acorn.parse(code,{ecmaVersion:2020,sourceType:'script',allowReturnOutsideFunction:true,locations:true});
    c={ast};
  }catch(e){
    let m=(e.message||String(e)).replace(/\s*\(\d+:\d+\)$/,'');
    m=m.replace(/^Unexpected token/,'非預期的符號').replace(/^Unterminated string constant/,'字串沒有結尾引號')
       .replace(/^Unexpected character/,'非預期的字元').replace(/^Unterminated template/,'樣板字串沒有結尾');
    c={error:{msg:'語法錯誤：'+m, line:e.loc?e.loc.line:null}};
  }
  if(CACHE.size>400) CACHE.clear();
  CACHE.set(code,c); return c;
}

class Scope{ constructor(parent,isFn,vars){ this.p=parent; this.fn=isFn; this.v=vars||Object.create(null); } }
const BREAK={t:'break'}, CONT={t:'continue'};
let COMPLETION, STEPS, ROOT, CURLINE;

function runProgram(ast,store){
  const saveC=COMPLETION, saveS=STEPS, saveR=ROOT, saveL=CURLINE;
  COMPLETION=undefined; STEPS=0; ROOT=new Scope(null,true,store); CURLINE=1;
  try{
    const sig=execBody(ast.body,ROOT);
    if(sig && sig.t==='return') return sig.v;
    return COMPLETION;
  }catch(e){ if(e && typeof e==='object' && !e.aeLine) { try{ e.aeLine=CURLINE; }catch(_){} } throw e; }
  finally{ COMPLETION=saveC; STEPS=saveS; ROOT=saveR; CURLINE=saveL; }
}

function lookupScope(s,name){ for(;s;s=s.p){ if(name in s.v) return s; } return null; }
function getVar(s,name){
  const sc=lookupScope(s,name); if(sc) return sc.v[name];
  const d=DYN[name]; if(d) return d();
  if(SAFE.has(name)) return globalThis[name];
  throw aeErr(name+' 未定義');
}
function hasVar(s,name){ return !!lookupScope(s,name) || !!DYN[name] || SAFE.has(name); }
function setVar(s,name,val){ const sc=lookupScope(s,name); if(sc && sc!==ROOT){ sc.v[name]=val; return; } // root 或未宣告 → root
  // 若在 STATIC 原型上（內建函式）則於 store 遮蔽
  ROOT.v[name]=val; }
function fnScope(s){ while(s && !s.fn) s=s.p; return s; }
function declare(s,kind,name,val){ const target = kind==='var' ? fnScope(s) : s; target.v[name]=val; }

function hoist(body,s){ for(const st of body){ if(st.type==='FunctionDeclaration') declare(s,'var',st.id.name,makeFn(st,s)); } }
function execBody(body,s){ hoist(body,s); for(const st of body){ const r=exec(st,s); if(r) return r; } }

function tick(){ if(++STEPS>200000) throw aeErr('執行步數過多（可能是無窮迴圈）'); }

function bindPattern(p,val,s,kind){
  switch(p.type){
    case 'Identifier': if(kind) declare(s,kind,p.name,val); else setVar(s,p.name,val); return;
    case 'ArrayPattern': p.elements.forEach((el,i)=>{ if(!el) return; if(el.type==='RestElement') bindPattern(el.argument,(val||[]).slice(i),s,kind); else bindPattern(el,val==null?undefined:val[i],s,kind); }); return;
    case 'ObjectPattern': for(const pr of p.properties){ if(pr.type==='RestElement') continue; const k=pr.computed?ev(pr.key,s):(pr.key.name!==undefined?pr.key.name:pr.key.value); bindPattern(pr.value,val==null?undefined:val[k],s,kind); } return;
    case 'AssignmentPattern': bindPattern(p.left, val===undefined? ev(p.right,s) : val, s, kind); return;
    case 'MemberExpression': { const o=ev(p.object,s); o[p.computed?ev(p.property,s):p.property.name]=val; return; }
  }
  throw aeErr('不支援的指派方式');
}

function exec(n,s){
  tick(); if(n.loc) CURLINE=n.loc.start.line;
  switch(n.type){
    case 'ExpressionStatement': COMPLETION=ev(n.expression,s); return;
    case 'VariableDeclaration': for(const d of n.declarations){ const v=d.init?ev(d.init,s):undefined; if(d.id.type==='Identifier' && !d.init && n.kind==='var' && lookupScope(fnScope(s),d.id.name)) continue; bindPattern(d.id,v,s,n.kind); } return;
    case 'FunctionDeclaration': return;
    case 'EmptyStatement': return;
    case 'BlockStatement': return execBody(n.body,new Scope(s,false));
    case 'IfStatement': if(ev(n.test,s)) return exec(n.consequent,s); else if(n.alternate) return exec(n.alternate,s); return;
    case 'ForStatement': { const ls=new Scope(s,false);
      if(n.init){ if(n.init.type==='VariableDeclaration') exec(n.init,ls); else ev(n.init,ls); }
      for(;;){ tick(); if(n.test && !ev(n.test,ls)) break; const r=exec(n.body,ls); if(r===BREAK) break; if(r && r!==CONT) return r; if(n.update) ev(n.update,ls); } return; }
    case 'WhileStatement': while(ev(n.test,s)){ tick(); const r=exec(n.body,s); if(r===BREAK) break; if(r && r!==CONT) return r; } return;
    case 'DoWhileStatement': do{ tick(); const r=exec(n.body,s); if(r===BREAK) break; if(r && r!==CONT) return r; } while(ev(n.test,s)); return;
    case 'ForOfStatement': case 'ForInStatement': {
      const obj=ev(n.right,s); const items = n.type==='ForOfStatement' ? Array.from(obj) : Object.keys(obj);
      for(const it of items){ tick(); const ls=new Scope(s,false);
        if(n.left.type==='VariableDeclaration') bindPattern(n.left.declarations[0].id,it,ls,n.left.kind); else bindPattern(n.left,it,ls,null);
        const r=exec(n.body,ls); if(r===BREAK) break; if(r && r!==CONT) return r; } return; }
    case 'BreakStatement': return BREAK;
    case 'ContinueStatement': return CONT;
    case 'ReturnStatement': return {t:'return', v:n.argument?ev(n.argument,s):undefined};
    case 'ThrowStatement': throw ev(n.argument,s);
    case 'SwitchStatement': { const d=ev(n.discriminant,s); let hit=false; const ls=new Scope(s,false);
      for(const c of n.cases){ if(!hit && (c.test===null || ev(c.test,ls)===d)) hit=true;
        if(hit){ for(const st of c.consequent){ const r=exec(st,ls); if(r===BREAK) return; if(r) return r; } } }
      if(!hit){ const dc=n.cases.findIndex(c=>c.test===null); if(dc>=0){ for(let i=dc;i<n.cases.length;i++) for(const st of n.cases[i].consequent){ const r=exec(st,ls); if(r===BREAK) return; if(r) return r; } } }
      return; }
    case 'TryStatement': { let r;
      try{ r=exec(n.block,s); }
      catch(e){ if(!n.handler) throw e; const ls=new Scope(s,false); if(n.handler.param) bindPattern(n.handler.param,e,ls,'let'); r=exec(n.handler.body,ls); }
      finally{ if(n.finalizer){ const f=exec(n.finalizer,s); if(f) r=f; } }
      return r; }
    case 'LabeledStatement': return exec(n.body,s);
  }
  throw aeErr('不支援的語法：'+n.type);
}

let DEPTH=0;
function makeFn(n,s){
  const f=function(){
    if(++DEPTH>200){ DEPTH=0; throw aeErr('函式遞迴過深'); }
    const fs=new Scope(s,true); const args=arguments;
    try{
      n.params.forEach((p,i)=>{ if(p.type==='RestElement') bindPattern(p.argument,Array.prototype.slice.call(args,i),fs,'let'); else bindPattern(p,args[i],fs,'let'); });
      if(n.type!=='ArrowFunctionExpression') fs.v.arguments=args;
      if(n.expression) return ev(n.body,fs);
      const saveC=COMPLETION; const r=execBody(n.body.body,fs); COMPLETION=saveC;
      return r && r.t==='return' ? r.v : undefined;
    } finally { DEPTH--; }
  };
  if(n.id) declareFnName(f,n);
  return f;
}
function declareFnName(f,n){ try{ Object.defineProperty(f,'name',{value:n.id.name}); }catch(e){} }

function memberKey(n,s){ return n.computed ? ev(n.property,s) : n.property.name; }
function getMember(obj,key,n){
  if(obj===undefined||obj===null) throw aeErr('無法讀取 '+obj+' 的屬性 "'+String(key)+'"'+(n&&n.object&&n.object.type==='Identifier'?'（'+n.object.name+' 是 '+obj+'）':''));
  return obj[key];
}
function calleeName(n){ if(n.type==='Identifier') return n.name; if(n.type==='MemberExpression' && !n.computed) return calleeName(n.object)+'.'+n.property.name; return '表達式'; }
function evArgs(list,s){ const out=[]; for(const a of list){ if(a.type==='SpreadElement') out.push.apply(out,Array.from(ev(a.argument,s))); else out.push(ev(a,s)); } return out; }

function assignOp(o,a,b){
  switch(o){ case '+': case '-': case '*': case '/': case '%': return op(o,a,b);
    case '**': return Math.pow(a,b); case '<<': return a<<b; case '>>': return a>>b; case '>>>': return a>>>b;
    case '|': return a|b; case '&': return a&b; case '^': return a^b; }
}

function ev(n,s){
  switch(n.type){
    case 'Literal': return n.regex ? new RegExp(n.regex.pattern,n.regex.flags) : n.value;
    case 'Identifier': return getVar(s,n.name);
    case 'TemplateLiteral': { let out=''; n.quasis.forEach((q,i)=>{ out+=q.value.cooked; if(i<n.expressions.length) out+=String(ev(n.expressions[i],s)); }); return out; }
    case 'ArrayExpression': { const out=[]; for(const el of n.elements){ if(!el) out.push(undefined); else if(el.type==='SpreadElement') out.push.apply(out,Array.from(ev(el.argument,s))); else out.push(ev(el,s)); } return out; }
    case 'ObjectExpression': { const o={}; for(const p of n.properties){ if(p.type==='SpreadElement'){ Object.assign(o,ev(p.argument,s)); continue; }
        const k=p.computed?ev(p.key,s):(p.key.type==='Identifier'?p.key.name:p.key.value);
        if(p.kind==='get'){ Object.defineProperty(o,k,{get:makeFn(p.value,s),enumerable:true,configurable:true}); continue; }
        o[k]=ev(p.value,s); } return o; }
    case 'FunctionExpression': case 'ArrowFunctionExpression': { const f=makeFn(n,s); return f; }
    case 'UnaryExpression': {
      if(n.operator==='typeof'){ if(n.argument.type==='Identifier' && !hasVar(s,n.argument.name)) return 'undefined'; return typeof ev(n.argument,s); }
      if(n.operator==='delete'){ if(n.argument.type==='MemberExpression'){ const o=ev(n.argument.object,s); return delete o[memberKey(n.argument,s)]; } return true; }
      const v=ev(n.argument,s);
      switch(n.operator){ case '-': return neg(v); case '+': return +v; case '!': return !v; case '~': return ~v; case 'void': return undefined; } break; }
    case 'UpdateExpression': {
      const a=n.argument; let old, set;
      if(a.type==='Identifier'){ old=+getVar(s,a.name); set=v=>setVar(s,a.name,v); }
      else { const o=ev(a.object,s), k=memberKey(a,s); old=+getMember(o,k,a); set=v=>{o[k]=v;}; }
      const nv=n.operator==='++'?old+1:old-1; set(nv); return n.prefix?nv:old; }
    case 'BinaryExpression': {
      const a=ev(n.left,s), b=ev(n.right,s);
      switch(n.operator){
        case '+': case '-': case '*': case '/': case '%': return op(n.operator,a,b);
        case '==': return a==b; case '!=': return a!=b; case '===': return a===b; case '!==': return a!==b;
        case '<': return a<b; case '>': return a>b; case '<=': return a<=b; case '>=': return a>=b;
        case '**': return Math.pow(a,b); case '&': return a&b; case '|': return a|b; case '^': return a^b;
        case '<<': return a<<b; case '>>': return a>>b; case '>>>': return a>>>b;
        case 'in': return a in b; case 'instanceof': return a instanceof b;
      } break; }
    case 'LogicalExpression': { const a=ev(n.left,s);
      if(n.operator==='&&') return a?ev(n.right,s):a; if(n.operator==='||') return a?a:ev(n.right,s); return (a===null||a===undefined)?ev(n.right,s):a; }
    case 'ConditionalExpression': return ev(n.test,s)?ev(n.consequent,s):ev(n.alternate,s);
    case 'AssignmentExpression': {
      const L=n.left;
      if(n.operator==='='){ const v=ev(n.right,s); bindPattern(L,v,s,null); return v; }
      const o2=n.operator.slice(0,-1);
      if(o2==='&&'||o2==='||'||o2==='??'){ const cv=ev(L,s); const go= o2==='&&'?cv : o2==='||'?!cv : (cv==null); if(!go) return cv; const v=ev(n.right,s); bindPattern(L,v,s,null); return v; }
      if(L.type==='Identifier'){ const v=assignOp(o2,getVar(s,L.name),ev(n.right,s)); setVar(s,L.name,v); return v; }
      const o=ev(L.object,s), k=memberKey(L,s); const v=assignOp(o2,getMember(o,k,L),ev(n.right,s)); o[k]=v; return v; }
    case 'SequenceExpression': { let v; for(const e of n.expressions) v=ev(e,s); return v; }
    case 'MemberExpression': { const o=ev(n.object,s); if(n.optional && o==null) return undefined; return getMember(o,memberKey(n,s),n); }
    case 'ChainExpression': return ev(n.expression,s);
    case 'CallExpression': {
      let fn, self;
      if(n.callee.type==='MemberExpression'){ self=ev(n.callee.object,s); if(n.callee.optional && self==null) return undefined; fn=getMember(self,memberKey(n.callee,s),n.callee); }
      else { fn=ev(n.callee,s); self=undefined; }
      if(n.optional && fn==null) return undefined;
      if(typeof fn!=='function') throw aeErr(calleeName(n.callee)+' 不是函式');
      const args=evArgs(n.arguments,s);
      return fn.apply(self,args); }
    case 'NewExpression': { const C=ev(n.callee,s); if(typeof C!=='function') throw aeErr(calleeName(n.callee)+' 不是建構式'); return Reflect.construct(C,evArgs(n.arguments,s)); }
    case 'ThisExpression': return undefined;
    case 'TaggedTemplateExpression': throw aeErr('不支援標籤樣板字串');
  }
  throw aeErr('不支援的語法：'+n.type);
}

function setScene(sc){ SCENE=sc; }

return { COMP, PROP_INFO, Scene, Layer, Prop, setScene, evalProp, compile, hslToRgb, unwrap, get scene(){ return SCENE; } };
})();
if(typeof module!=='undefined') module.exports=AE;
