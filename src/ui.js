(function(){
"use strict";
const $=s=>document.querySelector(s);
const {CATS,EX,LAB_STARTERS,buildScene}=LIB;
const COMP=AE.COMP;
const store={ get(k,d){ try{ const v=localStorage.getItem('aeexpr:'+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ if(v==null) localStorage.removeItem('aeexpr:'+k); else localStorage.setItem('aeexpr:'+k,JSON.stringify(v)); }catch(e){} } };

const S={ ex:null, saved:null, code:'', prop:'', scene:null, t:0, playing:!matchMedia('(prefers-reduced-motion: reduce)').matches,
  speed:1, trail:true, dirty:true, graphDirty:true, graph:null, paramSig:'', closed:{}, savedList:store.get('saved',[]), labProp:store.get('labProp','position'), codes:store.get('codes',{}) };

// ---------- 側欄 ----------
// 側欄平滑捲動（自訂緩動，使用者滑動時立即停止）
// v 為「虛擬捲動位置」：v < 0 時捲軸已到頂，改用列表上方暫時的留白補足，避免上方分類收起時標題瞬間跳動
const sideScroll={ raf:0,
  apply(box,v){ const list=$('#catList'); if(v<0){ list.style.marginTop=(-v)+'px'; box.scrollTop=0; } else { list.style.marginTop=''; box.scrollTop=v; } },
  stop(){ cancelAnimationFrame(this.raf); this.raf=0; $('#catList').style.marginTop=''; },
  to(box,from,target,done){ cancelAnimationFrame(this.raf); this.raf=0;
    const max=box.scrollHeight-box.clientHeight; target=Math.max(0,Math.min(max,target));
    this.apply(box,from); const d=target-from; if(Math.abs(d)<1){ this.apply(box,target); if(done) done(); return; }
    const dur=Math.min(650,Math.max(320,Math.abs(d)*0.6)), t0=performance.now();
    const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
    const stopOnUser=()=>{ if(!$('#catList').style.marginTop){ cancelAnimationFrame(this.raf); this.raf=0; } };
    box.addEventListener('wheel',stopOnUser,{once:true,passive:true}); box.addEventListener('touchstart',stopOnUser,{once:true,passive:true});
    const step=now=>{ const k=Math.min(1,(now-t0)/dur); this.apply(box,from+d*ease(k)); this.raf=k<1?requestAnimationFrame(step):0; if(k>=1&&done) done(); };
    this.raf=requestAnimationFrame(step); } };
function renderSide(){
  const q=$('#search').value.trim().toLowerCase();
  const side=$('#catList'); side.innerHTML='';
  // 搜尋：文字欄位用部分比對；程式碼只比對完整的字（避免像 j 命中 inject 這類無關結果）；符合分類名稱時整個分類都列出
  const esc=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const wordRe=q?new RegExp('(^|[^A-Za-z0-9_$])'+esc+'(?![A-Za-z0-9_$])','i'):null;
  const CAT_ALIAS={ js:'js javascript 語法', logic:'if else', text:'text 文字', textanim:'text animator', color:'color 顏色', random:'random' };
  const catHit=c=>!!q && (c.name+' '+(c.en||'')+' '+(CAT_ALIAS[c.id]||'')).toLowerCase().includes(q);
  const txt=e=>[e.name,e.sig,e.desc,e.tip||'',(e.how||[]).join(' ')].join(' ').toLowerCase();
  const codeOf=e=>(e.code||'').replace(/\/\/.*$/gm,'');
  const match=e=>!q || txt(e).includes(q) || wordRe.test(codeOf(e));
  let total=0;
  const groups=[];
  if(S.savedList.length){ const items=S.savedList.filter(s=>!q||s.name.toLowerCase().includes(q)||wordRe.test((s.code||'').replace(/\/\/.*$/gm,''))).map(s=>({saved:s})); if(items.length) groups.push({cat:{id:'mine',name:'我的表達式',en:'收藏的自訂版本'},items}); }
  for(const c of CATS){ const all=catHit(c); const items=EX.filter(e=>e.cat===c.id && (all||match(e))).map(e=>({ex:e})); if(items.length) groups.push({cat:c,items}); }
  for(const g of groups){
    total+=g.items.length;
    if(g.cat.id==='lab' && g.items.length===1 && g.items[0].ex){
      // 自由實驗室只有一個項目：不做下拉選單，直接顯示「空白實驗室」選項
      const ex=g.items[0].ex, wrap=document.createElement('div'); wrap.className='cat cat-solo';
      const h=document.createElement('button'); h.type='button'; h.className='cat-h'+((!S.saved&&S.ex&&S.ex.id===ex.id)?' on':'');
      h.innerHTML='<span class="dot"></span><span class="nm"></span>'; h.querySelector('.nm').textContent=ex.name;
      h.onclick=()=>{ go(ex.id); setDrawer(false); };
      wrap.append(h); side.append(wrap); continue;
    }
    const isClosed = g.cat.id in S.closed ? S.closed[g.cat.id] : true; // 預設收起
    const wrap=document.createElement('div'); wrap.className='cat'+(isClosed&&!q?' closed':'');
    const h=document.createElement('button'); h.className='cat-h'; h.type='button'; h.setAttribute('aria-expanded',String(!wrap.classList.contains('closed')));
    h.innerHTML='<svg class="chev" viewBox="0 0 12 12" fill="none" stroke-width="1.6"><path d="M3 4.5l3 3 3-3"/></svg><span class="nm"></span><span class="cnt"></span>';
    h.querySelector('.nm').textContent=g.cat.name; h.querySelector('.cnt').textContent=g.items.length;
    h.onclick=()=>{ const opening=wrap.classList.contains('closed');
      const box=$('#side'), y0=h.getBoundingClientRect().top;
      if(opening){ // 手風琴：展開這一個時，其他分類全部收起
        side.querySelectorAll('.cat').forEach(c=>{ c.classList.add('closed'); const hb=c.querySelector('.cat-h'); if(hb) hb.setAttribute('aria-expanded','false'); });
        S.closed={}; groups.forEach(x=>S.closed[x.cat.id]=true); }
      wrap.classList.toggle('closed',!opening); S.closed[g.cat.id]=!opening; h.setAttribute('aria-expanded',String(opening));
      sideScroll.stop();
      if(opening){ // 先讓點擊的標題留在原位，再平滑捲到這個分類（停在搜尋列下方）
        const bar=box.querySelector('.side-search'), barH=bar?bar.offsetHeight:0;
        side.style.paddingBottom='';
        const below=side.getBoundingClientRect().bottom-wrap.getBoundingClientRect().top;
        const need=box.clientHeight-barH-below-parseFloat(getComputedStyle(box).paddingBottom||0);
        if(need>0){ side.style.paddingBottom=need+'px'; side.dataset.padFor=g.cat.id; } // 底部留白，讓靠下方的分類也能捲到最上面
        const from=box.scrollTop+h.getBoundingClientRect().top-y0; // 可能為負（上方分類收起、捲軸已到頂）
        const target=box.scrollTop+wrap.getBoundingClientRect().top-box.getBoundingClientRect().top-barH;
        sideScroll.to(box,from,target);
      } else { // 收起：標題留在原位，再把為了捲動而加的底部留白收掉（平滑捲回，最底部就是空白實驗室）
        box.scrollTop+=h.getBoundingClientRect().top-y0;
        const pad=parseFloat(side.style.paddingBottom)||0;
        if(pad>0){ const maxNoPad=box.scrollHeight-pad-box.clientHeight;
          if(box.scrollTop>maxNoPad+0.5) sideScroll.to(box,box.scrollTop,Math.max(0,maxNoPad),()=>{ side.style.paddingBottom=''; });
          else side.style.paddingBottom=''; } } };
    const en=document.createElement('span'); en.className='cat-en'; en.textContent=g.cat.en; en.onclick=()=>h.click(); // 點英文小註記也能展開／收起
    const list=document.createElement('div'); list.className='items';
    for(const it of g.items){
      const b=document.createElement('button'); b.type='button'; b.className='item';
      const id=it.ex?it.ex.id:it.saved.id;
      if((S.saved?S.saved.id:S.ex&&S.ex.id)===id) b.classList.add('on');
      const t=document.createElement('span'); t.className='t'; t.textContent=it.ex?it.ex.name:it.saved.name;
      const s=document.createElement('span'); s.className='s'; s.textContent=it.ex?it.ex.sig:(exById(it.saved.base)||{}).name||'';
      b.append(t,s);
      b.onclick=()=>{ go(id); setDrawer(false); };
      if(it.saved){ const d=document.createElement('span'); d.className='del'; d.textContent='×'; d.title='刪除這個收藏'; d.setAttribute('role','button'); d.setAttribute('aria-label','刪除 '+it.saved.name);
        d.onclick=(ev)=>{ ev.stopPropagation(); S.savedList=S.savedList.filter(x=>x.id!==it.saved.id); store.set('saved',S.savedList); Sync.dirty(); if(S.saved&&S.saved.id===it.saved.id) go(it.saved.base); else renderSide(); };
        b.append(d); }
      list.append(b);
    }
    wrap.append(h,en,list); side.append(wrap);
  }
  // 搜尋中、或留白所屬的分類已不是展開狀態（例如切到別的範例）時，拿掉底部留白，避免列表下方空一大塊
  if(side.style.paddingBottom && (q || S.closed[side.dataset.padFor]!==false)){ sideScroll.stop(); side.style.paddingBottom=''; }
  if(!total){ const e=document.createElement('div'); e.className='empty-search'; e.textContent='沒有符合「'+q+'」的表達式，試試 wiggle、loop、文字、顏色。'; side.append(e); }
}
const exById=id=>EX.find(e=>e.id===id);

// ---------- 切換範例 ----------
function go(id){ if(location.hash!=='#'+id){ location.hash=id; } else load(id); }
function load(id){
  let ex=exById(id), saved=null;
  if(!ex){ saved=S.savedList.find(s=>s.id===id); ex=saved?exById(saved.base):null; }
  if(!ex){ ex=EX[0]; saved=null; }
  S.ex=ex; S.saved=saved;
  S.prop = ex.lab ? (saved&&saved.prop || S.labProp) : ex.prop;
  S.code = saved ? saved.code : (S.codes[ex.id+(ex.lab?':'+S.prop:'')] || (ex.lab? (S.prop==='position'?ex.code:LAB_STARTERS[S.prop]) : ex.code));
  // 只展開目前觀看範例所在的分類，其餘全部收起（不記錄，重新開啟頁面即還原）
  S.closed={}; S.closed[saved?'mine':ex.cat]=false;
  rebuildScene();
  $('#code').value=S.code;
  renderDoc(); renderMake(); renderHL(); renderParams(true); renderEffects(); renderSide();
  $('#trailTog').parentElement.style.display = ex.trail ? '' : 'none';
  const lp=$('#labProp'); lp.hidden=!ex.lab; if(ex.lab) lp.value=S.prop;
  $('#savebar').classList.remove('show');
  S.t = Math.min(S.t, COMP.dur-1e-6); S.graphDirty=true; S.dirty=true; resizeAll();
}
function rebuildScene(){ S.scene=new AE.Scene(buildScene(S.ex,S.code,S.prop)); AE.setScene(S.scene); }
function userLayers(){ return S.scene.userLayers(); }
function defaultCode(){ return S.saved? S.saved.code : (S.ex.lab ? (S.prop==='position'?S.ex.code:LAB_STARTERS[S.prop]) : S.ex.code); }
function codeKey(){ return S.ex.id+(S.ex.lab?':'+S.prop:''); }

function setCode(code,fromEditor){
  S.code=code;
  for(const L of userLayers()) L.props[S.prop].expr=code;
  if(!S.saved){ if(code===defaultCode()) delete S.codes[codeKey()]; else S.codes[codeKey()]=code; store.set('codes',S.codes); }
  else { S.saved.code=code; store.set('saved',S.savedList); }
  Sync.dirty();
  if(!fromEditor){ const ta=$('#code'); const ss=ta.selectionStart, se=ta.selectionEnd; ta.value=code; try{ ta.setSelectionRange(ss,se); }catch(e){} }
  renderHL(); renderParams(false); updateModChip();
  S.graphDirty=true; S.dirty=true;
}
function updateModChip(){ const m=$('#modChip'); m.innerHTML=''; if(S.code!==defaultCode()){ m.innerHTML='<span class="chip mod">已修改</span>'; } }

// ---------- 說明 ----------
function renderMake(){
  const ol=$('#make'); ol.innerHTML='';
  for(const t of (S.ex.make||[])){ const li=document.createElement('li'); li.textContent=t; ol.append(li); }
  ol.closest('.panel').hidden=!(S.ex.make&&S.ex.make.length);
}
function renderDoc(){
  const ex=S.ex, cat=CATS.find(c=>c.id===ex.cat);
  const d=$('#doc'); d.innerHTML='';
  const meta=document.createElement('div'); meta.className='meta';
  meta.innerHTML='<span class="chip"></span><span class="chip expr"></span>';
  meta.children[0].textContent=cat.name; meta.children[1].textContent='套用：'+AE.PROP_INFO[S.prop].label;
  const h=document.createElement('h2'); h.textContent=S.saved?S.saved.name:ex.name;
  const sig=document.createElement('code'); sig.className='sig'; sig.textContent=ex.sig;
  const p=document.createElement('p'); p.textContent=ex.desc;
  const more=document.createElement('div'); more.className='fold-body'; more.append(p);
  d.append(meta,h,sig,more);
  if(ex.how&&ex.how.length){ const ol=document.createElement('ul'); for(const s of ex.how){ const li=document.createElement('li'); li.textContent=s; ol.append(li); } more.append(ol); }
  if(ex.tip){ const t=document.createElement('div'); t.className='tip'; t.textContent=ex.tip; more.append(t); }
  updateModChip();
}

// ---------- 語法高亮 ----------
const KW=new Set('if else for while do var let const function return true false null undefined new typeof instanceof break continue switch case default in of this'.split(' '));
const AEF=new Set('wiggle random gaussRandom seedRandom noise linear ease easeIn easeOut clamp length normalize dot cross add sub mul div lookAt degreesToRadians radiansToDegrees timeToFrames framesToTime timeToTimecode timeToCurrentFormat hslToRgb rgbToHsl hexToRgb loopOut loopIn loopOutDuration loopInDuration key nearestKey valueAtTime velocityAtTime posterizeTime createPath effect toComp fromComp layer points inTangents outTangents isClosed'.split(' '));
const AEV=new Set('time value index thisComp thisLayer thisProperty numKeys velocity speed inPoint outPoint marker transform position scale rotation opacity anchorPoint text sourceText textIndex textTotal Math'.split(' '));
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const TOK=/(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(\b\d*\.?\d+(?:e[+-]?\d+)?\b)|([A-Za-z_$][\w$]*)/g;
function hlLine(line){
  let out='', last=0, m; TOK.lastIndex=0;
  while((m=TOK.exec(line))){ out+=esc(line.slice(last,m.index)); last=TOK.lastIndex;
    if(m[1]){ const at=m[1].indexOf('@'); out+= at>=0 && /\/\/\s*@/.test(m[1]) ? '<span class="tk-c">'+esc(m[1].slice(0,at))+'</span><span class="tk-p">'+esc(m[1].slice(at))+'</span>' : '<span class="tk-c">'+esc(m[1])+'</span>'; }
    else if(m[2]) out+='<span class="tk-s">'+esc(m[2])+'</span>';
    else if(m[3]) out+='<span class="tk-n">'+m[3]+'</span>';
    else { const w=m[4]; const cls=KW.has(w)?'tk-k':AEF.has(w)?'tk-f':AEV.has(w)?'tk-v':''; out+= cls?'<span class="'+cls+'">'+w+'</span>':w; }
  }
  return out+esc(line.slice(last));
}
let errLine=null;
function renderSel(){
  const ta=$('#code'), sel=$('#sel'); const a=ta.selectionStart, b=ta.selectionEnd;
  if(document.activeElement!==ta || a===b){ if(sel.innerHTML) sel.innerHTML=''; return; }
  const v=ta.value; sel.innerHTML=esc(v.slice(0,a))+'<mark>'+esc(v.slice(a,b))+'</mark>'+esc(v.slice(b))+'\n';
}
function renderHL(){
  const lines=S.code.split('\n');
  $('#hl').innerHTML=lines.map((l,i)=>'<span class="ln'+(errLine===i+1?' bad':'')+'">'+hlLine(l)+'</span>').join('\n')+'\n';
}

// ---------- 參數滑桿 ----------
const PRE=/^(\s*(?:var\s+|let\s+|const\s+)?([A-Za-z_$][\w$]*)\s*=\s*)(-?\d*\.?\d+)(\s*;?\s*\/\/\s*@\s*(.+?)\s+(-?\d*\.?\d+)\s*~\s*(-?\d*\.?\d+)(?:\s+(\d*\.?\d+))?\s*)$/; // 標籤可含空格，例如 @門檻 X 0~1920 10
function parseParams(code){ const out=[]; code.split('\n').forEach((l,i)=>{ const m=l.match(PRE); if(m) out.push({line:i,name:m[2],val:+m[3],label:m[5],min:+m[6],max:+m[7],step:m[8]?+m[8]:((+m[7]-+m[6])/100)}); }); return out; }
function decimals(step){ const s=String(step); const i=s.indexOf('.'); return i<0?0:s.length-i-1; }
let dragging=null;
function renderParams(force){
  const ps=parseParams(S.code); const sig=ps.map(p=>p.name+p.label+p.min+p.max+p.step).join('|');
  $('#paramsPanel').hidden=!ps.length; // 沒有可調參數時隱藏「參數調整」
  const box=$('#params');
  if(!force && sig===S.paramSig){ ps.forEach((p,i)=>{ const row=box.children[i]; if(!row||row===dragging) return; const r=row.querySelector('input[type=range]'), n=row.querySelector('input[type=number]'); r.value=p.val; if(document.activeElement!==n) n.value=p.val; }); return; }
  S.paramSig=sig; box.innerHTML='';
  if(!ps.length){ box.innerHTML='<div class="hint">這個表達式沒有可調參數。在數值變數那一行結尾加上註解 <code>// @標籤 最小~最大 間距</code> 就會出現滑桿，例如<br><code>amp = 50; // @幅度 0~200 1</code></div>'; return; }
  ps.forEach((p,i)=>{
    const row=document.createElement('div'); row.className='prow';
    const id='pr-'+i;
    row.innerHTML='<label for="'+id+'"></label><input type="range" id="'+id+'"><input type="number" aria-label="">';
    const lab=row.querySelector('label'); lab.textContent=p.label; const sm=document.createElement('small'); sm.textContent=p.name; lab.append(sm);
    const r=row.children[1], n=row.children[2]; n.setAttribute('aria-label',p.label+' 數值');
    for(const el of [r,n]){ el.min=p.min; el.max=p.max; el.step=p.step; el.value=p.val; }
    const apply=(v)=>{ v=+v; if(isNaN(v)) return; const cur=parseParams(S.code)[i]; if(!cur) return;
      const lines=S.code.split('\n'); lines[cur.line]=lines[cur.line].replace(PRE,(all,a,nm,num,rest)=>a+v.toFixed(decimals(p.step)).replace(/^-0$/,'0')+rest);
      setCode(lines.join('\n')); };
    r.addEventListener('input',()=>{ dragging=row; n.value=r.value; apply(r.value); });
    r.addEventListener('change',()=>{ dragging=null; });
    n.addEventListener('input',()=>{ if(n.value!=='') { r.value=n.value; apply(n.value); } });
    box.append(row);
  });
}

// ---------- 效果控制 ----------
function renderEffects(){
  const L=userLayers()[0]; const fxs=L?L.effects:[]; const panel=$('#fxPanel'), box=$('#fx');
  panel.hidden=!fxs.length; box.innerHTML='';
  // 記下每個參數的原始值，供「重設」使用
  fxs.forEach(fx=>fx.params.forEach(p=>{ if(!('_default' in p)) p._default=Array.isArray(p.v)?p.v.slice():p.v; }));
  fxs.forEach((fx,fi)=>{
    const f=document.createElement('div'); f.className='fx';
    f.innerHTML='<div class="fx-h"><span class="fxb">fx</span><span></span></div><div class="pb"></div>';
    f.querySelector('.fx-h span:last-child').textContent=fx.name+(fx.alias?'（'+fx.alias+'）':'');
    const pb=f.querySelector('.pb');
    fx.params.forEach((p,pi)=>{
      const row=document.createElement('div'); row.className='prow'; const id='fx-'+fi+'-'+pi;
      const lab=document.createElement('label'); lab.htmlFor=id; lab.textContent=p.name; if(p.alias){ const s=document.createElement('small'); s.textContent=p.alias; lab.append(s); }
      row.append(lab);
      const changed=()=>{ S.graphDirty=true; S.dirty=true; };
      if(p.type==='slider'||p.type==='angle'){
        const r=document.createElement('input'); r.type='range'; r.id=id; r.min=p.type==='angle'?-180:p.min; r.max=p.type==='angle'?180:p.max; r.step=p.type==='angle'?1:((p.max-p.min)/200);
        const n=document.createElement('input'); n.type='number'; n.setAttribute('aria-label',p.name+' 數值'); r.value=n.value=p.v;
        r.oninput=()=>{ p.v=+r.value; n.value=p.v; changed(); }; n.oninput=()=>{ if(n.value!==''){ p.v=+n.value; r.value=p.v; changed(); } };
        row.append(r,n);
      } else if(p.type==='checkbox'){
        const c=document.createElement('input'); c.type='checkbox'; c.id=id; c.checked=!!p.v; c.style.justifySelf='start'; c.style.width='18px'; c.style.height='18px'; c.style.accentColor='var(--expr)';
        const n=document.createElement('span'); n.className='mono'; n.style.color='var(--muted)'; n.textContent=p.v?'= 1':'= 0';
        c.onchange=()=>{ p.v=c.checked?1:0; n.textContent='= '+p.v; changed(); }; row.append(c,n);
      } else if(p.type==='color'){
        const c=document.createElement('input'); c.type='color'; c.id=id; c.value=toHex(p.v);
        const n=document.createElement('span'); n.className='mono'; n.style.cssText='color:var(--muted);font-size:11px'; const lbl=()=>n.textContent='['+p.v.slice(0,3).map(x=>x.toFixed(2)).join(', ')+', 1]';
        lbl(); c.oninput=()=>{ const h=c.value; p.v=[parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255,1]; lbl(); changed(); };
        row.style.gridTemplateColumns='96px 64px 1fr'; row.append(c,n);
      } else if(p.type==='point'){
        const w=document.createElement('div'); w.className='pt'; row.style.gridTemplateColumns='96px 1fr';
        [0,1].forEach(k=>{ const n=document.createElement('input'); n.type='number'; n.id=k?id+'y':id; n.setAttribute('aria-label',(k?'Y':'X')); n.value=p.v[k]; n.step=10; n.oninput=()=>{ if(n.value!==''){ p.v[k]=+n.value; changed(); } }; w.append(n); });
        row.append(w);
      }
      pb.append(row);
    });
    box.append(f);
  });
}
$('#fxReset').onclick=()=>{ const L=userLayers()[0]; if(!L) return;
  L.effects.forEach(fx=>fx.params.forEach(p=>{ if('_default' in p) p.v=Array.isArray(p._default)?p._default.slice():p._default; }));
  renderEffects(); S.graphDirty=true; S.dirty=true; };
function toHex(c){ return '#'+c.slice(0,3).map(x=>Math.round(Math.min(1,Math.max(0,x))*255).toString(16).padStart(2,'0')).join(''); }

// ---------- 繪圖 ----------
const comp=$('#comp'), cx=comp.getContext('2d');
const tl=$('#tl'), tx=tl.getContext('2d');
const gr=$('#graph'), gx=gr.getContext('2d');
let DPR=1;
function fitCanvas(c,h){ const w=c.clientWidth||300; c.width=Math.round(w*DPR); c.height=Math.round((h||c.clientHeight)*DPR); if(h) c.style.height=h+'px'; }
function resizeAll(){ DPR=Math.min(2,window.devicePixelRatio||1);
  const w=comp.clientWidth||600; comp.width=Math.round(w*DPR); comp.height=Math.round(w*9/16*DPR);
  fitCanvas(tl,tlHeight()); fitCanvas(gr,170); S.graphDirty=true; S.dirty=true; }
const rgba=(c,a)=>'rgba('+[0,1,2].map(i=>Math.round(Math.min(1,Math.max(0,c[i]))*255)).join(',')+','+Math.min(1,Math.max(0,(c[3]==null?1:c[3])*(a==null?1:a)))+')';

function shapePath(ctx,shape,w,h){
  ctx.beginPath();
  if(shape==='circle'){ ctx.ellipse(0,0,w/2,h/2,0,0,Math.PI*2); }
  else if(shape==='star'){ const n=shape==='star'?8:5; const R=w/2, r=w/2*0.72; for(let i=0;i<n*2;i++){ const a=i/(n*2)*Math.PI*2-Math.PI/2, rr=i%2?r:R; i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } ctx.closePath(); }
  else if(shape==='arrow'){ const L=w/2; ctx.moveTo(-L,-h*0.12); ctx.lineTo(L*0.25,-h*0.12); ctx.lineTo(L*0.25,-h*0.32); ctx.lineTo(L,0); ctx.lineTo(L*0.25,h*0.32); ctx.lineTo(L*0.25,h*0.12); ctx.lineTo(-L,h*0.12); ctx.closePath(); }
  else { const rr=Math.min(w,h)*0.12; if(ctx.roundRect) ctx.roundRect(-w/2,-h/2,w,h,rr); else ctx.rect(-w/2,-h/2,w,h); }
}
function drawPathValue(ctx,p,color,stroke){
  const P=p.points; if(!P||!P.length) return;
  ctx.beginPath(); ctx.moveTo(P[0][0],P[0][1]);
  const seg=(i,j)=>{ const o=p.outTangents[i]||[0,0], n=p.inTangents[j]||[0,0];
    if(!o[0]&&!o[1]&&!n[0]&&!n[1]) ctx.lineTo(P[j][0],P[j][1]); else ctx.bezierCurveTo(P[i][0]+o[0],P[i][1]+o[1],P[j][0]+n[0],P[j][1]+n[1],P[j][0],P[j][1]); };
  for(let i=0;i<P.length-1;i++) seg(i,i+1);
  if(p.closed){ seg(P.length-1,0); ctx.closePath(); }
  if(p.closed && !stroke){ ctx.fillStyle=rgba(color); ctx.fill(); ctx.lineWidth=4; ctx.strokeStyle=rgba([1,1,1,0.25]); ctx.stroke(); }
  else { ctx.lineWidth=stroke||8; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle=rgba(color); ctx.stroke(); }
}
const ev=(L,k,t)=>AE.evalProp(L.props[k],t);
function drawLayer(ctx,L,t){
  if(t<L.inPoint||t>=L.outPoint) return;
  const pos=ev(L,'position',t), sc=ev(L,'scale',t), rot=ev(L,'rotation',t), op=ev(L,'opacity',t), an=ev(L,'anchorPoint',t), col=ev(L,'color',t);
  const w=Array.isArray(L.size)?L.size[0]:L.size, h=Array.isArray(L.size)?L.size[1]:L.size;
  ctx.save(); ctx.globalAlpha=Math.min(1,Math.max(0,op/100)); if(L.blend==='add') ctx.globalCompositeOperation='lighter'; // 相加混合模式
  ctx.translate(pos[0],pos[1]); ctx.rotate(rot*Math.PI/180); ctx.scale(sc[0]/100,sc[1]/100); ctx.translate(-an[0],-an[1]);
  if(L.shape==='animtext'){
    // 逐字動畫：每個字依「表達式選取器 › 數量」套用動畫製作工具的位置／縮放／旋轉／不透明度／字距
    const chars=Array.from(L.spec.text||''); const n=chars.length; const an=L.anim;
    ctx.font='700 '+L.fontSize+'px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle=rgba(col);
    const ws=chars.map(c=>ctx.measureText(c).width), base=L.fontSize*0.36;
    const amts=chars.map((c,i)=>AE.evalProp(L.props.amount,t,{textIndex:i+1,textTotal:n}));
    const trk=an.tracking||0, sc=an.scale==null?null:(Array.isArray(an.scale)?an.scale:[an.scale,an.scale]);
    let tot=0; ws.forEach((w,i)=>{ tot+=w+(i<n-1?trk*amts[i][0]/100:0); }); let x=-tot/2;
    chars.forEach((c,i)=>{ const f0=amts[i][0]/100, f1=amts[i][1]/100, cxp=x+ws[i]/2;
      if(c!==' '){
        const dx=an.position?an.position[0]*f0:0, dy=an.position?an.position[1]*f1:0;
        const sx=sc?(100+(sc[0]-100)*f0)/100:1, sy=sc?(100+(sc[1]-100)*f1)/100:1;
        const o=an.opacity==null?1:Math.min(1,Math.max(0,(100+(an.opacity-100)*f0)/100));
        ctx.save(); ctx.globalAlpha*=o; ctx.translate(cxp+dx,base+dy); if(an.rotation) ctx.rotate(an.rotation*f0*Math.PI/180); ctx.scale(sx,sy); ctx.fillText(c,0,0); ctx.restore(); }
      x+=ws[i]+trk*f0; });
  } else if(L.shape==='text'){
    const s=String(ev(L,'sourceText',t)); const lines=s.split(/\r\n|\r|\n/);
    ctx.font='700 '+L.fontSize+'px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=rgba(col);
    const lh=L.fontSize*1.25; lines.forEach((ln,i)=>ctx.fillText(ln,0,(i-(lines.length-1)/2)*lh));
  } else if(L.shape==='path'){ drawPathValue(ctx,ev(L,'path',t),col,L.stroke); }
  else if(L.shape==='null'){ ctx.strokeStyle=rgba(col); ctx.lineWidth=4; ctx.strokeRect(-w/2,-w/2,w,w); ctx.beginPath(); ctx.moveTo(-w*0.8,0); ctx.lineTo(w*0.8,0); ctx.moveTo(0,-w*0.8); ctx.lineTo(0,w*0.8); ctx.stroke(); }
  else if(L.shape==='frame'){ ctx.setLineDash([16,12]); ctx.strokeStyle=rgba(col); ctx.lineWidth=4; ctx.strokeRect(-w/2,-h/2,w,h); ctx.setLineDash([]); }
  else { shapePath(ctx,L.shape,w,h); ctx.fillStyle=rgba(col); ctx.fill(); }
  ctx.restore();
  if(L.label){ ctx.save(); ctx.font='600 30px "JetBrains Mono",monospace'; ctx.fillStyle='#8d939c'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(L.label,40,pos[1]); ctx.restore(); }
}
function drawComp(){
  const W=comp.width, H=comp.height, k=W/COMP.w;
  cx.setTransform(1,0,0,1,0,0); cx.fillStyle='#0c0d0f'; cx.fillRect(0,0,W,H);
  cx.setTransform(k,0,0,k,0,0);
  // 背景格線
  cx.strokeStyle='#1b1d21'; cx.lineWidth=2;
  cx.beginPath(); for(let x=0;x<=COMP.w;x+=120){ cx.moveTo(x,0); cx.lineTo(x,COMP.h); } for(let y=0;y<=COMP.h;y+=120){ cx.moveTo(0,y); cx.lineTo(COMP.w,y); } cx.stroke();
  cx.strokeStyle='#2a2d33'; cx.setLineDash([10,10]); cx.strokeRect(COMP.w*0.05,COMP.h*0.05,COMP.w*0.9,COMP.h*0.9); cx.setLineDash([]);
  const t=S.t, Ls=S.scene.layers, U=userLayers();
  // 軌跡
  if(S.ex.trail && S.trail && U[0] && U[0].shape!=='text'){
    const L=U[0];
    for(let i=24;i>=1;i--){ const tt=t-i/COMP.fps; if(tt<0) continue; const p=ev(L,'position',tt); cx.beginPath(); cx.arc(p[0],p[1],5,0,Math.PI*2); cx.fillStyle='rgba(242,166,64,'+(0.55*(1-i/25))+')'; cx.fill(); }
  }
  for(let i=Ls.length-1;i>=0;i--) drawLayer(cx,Ls[i],t);
  // 錨點標示
  if(U[0] && U[0].shape!=='text' && U[0].shape!=='animtext'){ const L=U[0]; if(t>=L.inPoint && t<L.outPoint){ const p=ev(L,'position',t); cx.strokeStyle='rgba(78,164,242,.9)'; cx.lineWidth=3; cx.beginPath(); cx.arc(p[0],p[1],9,0,Math.PI*2); cx.moveTo(p[0]-16,p[1]); cx.lineTo(p[0]+16,p[1]); cx.moveTo(p[0],p[1]-16); cx.lineTo(p[0],p[1]+16); cx.stroke(); } }
}

// ---------- 讀值與錯誤 ----------
let lastRead='', lastErr='';
function fmtVal(v,prop){
  const d=AE.PROP_INFO[prop].dims;
  if(d==='text') return '"'+String(v).replace(/\r\n|\r|\n/g,'⏎')+'"';
  if(d==='path') return 'createPath('+(v.points?v.points.length:0)+' 個點'+(v.closed?'，封閉':'，開放')+')';
  const fx=(x,n)=>{ const s=(+x).toFixed(n); return /^-0\.?0*$/.test(s)? s.slice(1) : s; }; // 不顯示 -0.0
  if(d===1) return fx(v,2);
  if(d===4) return '['+v.map(x=>fx(x,3)).join(', ')+']';
  return v.map(x=>fx(x,1)).join(', ');
}
function updateReadout(){
  const L=userLayers()[0]; if(!L) return;
  const P=L.props[S.prop]; const isAmt=S.prop==='amount'; const nCh=isAmt?Array.from(L.spec.text||'').length:0;
  const v=isAmt?AE.evalProp(P,S.t,{textIndex:1,textTotal:nCh}):AE.evalProp(P,S.t);
  const s=L.name+'|'+fmtVal(v,S.prop);
  if(s!==lastRead){ lastRead=s; const r=$('#readout'); r.innerHTML='';
    // 只顯示「屬性：數值」，例如 旋轉：12.34
    const a=document.createElement('span'); a.className='rk'; a.textContent=P.label.split(' › ').pop()+'：';
    const b=document.createElement('b'); b.textContent=fmtVal(v,S.prop); r.append(a,b);
    if(S.prop==='color'){ const sw=document.createElement('span'); sw.className='swatch'; sw.style.background=rgba(v); r.append(sw); } }
  let err=null; for(const U of userLayers()){ if(U.props[S.prop].err){ err=U.props[S.prop].err; break; } }
  if(!err){ for(const X of S.scene.layers){ for(const k in X.props){ if(X.props[k].err){ err=X.props[k].err; break; } } if(err) break; } }
  const es=err?JSON.stringify(err):'';
  if(es!==lastErr){ lastErr=es; const box=$('#err');
    if(err){ $('#errText').textContent=(err.line?'第 '+err.line+' 行：':'')+err.msg+'。預覽暫時使用屬性原本的值。'; box.classList.add('show'); errLine=err.line; }
    else { box.classList.remove('show'); errLine=null; }
    renderHL(); }
}

// ---------- 時間軸 ----------
function tlRows(){
  const L=userLayers()[0]; if(!L) return [];
  const rows=[{type:'layer',L}];
  for(const k of ['position','scale','rotation','opacity','color','sourceText','path','amount']){ const P=L.props[k]; if(P.keys.length || k===S.prop || (P.expr && k!==S.prop)) rows.push({type:'prop',P,L}); }
  if(L.markers.length) rows.push({type:'marker',L});
  return rows;
}
function tlHeight(){ return 34+tlRows().length*24+4; }
function drawTL(){
  if(tl.clientWidth && Math.abs(tl.width-Math.round(tl.clientWidth*DPR))>1) fitCanvas(tl,tlHeight()); // 同上：避免時間軸被拉伸
  const W=tl.width/DPR, H=tl.height/DPR; tx.setTransform(DPR,0,0,DPR,0,0);
  tx.fillStyle='#1d1f23'; tx.fillRect(0,0,W,H);
  const left=W<520?78:118, right=14, tw=W-left-right, X=t=>left+t/COMP.dur*tw;
  tx.fillStyle='#17181b'; tx.fillRect(0,0,left,H);
  // 刻度
  tx.font='11px "JetBrains Mono",monospace'; tx.textBaseline='middle';
  for(let s=0;s<=COMP.dur*2;s++){ const x=X(s/2); tx.strokeStyle=s%2?'#2c2f35':'#3b3f46'; tx.beginPath(); tx.moveTo(x,s%2?27:22); tx.lineTo(x,33); tx.stroke(); if(s%2===0){ tx.fillStyle='#8d939c'; tx.textAlign='center'; fillMid(tx,(s/2)+'s',x,11); } }
  tx.strokeStyle='#33373d'; tx.beginPath(); tx.moveTo(0,33.5); tx.lineTo(W,33.5); tx.stroke();
  const rows=tlRows(); let y=34;
  // 屬性列、標記列的文字與上方圖層名稱的中心對齊
  // 左側欄所有文字（圖層名稱、屬性、標記）都置中在左側欄中間
  const fontOf=r=>(r.type==='layer'?'600 12px':'12px')+' "Noto Sans TC",sans-serif';
  const labelOf=r=>{ tx.font=fontOf(r); return r.type==='layer'? fit(r.L.name,left-14) : r.type==='prop'? fit(r.P.label.split(' › ').pop(),left-14) : '標記'; };
  let maxW=0; rows.forEach(r=>{ const s=labelOf(r); maxW=Math.max(maxW,tx.measureText(s).width); });
  const colCX=Math.max(4+maxW/2, Math.min((left-2)/2, left-6-maxW/2)); // 以左側欄的中心為軸；最寬的文字放不下時才往左移
  const atCenter=s=>colCX-tx.measureText(s).width/2; // 刻度區高 34：數字上方與數字到刻度之間各留約 7px
  rows.forEach((r,ri)=>{
    const cy=y+12;
    tx.textAlign='left'; tx.fillStyle='#dde0e5'; tx.font=(r.type==='layer'?'600 12px':'12px')+' "Noto Sans TC",sans-serif';
    if(r.type==='layer'){ const nm=labelOf(r); fillMid(tx,nm,atCenter(nm),cy); const c=r.L.props.color.base; tx.fillStyle=rgba(c,0.28); tx.fillRect(X(r.L.inPoint),y+5,X(r.L.outPoint)-X(r.L.inPoint),14); tx.fillStyle=rgba(c,0.9); tx.fillRect(X(r.L.inPoint),y+5,3,14); tx.fillRect(X(r.L.outPoint)-3,y+5,3,14); }
    else if(r.type==='prop'){ const P=r.P; const s=labelOf(r); tx.fillStyle=P.expr?'#f2a640':'#b9bec6'; fillMid(tx,s,atCenter(s),cy);
      if(P.expr){ tx.strokeStyle='rgba(242,166,64,.35)'; tx.setLineDash([3,4]); tx.beginPath(); tx.moveTo(left,cy); tx.lineTo(W-right,cy); tx.stroke(); tx.setLineDash([]); }
      for(const k of P.keys){ const x=X(k.t); tx.save(); tx.translate(x,cy); tx.rotate(Math.PI/4); tx.fillStyle=k.e==='linear'?'#dde0e5':'#a9cdf2'; tx.fillRect(-4.5,-4.5,9,9); tx.restore(); } }
    else { tx.font=fontOf(r); tx.fillStyle='#b9bec6'; fillMid(tx,'標記',atCenter('標記'),cy); for(const m of r.L.markers){ const x=X(m.time); tx.fillStyle='#62c48a'; tx.beginPath(); tx.moveTo(x-6,y+5); tx.lineTo(x+6,y+5); tx.lineTo(x,y+15); tx.closePath(); tx.fill(); tx.fillStyle='#8d939c'; tx.font='11px "JetBrains Mono",monospace'; fillMid(tx,m.comment,x+8,cy); } }
    y+=24; if(ri<rows.length-1){ tx.strokeStyle='#26292e'; tx.beginPath(); tx.moveTo(0,y+.5); tx.lineTo(W,y+.5); tx.stroke(); } // 最後一列下方不畫分隔線
  });
  const px=X(S.t); tx.strokeStyle='#4ea4f2'; tx.lineWidth=1.5; tx.beginPath(); tx.moveTo(px,4); tx.lineTo(px,H); tx.stroke(); tx.lineWidth=1;
  tx.fillStyle='#4ea4f2'; tx.beginPath(); tx.moveTo(px-6,0); tx.lineTo(px+6,0); tx.lineTo(px+6,8); tx.lineTo(px,13); tx.lineTo(px-6,8); tx.closePath(); tx.fill();
  tl._map={left,tw};
}
// 依字形實際高度垂直置中（不依字型的 middle 基準線，避免中文、數字看起來偏上）
function fillMid(c,text,x,cy){ const bl=c.textBaseline; c.textBaseline='alphabetic'; const m=c.measureText(text);
  const a=m.actualBoundingBoxAscent, d=m.actualBoundingBoxDescent;
  c.fillText(text,x,(isFinite(a)&&isFinite(d))? cy+(a-d)/2 : cy+4); c.textBaseline=bl; }
function fit(s,w){ if(tx.measureText(s).width<=w) return s; while(s.length>1 && tx.measureText(s+'…').width>w) s=s.slice(0,-1); return s+'…'; }
function scrubAt(e){ const r=tl.getBoundingClientRect(); const m=tl._map||{left:100,tw:r.width-120}; let t=(e.clientX-r.left-m.left)/m.tw*COMP.dur; t=Math.max(0,Math.min(COMP.dur-1/COMP.fps,t)); S.t=Math.round(t*COMP.fps)/COMP.fps; S.dirty=true; }
tl.addEventListener('pointerdown',e=>{ tl.setPointerCapture(e.pointerId); S.wasPlaying=S.playing; setPlaying(false); scrubAt(e); tl._drag=true; });
tl.addEventListener('pointermove',e=>{ if(tl._drag) scrubAt(e); });
tl.addEventListener('pointerup',()=>{ tl._drag=false; });

// ---------- 數值圖表 ----------
const SER=['#ee6a5c','#62c48a','#4ea4f2','#c9ccd2','#f2a640','#b48af0','#e879b0','#6fd0d8']; // 第 7、8 色給超過 6 條線的圖表
function computeGraph(){
  const L=userLayers()[0]; S.graph=null; if(!L) return;
  const d=AE.PROP_INFO[S.prop].dims;
  document.querySelector('.p-graph').hidden=(d==='text'||d==='path'); // 文字、路徑屬性沒有數值圖表，整個面板不顯示
  const N=Math.min(360,Math.max(120,Math.floor(gr.width/DPR/2)));
  if(d==='text'||d==='path'){ S.graph={msg: d==='text'?'文字屬性的結果是字串，請看合成預覽與上方讀值。':'路徑屬性的結果是形狀，請看合成預覽。'}; return; }
  const ts=[]; for(let i=0;i<=N;i++) ts.push(i/N*COMP.dur*0.9999);
  if(d===4){ S.graph={color:ts.map(t=>ev(L,'color',t))}; return; }
  let series=[], names=[];
  if(d==='amount'){ const n=Array.from(L.spec.text||'').length; const pick=[1,2,3,4,5].filter(i=>i<=n);
    S.graph=null; series=pick.map(i=>ts.map(t=>AE.evalProp(L.props.amount,t,{textIndex:i,textTotal:n})[0])); names=pick.map(i=>'第 '+i+' 字');
    return finishGraph(series,names); }
  if(S.ex.labels){ userLayers().forEach((U,i)=>{ series.push(ts.map(t=>{ const v=ev(U,S.prop,t); return Array.isArray(v)?v[0]:v; })); names.push(U.name+(d===2?' X':'')); }); }
  else if(d===1){ series=[ts.map(t=>ev(L,S.prop,t))]; names=[AE.PROP_INFO[S.prop].label]; }
  else { const vals=ts.map(t=>ev(L,S.prop,t)); series=[vals.map(v=>v[0]),vals.map(v=>v[1])]; names=[S.prop==='scale'?'寬 %':'X',S.prop==='scale'?'高 %':'Y']; }
  finishGraph(series,names);
}
function finishGraph(series,names){
  let mn=Infinity,mx=-Infinity; for(const s of series) for(const v of s){ if(isFinite(v)){ mn=Math.min(mn,v); mx=Math.max(mx,v); } }
  if(!isFinite(mn)){ mn=0; mx=1; } if(mx-mn<1e-6){ mn-=1; mx+=1; } const pad=(mx-mn)*0.08; mn-=pad; mx+=pad;
  S.graph={series,names,mn,mx};
}
function niceTicks(mn,mx,n){ const span=mx-mn; const step0=span/n; const mag=Math.pow(10,Math.floor(Math.log10(step0))); const st=[1,2,2.5,5,10].map(x=>x*mag).find(x=>span/x<=n)||mag*10; const out=[]; for(let v=Math.ceil(mn/st)*st; v<=mx+1e-9; v+=st) out.push(+v.toFixed(6)); return out; }
function drawGraph(){
  const W=gr.width/DPR, H=gr.height/DPR; gx.setTransform(DPR,0,0,DPR,0,0); gx.clearRect(0,0,W,H);
  const g=S.graph, box=$('#graphBox'), leg=$('#legend');
  let msg=box.querySelector('.graph-msg');
  if(!g||g.msg){ gr.style.display='none'; if(!msg){ msg=document.createElement('div'); msg.className='graph-msg'; box.append(msg); } msg.textContent=g?g.msg:''; leg.classList.remove('many'); leg.innerHTML=''; return; }
  gr.style.display=''; if(msg) msg.remove();
  // 畫布先前被隱藏時量不到寬度，會以錯誤尺寸建立而被拉伸；顯示後若尺寸不符就重新配置
  if(gr.clientWidth && Math.abs(gr.width-Math.round(gr.clientWidth*DPR))>1){ fitCanvas(gr,170); computeGraph(); return drawGraph(); }
  const l=52, r=12, t=10, b=22, w=W-l-r, h=H-t-b; const X=tt=>l+tt/COMP.dur*w;
  gx.font='10.5px "JetBrains Mono",monospace'; gx.textBaseline='middle';
  for(let s=0;s<=COMP.dur;s++){ const x=X(s); gx.strokeStyle='#26292e'; gx.beginPath(); gx.moveTo(x,t); gx.lineTo(x,t+h); gx.stroke(); gx.fillStyle='#8d939c'; gx.textAlign='center'; gx.fillText(s+'s',x,H-9); }
  if(g.color){
    const n=g.color.length; for(let i=0;i<n-1;i++){ gx.fillStyle=rgba(g.color[i]); gx.fillRect(X(i/(n-1)*COMP.dur),t+8,w/(n-1)+1,h-16); }
    gx.strokeStyle='#33373d'; gx.strokeRect(l,t+8,w,h-16); gx.fillStyle='#8d939c'; gx.textAlign='right'; gx.fillText('顏色',l-8,t+h/2);
    leg.classList.remove('many'); leg.innerHTML='<span>顏色隨時間變化</span>';
  } else {
    const Y=v=>t+h-(v-g.mn)/(g.mx-g.mn)*h;
    const ticks=niceTicks(g.mn,g.mx,4); gx.textAlign='right';
    for(const v of ticks){ const y=Y(v); gx.strokeStyle='#26292e'; gx.beginPath(); gx.moveTo(l,y); gx.lineTo(l+w,y); gx.stroke(); gx.fillStyle='#8d939c'; gx.fillText(Math.abs(v)>=1000?Math.round(v):(+v.toFixed(2)),l-8,y); }
    g.series.forEach((s,si)=>{ const c=SER[si%SER.length]; gx.strokeStyle=c; gx.lineWidth=1.8; gx.beginPath(); let started=false;
      s.forEach((v,i)=>{ if(!isFinite(v)){ started=false; return; } const x=X(i/(s.length-1)*COMP.dur), y=Y(v); started?gx.lineTo(x,y):gx.moveTo(x,y); started=true; }); gx.stroke(); gx.lineWidth=1; });
    leg.innerHTML=''; leg.classList.toggle('many',g.names.length>4); g.names.forEach((nm,i)=>{ const sp=document.createElement('span'); const ic=document.createElement('i'); ic.style.background=SER[i%SER.length]; sp.append(ic,document.createTextNode(nm)); leg.append(sp); });
    // 目前值的點
    const L=userLayers()[0]; if(L){ const isAmt=S.prop==='amount'; const nCh=isAmt?Array.from(L.spec.text||'').length:0; const v=isAmt?null:ev(L,S.prop,S.t); const vals=isAmt?g.series.map((_,i)=>AE.evalProp(L.props.amount,S.t,{textIndex:i+1,textTotal:nCh})[0]):S.ex.labels?userLayers().map(U=>{const q=ev(U,S.prop,S.t); return Array.isArray(q)?q[0]:q;}):(Array.isArray(v)?v.slice(0,2):[v]);
      vals.forEach((q,i)=>{ if(!isFinite(q)) return; gx.fillStyle=SER[i%SER.length]; gx.beginPath(); gx.arc(X(S.t),Y(q),4,0,Math.PI*2); gx.fill(); gx.strokeStyle='#1d1f23'; gx.lineWidth=2; gx.stroke(); gx.lineWidth=1; }); }
  }
  const px=X(S.t); gx.strokeStyle='rgba(78,164,242,.8)'; gx.beginPath(); gx.moveTo(px,t); gx.lineTo(px,t+h); gx.stroke();
}

// ---------- 播放 ----------
function setPlaying(p){ S.playing=p; $('#playIco').innerHTML=p?'<path d="M3 2h3v10H3zM8 2h3v10H8z"/>':'<path d="M3 1.5v11l9-5.5z"/>'; $('#bPlay').setAttribute('aria-label',p?'暫停':'播放'); }
function step(n){ setPlaying(false); S.t=((Math.round(S.t*COMP.fps)+n)%(COMP.dur*COMP.fps)+COMP.dur*COMP.fps)%(COMP.dur*COMP.fps)/COMP.fps; S.dirty=true; }
let lastTs=null, lastTc='';
function frame(ts){
  if(lastTs==null) lastTs=ts; const dt=Math.min(0.1,(ts-lastTs)/1000); lastTs=ts;
  if(S.playing){ S.t+=dt*S.speed; if(S.t>=COMP.dur) S.t%=COMP.dur; S.dirty=true; }
  if(S.graphDirty){ S.graphDirty=false; const h=tlHeight(); if(Math.abs(tl.height/DPR-h)>1) fitCanvas(tl,h); computeGraph();
    if(gr.clientWidth && Math.abs(gr.width-Math.round(gr.clientWidth*DPR))>1){ fitCanvas(gr,170); computeGraph(); } } // 圖表剛從隱藏變成顯示：先配置正確尺寸再取樣，避免同一條線先後畫兩次而抖動
  if(S.dirty){ S.dirty=false;
    const tf=Math.floor(S.t*COMP.fps+1e-6); const tcs=tf+'';
    if(tcs!==lastTc){ lastTc=tcs; const f=tf%COMP.fps, s=Math.floor(tf/COMP.fps); $('#tc').innerHTML='0:00:'+String(s).padStart(2,'0')+':'+String(f).padStart(2,'0')+'<small>'+S.t.toFixed(2)+' 秒 · 第 '+tf+' 格</small>'; }
    drawComp(); drawTL(); drawGraph(); updateReadout(); }
  requestAnimationFrame(frame);
}

// ---------- 事件 ----------
const ta=$('#code');
let edTimer=null;
ta.addEventListener('input',()=>{ S.code=ta.value; renderHL(); renderSel(); clearTimeout(edTimer); edTimer=setTimeout(()=>setCode(ta.value,true),120); });
for(const evn of ['select','keyup','mouseup','pointerup','focus','blur']) ta.addEventListener(evn,()=>setTimeout(renderSel,0));
document.addEventListener('selectionchange',()=>{ if(document.activeElement===ta) renderSel(); });
ta.addEventListener('keydown',e=>{
  if(e.key==='Tab' && !e.shiftKey){ e.preventDefault(); if(!document.execCommand('insertText',false,'  ')) ta.setRangeText('  ',ta.selectionStart,ta.selectionEnd,'end'); ta.dispatchEvent(new Event('input')); }
});
$('#bPlay').onclick=()=>setPlaying(!S.playing);
$('#bStart').onclick=()=>{ S.t=0; S.dirty=true; };
$('#bPrev').onclick=()=>step(-1); $('#bNext').onclick=()=>step(1);
$('#speed').onchange=e=>{ S.speed=+e.target.value; };
$('#trailTog').onchange=e=>{ S.trail=e.target.checked; S.dirty=true; };
$('#search').addEventListener('input',renderSide);
// 側欄抽屜：開啟時鎖住頁面捲動，避免背景與頂列分離
let lockY=0;
function setDrawer(open){
  const body=document.body; if(open===body.classList.contains('drawer')) return;
  const mobile=matchMedia('(max-width:820px)').matches;
  if(open){ if(mobile){ lockY=window.scrollY; body.style.top=(-lockY)+'px'; body.classList.add('locked'); } body.classList.add('drawer'); }
  else { body.classList.remove('drawer'); if(body.classList.contains('locked')){ body.classList.remove('locked'); body.style.top=''; window.scrollTo(0,lockY); } }
  $('#menuBtn').setAttribute('aria-expanded',String(open));
}
function measureTop(){ document.documentElement.style.setProperty('--top-h',$('.top').offsetHeight+'px'); }
measureTop(); window.addEventListener('resize',measureTop);
$('#menuBtn').onclick=()=>setDrawer(!document.body.classList.contains('drawer'));
$('#scrim').onclick=()=>setDrawer(false);
$('#scrim').addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
document.addEventListener('keydown',e=>{ if(e.key==='Escape') setDrawer(false); });
document.addEventListener('keydown',e=>{
  const tag=(document.activeElement&&document.activeElement.tagName)||''; if(/INPUT|TEXTAREA|SELECT/.test(tag)) return;
  if(e.key==='/'){ e.preventDefault(); if(matchMedia('(max-width:1100px)').matches) setDrawer(true); $('#search').focus(); return; }
  if(e.code==='Space'){ e.preventDefault(); setPlaying(!S.playing); }
  else if(e.key==='PageDown'||e.key==='.'){ step(1); } else if(e.key==='PageUp'||e.key===','){ step(-1); }
});
$('#bCopy').onclick=async()=>{ const b=$('#bCopy'); let ok=false;
  try{ await navigator.clipboard.writeText(S.code); ok=true; }catch(e){ try{ ta.focus(); ta.select(); ok=document.execCommand('copy'); }catch(_){} }
  b.textContent=ok?'已複製':'請手動選取複製'; setTimeout(()=>b.textContent='複製',1600); };
$('#bReset').onclick=()=>{ if(S.saved){ go(S.saved.base); return; } setCode(defaultCode()); renderParams(true); };
$('#bSave').onclick=()=>{ const bar=$('#savebar'); bar.classList.toggle('show'); const n=$('#saveName'); n.value=(S.saved?S.saved.name:S.ex.name)+'（自訂）'; if(bar.classList.contains('show')) n.focus(); };
$('#bSaveNo').onclick=()=>$('#savebar').classList.remove('show');
const doSave=()=>{ const name=$('#saveName').value.trim()||S.ex.name; const item={id:'my-'+Date.now().toString(36), base:S.ex.id, name, code:S.code, prop:S.prop};
  S.savedList.unshift(item); store.set('saved',S.savedList); Sync.dirty(); S.closed.mine=false; $('#savebar').classList.remove('show'); go(item.id); };
$('#bSaveOk').onclick=doSave; $('#saveName').addEventListener('keydown',e=>{ if(e.key==='Enter') doSave(); if(e.key==='Escape') $('#savebar').classList.remove('show'); });
const lp=$('#labProp');
for(const k in AE.PROP_INFO){ if(k==='anchorPoint'||k==='amount') continue; const o=document.createElement('option'); o.value=k; o.textContent=AE.PROP_INFO[k].label; lp.append(o); }
lp.onchange=()=>{ S.labProp=lp.value; store.set('labProp',S.labProp); Sync.dirty(); S.saved=null; load('lab'); };
window.addEventListener('hashchange',()=>load(location.hash.slice(1)));
let rzT=null; window.addEventListener('resize',()=>{ clearTimeout(rzT); rzT=setTimeout(resizeAll,80); });
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ S.dirty=true; });


// ---------- 帳號同步（以 Claude 帳號識別，存在此頁的個人私有資料區） ----------
const Sync=(function(){
  let db=null, ref=null, ready=false, timer=null, writing=false, again=false, lastSent='', status='local';
  const btn=$('#syncBtn'), txt=$('#syncTxt'), title=$('#syncTitle'), desc=$('#syncDesc');
  function show(st,msg){ status=st; btn.classList.remove('ok','busy','off'); if(st==='ok') btn.classList.add('ok'); if(st==='busy'||st==='loading') btn.classList.add('busy'); if(st==='off') btn.classList.add('off');
    txt.textContent = st==='ok'?'已同步' : st==='busy'?'同步中…' : st==='loading'?'連線中…' : st==='off'?'未同步':'僅存本機';
    title.textContent = st==='ok'?'已綁定你的 Claude 帳號' : st==='local'||st==='off'?'目前只存在這台裝置' : '正在連線到你的帳號';
    desc.textContent = msg; }
  function payload(){ return { saved:S.savedList, codes:S.codes, labProp:S.labProp, v:1 }; }
  function applyRemote(d){
    const before=JSON.stringify(payload());
    S.savedList=Array.isArray(d.saved)?d.saved.filter(x=>x&&x.id&&x.base&&typeof x.code==='string'):[];
    S.codes=(d.codes&&typeof d.codes==='object')?Object.assign({},d.codes):{};
    if(d.labProp && AE.PROP_INFO[d.labProp]) S.labProp=d.labProp;
    store.set('saved',S.savedList); store.set('codes',S.codes); store.set('labProp',S.labProp);
    if(JSON.stringify(payload())===before) return;
    const id=location.hash.slice(1);
    if(document.activeElement===$('#code')){ renderSide(); return; } // 正在編輯時不打斷，只更新清單
    load(id||'time-rotate');
  }
  function merge(d){ // 第一次連線：雲端與本機合併，兩邊都不遺失
    const ids=new Set((d.saved||[]).map(x=>x.id));
    const saved=(d.saved||[]).concat(S.savedList.filter(x=>!ids.has(x.id)));
    return { saved, codes:Object.assign({},S.codes,d.codes||{}), labProp:d.labProp||S.labProp, v:1 };
  }
  async function flush(){
    if(!ready) return; if(writing){ again=true; return; }
    const body=payload(); const js=JSON.stringify(body); if(js===lastSent) { show('ok','收藏與修改已存到你的帳號，在其他裝置用同一個 Claude 帳號開啟此頁即可使用。'); return; }
    writing=true; show('busy','正在上傳變更…');
    try{ await ref.set(JSON.parse(js)); lastSent=js; show('ok','收藏與修改已存到你的帳號，在其他裝置用同一個 Claude 帳號開啟此頁即可使用。'); }
    catch(e){ show('off', e&&e.code==='quota_exceeded'?'帳號儲存空間已滿，請刪除一些收藏後再試。':'上傳失敗，變更仍保存在這台裝置，稍後會再試一次。'); setTimeout(dirty,8000); }
    finally{ writing=false; if(again){ again=false; dirty(); } }
  }
  function dirty(){ if(!ready) return; clearTimeout(timer); show('busy','有尚未上傳的變更…'); timer=setTimeout(flush,900); }
  async function init(){
    show('loading','正在確認你的 Claude 帳號…');
    if(!window.claude || !window.claude.use){ show('local','這個環境無法連到帳號，資料只存在這台裝置的瀏覽器。'); return; }
    let user;
    try{ [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]); }catch(e){ db=null; }
    const uid = user ? await user.id().catch(()=>null) : null;
    if(!db || !uid){ show('local','需要登入 Claude 才能同步。目前資料只存在這台裝置的瀏覽器。'); return; }
    ref=db.doc('data/users/'+uid+'/state');
    let first=true;
    const to=setTimeout(()=>{ if(first) show('off','暫時連不上帳號資料，變更會先存在這台裝置。'); },10000);
    ref.onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites) return;
      if(first){ if(snap.metadata.fromCache) return; first=false; clearTimeout(to); ready=true;
        if(snap.exists){ const m=merge(snap.data()); applyRemote(m); lastSent=JSON.stringify(snap.data()); if(JSON.stringify(payload())!==lastSent) dirty(); else show('ok','收藏與修改已存到你的帳號，在其他裝置用同一個 Claude 帳號開啟此頁即可使用。'); }
        else dirty();
        return; }
      if(snap.exists){ const d=snap.data(); const js=JSON.stringify(d); if(js===lastSent) return; lastSent=js; applyRemote(d); show('ok','已收到其他裝置的更新。'); }
    }, err=>{ clearTimeout(to); show('off', err&&err.code==='revoked'?'這個頁面的存取權已變更，資料只存在這台裝置。':'與帳號的連線中斷，資料只存在這台裝置。重新開啟頁面可再連線。'); ready=false; });
  }
  btn.onclick=()=>{ const p=$('#syncPop'); p.hidden=!p.hidden; btn.setAttribute('aria-expanded',String(!p.hidden)); };
  document.addEventListener('click',e=>{ const p=$('#syncPop'); if(!p.hidden && !e.target.closest('.syncwrap')){ p.hidden=true; btn.setAttribute('aria-expanded','false'); } });
  $('#syncNow').onclick=()=>{ if(ready){ clearTimeout(timer); lastSent=''; flush(); } else init(); };
  return { init, dirty };
})();

