// ================= 範例庫 =================
var LIB = (function(){
const R = String.raw;
const C = { blue:[0.24,0.61,0.94], amber:[0.96,0.65,0.24], coral:[0.94,0.39,0.34], green:[0.36,0.79,0.52], violet:[0.62,0.52,0.96], white:[0.93,0.94,0.96], grey:[0.55,0.58,0.63] };

function ring(n, rf){ const pts=[]; for(let i=0;i<n;i++){ const a=i/n*Math.PI*2-Math.PI/2, r=rf(i); pts.push([Math.round(Math.cos(a)*r*10)/10, Math.round(Math.sin(a)*r*10)/10]); } return {__path:true, points:pts, inTangents:[], outTangents:[], closed:true}; }
const SHAPE_A = ring(10, ()=>210);
const SHAPE_B = ring(10, i=> i%2==0 ? 320 : 125);

const CATS = [
  { id:'time',    name:'時間與基礎',       en:'time · value · index', desc:'用 time 讓屬性隨時間變化，是所有表達式動畫的起點。' },
  { id:'random',  name:'隨機與抖動',       en:'wiggle · random · noise', desc:'製造自然晃動、閃爍、散佈與雜訊。' },
  { id:'loop',    name:'循環',             en:'loopOut · loopIn', desc:'讓手動設定的關鍵影格無限重複。' },
  { id:'interp',  name:'插值與映射',       en:'linear · ease · clamp', desc:'把一個範圍的數值轉換到另一個範圍。' },
  { id:'math',    name:'數學與週期運動',   en:'Math.sin · cos · abs', desc:'三角函式與數學運算做出擺動、繞圓、彈跳。' },
  { id:'physics', name:'關鍵影格與物理',   en:'velocity · key() · valueAtTime', desc:'讀取關鍵影格與速度，加上慣性、彈跳與延遲。' },
  { id:'layers',  name:'圖層引用與 index', en:'thisComp.layer() · index', desc:'讓圖層彼此連動，或用 index 讓複製圖層自動錯開。' },
  { id:'controls',name:'控制效果',   en:'effect()("…")', desc:'用滑桿、核取方塊、顏色等效果當作控制面板。' },
  { id:'text',    name:'文字',             en:'sourceText', desc:'計數器、打字機、倒數計時、亂碼解碼。' },
  { id:'textanim',name:'逐字動畫',         en:'textIndex · 表達式選取器', desc:'用表達式選取器讓每個字有不同的動畫時間與方向。' },
  { id:'color',   name:'顏色',             en:'hslToRgb · hexToRgb', desc:'顏色是 [R, G, B, A] 四個 0~1 的數值。' },
  { id:'glitch',  name:'故障與閃爍',       en:'posterizeTime · random · noise', desc:'數位故障、訊號干擾、頻閃與燈光閃爍。' },
  { id:'path',    name:'形狀路徑',         en:'createPath()', desc:'用程式產生多邊形、波形與星形路徑。' },
  { id:'logic',   name:'條件、標記與邏輯', en:'if · else · marker', desc:'依時間、數值或標記切換狀態。' },
  { id:'js',      name:'JavaScript 基礎語法', en:'變數 · 陣列 · 迴圈 · 函式', desc:'AE 表達式就是 JavaScript，這些語法都能用。' },
  { id:'lab',     name:'自由實驗室',       en:'playground', desc:'選一個屬性，從空白開始寫自己的表達式。' }
];

const EX = [
// ---------------- 時間 ----------------
{ id:'time-rotate', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','調整 speed 改變每秒旋轉的角度，負數會反方向轉'], cat:'time', name:'持續旋轉', sig:'time * 速度', prop:'rotation',
  desc:'time 是目前時間（秒）。乘上一個數字就得到每秒增加多少，最常用來做持續旋轉。',
  how:[], tip:'負數會反方向旋轉。想要每秒轉一圈就用 time * 360。',
  code:R`speed = 90; // @每秒角度 -720~720 1
time * speed`,
  layer:{ shape:'rect' } },
{ id:'time-move', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 speed 改變移動速度，圖層到右邊界後會從左邊重新出現'], cat:'time', name:'等速移動並重複', sig:'(time * 速度) % 寬度', prop:'position',
  desc:'% 是取餘數，讓數值超過合成寬度後回到 0，形成跑馬燈式的等速重複。',
  how:['value[1] 代表保留原本的 Y 值'], trail:true,
  code:R`speed = 500; // @每秒像素 0~1500 10
x = (time * speed) % thisComp.width;
[x, value[1]]`,
  layer:{ shape:'circle', size:120, color:C.amber } },
{ id:'time-value', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，設兩個以上的關鍵影格做出左右移動','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','圖形會照關鍵影格移動，同時上下擺動；調整 offsetY 改變擺動幅度'], cat:'time', name:'在原值上疊加', sig:'value + [x, y]', prop:'position',
  desc:'value 是屬性原本的值（含關鍵影格）。在 value 上加減，可以保留你手動設定的位置再做偏移。',
  how:['陣列會逐項相加：[a, b] + [c, d] = [a+c, b+d]'], trail:true,
  code:R`offsetY = 200; // @上下幅度 0~400 1
value + [0, Math.sin(time * 3) * offsetY]`,
  layer:{ shape:'rect', keys:{ position:[[0,[400,540]],[3,[1520,540]],[6,[400,540]]] } } },
{ id:'time-posterize', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 fps：數字越小，越有逐格、卡頓的感覺'], cat:'time', name:'降低影格率', sig:'posterizeTime(fps)', prop:'position',
  desc:'posterizeTime 讓後面的運算只在每秒指定次數更新，做出逐格動畫、定格抖動的質感。',
  how:['放在表達式第一行','後面接 wiggle 等任何會變化的運算'], trail:true,
  code:R`fps = 4; // @每秒更新次數 1~30 1
posterizeTime(fps);
wiggle(5, 140)`,
  layer:{ shape:'star', size:180, color:C.amber } },
{ id:'time-timecode', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','播放時文字會顯示目前的時間碼和影格數'], cat:'time', name:'顯示時間碼與影格', sig:'timeToTimecode() · timeToFrames()', prop:'sourceText',
  desc:'把目前時間轉成時間碼或影格數，常用在畫面上的計時、除錯資訊。',
  how:['\\r 代表換行'],
  code:R`"時間碼 " + timeToTimecode(time) + "\r影格 " + timeToFrames(time)`,
  layer:{ shape:'text', fontSize:88 } },
{ id:'time-inout', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','拖動圖層的頭尾，修剪成想要出現的時間範圍','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 fade 改變淡入淡出的秒數'], cat:'time', name:'依入出點自動淡入淡出', sig:'inPoint · outPoint', prop:'opacity',
  desc:'inPoint / outPoint 是圖層開始與結束的時間。搭配 linear 就能讓任何長度的圖層自動淡入淡出。',
  how:['修剪圖層長度時，淡入淡出會自動跟著移動'],
  code:R`fade = 0.6; // @淡入淡出秒數 0.1~2 0.1
fadeIn = linear(time, inPoint, inPoint + fade, 0, 100);
fadeOut = linear(time, outPoint - fade, outPoint, 100, 0);
Math.min(fadeIn, fadeOut)`,
  layer:{ shape:'rect', size:260, inPoint:0.5, outPoint:5.5, color:C.violet } },

// ---------------- 隨機 ----------------
{ id:'wiggle-basic', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」（也可以按 R、S、T 改用旋轉、縮放、不透明度）','按住 Alt（Mac：Option）點擊該屬性的碼錶，貼上表達式','調整 freq（每秒晃幾次）與 amp（晃動距離）'], cat:'random', name:'wiggle 隨機晃動', sig:'wiggle(頻率, 幅度)', prop:'position',
  desc:'wiggle 在原值附近平滑地隨機擺動。頻率是每秒晃幾次，幅度是最大偏移量（像素、度數或百分比，依屬性而定）。',
  how:['可套用在位置、旋轉、縮放、不透明度等任何數值屬性'], trail:true,
  code:R`freq = 2; // @頻率 0~10 0.1
amp = 120; // @幅度 0~400 1
wiggle(freq, amp)`,
  layer:{ shape:'rect' } },
{ id:'wiggle-axis', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','想改成只晃 Y，把最後一行改成 [value[0], w[1]]'], cat:'random', name:'只晃動單一軸', sig:'w = wiggle(); [w[0], value[1]]', prop:'position',
  desc:'先把 wiggle 結果存成變數，再只取需要的軸。用 [0] 取 X、[1] 取 Y。',
  how:['想只晃 Y 就改成 [value[0], w[1]]'], trail:true,
  code:R`freq = 3; // @頻率 0~10 0.1
amp = 300; // @幅度 0~600 1
w = wiggle(freq, amp);
[w[0], value[1]]`,
  layer:{ shape:'circle', size:140, color:C.green } },
{ id:'wiggle-octaves', make:['新增形狀圖層：畫一個長條或箭頭，比較容易看出旋轉','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','調整 octaves 與 ampMult：數字越大，晃動越細碎，越像手持鏡頭'], cat:'random', name:'wiggle 細節層次', sig:'wiggle(freq, amp, octaves, amp_mult)', prop:'rotation',
  desc:'第三個參數 octaves 疊加更多層高頻細節，第四個 amp_mult 控制每層強度。數值高會更毛躁、像手持抖動。',
  how:['看數值圖表比較曲線變化'],
  code:R`freq = 1; // @頻率 0~6 0.1
amp = 45; // @幅度 0~180 1
octaves = 4; // @細節層數 1~8 1
ampMult = 0.6; // @每層強度 0~1 0.05
wiggle(freq, amp, octaves, ampMult)`,
  layer:{ shape:'arrow', size:260, color:C.amber } },
{ id:'wiggle-loop', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','把 loopTime 設成合成長度或想循環的秒數，結尾會無縫接回開頭'], cat:'random', name:'可無縫循環的 wiggle', sig:'linear(t, 0, loop, w1, w2)', prop:'position',
  desc:'在一個循環長度內，把兩段時間錯開的 wiggle 混合，讓結尾正好接回開頭，適合做循環 GIF 或背景。',
  how:['loopTime 設成合成或循環段落的長度'], trail:true,
  code:R`freq = 1; // @頻率 0~5 0.1
amp = 160; // @幅度 0~400 1
loopTime = 3; // @循環秒數 1~6 0.5
t = time % loopTime;
w1 = wiggle(freq, amp, 1, 0.5, t);
w2 = wiggle(freq, amp, 1, 0.5, t - loopTime);
linear(t, 0, loopTime, w1, w2)`,
  layer:{ shape:'circle', size:130, color:C.violet } },
{ id:'random-scatter', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','按 Ctrl/Cmd + D 複製多個圖層，每個複本會自動散開到不同位置','調整 seed 重新洗牌，調整 margin 控制離畫面邊緣的距離'], cat:'random', name:'隨機散佈（固定不動）', sig:'seedRandom(index, true); random(min, max)', prop:'position',
  desc:'random 每格都會變。先呼叫 seedRandom(種子, true)，第二個參數 true 代表「不隨時間改變」，每個圖層用自己的 index 當種子就會各自落在不同位置。',
  how:['按 Ctrl/Cmd + D 複製圖層，每個複本自動散開','改變 seed 可以整組重新洗牌'],
  code:R`seed = 1; // @亂數種子 1~50 1
margin = 100; // @邊界留白 0~400 1
seedRandom(index + seed * 100, true);
random([margin, margin], [thisComp.width - margin, thisComp.height - margin])`,
  layer:{ shape:'circle', size:60, color:C.amber }, dup:{ n:24, layout:'same' } },
{ id:'random-flicker', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 rate（每秒閃幾次）與 minO（最暗時的不透明度）'], cat:'random', name:'隨機閃爍', sig:'random(min, max)', prop:'opacity',
  desc:'不加 seedRandom 時，random 每一格都產生新數字，可做燈光、霓虹、訊號不穩的閃爍。搭配 posterizeTime 控制閃爍速度。',
  how:[],
  code:R`rate = 12; // @每秒閃幾次 1~30 1
minO = 15; // @最低不透明度 0~100 1
posterizeTime(rate);
random(minO, 100)`,
  layer:{ shape:'star', size:320, color:C.amber } },
{ id:'random-gauss', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','按 Ctrl/Cmd + D 複製幾十個圖層，會聚集在中央、越外圍越稀疏','調整 spread 改變擴散範圍'], cat:'random', name:'常態分佈亂數', sig:'gaussRandom(min, max)', prop:'position',
  desc:'gaussRandom 產生的數值集中在範圍中央、越外圍越少，看起來比 random 更自然，適合做星群、粒子聚落。',
  how:['複製多個圖層'],
  code:R`spread = 260; // @擴散範圍 50~500 10
seedRandom(index, true);
c = [thisComp.width / 2, thisComp.height / 2];
gaussRandom(c - [spread, spread], c + [spread, spread])`,
  layer:{ shape:'circle', size:34, color:C.white }, dup:{ n:40, layout:'same' } },
{ id:'noise-wave', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','複製十幾個圖層，用「對齊」面板把它們水平平均分佈','調整 speed、amp、spacing 改變波的速度、高度與平滑度'], cat:'random', name:'noise 平滑雜訊波', sig:'noise(值)', prop:'position',
  desc:'noise 輸入任何數字，回傳 -1 到 1 之間平滑變化的值。相同輸入永遠得到相同結果，把 index 加進輸入就能讓相鄰圖層連成一條起伏的波。',
  how:['複製多個圖層'],
  code:R`speed = 0.8; // @速度 0~3 0.1
amp = 260; // @起伏高度 0~500 1
spacing = 0.25; // @相鄰差異 0~1 0.01
[value[0], value[1] + noise(time * speed + index * spacing) * amp]`,
  layer:{ shape:'circle', size:56, color:C.green }, dup:{ n:16, layout:'row' } },

// ---------------- 循環 ----------------
{ id:'loop-cycle', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，設至少兩個關鍵影格','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','最後一個關鍵影格之後，動畫會從第一個關鍵影格重新播放'], cat:'loop', name:'loopOut("cycle") 重複', sig:'loopOut("cycle")', prop:'position',
  desc:'在最後一個關鍵影格之後，從第一個關鍵影格重新播放。時間軸上的菱形是預先設好的關鍵影格。',
  how:['先在屬性上設至少兩個關鍵影格','再對同一個屬性加上表達式'], trail:true,
  code:R`loopOut("cycle")`,
  layer:{ shape:'rect', keys:{ position:[[0,[460,620]],[0.8,[960,320]],[1.6,[1460,620]]] } } },
{ id:'loop-pingpong', make:['新增形狀圖層：畫一個細長的長方形','用錨點工具（Y）把錨點移到圖形上方','按 R 展開「旋轉」，在 0 秒設 -35°、1 秒設 35° 兩個關鍵影格','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','播放時會像鐘擺一樣來回擺動'], cat:'loop', name:'loopOut("pingpong") 來回', sig:'loopOut("pingpong")', prop:'rotation',
  desc:'播到最後一格後倒著播回來，再正著播，像鐘擺一樣來回。只需要兩個關鍵影格就能做擺動。',
  how:['需要先設好關鍵影格','錨點設在圖形上方就會像鐘擺'],
  code:R`loopOut("pingpong")`,
  layer:{ shape:'rect', size:[60,360], color:C.amber, base:{ position:[960,260], anchorPoint:[0,-170] }, keys:{ rotation:[[0,-35],[1,35]] } } },
{ id:'loop-offset', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，只做「一步」的位移關鍵影格（例如往右上再往右下）','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','每次重複都從上一輪的終點繼續，像一步一步往前走'], cat:'loop', name:'loopOut("offset") 累加', sig:'loopOut("offset")', prop:'position',
  desc:'每次重複時，從上一輪的結束值繼續累加，適合做走路、樓梯、持續前進的步伐。',
  how:['關鍵影格只做一步的位移'], trail:true,
  code:R`loopOut("offset")`,
  layer:{ shape:'rect', size:120, color:C.green, keys:{ position:[[0,[220,640]],[0.5,[320,440]],[1,[420,640]]] } } },
{ id:'loop-continue', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 R 展開「旋轉」，在 0 秒設 0°、1 秒設 120°','選取關鍵影格，按右鍵 › 關鍵影格插值 › 線性，避免結尾速度變成 0','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','最後一格之後會用同樣的速度一直轉下去'], cat:'loop', name:'loopOut("continue") 延續', sig:'loopOut("continue")', prop:'rotation',
  desc:'沿著最後一個關鍵影格的速度與方向繼續前進。旋轉設 0→120 度之後，就會永遠以同樣速度轉下去。',
  how:['最後一個關鍵影格請用「線性」，速度才不會是 0'],
  code:R`loopOut("continue")`,
  layer:{ shape:'star', size:260, color:C.violet, keys:{ rotation:[[0,0,'linear'],[1,120,'linear']] } } },
{ id:'loop-in', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，在後面的時間（例如 3 秒之後）設好一段來回的關鍵影格','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','第一個關鍵影格之前的時間，也會照同樣的動作循環'], cat:'loop', name:'loopIn() 在第一格之前循環', sig:'loopIn("cycle")', prop:'position',
  desc:'loopIn 處理第一個關鍵影格「之前」的時間。關鍵影格設在 3 秒之後，前面的時間也會照著循環。',
  how:['loopIn 與 loopOut 可以分開用，參數相同'], trail:true,
  code:R`loopIn("cycle")`,
  layer:{ shape:'circle', size:120, color:C.coral, keys:{ position:[[3,[560,540]],[3.6,[960,320]],[4.2,[1360,540]],[4.8,[960,760]],[5.4,[560,540]]] } } },
{ id:'loop-numkeys', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，設 4 個關鍵影格：前段當進場，後段當要循環的動作','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','把 n 設成要循環的段數，例如 2 代表只循環最後兩段'], cat:'loop', name:'只循環最後幾格', sig:'loopOut("cycle", 影格數)', prop:'position',
  desc:'第二個參數指定只循環最後 N 段關鍵影格。前段可以做進場動畫，後段才循環。設 0 代表全部。',
  how:['調整「循環段數」觀察差異'], trail:true,
  code:R`n = 2; // @循環段數 0~3 1
loopOut("cycle", n)`,
  layer:{ shape:'rect', size:120, color:C.amber, keys:{ position:[[0,[200,900]],[0.8,[960,540]],[1.4,[1300,300]],[2,[1600,540]]] } } },

// ---------------- 插值 ----------------
{ id:'interp-linear', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','調整 startT、endT（開始與結束秒數）和 endAngle（最後角度）'], cat:'interp', name:'linear 範圍映射', sig:'linear(t, tMin, tMax, v1, v2)', prop:'rotation',
  desc:'當 t 從 tMin 變到 tMax，輸出從 v1 等速變到 v2；超出範圍會停在端點。最常用的「把 A 範圍換算成 B 範圍」。',
  how:['把 time 換成任何數值（如另一圖層的位置）就是連動'],
  code:R`startT = 1; // @開始秒數 0~5 0.1
endT = 4; // @結束秒數 0.5~6 0.1
endAngle = 360; // @結束角度 -720~720 1
linear(time, startT, endT, 0, endAngle)`,
  layer:{ shape:'rect', size:220 } },
{ id:'interp-compare', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','按 Ctrl/Cmd + D 複製成 4 個圖層並上下排開','4 個圖層會依 index 分別用 linear、ease、easeIn、easeOut 移動，可以直接比較差別'], cat:'interp', name:'四種插值比較', sig:'linear · ease · easeIn · easeOut', prop:'position',
  desc:'同樣從左移到右，ease 頭尾都放慢、easeIn 開頭慢、easeOut 結尾慢。看圖表能直接比較曲線形狀。',
  how:['四個圖層用 index 選擇不同函式'], labels:true,
  code:R`dur = 2; // @移動秒數 0.5~3 0.1
t = time % 3;
x0 = 300; x1 = 1620;
if (index == 1) x = linear(t, 0, dur, x0, x1);
else if (index == 2) x = ease(t, 0, dur, x0, x1);
else if (index == 3) x = easeIn(t, 0, dur, x0, x1);
else x = easeOut(t, 0, dur, x0, x1);
[x, value[1]]`,
  layer:{ shape:'circle', size:90 }, dup:{ n:4, layout:'col', names:['linear','ease','easeIn','easeOut'], colors:[C.grey,C.blue,C.amber,C.green] } },
{ id:'interp-easings', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','按 Ctrl/Cmd + D 複製成 8 個圖層並上下排開','8 個圖層會依 index 分別套用 Linear、Ease in、Ease out、Ease in-out、Overshoot、Elastic、Bounce、Steps，可以直接比較'], cat:'interp', name:'八種緩動曲線', sig:'p = 0~1 的進度 → 曲線函式 → x0 + (x1 - x0) * p', prop:'position',
  desc:'先把時間換成 0～1 的進度 p，再用不同的曲線函式改寫 p。Overshoot 和 Elastic 會超過 1（衝過頭），Bounce 在終點彈跳，Steps 一格一格跳。',
  how:['Linear：機械、轉圈、載入動畫','Ease in：離開畫面','Ease out：進入畫面','Ease in-out：在畫面內移動','Overshoot：帶點個性的彈出、按鈕','Elastic：俏皮的瞬間，少量使用','Bounce：掉落或著地','Steps：時鐘、計數器、定格動畫'], labels:true,
  code:R`dur = 1.2; // @移動秒數 0.4~2.5 0.1
steps = 6; // @Steps 格數 2~12 1
t = Math.min((time - inPoint) / dur, 1); // 0~1 的進度
x0 = 300; x1 = 1620;

// ───── 1. Linear ─────
if (index == 1) {
  p = t;
}
// ───── 2. Ease in ─────
else if (index == 2) {
  p = t * t * t;
}
// ───── 3. Ease out ─────
else if (index == 3) {
  p = 1 - Math.pow(1 - t, 3);
}
// ───── 4. Ease in-out ─────
else if (index == 4) {
  if (t < 0.5) p = 4 * t * t * t;
  else p = 1 - Math.pow(-2 * t + 2, 3) / 2;
}
// ───── 5. Overshoot ─────
else if (index == 5) {
  c = 1.70158;
  p = 1 + (c + 1) * Math.pow(t - 1, 3)
        + c * Math.pow(t - 1, 2);
}
// ───── 6. Elastic ─────
else if (index == 6) {
  if (t == 0 || t == 1) p = t;
  else p = Math.pow(2, -10 * t)
         * Math.sin((t * 10 - 0.75) * 2 * Math.PI / 3) + 1;
}
// ───── 7. Bounce ─────
else if (index == 7) {
  n = 7.5625; d = 2.75; u = t;
  if (u < 1 / d) {
    p = n * u * u;
  } else if (u < 2 / d) {
    u -= 1.5 / d; p = n * u * u + 0.75;
  } else if (u < 2.5 / d) {
    u -= 2.25 / d; p = n * u * u + 0.9375;
  } else {
    u -= 2.625 / d; p = n * u * u + 0.984375;
  }
}
// ───── 8. Steps ─────
else {
  p = Math.floor(t * steps) / steps;
}

[x0 + (x1 - x0) * p, value[1]]`,
  layer:{ shape:'circle', size:64 }, dup:{ n:8, layout:'col', y0:120, y1:960, names:['Linear','Ease in','Ease out','Ease in-out','Overshoot','Elastic','Bounce','Steps'], colors:[C.grey,C.blue,C.green,C.violet,C.amber,C.coral,C.white,C.amber] } },
{ id:'interp-map-prop', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，設左右兩個關鍵影格，再對「位置」加上 loopOut("pingpong") 讓它來回','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 fromX、toX：圖層在這兩個 X 之間移動時，會從透明變成清楚'], cat:'interp', name:'用位置控制不透明度', sig:'linear(position[0], …)', prop:'opacity',
  desc:'把自己的 X 座標映射成不透明度：越往右越清楚。輸入不一定是時間，任何屬性數值都可以。',
  how:['位置本身有來回的關鍵影格'],
  code:R`x = transform.position[0];
fromX = 400; // @起點 X 0~1920 10
toX = 1520; // @終點 X 0~1920 10
linear(x, fromX, toX, 5, 100)`,
  layer:{ shape:'rect', size:200, color:C.violet, keys:{ position:[[0,[400,540]],[2,[1520,540]]] }, expr:{ position:'loopOut("pingpong")' } } },
{ id:'interp-clamp', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','（可選）再畫一個長方形外框當範圍參考','調整 left、right 改變左右邊界；上下邊界可在最後一行修改 340、740'], cat:'interp', name:'clamp 限制範圍', sig:'clamp(值, 最小, 最大)', prop:'position',
  desc:'clamp 把數值限制在範圍內。這裡讓大幅晃動的 wiggle 永遠不會超出中間的框。',
  how:['clamp 也可以直接接陣列：clamp(w, [x1,y1], [x2,y2])'], trail:true,
  code:R`w = wiggle(1.5, 600);
left = 660; // @左邊界 0~960 10
right = 1260; // @右邊界 960~1920 10
[clamp(w[0], left, right), clamp(w[1], 340, 740)]`,
  layer:{ shape:'circle', size:100, color:C.coral },
  after:[{ name:'範圍框', shape:'frame', size:[600,400], color:C.grey }] },

// ---------------- 數學 ----------------
{ id:'math-sin', make:['新增形狀圖層：畫一個細長的長方形','用錨點工具（Y）把錨點移到圖形上方','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','調整 amp（擺動角度）與 freq（每秒擺幾次）'], cat:'math', name:'Math.sin 鐘擺擺動', sig:'振幅 * Math.sin(time * 頻率 * 2π)', prop:'rotation',
  desc:'正弦波在 -1 到 1 之間平滑來回。乘上振幅得到擺動角度，頻率代表每秒擺幾次。',
  how:['錨點移到圖形上方'],
  code:R`amp = 40; // @擺動角度 0~90 1
freq = 0.8; // @每秒次數 0~4 0.05
amp * Math.sin(time * freq * Math.PI * 2)`,
  layer:{ shape:'rect', size:[50,380], color:C.amber, base:{ position:[960,240], anchorPoint:[0,-180] } } },
{ id:'math-orbit', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 radius（半徑）與 speed（每秒繞幾圈，負數會反方向）'], cat:'math', name:'繞圓運動', sig:'中心 + [cos(a), sin(a)] * 半徑', prop:'position',
  desc:'cos 給 X、sin 給 Y，角度隨時間增加就會繞圓。X、Y 半徑不同就變成橢圓。',
  how:[], trail:true,
  code:R`radius = 300; // @半徑 0~500 1
speed = 0.5; // @每秒圈數 -2~2 0.05
center = [thisComp.width / 2, thisComp.height / 2];
a = time * speed * Math.PI * 2;
center + [Math.cos(a), Math.sin(a)] * radius`,
  layer:{ shape:'circle', size:100, color:C.green },
  after:[{ name:'中心', shape:'null', size:60, color:C.coral }] },
{ id:'math-decay', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','調整 amp、freq、decay 改變彈跳的幅度、快慢和停下速度'], cat:'math', name:'衰減彈跳縮放', sig:'sin(t) / exp(t * 衰減)', prop:'scale',
  desc:'正弦波除以指數函數，振幅會越來越小，做出 Q 彈、果凍般的縮放。',
  how:['回傳 [s, s] 保持等比'],
  code:R`amp = 60; // @初始幅度 0~150 1
freq = 3; // @頻率 0.5~8 0.1
decay = 4; // @衰減速度 0.5~10 0.1
t = time % 2;
s = 100 + amp * Math.sin(t * freq * Math.PI * 2) / Math.exp(t * decay);
[s, s]`,
  layer:{ shape:'rect', size:240, color:C.coral } },
{ id:'math-lissajous', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 fa、fb：兩個頻率的比例不同會畫出不同花樣，1 比 2 是 8 字形'], cat:'math', name:'利薩茹曲線', sig:'[sin(t·a), sin(t·b)]', prop:'position',
  desc:'X、Y 用不同頻率的正弦波，就能畫出 8 字形與各種花樣。頻率比例決定形狀。',
  how:[], trail:true,
  code:R`fa = 1; // @X 頻率 0.5~5 0.5
fb = 2; // @Y 頻率 0.5~5 0.5
[960 + Math.sin(time * fa * 1.5) * 600, 540 + Math.sin(time * fb * 1.5) * 330]`,
  layer:{ shape:'circle', size:70, color:C.violet } },
{ id:'math-step', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 rate（每秒跳幾步）與 steps（總共幾步）'], cat:'math', name:'Math.floor 階梯移動', sig:'Math.floor(time * 速率)', prop:'position',
  desc:'Math.floor 無條件捨去小數，讓連續的時間變成一格一格跳的整數，做出步進、跳格的動作。',
  how:['改用 Math.round 會四捨五入'], trail:true,
  code:R`rate = 2; // @每秒跳幾步 0.5~8 0.5
steps = 6; // @總步數 2~12 1
i = Math.floor(time * rate) % steps;
[300 + i * (1320 / (steps - 1)), value[1]]`,
  layer:{ shape:'rect', size:120, color:C.blue } },

// ---------------- 物理 ----------------
{ id:'phys-inertia', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，設兩個關鍵影格讓圖形移動後停下','選取關鍵影格，按右鍵 › 關鍵影格插值 › 線性，速度越快回彈越明顯','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 amp、freq、decay 改變回彈的幅度、頻率和停下速度'], cat:'physics', name:'慣性回彈（Overshoot）', sig:'velocityAtTime(key(n).time)', prop:'position',
  desc:'經典的慣性表達式：在每個關鍵影格停下時，依照進場速度加上一段衰減的回彈。關鍵影格只要做直線移動即可。',
  how:['需要先設好關鍵影格，縮放、旋轉也適用','關鍵影格建議用線性，速度越快回彈越明顯'], trail:true,
  code:R`amp = 0.06; // @回彈幅度 0~0.2 0.005
freq = 2.5; // @回彈頻率 0.5~6 0.1
decay = 5; // @衰減 1~12 0.5
n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) n--;
}
if (n == 0) t = 0; else t = time - key(n).time;
if (n > 0 && t < 2) {
  v = velocityAtTime(key(n).time - thisComp.frameDuration / 10);
  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
} else {
  value;
}`,
  layer:{ shape:'rect', size:140, keys:{ position:[[0.4,[400,540],'linear'],[1,[1500,540],'linear'],[3,[1500,540],'linear'],[3.6,[400,540],'linear']] } } },
{ id:'phys-bounce', make:['新增形狀圖層：用橢圓工具畫一個小圓點','按 P 展開「位置」，設兩個關鍵影格：先在空中，再落到地面','選取第一個關鍵影格，按 Ctrl + Shift + F9（Mac：Cmd + Shift + F9）緩出，落下會越來越快','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 e（彈性，越接近 1 越彈）與 g（重力）'], cat:'physics', name:'落地彈跳', sig:'重力 · 彈性係數', prop:'position',
  desc:'依照落地瞬間的速度，計算一連串越來越小的彈跳，彈性 e 越接近 1 越彈。',
  how:['在「位置」設兩個關鍵影格：空中 → 地面','第一段用加速（緩入）效果最好'], trail:true,
  code:R`e = 0.6; // @彈性 0~0.95 0.01
g = 6000; // @重力 1000~12000 100
nMax = 8;
n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) n--;
}
if (n > 0) {
  t = time - key(n).time;
  v = -velocityAtTime(key(n).time - 0.001) * e;
  vl = length(v);
  vu = (vl > 0) ? normalize(v) : [0, 0];
  tCur = 0; segDur = 2 * vl / g; tNext = segDur; nb = 1;
  while (tNext < t && nb <= nMax) {
    vl *= e; segDur *= e; tCur = tNext; tNext += segDur; nb++;
  }
  if (nb <= nMax) {
    delta = t - tCur;
    value + vu * delta * (vl - g * delta / 2);
  } else value;
} else value;`,
  layer:{ shape:'circle', size:120, color:C.amber, keys:{ position:[[0.3,[960,160],'in'],[0.9,[960,860]]] } },
  after:[{ name:'地面', shape:'rect', size:[1400,10], color:C.grey, base:{ position:[960,925] } }] },
{ id:'phys-velocity', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','按 P 展開「位置」，設左右兩個關鍵影格，再對「位置」加上 loopOut("pingpong")','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','調整 k：數字越大傾斜越多，負數會反方向傾斜'], cat:'physics', name:'依移動速度傾斜', sig:'transform.position.velocity', prop:'rotation',
  desc:'velocity 是屬性每秒的變化量。把水平速度乘上係數當作旋轉，物體會在加速時傾斜、停下時回正。',
  how:['讀取同圖層的位置速度'], trail:true,
  code:R`k = 0.025; // @傾斜係數 -0.1~0.1 0.001
transform.position.velocity[0] * k`,
  layer:{ shape:'rect', size:[120,260], color:C.green, keys:{ position:[[0,[400,540]],[1.5,[1520,540]]] }, expr:{ position:'loopOut("pingpong")' } } },
{ id:'phys-delay', make:['新增形狀圖層：用橢圓工具畫一個小圓點','按 P 展開「位置」，設一段移動的關鍵影格','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','按 Ctrl/Cmd + D 複製幾個圖層，後面的圖層會延遲跟上，形成殘影','調整 delay 改變每層之間的延遲秒數'], cat:'physics', name:'時間延遲殘影', sig:'valueAtTime(time - 延遲)', prop:'position',
  desc:'valueAtTime 取得屬性在其他時間的值。每個複本延遲一點，就形成拖尾、殘影的效果。',
  how:['複製圖層後，index 越大延遲越多'],
  code:R`delay = 0.06; // @每層延遲秒數 0~0.3 0.005
valueAtTime(time - (index - 1) * delay)`,
  layer:{ shape:'circle', size:90, color:C.coral, keys:{ position:[[0,[300,300]],[1,[1600,400]],[2,[900,850]],[3,[300,300]],[4,[1600,800]],[5,[700,250]],[6,[300,300]]] } }, dup:{ n:8, layout:'same' } },
{ id:'phys-keyinfo', make:['新增形狀圖層並命名為「球」，按 P 設幾個位置關鍵影格','新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','文字會顯示「球」的關鍵影格數量、最近的關鍵影格與時間'], cat:'physics', name:'讀取關鍵影格資訊', sig:'numKeys · key(n).time · nearestKey()', prop:'sourceText',
  desc:'用文字顯示另一個圖層位置屬性的關鍵影格數量、最近的關鍵影格與其時間，適合了解 key() 的回傳內容。',
  how:[],
  code:R`p = thisComp.layer("球").transform.position;
n = p.nearestKey(time).index;
"關鍵影格數：" + p.numKeys +
"\r最近的是第 " + n + " 個" +
"\r時間：" + p.key(n).time.toFixed(2) + " 秒"`,
  layer:{ shape:'text', fontSize:72, base:{ position:[960,300] } },
  after:[{ name:'球', shape:'circle', size:100, color:C.amber, keys:{ position:[[0.5,[400,800]],[2,[960,700]],[3.5,[1520,800]],[5,[960,900]]] } }] },

// ---------------- 圖層 ----------------
{ id:'layer-chain', make:['新增一個形狀圖層當領頭，放在時間軸最上面（第 1 層），讓它的位置有動畫','再新增一個小圓點形狀圖層當跟隨者','選取跟隨者，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','把跟隨者複製十幾次，會排成一串跟在領頭後面','調整 delay 改變每個之間的間隔'], cat:'layers', name:'跟隨領頭圖層（貪食蛇）', sig:'thisComp.layer(1).position.valueAtTime()', prop:'position',
  desc:'每個複本讀取第 1 個圖層過去某個時間的位置，延遲隨 index 遞增，串成一條跟隨的隊伍。',
  how:['第 1 層是領頭（自己有動畫）','在跟隨圖層套用後大量複製'],
  code:R`delay = 0.08; // @間隔秒數 0~0.3 0.005
leader = thisComp.layer(1);
leader.transform.position.valueAtTime(time - (index - 1) * delay)`,
  before:[{ name:'領頭', shape:'circle', size:110, color:C.coral, expr:{ position:'[960 + Math.cos(time * 1.6) * 600, 540 + Math.sin(time * 2.4) * 300]' } }],
  layer:{ shape:'circle', size:70, color:C.blue }, dup:{ n:14, layout:'same' } },
{ id:'layer-radial', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','按 Ctrl/Cmd + D 複製任意數量，會自動平均排成圓環','調整 radius（半徑）與 spin（旋轉速度）'], cat:'layers', name:'用 index 排成圓環', sig:'(index - 1) / thisComp.numLayers', prop:'position',
  desc:'index 是圖層在時間軸上的編號。用它算出每個圖層的角度，複製後會自動平均分佈在圓上。',
  how:['複製任意數量，圖層數改變會自動重新排列'],
  code:R`radius = 340; // @半徑 0~500 1
spin = 0.3; // @旋轉速度 -2~2 0.05
n = thisComp.numLayers;
a = (index - 1) / n * Math.PI * 2 + time * spin * Math.PI * 2;
[960, 540] + [Math.cos(a), Math.sin(a)] * radius`,
  layer:{ shape:'circle', size:80, color:C.violet }, dup:{ n:12, layout:'same' } },
{ id:'layer-fan', make:['新增形狀圖層：畫一個細長的長方形','用錨點工具（Y）把錨點移到長條底端','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','複製十幾個圖層，會像扇子一樣展開','調整 step（每層角度）與 breathe（呼吸幅度）'], cat:'layers', name:'用 index 展開扇形', sig:'(index - 1) * 角度', prop:'rotation',
  desc:'每個圖層的旋轉角度比前一個多一點，配合偏移的錨點展開成扇形或花瓣，再加上 sin 讓它呼吸。',
  how:['錨點放在圖形底端'],
  code:R`step = 30; // @每層角度 0~60 1
breathe = 12; // @呼吸幅度 0~45 1
(index - 1) * step + Math.sin(time * 2) * breathe * index / 4`,
  layer:{ shape:'rect', size:[70,340], color:C.amber, base:{ position:[960,560], anchorPoint:[0,160] } }, dup:{ n:12, layout:'same' } },
{ id:'layer-distance', make:['新增空物件（圖層 › 新增 › 空物件），命名為「控制點」，讓它的位置有動畫','新增一個小方塊形狀圖層','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','把方塊複製多個並排成網格，靠近「控制點」的會放大','調整 radius、maxS、minS 改變影響範圍與大小'], cat:'layers', name:'依距離縮放（網格）', sig:'length(a, b)', prop:'scale',
  desc:'length 算出兩點距離。每個格子依照與「控制點」的距離決定大小，控制點移動時形成波紋般的放大效果。',
  how:['建立一個名為「控制點」的空物件並做動畫','在網格圖層套用'],
  code:R`radius = 500; // @影響半徑 100~1000 10
maxS = 160; // @最大縮放 50~300 1
minS = 20; // @最小縮放 0~100 1
d = length(position, thisComp.layer("控制點").transform.position);
s = linear(d, 0, radius, maxS, minS);
[s, s]`,
  before:[{ name:'控制點', shape:'null', size:70, color:C.coral, expr:{ position:'[960 + Math.sin(time * 1.3) * 650, 540 + Math.cos(time * 0.9) * 280]' } }],
  layer:{ shape:'rect', size:90, color:C.blue }, dup:{ n:40, layout:'grid', cols:8, rows:5 } },
{ id:'layer-lookat', make:['新增一個形狀圖層並命名為「目標」，讓它的位置有動畫','新增一個朝右的箭頭形狀圖層','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','複製多個箭頭排滿畫面，全部都會指向「目標」'], cat:'layers', name:'朝向目標旋轉', sig:'Math.atan2(dy, dx)', prop:'rotation',
  desc:'用兩點的差算出方向角度，所有箭頭都會指向移動中的「目標」。atan2 回傳弧度，要轉成角度。',
  how:['在箭頭圖層套用','箭頭圖形預設朝右（0 度）'],
  code:R`target = thisComp.layer("目標").transform.position;
v = target - position;
radiansToDegrees(Math.atan2(v[1], v[0]))`,
  before:[{ name:'目標', shape:'circle', size:80, color:C.amber, expr:{ position:'[960 + Math.cos(time) * 500, 540 + Math.sin(time * 1.7) * 300]' } }],
  layer:{ shape:'arrow', size:90, color:C.white }, dup:{ n:35, layout:'grid', cols:7, rows:5 } },
{ id:'layer-pickwhip', make:['新增一個形狀圖層並命名為「主齒輪」，讓它的旋轉有動畫','新增另一個形狀圖層當小齒輪','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，把表達式旁的螺旋圖示拖到「主齒輪」的旋轉','在產生的表達式後面加上 * ratio，或直接貼上範例表達式','調整 ratio：負數會反方向轉，2 代表轉速兩倍'], cat:'layers', name:'連結其他圖層屬性', sig:'thisComp.layer("名稱").transform.rotation', prop:'rotation',
  desc:'用螺旋圖示（Pick Whip）拖到另一個屬性，AE 會自動產生這種引用。再乘上倍率就能做齒輪連動。',
  how:['按住表達式的螺旋圖示，拖到「主齒輪」的旋轉','在後面加上 * 倍率'],
  code:R`ratio = -2; // @倍率 -4~4 0.1
thisComp.layer("主齒輪").transform.rotation * ratio`,
  before:[{ name:'主齒輪', shape:'star', size:300, color:C.grey, base:{ position:[700,540] }, expr:{ rotation:'time * 40' } }],
  layer:{ shape:'star', size:160, color:C.amber, base:{ position:[1080,400] } } },

// ---------------- 控制效果 ----------------
{ id:'ctrl-slider', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','在「效果與預設集」搜尋「滑桿控制」（Slider Control），拖到圖層上','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','在「效果控制」面板拖動滑桿，就能改變旋轉速度'], cat:'controls', name:'滑桿控制', sig:'effect("Slider Control")("Slider")', prop:'rotation',
  desc:'在圖層加上「效果 › 表達式控制 › 滑桿控制」，表達式讀取它的數值。之後只要拖滑桿，不用改程式碼。',
  how:['效果與預設集 → 表達式控制 → 滑桿控制','中文版名稱為「滑桿控制」與「滑桿」，表達式中的名稱要與面板一致'],
  tip:'下方「效果控制」面板可以直接拖動試試。',
  code:R`speed = effect("Slider Control")("Slider");
time * speed`,
  layer:{ shape:'rect', size:220, color:C.blue, effects:[{ name:'Slider Control', alias:'滑桿控制', params:[{ name:'Slider', alias:'滑桿', type:'slider', v:120, min:-360, max:360 }] }] } },
{ id:'ctrl-checkbox', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','在「效果與預設集」搜尋「核取方塊控制」（Checkbox Control），拖到圖層上','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','勾選時圖形會晃動，取消勾選就停在原位'], cat:'controls', name:'核取方塊開關', sig:'effect("Checkbox Control")("Checkbox") == 1', prop:'position',
  desc:'核取方塊勾選時值為 1，未勾選為 0。用 if 或三元運算子切換兩種行為。',
  how:['效果 → 表達式控制 → 核取方塊控制'], trail:true,
  code:R`on = effect("Checkbox Control")("Checkbox");
on == 1 ? wiggle(3, 200) : value`,
  layer:{ shape:'circle', size:130, color:C.green, effects:[{ name:'Checkbox Control', alias:'核取方塊控制', params:[{ name:'Checkbox', alias:'核取方塊', type:'checkbox', v:1 }] }] } },
{ id:'ctrl-color', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','在「效果與預設集」搜尋「色彩控制」（Color Control），拖到圖層上','展開 內容 › 矩形 1 › 填色 1 › 顏色','按住 Alt（Mac：Option）點擊「顏色」的碼錶，貼上表達式','在「效果控制」面板挑選顏色，圖形就會跟著變色'], cat:'controls', name:'顏色控制', sig:'effect("Color Control")("Color")', prop:'color',
  desc:'色彩控制讓多個圖層共用同一個顏色來源。常見做法是把它放在一個「控制」空物件上，再讓所有圖層引用。',
  how:[],
  code:R`effect("Color Control")("Color")`,
  layer:{ shape:'star', size:340, effects:[{ name:'Color Control', alias:'色彩控制', params:[{ name:'Color', alias:'色彩', type:'color', v:[0.96,0.45,0.3,1] }] }] } },
{ id:'ctrl-combo', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','在圖層上加入「點控制」（Point Control）與「滑桿控制」（Slider Control）兩個效果','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','用「點」決定基準位置，用「滑桿」決定晃動幅度'], cat:'controls', name:'點控制 + 滑桿組合', sig:'Point Control · Slider Control', prop:'position',
  desc:'點控制提供 [x, y] 座標當作基準位置，滑桿控制晃動幅度。把常改的數值都做成控制項，就是一個可重複使用的範本。',
  how:['加上「點控制」與「滑桿控制」兩個效果'], trail:true,
  code:R`base = effect("Point Control")("Point");
amp = effect("Slider Control")("Slider");
base + wiggle(2, amp) - value`,
  layer:{ shape:'rect', size:130, color:C.violet, effects:[
    { name:'Point Control', alias:'點控制', params:[{ name:'Point', alias:'點', type:'point', v:[960,540] }] },
    { name:'Slider Control', alias:'滑桿控制', params:[{ name:'Slider', alias:'滑桿', type:'slider', v:80, min:0, max:400 }] } ] } },
{ id:'ctrl-angle', make:['新增形狀圖層：畫一個箭頭或長條','在「效果與預設集」搜尋「角度控制」（Angle Control），拖到圖層上','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','轉動角度控制的轉盤，就能改變起始方向'], cat:'controls', name:'角度控制', sig:'effect("Angle Control")("Angle")', prop:'rotation',
  desc:'角度控制提供轉盤式的角度輸入。這裡把它當作起始方向，再加上隨時間的擺動。',
  how:['效果 → 表達式控制 → 角度控制'],
  code:R`base = effect("Angle Control")("Angle");
base + Math.sin(time * 3) * 20`,
  layer:{ shape:'arrow', size:360, color:C.amber, effects:[{ name:'Angle Control', alias:'角度控制', params:[{ name:'Angle', alias:'角度', type:'angle', v:-45 }] }] } },

// ---------------- 文字 ----------------
{ id:'text-counter', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 target（目標數字）與 dur（跑完的秒數），結尾的 "%" 可以改成任何單位'], cat:'text', name:'數字計數器', sig:'Math.round(linear(time, …))', prop:'sourceText',
  desc:'讓數字從 0 跑到目標值，結尾加上單位。Math.round 去掉小數，或用 toFixed(1) 保留一位。',
  how:[],
  code:R`target = 100; // @目標數字 1~1000 1
dur = 3; // @秒數 0.5~6 0.1
n = linear(time, 0, dur, 0, target);
Math.round(n) + "%"`,
  layer:{ shape:'text', fontSize:220, color:C.amber } },
{ id:'text-comma', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 target 設定最終數字，開頭的 "NT$ " 可以改成其他前綴'], cat:'text', name:'千分位逗號', sig:'.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")', prop:'sourceText',
  desc:'用正規表達式每三位數插入逗號，適合金額、人數、觀看次數等大數字動畫。',
  how:[],
  code:R`target = 1280000; // @目標數字 1000~9999999 1000
n = Math.round(ease(time, 0, 4, 0, target));
"NT$ " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")`,
  layer:{ shape:'text', fontSize:150, color:C.green } },
{ id:'text-typewriter', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','把 txt 裡的文字換成你要的句子','調整 speed 改變每秒出現幾個字'], cat:'text', name:'打字機效果', sig:'txt.substr(0, 字數)', prop:'sourceText',
  desc:'依照時間決定顯示幾個字，再加上閃爍的游標。中文字也能正常逐字出現。',
  how:['可把文字改成你需要的句子'],
  code:R`txt = "表達式讓動畫自己動起來";
speed = 6; // @每秒字數 1~20 1
n = Math.floor(time * speed);
cursor = (Math.floor(time * 2) % 2 == 0) ? "|" : " ";
txt.substr(0, n) + cursor`,
  layer:{ shape:'text', fontSize:96 } },
{ id:'text-countdown', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 total 設定起始秒數；範例為了示範加快了 10 倍，實際使用請把 time * 10 改成 time'], cat:'text', name:'倒數計時 mm:ss', sig:'Math.floor(t / 60) · t % 60', prop:'sourceText',
  desc:'把剩餘秒數拆成分與秒，不足兩位數補 0。改 total 就能設定起始時間。',
  how:[],
  code:R`total = 90; // @起始秒數 10~600 1
t = Math.max(0, total - time * 10);
m = Math.floor(t / 60);
s = Math.floor(t % 60);
(m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s`,
  layer:{ shape:'text', fontSize:240, color:C.coral } },
{ id:'text-scramble', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','把 txt 換成你要顯示的文字，建議用英文大寫','調整 speed 改變每秒解碼幾個字'], cat:'text', name:'亂碼解碼', sig:'random() + for 迴圈', prop:'sourceText',
  desc:'還沒「解碼」的字元每格隨機換成亂碼，已解碼的顯示正確文字，像駭客電影的文字特效。',
  how:[],
  code:R`txt = "AFTER EFFECTS";
chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&";
speed = 4; // @每秒解碼字數 1~15 1
done = Math.floor(time * speed);
out = "";
for (i = 0; i < txt.length; i++) {
  if (i < done || txt[i] == " ") out += txt[i];
  else out += chars[Math.floor(random(chars.length))];
}
out`,
  layer:{ shape:'text', fontSize:130, color:C.green } },
{ id:'text-coords', make:['新增形狀圖層並命名為「球」，讓它的位置有動畫','新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','文字會即時顯示「球」的 X、Y 座標'], cat:'text', name:'顯示其他圖層座標', sig:'p[0].toFixed(0)', prop:'sourceText',
  desc:'讀取另一個圖層的位置並格式化成文字，toFixed(n) 指定小數位數。做 HUD、資訊圖表標籤很實用。',
  how:[],
  code:R`p = thisComp.layer("球").transform.position;
"X " + p[0].toFixed(0) + "   Y " + p[1].toFixed(0)`,
  layer:{ shape:'text', fontSize:80, base:{ position:[960,160] } },
  after:[{ name:'球', shape:'circle', size:100, color:C.amber, expr:{ position:'wiggle(1, 400)' } }] },

{ id:'text-bounce', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層，按「動畫 › 縮放」新增動畫製作工具，把裡面的「縮放」設成 0%','刪掉「範圍選取器」，再按「新增 › 選取器 › 表達式」','展開「表達式選取器」，按住 Alt（Mac：Option）點擊「數量」的碼錶，貼上表達式','調整 delay、freq、decay 改變每個字的間隔、彈跳快慢和停下速度'], cat:'textanim', name:'逐字彈跳出現', sig:'textIndex · 表達式選取器', prop:'amount',
  desc:'每個字依序彈出：先放大衝過頭、再縮回、最後停在原本大小。用 textIndex 讓每個字的開始時間往後延，就會一個接一個出現。',
  how:['文字圖層 › 動畫 › 縮放，把動畫製作工具裡的「縮放」設成 0%','刪掉「範圍選取器」，按「新增 › 選取器 › 表達式」'],
  tip:'數量 100 代表完全套用動畫製作工具（縮放 0%，看不到），0 代表不影響（原本大小）。所以從 100 往 0 衰減震盪，字就會從無到有彈出來，負數時則會超過原本大小。',
  code:R`delay = 0.05; // @每字延遲秒數 0~0.2 0.005
freq = 2.1; // @回彈頻率 0.5~5 0.1
decay = 8; // @停下速度 1~15 0.5
t = time - inPoint - (textIndex - 1) * delay;
if (t < 0) {
  [100, 100];
} else {
  s = 100 * Math.cos(freq * t * 2 * Math.PI) / Math.exp(decay * t);
  [s, s];
}`,
  layer:{ shape:'animtext', text:'AFTER EFFECTS', fontSize:150, color:C.white, animScale:0 } },

// ---------------- 顏色 ----------------
{ id:'color-rainbow', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','展開 內容 › 矩形 1 › 填色 1 › 顏色','按住 Alt（Mac：Option）點擊「顏色」的碼錶，貼上表達式','調整 speed（變色速度）、sat（飽和度）、light（亮度）'], cat:'color', name:'彩虹循環', sig:'hslToRgb([色相, 飽和, 亮度, 1])', prop:'color',
  desc:'HSL 的色相 0~1 繞色環一圈。讓色相隨時間增加並取 % 1，就能無限循環彩虹色。',
  how:[],
  code:R`speed = 0.2; // @每秒繞色環 0~1 0.01
sat = 0.8; // @飽和度 0~1 0.01
light = 0.55; // @亮度 0~1 0.01
hslToRgb([(time * speed) % 1, sat, light, 1])`,
  layer:{ shape:'circle', size:360 } },
{ id:'color-blend', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','展開 內容 › 矩形 1 › 填色 1 › 顏色','按住 Alt（Mac：Option）點擊「顏色」的碼錶，貼上表達式','修改 c1、c2 兩組顏色 [R, G, B, A]（每個值 0～1），調整 dur 改變過渡秒數'], cat:'color', name:'兩色漸變', sig:'linear(t, …, 顏色1, 顏色2)', prop:'color',
  desc:'linear 也能直接插值陣列，所以兩個顏色之間可以平滑過渡。顏色每個值都是 0~1。',
  how:[],
  code:R`dur = 3; // @過渡秒數 0.5~6 0.1
c1 = [0.95, 0.35, 0.3, 1];
c2 = [0.25, 0.55, 0.98, 1];
t = (time % (dur * 2));
t < dur ? linear(t, 0, dur, c1, c2) : linear(t, dur, dur * 2, c2, c1)`,
  layer:{ shape:'rect', size:340 } },
{ id:'color-hex', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','展開 內容 › 矩形 1 › 填色 1 › 顏色','按住 Alt（Mac：Option）點擊「顏色」的碼錶，貼上表達式','把 "#FF5A36"、"#2E86DE" 換成你的色碼，調整 rate 改變切換速度'], cat:'color', name:'使用色碼', sig:'hexToRgb("#FF5A36")', prop:'color',
  desc:'hexToRgb 把設計稿上常見的色碼轉成 AE 顏色陣列，方便對照品牌色。',
  how:[],
  code:R`rate = 1; // @每秒切換 0.2~6 0.1
on = Math.floor(time * rate) % 2 == 0;
on ? hexToRgb("#FF5A36") : hexToRgb("#2E86DE")`,
  layer:{ shape:'star', size:340 } },
{ id:'color-index', make:['新增形狀圖層：畫一個細長的長方形','展開 內容 › 矩形 1 › 填色 1 › 顏色','按住 Alt（Mac：Option）點擊「顏色」的碼錶，貼上表達式','複製多個圖層並橫向排開，會自動分配成一組漸層色','調整 flow 讓顏色流動'], cat:'color', name:'依 index 分配顏色', sig:'(index - 1) / numLayers', prop:'color',
  desc:'每個複本依照 index 取色環上不同位置，自動得到一組協調的漸層配色。',
  how:['複製多個圖層'],
  code:R`flow = 0.1; // @色彩流動速度 0~1 0.01
h = ((index - 1) / thisComp.numLayers + time * flow) % 1;
hslToRgb([h, 0.75, 0.58, 1])`,
  layer:{ shape:'rect', size:[150,520] }, dup:{ n:10, layout:'row' } },

// ---------------- 路徑 ----------------
{ id:'path-polygon', make:['用鋼筆工具在合成中畫一個形狀（或畫矩形後按右鍵 › 轉換為貝茲路徑）','展開 內容 › 形狀 1 › 路徑 1 › 路徑','按住 Alt（Mac：Option）點擊「路徑」的碼錶，貼上表達式','調整 sides（邊數）與 r（半徑）'], cat:'path', name:'正多邊形', sig:'createPath(points, [], [], true)', prop:'path',
  desc:'用迴圈算出每個頂點的座標，交給 createPath 建立封閉路徑。改邊數就能從三角形變到圓形。',
  how:['座標是相對於圖層中心'],
  code:R`sides = 6; // @邊數 3~16 1
r = 260; // @半徑 50~450 1
pts = [];
for (i = 0; i < sides; i++) {
  a = i / sides * Math.PI * 2 - Math.PI / 2;
  pts.push([Math.cos(a) * r, Math.sin(a) * r]);
}
createPath(pts, [], [], true)`,
  layer:{ shape:'path', color:C.blue } },
{ id:'path-wave', make:['用鋼筆工具在合成中畫一個形狀（或畫矩形後按右鍵 › 轉換為貝茲路徑）','在形狀圖層關掉「填色」，加上「筆畫」並設定粗細','展開 內容 › 形狀 1 › 路徑 1 › 路徑','按住 Alt（Mac：Option）點擊「路徑」的碼錶，貼上表達式','調整 amp（振幅）、waves（波數）、speed（流動速度）'], cat:'path', name:'流動正弦波', sig:'createPath(points, inT, outT, false)', prop:'path',
  desc:'沿 X 方向取很多點，Y 用 sin 加上時間，就是一條會流動的波浪線。每個點再依 sin 的斜率加上切線把手，線條就會平滑。最後一個參數 false 代表不封閉。',
  how:['在形狀圖層加上「筆畫」'],
  code:R`amp = 160; // @振幅 0~400 1
waves = 2; // @波數 0.5~6 0.5
speed = 4; // @流動速度 -10~10 0.5
pts = []; inT = []; outT = [];
n = 60; w = 1500;
k = Math.PI * 2 * waves / w; // 每 1px 的相位變化
h = w / n / 3; // 切線把手長度（點距的 1/3）
for (i = 0; i <= n; i++) {
  x = i / n * w - w / 2;
  ph = (x + w / 2) * k + time * speed;
  slope = Math.cos(ph) * amp * k; // sin 的斜率，讓曲線平滑
  pts.push([x, Math.sin(ph) * amp]);
  inT.push([-h, -slope * h]);
  outT.push([h, slope * h]);
}
createPath(pts, inT, outT, false)`,
  layer:{ shape:'path', color:C.green, stroke:10 } },
{ id:'path-star', make:['用鋼筆工具在合成中畫一個形狀（或畫矩形後按右鍵 › 轉換為貝茲路徑）','展開 內容 › 形狀 1 › 路徑 1 › 路徑','按住 Alt（Mac：Option）點擊「路徑」的碼錶，貼上表達式','調整 points（星角數）與 outer（外半徑）'], cat:'path', name:'脈動星形', sig:'內外半徑交替', prop:'path',
  desc:'奇數點用外半徑、偶數點用內半徑就是星形，讓內半徑隨時間變化就會一縮一放。',
  how:[],
  code:R`points = 5; // @星角數 3~12 1
outer = 300; // @外半徑 100~450 1
inner = outer * (0.4 + Math.sin(time * 3) * 0.15);
pts = [];
for (i = 0; i < points * 2; i++) {
  r = (i % 2 == 0) ? outer : inner;
  a = i / (points * 2) * Math.PI * 2 - Math.PI / 2;
  pts.push([Math.cos(a) * r, Math.sin(a) * r]);
}
createPath(pts, [], [], true)`,
  layer:{ shape:'path', color:C.amber } },

{ id:'path-inertia', make:['用鋼筆工具畫出形狀 A，展開「路徑」設第一個關鍵影格','移到後面的時間，把形狀改成 B（頂點數要相同），設第二個關鍵影格','選取關鍵影格，按右鍵 › 關鍵影格插值 › 線性','按住 Alt（Mac：Option）點擊「路徑」的碼錶，貼上表達式','調整 amp、freq、decay 改變果凍回彈的幅度、頻率和停下速度'], cat:'path', name:'慣性回彈', sig:'points(t) · createPath()', prop:'path',
  desc:'路徑有關鍵影格從形狀 A 變成 B 時，在停下的瞬間讓每個頂點依照自己的進場速度衝過頭再回彈，形狀會像果凍一樣晃一下再定型。',
  how:['在「路徑」上設兩個以上的關鍵影格（A 形狀 → B 形狀），建議用線性','位置、縮放、旋轉請用「關鍵影格與物理 › 慣性回彈」那一版'],
  tip:'路徑不能直接做 value + 速度 的運算，所以這裡用 points() 取出每個頂點，各自算速度與回彈，再用 createPath() 組回去。需要 AE CC 2018 以上。',
  code:R`amp = 0.1; // @回彈幅度 0~0.3 0.005
freq = 1.8; // @回彈頻率 0.5~5 0.1
decay = 5; // @停下速度 1~12 0.5
n = 0;
if (numKeys > 0) {
  n = nearestKey(time).index;
  if (key(n).time > time) n--;
}
t = (n == 0) ? 0 : time - key(n).time;
if (n > 0 && t < 3) {
  p = thisProperty;
  dt = thisComp.frameDuration / 10;
  tk = key(n).time;
  before1 = p.points(tk - dt);
  before2 = p.points(tk - dt * 2);
  now = p.points();
  k = amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
  pts = [];
  for (i = 0; i < now.length; i++) {
    v = (before1[i] - before2[i]) / dt; // 這個頂點進場時的速度
    pts.push(now[i] + v * k);
  }
  createPath(pts, p.inTangents(), p.outTangents(), p.isClosed());
} else {
  value;
}`,
  layer:{ shape:'path', color:C.coral, keys:{ path:[[0.5,SHAPE_A,'linear'],[0.8,SHAPE_B,'linear'],[3,SHAPE_B,'linear'],[3.3,SHAPE_A,'linear']] } } },

// ---------------- 邏輯 ----------------
{ id:'logic-if', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 start（開始閃爍的秒數）與 rate（每秒閃幾次）'], cat:'logic', name:'if / else 依時間切換', sig:'if (條件) A; else B;', prop:'opacity',
  desc:'在指定時間之前保持不動，之後開始閃爍。if / else 最後被執行的那一行就是結果。',
  how:[],
  code:R`start = 2; // @開始閃爍秒數 0~5 0.1
rate = 3; // @每秒閃爍 0.5~10 0.5
if (time < start) {
  100;
} else {
  Math.sin(time * rate * Math.PI * 2) > 0 ? 100 : 15;
}`,
  layer:{ shape:'circle', size:280, color:C.coral } },
{ id:'logic-marker', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','在想觸發的時間點選取圖層，按數字鍵盤的 *（或 圖層 › 新增標記）加上標記','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','每經過一個標記就會彈一下；移動標記，彈跳時間也會跟著改'], cat:'logic', name:'標記觸發動畫', sig:'marker.nearestKey(time)', prop:'scale',
  desc:'在圖層上加標記（數字鍵盤 *），每經過一個標記就觸發一次彈跳。剪輯時只要移動標記，動畫就跟著走。',
  how:['選圖層按數字鍵盤 * 新增標記'],
  code:R`amp = 60; // @彈跳幅度 0~150 1
n = 0;
if (marker.numKeys > 0) {
  n = marker.nearestKey(time).index;
  if (marker.key(n).time > time) n--;
}
if (n == 0) {
  value;
} else {
  t = time - marker.key(n).time;
  s = 100 + amp * Math.exp(-t * 6) * Math.cos(t * 22);
  [s, s];
}`,
  layer:{ shape:'rect', size:240, color:C.violet, markers:[[1,'A'],[2.5,'B'],[3.2,'C'],[4.6,'D']] } },
{ id:'logic-threshold', cat:'logic', name:'超過門檻變色', sig:'條件 ? 值1 : 值2', prop:'color',
  make:['新增形狀圖層：用矩形工具在合成中畫一個方塊（圖層 › 新增 › 形狀圖層）。',
    '做出左右移動：在「位置」設兩個關鍵影格，例如 0 秒 X = 350、2 秒 X = 1570，再對「位置」加上 loopOut("pingpong") 讓它來回移動。',
    '找到顏色屬性：展開 內容 › 矩形 1 › 填色 1 › 顏色。',
    '套用表達式：按住 Alt（Mac 為 Option）點擊「顏色」旁的碼錶，貼上這個範例的表達式。',
    '設定門檻：把 960 改成你要的 X 座標，960 是 1920 寬合成的正中央。',
    '更換顏色：兩組 [R, G, B, A] 都是 0～1 的數值，例如紅色是 [1, 0, 0, 1]；也可以改用 hexToRgb("#FF5A36") 這種色碼寫法。',
    '（可選）畫一條參考線：新增一個細長的形狀圖層放在 X = 960，方便看出越線的瞬間。'],
  desc:'三元運算子 a ? b : c 是一行版的 if。當圖層越過畫面中線時改變顏色。',
  how:[],
  code:R`line = 960; // @門檻 X 0~1920 10
transform.position[0] > line ? [0.95, 0.38, 0.33, 1] : [0.24, 0.61, 0.94, 1]`,
  layer:{ shape:'rect', size:200, keys:{ position:[[0,[350,540]],[2,[1570,540]]] }, expr:{ position:'loopOut("pingpong")' } },
  after:[{ name:'中線', shape:'rect', size:[6,700], color:C.grey }] },

// ---------------- JS ----------------
{ id:'js-math', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','播放時可以比較同一個數字經過不同 Math 函式的結果'], cat:'js', name:'Math 函式對照', sig:'round · floor · ceil · abs', prop:'sourceText',
  desc:'同一個數字經過不同 Math 函式的結果，一次看懂差別。',
  how:[],
  code:R`v = time * 1.7;
"v = " + v.toFixed(3) +
"\rMath.round → " + Math.round(v) +
"\rMath.floor → " + Math.floor(v) +
"\rMath.ceil  → " + Math.ceil(v) +
"\rMath.sin   → " + Math.sin(v).toFixed(3)`,
  layer:{ shape:'text', fontSize:64 } },
{ id:'js-array', make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','修改 pts 陣列裡的座標可以改變跳動的位置與順序，調整 rate 改變速度'], cat:'js', name:'陣列與索引', sig:'arr[i] · arr.length', prop:'position',
  desc:'把多個座標放在陣列裡，用 Math.floor(time) % 長度 依序取出，就能每秒跳到下一個位置。',
  how:[], trail:true,
  code:R`pts = [[400, 300], [1500, 300], [1500, 800], [400, 800]];
rate = 1; // @每秒換幾個點 0.5~4 0.5
i = Math.floor(time * rate) % pts.length;
pts[i]`,
  layer:{ shape:'rect', size:140, color:C.amber } },
{ id:'js-loop', make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','播放時會看到從 1 加到 n 的過程與總和'], cat:'js', name:'for 迴圈累加', sig:'for (i = 0; i < n; i++)', prop:'sourceText',
  desc:'迴圈重複執行同一段程式。這裡把 1 加到 n，並把每一項串成文字。',
  how:[],
  code:R`n = Math.floor(time * 1.5) + 1;
sum = 0;
list = [];
for (i = 1; i <= n; i++) {
  sum += i;
  list.push(i);
}
list.join(" + ") + "\r= " + sum`,
  layer:{ shape:'text', fontSize:72 } },
{ id:'js-function', make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','修改 hop 函式或 height，改變跳躍的高度與節奏'], cat:'js', name:'自訂函式', sig:'function 名稱(參數) { return … }', prop:'position',
  desc:'把重複的計算包成函式，傳入不同參數重複使用，讓表達式更好讀也更好改。',
  how:[], trail:true,
  code:R`function hop(t, h) {
  return Math.abs(Math.sin(t * Math.PI)) * h;
}
height = 300; // @跳躍高度 0~600 1
x = linear(time % 3, 0, 3, 300, 1620);
[x, 820 - hop(time * 1.5, height)]`,
  layer:{ shape:'circle', size:110, color:C.green } },

// ---------------- Expression Kit 補充 ----------------
{ id:'ta-order',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層，按「動畫」新增 「位置」，把動畫製作工具裡的數值設成範例的起始狀態','把動畫製作工具的位置設成 0, -150','刪掉「範圍選取器」，再按「新增 › 選取器 › 表達式」','展開「表達式選取器」，按住 Alt（Mac：Option）點擊「數量」的碼錶，貼上表達式','把 mode 改成 0～3 切換順序：0 正序、1 倒序、2 隨機、3 中心向外'],
  cat:'textanim',
  name:'逐字順序：正序／倒序／隨機／中心',
  sig:'textTotal · seedRandom(textIndex)',
  prop:'amount',
  desc:'同一個逐字彈入動畫，只改變每個字的出場順序：從第一個字、從最後一個字、隨機，或從中間往兩側。用 textTotal 取得總字數。',
  how:['動畫製作工具用「位置」設成 0, -150，字會從上方彈入','換成旋轉、縮放、字距、傾斜，就是其他彈入效果'],
  code:R`mode = 3; // @順序 0~3 1
delay = 0.06; // @每字延遲 0~0.2 0.01
freq = 2; // @回彈頻率 0.5~5 0.1
decay = 7; // @停下速度 1~15 0.5
n = textTotal;
if (mode == 1) k = n - textIndex;
else if (mode == 2) { seedRandom(textIndex, true); k = Math.floor(random(n)); }
else if (mode == 3) k = Math.abs(textIndex - (n + 1) / 2);
else k = textIndex - 1;
t = time - inPoint - k * delay;
t < 0 ? 100 : 100 * Math.cos(freq * t * 2 * Math.PI) / Math.exp(decay * t)`,
  layer:{ shape:'animtext', text:'EXPRESSION', fontSize:150, color:C.white, anim:{ position:[0,-150], opacity:0 } } },
{ id:'ta-wave',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層，按「動畫」新增 「位置」，把動畫製作工具裡的數值設成範例的起始狀態','把動畫製作工具的位置設成 0, -60','刪掉「範圍選取器」，再按「新增 › 選取器 › 表達式」','展開「表達式選取器」，按住 Alt（Mac：Option）點擊「數量」的碼錶，貼上表達式','調整 speed（波動速度）與 spacing（相鄰字的錯開程度）'],
  cat:'textanim',
  name:'逐字波浪',
  sig:'Math.sin(time + textIndex)',
  prop:'amount',
  desc:'每個字用 sin 上下擺動，加上 textIndex 讓相鄰的字錯開時間，整行字就像波浪一樣起伏，會一直持續。',
  how:['動畫製作工具用「位置」設成 0, -60，數量 100 就代表往上 60 像素'],
  code:R`speed = 4; // @波動速度 0~10 0.1
spacing = 0.5; // @相鄰錯開 0~2 0.05
Math.sin(time * speed - textIndex * spacing) * 100`,
  layer:{ shape:'animtext', text:'WAVE TEXT', fontSize:160, color:C.green, anim:{ position:[0,-60] } } },
{ id:'ta-fade',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層，按「動畫」新增 「位置」與「不透明度」，把動畫製作工具裡的數值設成範例的起始狀態','把位置設成 0, 40、不透明度設成 0%','刪掉「範圍選取器」，再按「新增 › 選取器 › 表達式」','展開「表達式選取器」，按住 Alt（Mac：Option）點擊「數量」的碼錶，貼上表達式','調整 delay（每字間隔）與 dur（每個字淡入的秒數）'],
  cat:'textanim',
  name:'逐字淡入上升',
  sig:'100 - ease(t, 0, dur, 0, 100)',
  prop:'amount',
  desc:'每個字依序從下方淡入，沒有回彈，是最常用的字幕進場方式。同一個動畫製作工具裡同時放「位置」和「不透明度」，就能一次控制兩種變化。',
  how:['動畫製作工具同時加「位置」0, 40 和「不透明度」0%'],
  code:R`delay = 0.06; // @每字延遲 0~0.3 0.01
dur = 0.6; // @淡入秒數 0.1~2 0.05
t = time - inPoint - (textIndex - 1) * delay;
100 - ease(t, 0, dur, 0, 100)`,
  layer:{ shape:'animtext', text:'表達式讓動畫更簡單', fontSize:120, color:C.white, anim:{ position:[0,40], opacity:0 } } },
{ id:'ta-gravity',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層，按「動畫」新增 「位置」，把動畫製作工具裡的數值設成範例的起始狀態','把動畫製作工具的位置設成 0, -400','刪掉「範圍選取器」，再按「新增 › 選取器 › 表達式」','展開「表達式選取器」，按住 Alt（Mac：Option）點擊「數量」的碼錶，貼上表達式','調整 fall（落下秒數）、bounce（落地彈跳高度）'],
  cat:'textanim',
  name:'逐字重力落下',
  sig:'1 - (t / 落下時間)²',
  prop:'amount',
  desc:'每個字從上方加速掉落，落地後小小彈兩下再停住。用平方讓速度越來越快，模擬重力。',
  how:['動畫製作工具用「位置」設成 0, -400，數量 100 代表在上方 400 像素'],
  code:R`delay = 0.07; // @每字延遲 0~0.3 0.01
fall = 0.5; // @落下秒數 0.2~1.5 0.05
bounce = 15; // @彈跳高度 0~40 1
t = time - inPoint - (textIndex - 1) * delay;
if (t < 0) {
  100;
} else if (t < fall) {
  100 * (1 - Math.pow(t / fall, 2));
} else {
  u = t - fall;
  Math.abs(Math.sin(u * Math.PI * 3)) * bounce * Math.exp(-u * 5);
}`,
  layer:{ shape:'animtext', text:'GRAVITY', fontSize:170, color:C.amber, anim:{ position:[0,-400] } } },
{ id:'ta-gather',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層，按「動畫」新增 「位置」，把動畫製作工具裡的數值設成範例的起始狀態','把動畫製作工具的位置設成 600, 400','刪掉「範圍選取器」，再按「新增 › 選取器 › 表達式」','展開「表達式選取器」，按住 Alt（Mac：Option）點擊「數量」的碼錶，貼上表達式','把 mode 設成 0（聚合）或 1（爆散），調整 dur 改變飛行秒數'],
  cat:'textanim',
  name:'逐字聚合／爆散',
  sig:'seedRandom(textIndex, true) · 數量陣列',
  prop:'amount',
  desc:'每個字用自己的 textIndex 當亂數種子，得到一個固定的隨機方向。聚合模式從四散的位置飛回原位，爆散模式則從原位往外飛出。數量可以回傳 [x, y]，分別控制兩個方向。',
  how:['動畫製作工具用「位置」設成 600, 400，代表最遠飛出的距離'],
  code:R`mode = 0; // @模式 0~1 1
dur = 1.2; // @飛行秒數 0.3~3 0.1
start = 1; // @爆散開始秒數 0~4 0.1
seedRandom(textIndex, true);
dir = [random(-100, 100), random(-100, 100)];
t = time - inPoint;
p = (mode == 0) ? 1 - easeOut(t, 0, dur, 0, 1) : easeIn(t, start, start + dur, 0, 1);
dir * p`,
  layer:{ shape:'animtext', text:'SCATTER', fontSize:170, color:C.violet, anim:{ position:[600,400] } } },
{ id:'ta-spiral',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層，按「動畫」新增 「位置」，把動畫製作工具裡的數值設成範例的起始狀態','把動畫製作工具的位置設成 500, 300','刪掉「範圍選取器」，再按「新增 › 選取器 › 表達式」','展開「表達式選取器」，按住 Alt（Mac：Option）點擊「數量」的碼錶，貼上表達式','調整 turns（繞幾圈）、dur（進場秒數）與 delay（每字間隔）'],
  cat:'textanim',
  name:'逐字螺旋進場',
  sig:'[cos(a), sin(a)] * 半徑',
  prop:'amount',
  desc:'每個字沿著螺旋線轉進來：角度隨時間轉動、半徑越來越小，最後停在原位。',
  how:['動畫製作工具用「位置」設成 500, 300，決定螺旋的大小'],
  code:R`delay = 0.05; // @每字延遲 0~0.2 0.01
dur = 1.5; // @進場秒數 0.3~3 0.1
turns = 1.5; // @繞幾圈 0~4 0.25
t = time - inPoint - (textIndex - 1) * delay;
p = 1 - ease(t, 0, dur, 0, 1);
a = p * turns * 2 * Math.PI;
[Math.cos(a), Math.sin(a)] * p * 100`,
  layer:{ shape:'animtext', text:'SPIRAL', fontSize:170, color:C.blue, anim:{ position:[500,300] } } },
{ id:'text-bounce-counter',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 target（目標數字）、freq（回彈頻率）、decay（停下速度）'],
  cat:'text',
  name:'彈跳計數器',
  sig:'目標 * (1 - cos(ωt) / e^(d·t))',
  prop:'sourceText',
  desc:'數字跑向目標時先衝過頭、再往回修正，最後停在目標值，比一般的計數器更有彈性。',
  how:[],
  code:R`target = 100; // @目標數字 1~1000 1
freq = 1; // @回彈頻率 0.3~3 0.1
decay = 3; // @停下速度 0.5~8 0.5
t = time - inPoint;
n = target * (1 - Math.cos(freq * t * 2 * Math.PI) / Math.exp(decay * t));
Math.round(n)`,
  layer:{ shape:'text', fontSize:240, color:C.amber } },
{ id:'text-date',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','修改最後一行的組合方式，例如改成 m + "月" + day + "日"'],
  cat:'text',
  name:'顯示今天日期',
  sig:'new Date()',
  prop:'sourceText',
  desc:'用 JavaScript 的 Date 取得電腦目前的日期與星期，每次開啟專案都會顯示當天日期。',
  how:['日期取自電腦時間，算圖當下的日期就是畫面上的日期'],
  code:R`d = new Date();
y = d.getFullYear();
m = d.getMonth() + 1;
day = d.getDate();
week = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
y + " 年 " + m + " 月 " + day + " 日\r星期" + week`,
  layer:{ shape:'text', fontSize:110 } },
{ id:'text-stopwatch',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 stopAt（最後停住的秒數）與 dur（跑多久）'],
  cat:'text',
  name:'碼錶減速停止',
  sig:'1 - (1 - u)³',
  prop:'sourceText',
  desc:'碼錶一開始快速跑動，越來越慢，最後停在指定秒數，適合揭曉成績、時間的畫面。',
  how:[],
  code:R`stopAt = 9.58; // @停止秒數 1~60 0.01
dur = 3; // @跑動時間 0.5~6 0.1
u = Math.min(1, Math.max(0, (time - inPoint) / dur));
s = stopAt * (1 - Math.pow(1 - u, 3));
s.toFixed(2) + " 秒"`,
  layer:{ shape:'text', fontSize:220, color:C.green } },
{ id:'text-blink',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 rate（每秒閃幾次）'],
  cat:'text',
  name:'文字閃爍',
  sig:'Math.floor(time * 速率) % 2',
  prop:'sourceText',
  desc:'依時間輪流顯示與隱藏文字。value 代表原本輸入的文字，所以不用把文字寫進表達式。',
  how:[],
  code:R`rate = 2; // @每秒閃幾次 0.5~10 0.5
Math.floor(time * rate * 2) % 2 == 0 ? value : ""`,
  layer:{ shape:'text', fontSize:150, color:C.coral, text:'● REC' } },
{ id:'text-noise',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 amount（被干擾的比例）與 fps（每秒換幾次亂碼）'],
  cat:'text',
  name:'數位雜訊干擾',
  sig:'random() < 比例 ? 亂碼 : 原字',
  prop:'sourceText',
  desc:'隨機把一部分字替換成符號，模擬訊號不良、數位干擾的效果。比例越高越亂。',
  how:['搭配 posterizeTime 控制亂碼變化的速度'],
  code:R`amount = 0.25; // @干擾比例 0~1 0.05
fps = 12; // @每秒變化 1~30 1
posterizeTime(fps);
chars = "#%&*@$?!<>/\\|=+";
out = "";
for (i = 0; i < value.length; i++) {
  c = value[i];
  out += (c != " " && random() < amount) ? chars[Math.floor(random(chars.length))] : c;
}
out`,
  layer:{ shape:'text', fontSize:140, color:C.green, text:'SIGNAL LOST' } },
{ id:'text-loading',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','調整 rate（每秒加幾個點），把 "載入中" 換成你要的文字'],
  cat:'text',
  name:'載入中動態點點',
  sig:'".".repeat(n)',
  prop:'sourceText',
  desc:'在文字後面循環出現 0～3 個點，做出「載入中…」的等待動畫。',
  how:[],
  code:R`rate = 3; // @每秒加幾點 0.5~10 0.5
"載入中" + ".".repeat(Math.floor(time * rate) % 4)`,
  layer:{ shape:'text', fontSize:140 } },
{ id:'text-slot',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','把 txt 換成你要揭曉的數字或文字，調整 start 與 gap 改變停止的時間'],
  cat:'text',
  name:'拉霸數字滾動',
  sig:'每格隨機數字，時間到就定住',
  prop:'sourceText',
  desc:'每一位數字像拉霸機一樣快速亂跳，從左到右依序停在正確的數字上。',
  how:[],
  code:R`txt = "2026";
start = 0.6; // @第一位停止秒數 0~3 0.1
gap = 0.4; // @每位間隔 0.05~1 0.05
out = "";
for (i = 0; i < txt.length; i++) {
  if (time - inPoint > start + i * gap) out += txt[i];
  else out += Math.floor(random(10));
}
out`,
  layer:{ shape:'text', fontSize:260, color:C.amber } },
{ id:'text-redact',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','把 txt 換成你的文字，調整 speed（每秒揭露幾個字）與 start（開始時間）'],
  cat:'text',
  name:'機密塗黑揭露',
  sig:'i < 已揭露字數 ? 原字 : "█"',
  prop:'sourceText',
  desc:'還沒揭露的字用黑色方塊遮住，再一個字一個字揭開，像機密文件被解密。',
  how:[],
  code:R`txt = "TOP SECRET FILE";
speed = 8; // @每秒揭露字數 1~30 1
start = 0.5; // @開始秒數 0~3 0.1
done = Math.floor((time - inPoint - start) * speed);
out = "";
for (i = 0; i < txt.length; i++) {
  out += (i < done || txt[i] == " ") ? txt[i] : "█";
}
out`,
  layer:{ shape:'text', fontSize:120 } },
{ id:'text-words',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','把 txt 換成你的句子（詞與詞之間用空格分開），調整 speed（每秒出現幾個詞）'],
  cat:'text',
  name:'逐詞出現',
  sig:'txt.split(" ").slice(0, n)',
  prop:'sourceText',
  desc:'以空格把句子切成詞，依時間一次多顯示一個詞，比逐字打字更適合英文標語。',
  how:[],
  code:R`txt = "Make your motion come alive";
speed = 2; // @每秒幾個詞 0.5~8 0.5
words = txt.split(" ");
n = Math.floor((time - inPoint) * speed) + 1;
words.slice(0, n).join(" ")`,
  layer:{ shape:'text', fontSize:110 } },
{ id:'text-cycle',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','展開文字圖層的 文字 › 來源文字','按住 Alt（Mac：Option）點擊「來源文字」的碼錶，貼上表達式','修改 list 裡的詞，調整 hold（每個詞停留秒數）'],
  cat:'text',
  name:'文字輪播',
  sig:'list[Math.floor(time / 間隔) % list.length]',
  prop:'sourceText',
  desc:'在多個詞之間輪流切換，適合「我們做 ___」這種輪換標語。陣列裡可以放任意數量的詞。',
  how:[],
  code:R`list = ["DESIGN", "MOTION", "CODE"];
hold = 1; // @每個停留秒數 0.2~3 0.1
list[Math.floor((time - inPoint) / hold) % list.length]`,
  layer:{ shape:'text', fontSize:200, color:C.blue } },
{ id:'wiggle-decay',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 amp（一開始的晃動距離）與 decay（平息速度）'],
  cat:'random',
  name:'漸弱抖動',
  sig:'wiggle(freq, amp * e^(-衰減·t))',
  prop:'position',
  desc:'wiggle 的幅度乘上指數衰減，一開始劇烈晃動、慢慢平息，適合撞擊、爆炸後的震動。',
  how:['幅度參數可以是運算式，不一定要是固定數字'],
  trail:true,
  code:R`freq = 12; // @頻率 1~30 1
amp = 120; // @初始幅度 0~400 1
decay = 2; // @平息速度 0.2~8 0.1
t = (time - inPoint) % 3;
wiggle(freq, amp * Math.exp(-decay * t))`,
  layer:{ shape:'rect', size:140 } },
{ id:'wiggle-snap',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 grid（格距）讓移動對齊到不同大小的格子'],
  cat:'random',
  name:'格點吸附抖動',
  sig:'Math.round(w / 格距) * 格距',
  prop:'position',
  desc:'把 wiggle 的結果四捨五入到最近的格點，移動會一格一格跳，像像素遊戲或棋盤上的移動。',
  how:[],
  trail:true,
  code:R`freq = 2; // @頻率 0~8 0.1
amp = 300; // @幅度 0~600 1
grid = 80; // @格距 10~200 5
w = wiggle(freq, amp);
[Math.round(w[0] / grid) * grid, Math.round(w[1] / grid) * grid]`,
  layer:{ shape:'rect', size:80, color:C.green } },
{ id:'wiggle-xy',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','分別調整 X 和 Y 的頻率與幅度'],
  cat:'random',
  name:'X、Y 分開抖動',
  sig:'[wiggle(…)[0], wiggle(…)[1]]',
  prop:'position',
  desc:'對 X 和 Y 各算一次 wiggle，就能給兩個方向不同的頻率和幅度，例如左右大幅緩慢、上下小幅快速。',
  how:[],
  trail:true,
  code:R`fx = 1; // @X 頻率 0~8 0.1
ax = 400; // @X 幅度 0~600 1
fy = 6; // @Y 頻率 0~15 0.1
ay = 40; // @Y 幅度 0~300 1
[wiggle(fx, ax)[0], wiggle(fy, ay)[1]]`,
  layer:{ shape:'circle', size:110, color:C.amber } },
{ id:'wiggle-uniform',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','調整 freq 與 amp（縮放百分比的變化量）'],
  cat:'random',
  name:'等比縮放抖動',
  sig:'w = wiggle(); [w[0], w[0]]',
  prop:'scale',
  desc:'直接對縮放用 wiggle，寬和高會各自亂跳而變形。只取第一個值同時給寬和高，就能保持比例地放大縮小。',
  how:[],
  code:R`freq = 3; // @頻率 0~10 0.1
amp = 30; // @幅度 % 0~80 1
w = wiggle(freq, amp);
[w[0], w[0]]`,
  layer:{ shape:'star', size:260, color:C.violet } },
{ id:'wiggle-wind',
  make:['新增形狀圖層：畫一個細長的長方形','用錨點工具（Y）把錨點移到長條底端','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','調整 strength（擺動角度）與 gust（陣風變化速度）'],
  cat:'random',
  name:'風吹搖擺',
  sig:'sin 疊加 + noise 陣風',
  prop:'rotation',
  desc:'兩個不同頻率的 sin 疊在一起做出自然的擺動，再加上 noise 模擬忽大忽小的陣風，適合草、旗子、招牌。',
  how:['錨點移到底部，看起來才像固定在地上被風吹'],
  code:R`strength = 15; // @擺動角度 0~45 1
gust = 0.8; // @陣風速度 0~3 0.1
sway = Math.sin(time * 1.3) * 0.6 + Math.sin(time * 2.7 + 1) * 0.3;
strength * (sway + noise(time * gust) * 0.6)`,
  layer:{ shape:'rect', size:[50,420], color:C.green, base:{ position:[960,900], anchorPoint:[0,210] } } },
{ id:'wiggle-handheld',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 slow（大幅慢晃）與 fast（細微快抖）的幅度'],
  cat:'random',
  name:'手持攝影晃動',
  sig:'wiggle(慢) + wiggle(快) - value',
  prop:'position',
  desc:'把一個慢而大的 wiggle 和一個快而小的 wiggle 疊在一起，比單一 wiggle 更像真人拿著攝影機的晃動。',
  how:['可以套在攝影機或空物件上，讓整個畫面一起晃'],
  trail:true,
  code:R`slow = 40; // @慢晃幅度 0~150 1
fast = 6; // @快抖幅度 0~40 1
wiggle(0.6, slow) + wiggle(5, fast) - value`,
  layer:{ shape:'rect', size:220, color:C.blue } },
{ id:'phys-auto-bounce',
  make:['新增形狀圖層：用橢圓工具畫一個小圓點','把圖層移到地面的位置','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 h（掉落高度）、e（彈性）與 g（重力）'],
  cat:'physics',
  name:'自動落下彈跳',
  sig:'重力 + 彈性，不用關鍵影格',
  prop:'position',
  desc:'不用設關鍵影格，圖層一出現就從上方掉落並彈跳，原本的 Y 位置就是地面。',
  how:['把圖層放在你想要的「地面」高度，表達式會從上方掉下來'],
  trail:true,
  code:R`h = 600; // @掉落高度 50~900 10
e = 0.6; // @彈性 0~0.95 0.01
g = 4000; // @重力 500~10000 100
t = time - inPoint;
v0 = Math.sqrt(2 * g * h);
tFall = v0 / g;
if (t < tFall) {
  y = value[1] - h + 0.5 * g * t * t;
} else {
  t -= tFall; v = v0 * e;
  while (v > 1 && t > 2 * v / g) { t -= 2 * v / g; v *= e; }
  y = (v > 1) ? value[1] - (v * t - 0.5 * g * t * t) : value[1];
}
[value[0], y]`,
  layer:{ shape:'circle', size:110, color:C.amber, base:{ position:[960,860] } },
  after:[{ name:'地面', shape:'rect', size:[1400,10], color:C.grey, base:{ position:[960,920] } }] },
{ id:'phys-pop',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','把圖層的開頭拖到想要登場的時間','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','調整 freq（回彈頻率）與 decay（停下速度）'],
  cat:'physics',
  name:'彈性放大登場',
  sig:'100 - 100·cos(ωt) / e^(d·t)',
  prop:'scale',
  desc:'圖層出現時從 0% 彈到 100%，先衝過頭再回到原大小，是最常用的圖示、按鈕登場方式。',
  how:['從圖層的入點開始計時，移動圖層就能改變登場時間'],
  code:R`freq = 2; // @回彈頻率 0.5~5 0.1
decay = 6; // @停下速度 1~15 0.5
t = Math.max(0, time - inPoint);
s = 100 - 100 * Math.cos(freq * t * 2 * Math.PI) / Math.exp(decay * t);
[s, s]`,
  layer:{ shape:'rect', size:260, color:C.coral, inPoint:0.5 } },
{ id:'phys-jelly',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','調整 amp（形變幅度）、freq（抖動頻率）、decay（停下速度）'],
  cat:'physics',
  name:'果凍形變',
  sig:'寬 +sin，高 -sin',
  prop:'scale',
  desc:'寬和高朝相反方向擺動並逐漸衰減，看起來像果凍被戳了一下。',
  how:[],
  code:R`amp = 25; // @形變幅度 0~60 1
freq = 3; // @抖動頻率 0.5~8 0.1
decay = 3; // @停下速度 0.5~10 0.5
t = time % 2;
k = amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);
[100 + k, 100 - k]`,
  layer:{ shape:'circle', size:300, color:C.green } },
{ id:'phys-squash',
  make:['新增形狀圖層：用橢圓工具畫一個小圓點','用錨點工具（Y）把錨點移到圓形底部','在「位置」加上彈跳表達式，例如 [value[0], 860 - Math.abs(Math.sin(time * 1.2 * Math.PI)) * 450]','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','調整 squash（落地壓扁程度）與 stretch（移動時拉長程度）'],
  cat:'physics',
  name:'擠壓與伸展',
  sig:'[10000 / 高, 高]',
  prop:'scale',
  desc:'動畫原則中的擠壓與伸展：落地時壓扁、快速移動時拉長。寬度用 10000 ÷ 高度計算，讓整體體積看起來不變。',
  how:['錨點要在圖形底部，壓扁時才會貼著地面','位置本身有彈跳的表達式，頻率要和這裡的 f 一致'],
  code:R`f = 1.2; // @彈跳頻率 0.3~3 0.1
squash = 35; // @壓扁程度 0~60 1
stretch = 20; // @拉長程度 0~50 1
p = (time * f) % 1;
g = Math.min(p, 1 - p);
hit = Math.exp(-Math.pow(g / 0.06, 2));
speed = Math.abs(Math.cos(p * Math.PI));
sy = 100 + speed * stretch - hit * squash;
[10000 / sy, sy]`,
  layer:{ shape:'circle', size:140, color:C.amber, base:{ anchorPoint:[0,70] }, expr:{ position:'[value[0], 860 - Math.abs(Math.sin(time * 1.2 * Math.PI)) * 450]' } },
  after:[{ name:'地面', shape:'rect', size:[1400,10], color:C.grey, base:{ position:[960,865] } }] },
{ id:'phys-anticipation',
  make:['新增形狀圖層：畫一個細長的長方形','用錨點工具（Y）把錨點移到長條底端','選取圖層，按 R 展開「旋轉」','按住 Alt（Mac：Option）點擊「旋轉」的碼錶，貼上表達式','調整 back（往後拉的角度）、target（目標角度）與 decay（停下速度）'],
  cat:'physics',
  name:'預備動作',
  sig:'先往反方向拉，再衝過頭回彈',
  prop:'rotation',
  desc:'動畫原則中的預備動作：要往前之前先往後拉一下，再快速衝到目標並回彈，讓動作更有力量。',
  how:[],
  code:R`back = 25; // @預備角度 0~60 1
target = 120; // @目標角度 -180~180 1
prep = 0.4; // @預備秒數 0.1~1 0.05
decay = 5; // @停下速度 1~12 0.5
t = time % 3;
if (t < prep) {
  -back * ease(t, 0, prep, 0, 1);
} else {
  u = t - prep;
  target - (target + back) * Math.cos(u * 2 * 2 * Math.PI) * Math.exp(-decay * u);
}`,
  layer:{ shape:'rect', size:[60,360], color:C.blue, base:{ position:[960,760], anchorPoint:[0,170] } } },
{ id:'phys-slide',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','把圖層放在起點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 v0（初速）並用 mode 切換兩種減速方式'],
  cat:'physics',
  name:'滑行減速（摩擦力／空氣阻力）',
  sig:'v·t - ½·a·t² · v/k·(1 - e^(-k·t))',
  prop:'position',
  desc:'物體以初速滑出後慢慢停下。摩擦力是固定減速、會在某個點確實停住；空氣阻力是越慢減得越少，會慢慢逼近終點。',
  how:['mode 0 是摩擦力，1 是空氣阻力'],
  trail:true,
  code:R`v0 = 1600; // @初速 200~3000 50
mode = 0; // @模式 0~1 1
friction = 1000; // @摩擦減速 200~3000 50
drag = 1.5; // @空氣阻力 0.3~5 0.1
t = (time - inPoint) % 3;
if (mode == 0) {
  tt = Math.min(t, v0 / friction);
  d = v0 * tt - 0.5 * friction * tt * tt;
} else {
  d = v0 / drag * (1 - Math.exp(-drag * t));
}
value + [d, 0]`,
  layer:{ shape:'rect', size:120, color:C.violet, base:{ position:[300,540] } } },
{ id:'phys-magnet',
  make:['新增一個形狀圖層，命名為「磁鐵」，放在吸引的中心位置','新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 r0（起始距離）、pull（吸引速度）與 spin（旋轉速度）'],
  cat:'physics',
  name:'磁力吸引',
  sig:'目標 + [cos, sin] · r·e^(-k·t)',
  prop:'position',
  desc:'圖層繞著「磁鐵」轉，半徑越來越小，最後被吸到中心。',
  how:['建立一個名為「磁鐵」的圖層當作吸引中心'],
  trail:true,
  code:R`r0 = 520; // @起始距離 50~800 10
pull = 0.9; // @吸引速度 0.1~4 0.1
spin = 0.7; // @每秒圈數 -3~3 0.1
target = thisComp.layer("磁鐵").transform.position;
t = time - inPoint;
r = r0 * Math.exp(-pull * t);
a = t * spin * 2 * Math.PI;
target + [Math.cos(a), Math.sin(a)] * r`,
  layer:{ shape:'circle', size:70, color:C.white },
  before:[{ name:'磁鐵', shape:'null', size:70, color:C.coral, base:{ position:[960,540] } }] },
{ id:'phys-edge',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 sx、sy（水平與垂直速度）與 size（圖形半徑，避免穿出畫面）'],
  cat:'physics',
  name:'碰到邊界反彈',
  sig:'三角波：x < w ? x : 2w - x',
  prop:'position',
  desc:'圖層以固定速度移動，碰到畫面邊緣就反彈，像經典的 DVD 待機畫面。用「三角波」讓數值在 0 和邊界之間來回。',
  how:[],
  trail:true,
  code:R`sx = 420; // @水平速度 0~1200 10
sy = 300; // @垂直速度 0~1200 10
size = 80; // @圖形半徑 10~300 5
w = thisComp.width - size * 2;
h = thisComp.height - size * 2;
x = (time * sx) % (2 * w);
y = (time * sy) % (2 * h);
[size + (x < w ? x : 2 * w - x), size + (y < h ? y : 2 * h - y)]`,
  layer:{ shape:'rect', size:160, color:C.coral } },
{ id:'math-waves',
  make:['新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','按 Ctrl/Cmd + D 複製成 3 個圖層並上下排開','調整 freq（頻率）、amp（幅度）與 duty（方波亮的比例）'],
  cat:'math',
  name:'方波、三角波、鋸齒波',
  sig:'p = (time × 頻率) % 1',
  prop:'position',
  desc:'先算出 0～1 不斷重複的進度 p，再用不同公式變成三種波形：方波瞬間切換、三角波等速來回、鋸齒波一路上升後歸零。',
  how:['三個圖層用 index 選擇不同波形'],
  labels:true,
  code:R`freq = 0.6; // @頻率 0.1~3 0.05
amp = 500; // @幅度 0~800 10
duty = 0.5; // @方波比例 0.05~0.95 0.05
p = (time * freq) % 1;
if (index == 1) w = (p < duty) ? 1 : -1;
else if (index == 2) w = 1 - 4 * Math.abs(p - 0.5);
else w = 2 * p - 1;
[960 + w * amp, value[1]]`,
  layer:{ shape:'circle', size:90 },
  dup:{ n:3, layout:'col', names:['方波','三角波','鋸齒波'], colors:[C.coral,C.green,C.blue] } },
{ id:'math-heartbeat',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 S 展開「縮放」','按住 Alt（Mac：Option）點擊「縮放」的碼錶，貼上表達式','調整 bpm（每分鐘心跳數）與 amp（放大幅度）'],
  cat:'math',
  name:'心跳脈動',
  sig:'兩個高斯脈衝疊加',
  prop:'scale',
  desc:'用兩個尖峰（一大一小）組成「咚咚」的心跳節奏，依每分鐘跳動次數重複。',
  how:[],
  code:R`bpm = 70; // @每分鐘心跳 30~180 1
amp = 25; // @放大幅度 0~60 1
p = (time * bpm / 60) % 1;
b1 = Math.exp(-Math.pow((p - 0.1) / 0.04, 2));
b2 = Math.exp(-Math.pow((p - 0.3) / 0.05, 2)) * 0.6;
s = 100 + amp * (b1 + b2);
[s, s]`,
  layer:{ shape:'circle', size:300, color:C.coral } },
{ id:'layer-elastic-follow',
  make:['新增一個形狀圖層或空物件，命名為「目標」，對它的位置設幾個關鍵影格','新增形狀圖層：用橢圓工具畫一個小圓點','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 k（拉力，越大追得越緊）與 damp（阻尼，越小越快停下）'],
  cat:'layers',
  name:'彈性跟隨目標',
  sig:'逐格累加：速度 = (速度 + 拉力) × 阻尼',
  prop:'position',
  desc:'圖層像被彈簧拉著追向「目標」：目標移動時會落後、追上時衝過頭再回彈。表達式從第 0 格開始逐格模擬彈簧，所以結果穩定、可以重複。',
  how:['建立一個名為「目標」的圖層，並對它的位置做關鍵影格'],
  code:R`k = 0.12; // @彈簧拉力 0.01~0.5 0.01
damp = 0.8; // @阻尼 0.3~0.98 0.01
target = thisComp.layer("目標").transform.position;
fd = thisComp.frameDuration;
n = Math.round(time / fd);
p = target.valueAtTime(0);
v = [0, 0];
for (i = 1; i <= n; i++) {
  v = (v + (target.valueAtTime(i * fd) - p) * k) * damp;
  p = p + v;
}
p`,
  layer:{ shape:'circle', size:90, color:C.green },
  before:[{ name:'目標', shape:'null', size:70, color:C.coral, keys:{ position:[[0,[400,300],'hold'],[1,[1500,300],'hold'],[2,[1500,800],'hold'],[3,[400,800],'hold'],[4,[960,540],'hold']] } }] },
{ id:'layer-mirror',
  make:['新增一個形狀圖層當來源，對它的位置做動畫','新增另一個形狀圖層放在來源的下一層','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 axis（鏡子所在的 X 座標）'],
  cat:'layers',
  name:'鏡像移動',
  sig:'[2 × 中心 - x, y]',
  prop:'position',
  desc:'讀取上一層的位置，以畫面中線為鏡子做左右翻轉：上一層往右，這一層就往左。',
  how:['上一層（index - 1）是被鏡像的來源'],
  code:R`axis = 960; // @鏡子 X 座標 0~1920 10
src = thisComp.layer(index - 1).transform.position;
[2 * axis - src[0], src[1]]`,
  layer:{ shape:'circle', size:110, color:C.violet },
  before:[{ name:'來源', shape:'circle', size:110, color:C.amber, expr:{ position:'[960 + Math.sin(time * 1.4) * 420 + 200, 540 + Math.sin(time * 2.1) * 250]' } }],
  after:[{ name:'中線', shape:'rect', size:[6,700], color:C.grey }] },
{ id:'layer-parallax',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','複製 5 個圖層並上下排開','調整 dist（最下層的移動距離）與 speed（擺動速度）'],
  cat:'layers',
  name:'依 index 做視差',
  sig:'位移 × index / 總層數',
  prop:'position',
  desc:'每一層移動的距離依 index 遞增：上層動得少、下層動得多，製造前後景深的視差感。',
  how:[],
  code:R`dist = 500; // @最大位移 0~800 10
speed = 0.8; // @擺動速度 0~3 0.1
value + [Math.sin(time * speed) * dist * index / thisComp.numLayers, 0]`,
  layer:{ shape:'rect', size:[140,90] },
  dup:{ n:5, layout:'col', colors:[C.grey,C.blue,C.green,C.amber,C.coral] } },
{ id:'color-random',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','展開 內容 › 矩形 1 › 填色 1 › 顏色','按住 Alt（Mac：Option）點擊「顏色」的碼錶，貼上表達式','複製多個圖層，每個都會自動換成不同顏色','調整 seed 重新洗牌，sat、light 控制飽和度與亮度'],
  cat:'color',
  name:'每層隨機顏色',
  sig:'seedRandom(index, true); hslToRgb([random(), …])',
  prop:'color',
  desc:'每個圖層用自己的 index 當種子取一個隨機色相，複製圖層就會各自得到不同但固定的顏色。',
  how:[],
  code:R`seed = 1; // @亂數種子 1~50 1
sat = 0.7; // @飽和度 0~1 0.05
light = 0.58; // @亮度 0~1 0.05
seedRandom(index + seed * 100, true);
hslToRgb([random(), sat, light, 1])`,
  layer:{ shape:'rect', size:[150,520] },
  dup:{ n:8, layout:'row' } },
{ id:'glitch-jump',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 chance（故障機率）與 amp（大跳距離）'],
  cat:'glitch',
  name:'數位故障跳動',
  sig:'random() < 機率 ? 大跳 : 原位',
  prop:'position',
  desc:'大部分時間待在原位，偶爾小抖、偶爾大幅跳開，做出數位訊號故障的感覺。',
  how:[],
  code:R`rate = 12; // @每秒判斷次數 1~30 1
chance = 0.15; // @故障機率 0~1 0.01
amp = 160; // @大跳距離 0~500 5
posterizeTime(rate);
r = random();
if (r < chance) value + random([-amp, -amp / 4], [amp, amp / 4]);
else if (r < chance * 2) value + random([-8, -8], [8, 8]);
else value`,
  layer:{ shape:'rect', size:[420,140], color:C.blue } },
{ id:'glitch-stutter',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','對「位置」設好一段移動的關鍵影格','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 fps（每秒更新幾次）與 jitter（卡頓時的偏移量）'],
  cat:'glitch',
  name:'畫面卡頓',
  sig:'posterizeTime(fps) + 隨機偏移',
  prop:'position',
  desc:'讓原本流暢的移動變成一格一格卡住，同時隨機偏移一點，像影片串流不順。',
  how:['位置原本要有動畫（這裡是左右來回的關鍵影格）'],
  trail:true,
  code:R`fps = 6; // @每秒更新 1~30 1
jitter = 20; // @偏移量 0~80 1
posterizeTime(fps);
value + random([-jitter, -jitter], [jitter, jitter])`,
  layer:{ shape:'rect', size:160, color:C.amber, keys:{ position:[[0,[300,540]],[3,[1620,540]],[6,[300,540]]] } } },
{ id:'glitch-signal',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 drop（斷訊機率）與 fps（每秒變化次數）'],
  cat:'glitch',
  name:'訊號斷訊',
  sig:'random() < 斷訊率 ? 0 : 亮度',
  prop:'opacity',
  desc:'每一格隨機決定要不要「斷訊」，斷訊時完全消失，其餘時間也會微微忽明忽暗。',
  how:[],
  code:R`fps = 24; // @每秒變化 1~30 1
drop = 0.12; // @斷訊機率 0~1 0.01
posterizeTime(fps);
random() < drop ? 0 : random(75, 100)`,
  layer:{ shape:'rect', size:[600,340], color:C.green } },
{ id:'glitch-strobe',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 rate（每秒閃幾次）'],
  cat:'glitch',
  name:'頻閃',
  sig:'Math.floor(time × 速率 × 2) % 2',
  prop:'opacity',
  desc:'以固定節奏完全亮、完全暗交替，常用在舞台燈光、節奏感強的剪輯。',
  how:[],
  code:R`rate = 6; // @每秒閃幾次 1~20 0.5
Math.floor(time * rate * 2) % 2 == 0 ? 100 : 0`,
  layer:{ shape:'star', size:360, color:C.white } },
{ id:'glitch-flash',
  make:['新增純色圖層（圖層 › 新增 › 純色），顏色設為白色並放在最上層','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 period（每隔幾秒閃一次）與 decay（變暗速度）'],
  cat:'glitch',
  name:'閃光衰減',
  sig:'100 × e^(-衰減·t)',
  prop:'opacity',
  desc:'瞬間全亮後依指數快速變暗，像相機閃光或閃電。蓋在畫面最上層的白色圖層上使用。',
  how:['用一個蓋滿畫面的白色圖層，混合模式可改成「相加」'],
  code:R`period = 1.5; // @間隔秒數 0.3~5 0.1
decay = 6; // @變暗速度 1~20 0.5
t = (time - inPoint) % period;
100 * Math.exp(-decay * t)`,
  layer:{ shape:'rect', size:[1920,1080], color:C.white } },
{ id:'glitch-light',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 T 展開「不透明度」','按住 Alt（Mac：Option）點擊「不透明度」的碼錶，貼上表達式','調整 base（平常亮度）與 dip（驟暗機率）'],
  cat:'glitch',
  name:'燈光閃爍（真實感）',
  sig:'noise 微弱變化 + 偶爾驟暗',
  prop:'opacity',
  desc:'平常用 noise 做出微弱、不規則的亮度起伏，偶爾再驟暗一下，比單純的 random 更像接觸不良的燈管。',
  how:[],
  code:R`base = 85; // @平常亮度 30~100 1
dip = 0.06; // @驟暗機率 0~0.5 0.01
o = base + noise(time * 3) * 15;
seedRandom(Math.floor(time * 12), true);
random() < dip ? 15 : o`,
  layer:{ shape:'circle', size:320, color:C.amber } },
{ id:'glitch-heat',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 speed（扭動速度）與 amp（扭動幅度）'],
  cat:'glitch',
  name:'熱浪扭動',
  sig:'value + noise(time × 速度) × 幅度',
  prop:'position',
  desc:'用快速變化的 noise 讓圖層小幅度、不規則地晃動，像隔著熱空氣看東西的扭曲感。',
  how:['幅度要小，太大就會變成一般的晃動'],
  code:R`speed = 8; // @扭動速度 1~20 0.5
amp = 8; // @扭動幅度 0~30 0.5
value + [noise(time * speed) * amp, noise(time * speed + 50) * amp * 0.5]`,
  layer:{ shape:'text', fontSize:220, color:C.amber, text:'HEAT' } },
{ id:'glitch-electric',
  make:['新增形狀圖層：用矩形或橢圓工具在合成中畫一個圖形','選取圖層，按 P 展開「位置」','按住 Alt（Mac：Option）點擊「位置」的碼錶，貼上表達式','調整 small（細微抖動）、big（電擊跳動）與 chance（電擊機率）'],
  cat:'glitch',
  name:'電擊抖動',
  sig:'高頻小抖 + 偶發大跳',
  prop:'position',
  desc:'持續高頻的細微抖動，偶爾突然出現一次大幅度的電擊跳動。',
  how:[],
  code:R`small = 6; // @細微抖動 0~30 1
big = 90; // @電擊幅度 0~300 5
chance = 0.08; // @電擊機率 0~0.5 0.01
posterizeTime(24);
v = value + random([-small, -small], [small, small]);
seedRandom(Math.floor(time * 8), true);
random() < chance ? value + random([-big, -big], [big, big]) : v`,
  layer:{ shape:'star', size:260, color:C.blue } },
{ id:'glitch-rgb',
  make:['新增文字圖層：用文字工具在合成中點一下，輸入任意文字','按 Ctrl/Cmd + D 複製成 3 層，填色分別改成紅、綠、藍','三層的混合模式都改成「相加」','三層都選取，按 P 展開「位置」','在每一層的「位置」按住 Alt（Mac：Option）點擊碼錶，貼上表達式','調整 amt（最大偏移量）與 speed（變化速度）'],
  cat:'glitch',
  name:'RGB 分離',
  sig:'(index - 2) × 偏移量',
  prop:'position',
  desc:'同一段文字複製三份，分別設成紅、綠、藍並用「相加」混合，重疊時是白色；再讓三層朝不同方向偏移，就會出現色差故障效果。',
  how:['三個圖層用 index 決定往左、不動、往右','混合模式設成「相加」，重疊處才會變白'],
  code:R`amt = 18; // @最大偏移 0~60 1
speed = 6; // @變化速度 0~20 0.5
j = Math.abs(noise(time * speed)) * amt;
value + [(index - 2) * j, 0]`,
  layer:{ shape:'text', fontSize:240, text:'GLITCH', blend:'add' },
  dup:{ n:3, layout:'same', names:['紅','綠','藍'], colors:[[1,0,0],[0,1,0],[0,0.4,1]] } },

// ---------------- 實驗室 ----------------
{ id:'lab', cat:'lab', name:'空白實驗室', sig:'選擇屬性 → 自由撰寫', prop:'position', lab:true,
  desc:'在這裡切換要套用的屬性，從頭寫任何表達式。所有內建函式都可以使用，結果會即時預覽。',
  how:['上方選擇屬性','在數字變數後面加上 // @標籤 最小~最大 間距 即可產生滑桿'], trail:true,
  code:R`amp = 200; // @幅度 0~500 1
[value[0] + Math.sin(time * 2) * amp, value[1]]`,
  layer:{ shape:'rect' } }
];

const LAB_STARTERS = {
  position:R`amp = 200; // @幅度 0~500 1
[value[0] + Math.sin(time * 2) * amp, value[1]]`,
  scale:R`s = 100 + Math.sin(time * 4) * 30;
[s, s]`,
  rotation:R`speed = 60; // @速度 -360~360 1
time * speed`,
  opacity:R`50 + Math.sin(time * 3) * 50`,
  color:R`hslToRgb([time * 0.15 % 1, 0.8, 0.55, 1])`,
  sourceText:R`"Hello AE  " + time.toFixed(2)`,
  path:R`r = 200 + Math.sin(time * 2) * 60;
createPath([[-r, 0], [0, -r], [r, 0], [0, r]], [], [], true)`
};

// ---------- 場景建立 ----------
function layoutPos(dup,i){
  const n=dup.n, W=1920, H=1080;
  switch(dup.layout){
    case 'row': { const x0=dup.x0||200, x1=dup.x1||1720; return [n<2?960:x0+(x1-x0)*i/(n-1), dup.y||540]; }
    case 'col': { const y0=dup.y0||240, y1=dup.y1||840; return [dup.x||960, n<2?540:y0+(y1-y0)*i/(n-1)]; }
    case 'grid': { const c=dup.cols, r=dup.rows, cx=i%c, cy=Math.floor(i/c); const x0=260,x1=1660,y0=200,y1=880;
      return [x0+(x1-x0)*cx/Math.max(1,c-1), y0+(y1-y0)*cy/Math.max(1,r-1)]; }
    default: return null;
  }
}
function buildScene(ex, code, propOverride){
  const prop = propOverride || ex.prop;
  const specs=[];
  (ex.before||[]).forEach(s=>specs.push(Object.assign({},s)));
  let main = Object.assign({}, ex.layer||{});
  if(ex.lab){
    main = { shape: prop==='sourceText'?'text' : prop==='path'?'path' : 'rect', color:[0.24,0.61,0.94] };
  }
  const isText = main.shape==='text' || main.shape==='animtext';
  const baseName = isText ? '文字圖層' : (main.shape==='path'?'形狀圖層':'形狀圖層');
  const dup = ex.dup || { n:1 };
  for(let i=0;i<dup.n;i++){
    const s = JSON.parse(JSON.stringify(main));
    s.name = dup.names ? dup.names[i] : (baseName+' '+(i+1));
    if(dup.colors) s.color = dup.colors[i];
    s.user = true;
    s.expr = Object.assign({}, s.expr||{}); s.expr[prop] = code;
    const p = layoutPos(dup,i);
    if(p){ s.base = Object.assign({}, s.base||{}); if(!(s.keys&&s.keys.position)) s.base.position = p; }
    if(ex.labels) s.label = s.name;
    if(s.effects && i>0) s.effects = main.effects; // 共用同一組控制
    specs.push(s);
  }
  if(main.effects){ for(const sp of specs) if(sp.user) sp.effects = main.effects; }
  (ex.after||[]).forEach(s=>specs.push(Object.assign({},s)));
  return specs;
}

return { CATS, EX, LAB_STARTERS, buildScene };
})();
if(typeof module!=='undefined') module.exports=LIB;