// 「在 After Effects 中套用」與電腦版「數值圖表」：展開時平滑捲到整個面板（電腦版捲右欄、手機版捲整頁；用瀏覽器原生平滑捲動較不會抖動）
function howScroll(panel){
  const col=panel.closest('.col'), inCol=col && getComputedStyle(col).overflowY==='auto' && col.scrollHeight>col.clientHeight;
  const sc=inCol?col:document.documentElement;
  const top=inCol?col.getBoundingClientRect().top:0, vh=inCol?col.clientHeight:((window.visualViewport&&visualViewport.height)||innerHeight);
  const from=inCol?col.scrollTop:window.scrollY, maxY=sc.scrollHeight-vh, rect=panel.getBoundingClientRect();
  // 停在最底端前幾 px：iOS 捲到最底會觸發回彈並重新顯示底部工具列，造成最後抖一下
  const to=Math.max(from,Math.min(maxY-6, from+rect.bottom-top-vh+6, from+rect.top-top-12)); // 讓整個說明進入畫面（太高時以標題為準）
  if(to-from<1) return; (inCol?col:window).scrollTo({top:to,behavior:'smooth'});
}

// ---------- 面板收合 ----------
(function(){
  const st=store.get('folds',{});
  document.querySelectorAll('[data-fold]').forEach(panel=>{
    const key=panel.dataset.fold, ph=panel.querySelector('.ph'); if(!ph) return;
    const b=document.createElement('button'); b.type='button'; b.className='fold';
    b.innerHTML='<svg viewBox="0 0 12 12" fill="none" stroke-width="1.6"><path d="M3 4.5l3 3 3-3"/></svg>';
    const h=ph.querySelector('h3'); if(h) h.classList.add('foldable');
    const set=(f)=>{ panel.classList.toggle('folded',f); b.setAttribute('aria-expanded',String(!f)); b.setAttribute('aria-label',(f?'展開 ':'收合 ')+(h?h.textContent:'')); };
    set(key==='how' ? true : key in st ? st[key] : panel.dataset.foldDefault==='closed'); // 「在 After Effects 中套用」每次開啟網頁都預設收起
    const after=()=>setTimeout(()=>{ S.graphDirty=true; S.dirty=true; resizeAll(); },0);
    const toggle=()=>{ const f=!panel.classList.contains('folded');
      set(f); st[key]=f; store.set('folds',st);
      if(key==='how'){ if(!f) requestAnimationFrame(()=>howScroll(panel)); return; }
      if(key==='graph' && !f && matchMedia('(min-width:821px)').matches){ resizeAll(); requestAnimationFrame(()=>howScroll(panel)); return; } // 電腦版：展開數值圖表時同樣平滑捲到整個面板 // 這個面板沒有畫布，不需重算尺寸，避免捲動中重排而抖動
      after(); };
    b.onclick=toggle; if(h) h.onclick=toggle;
    ph.append(b);
  });
})();
if(window.ResizeObserver){ let t=null; new ResizeObserver(()=>{ clearTimeout(t); t=setTimeout(resizeAll,60); }).observe(document.querySelector('.p-comp')); }

setPlaying(S.playing);
Sync.init();
load(location.hash.slice(1)||'time-rotate');
requestAnimationFrame(frame);
})();
