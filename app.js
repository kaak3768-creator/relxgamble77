const $=s=>document.querySelector(s);
const KEY='relx_gamble_v2';
const ADMIN_PASS='zayy123',PAY_TO='DimsGuyy1',DEP_MIN=5000000,DEP_MAX=100000000;
const games=[
 {id:'crash',image:'assets/games/crash.jpg',name:'Crash',desc:'Tarik hasil sebelum pesawat jatuh.',tag:'MULTIPLIER',glow:'#267bff'},
 {id:'coinflip',image:'assets/games/coinflip.jpg',name:'Coinflip',desc:'Tebak sisi koin yang muncul.',tag:'3 MODE',glow:'#1ad69a'},
 {id:'blackjack',image:'assets/games/blackjack.jpg',name:'Blackjack',desc:'Dekati angka 21 tanpa melewatinya.',tag:'CARD GAME',glow:'#3479ef'},
 {id:'mines',image:'assets/games/mines.jpg',name:'Mines',desc:'Buka kotak aman, hindari ranjau.',tag:'3 MODE',glow:'#21c88d'},
 {id:'dice',image:'assets/games/dice.jpg',name:'Dice',desc:'Prediksi angka dadu dan peluangnya.',tag:'PREDICTION',glow:'#397ff2'},
 {id:'plinko',image:'assets/games/plinko.jpg',name:'Plinko',desc:'Jatuhkan bola dan lihat ke mana ia pergi.',tag:'3 MODE',glow:'#20c69a'},
 {id:'case',image:'assets/games/case.jpg',name:'Case',desc:'Buka peti dan temukan hadiah.',tag:'CASE OPENING',glow:'#397ff2'}
];
/* ===== Pengaturan mode (Mudah / Sedang / Sulit) ===== */
const COIN={mudah:{mult:1.75,chance:.48},sedang:{mult:2.1,chance:.40},sulit:{mult:3,chance:.28}};
const MINES={mudah:{mines:3,cap:4},sedang:{mines:5,cap:8},sulit:{mines:8,cap:15}};const MINES_RTP=.85;
const PLINKO={mudah:[2.5,1.3,1.1,.85,.5,.85,1.1,1.3,2.5],sedang:[5,2.4,1.3,.6,.4,.6,1.3,2.4,5],sulit:[9,3.5,1.3,.5,.2,.5,1.3,3.5,9]};
const CASE_TABLE=[[0,32],[.5,24],[1,17],[1.5,13],[2,8],[3,5],[5,1]];

/* ===== State ===== */
function loadState(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')return{users:s.users||{},requests:Array.isArray(s.requests)?s.requests:[],current:s.current||null,plays:s.plays||0}}catch(_){}return{users:{},requests:[],current:null,plays:0}}
let state=loadState();
let gameToken=0,toastTimer=null,winTimer=null;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}updateHeader()}
function current(){return state.current&&state.users[state.current]?state.users[state.current]:null}
function fmt(n){return Math.floor(Number(n)||0).toLocaleString('id-ID')}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function parseAmount(v){v=String(v==null?'':v).trim().toLowerCase().replace(/\s+/g,'');if(!v)return NaN;if(/^\d{1,3}([.,]\d{3})+$/.test(v))return Number(v.replace(/[.,]/g,''));const m=v.match(/^(\d+(?:[.,]\d+)?)(k|m|jt|b)?$/);if(!m)return NaN;const n=Number(m[1].replace(',','.'));const mul={k:1e3,m:1e6,jt:1e6,b:1e9}[m[2]]||1;return Math.floor(n*mul)}
function hashPw(name,pw){const s='relx|'+name.toLowerCase()+'|'+pw;let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
function updateHeader(){const u=current(),b=u?u.balance:0;$('#headerBalance').textContent=fmt(b);$('#heroBalance').textContent=fmt(b);$('#loginBtn').textContent=u?u.name:'Masuk';$('#profileBtn').textContent=u?u.name[0].toUpperCase():'?';const gb=$('#gameBalance');if(gb)gb.textContent=fmt(b)+' ◆'}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600)}
function showWin(n){const el=$('#winPop');el.textContent='Kamu menang +'+fmt(n)+' Koin';el.classList.add('show');clearTimeout(winTimer);winTimer=setTimeout(()=>el.classList.remove('show'),2600)}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$('#'+id).classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function requireUser(){if(!current()){toast('Masuk dulu untuk lanjut.');openLogin();return false}return true}

/* ===== Login (username + password) ===== */
function openLogin(){$('#usernameInput').value='';$('#passwordInput').value='';$('#modal').classList.add('show');setTimeout(()=>$('#usernameInput').focus(),50)}
$('#loginForm').onsubmit=e=>{e.preventDefault();const name=$('#usernameInput').value.trim(),pw=$('#passwordInput').value;
 if(!/^[A-Za-z0-9_]{3,16}$/.test(name)){toast('Username 3–16 karakter: huruf, angka, underscore.');return}
 if(pw.length<4){toast('Password minimal 4 karakter.');return}
 const key=name.toLowerCase();let u=state.users[key];
 if(!u){state.users[key]={name,pass:hashPw(name,pw),balance:0,sessions:0};state.current=key;save();toast('Akun dibuat. Selamat datang, '+name+'!')}
 else if(u.pass!==hashPw(u.name,pw)){toast('Password salah.');return}
 else{state.current=key;save();toast('Selamat datang kembali, '+u.name+'!')}
 $('#modal').classList.remove('show');renderLeaderboard()};
$('#loginBtn').onclick=()=>{const u=current();if(u){if(confirm('Keluar dari akun '+u.name+'?')){state.current=null;save();showPage('lobby');toast('Kamu sudah keluar.')}}else openLogin()};
$('#profileBtn').onclick=()=>{const u=current();u?toast('Pemain: '+u.name+' · Saldo: '+fmt(u.balance)+' Koin'):openLogin()};
$('#modalClose').onclick=()=>$('#modal').classList.remove('show');

/* ===== Deposit & Withdraw ===== */
function closeTx(){$('#txModal').classList.remove('show');$('#txBox').innerHTML=''}
function txDone(eyebrow,title,msg){$('#txBox').innerHTML=`<button class="modal-x" id="txX">×</button><div class="eyebrow">${eyebrow}</div><h2>${title}</h2><div class="tx-done">${msg}</div><button class="btn btn-primary full" id="txOk">Tutup</button>`;$('#txX').onclick=closeTx;$('#txOk').onclick=closeTx}
function newReq(type,user,amount){const u=current();state.requests.push({id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,user,account:state.current,amount,status:'pending',time:Date.now()});save()}
function openDeposit(){if(!requireUser())return;const u=current();
 $('#txBox').innerHTML=`<button class="modal-x" id="txX">×</button><div class="eyebrow">DEPOSIT</div><h2>Deposit Koin</h2>
 <label>USERNAME</label><input id="txUser" maxlength="16" autocomplete="off" value="${escapeHtml(u.name)}">
 <label>JUMLAH DEPOSIT</label><input id="txAmount" inputmode="numeric" autocomplete="off" placeholder="Contoh: 5.000.000 atau 5M"><small class="tx-hint">Min ${fmt(DEP_MIN)} (5M) · Maks ${fmt(DEP_MAX)} (100M)</small>
 <div class="tx-info">Pay duit ke pemain bernama : <b>${PAY_TO}</b> di server relx dengan nominal deposit anda <b id="txAmt"></b> setelah itu tag pemain tsb dan bilang : <b>depo bg</b></div>
 <div class="tx-actions"><button class="btn btn-primary" id="txPaid">Sudah Bayar</button><button class="btn btn-ghost" id="txCancel">Batalkan</button></div>`;
 $('#txModal').classList.add('show');
 $('#txX').onclick=closeTx;$('#txCancel').onclick=closeTx;
 $('#txAmount').oninput=()=>{const n=parseAmount($('#txAmount').value);$('#txAmt').textContent=n>0?'('+fmt(n)+' Koin)':''};
 $('#txPaid').onclick=()=>{const name=$('#txUser').value.trim(),amt=parseAmount($('#txAmount').value);
  if(!/^[A-Za-z0-9_]{3,16}$/.test(name)){toast('Username tidak valid (3–16 karakter: huruf, angka, underscore).');return}
  if(!Number.isFinite(amt)||amt<DEP_MIN||amt>DEP_MAX){toast('Jumlah deposit harus antara '+fmt(DEP_MIN)+' dan '+fmt(DEP_MAX)+'.');return}
  newReq('deposit',name,amt);txDone('DEPOSIT','Deposit Diajukan','Deposit sedang diajukan tunggu respon Admin Paling lambat 5 Menit')}}
function openWithdraw(){if(!requireUser())return;const u=current();
 $('#txBox').innerHTML=`<button class="modal-x" id="txX">×</button><div class="eyebrow">WITHDRAW</div><h2>Withdraw Koin</h2>
 <label>USERNAME MINECRAFT</label><input id="txUser" maxlength="16" autocomplete="off" value="${escapeHtml(u.name)}">
 <label>JUMLAH WITHDRAW</label><input id="txAmount" inputmode="numeric" autocomplete="off" placeholder="Contoh: 5.000.000 atau 5M"><small class="tx-hint">Saldo kamu: ${fmt(u.balance)} Koin</small>
 <div class="tx-info">Ajukan withdraw dan admin konfirmasi paling lambat 5 menit setelah itu duit di pay ke username minecraft anda di Relx</div>
 <div class="tx-actions"><button class="btn btn-primary" id="txSubmit">Ajukan WD</button><button class="btn btn-ghost" id="txCancel">Batalkan</button></div>`;
 $('#txModal').classList.add('show');
 $('#txX').onclick=closeTx;$('#txCancel').onclick=closeTx;
 $('#txSubmit').onclick=()=>{const acc=current();if(!acc){closeTx();return}const name=$('#txUser').value.trim(),amt=parseAmount($('#txAmount').value);
  if(!/^[A-Za-z0-9_]{3,16}$/.test(name)){toast('Username tidak valid (3–16 karakter: huruf, angka, underscore).');return}
  if(!Number.isFinite(amt)||amt<1){toast('Masukkan jumlah withdraw yang valid.');return}
  if(amt>acc.balance){toast('Saldo tidak cukup.');return}
  acc.balance-=amt;newReq('withdraw',name,amt);
  txDone('WITHDRAW','Withdraw Diajukan','Pengajuan withdraw terkirim. Admin konfirmasi paling lambat 5 menit, setelah itu duit di pay ke username minecraft anda di Relx.')}}
$('#depositBtn').onclick=openDeposit;$('#withdrawBtn').onclick=openWithdraw;

/* ===== Admin ===== */
function openAdminLogin(){const p=prompt('Masukkan password admin:');if(p===null)return;if(p!==ADMIN_PASS){toast('Password admin salah');return}renderAdmin();showPage('adminPage')}
function statusBadge(s){return s==='pending'?'<span class="st st-pending">● PENDING</span>':s==='approved'?'<span class="st st-ok">✔ DITERIMA</span>':'<span class="st st-no">✖ DITOLAK</span>'}
function renderAdmin(){const users=Object.values(state.users);
 const reqs=[...state.requests].sort((a,b)=>((a.status==='pending')?0:1)-((b.status==='pending')?0:1)||b.time-a.time);
 $('#totalUsers').textContent=users.length;$('#totalCoins').textContent=fmt(users.reduce((s,u)=>s+u.balance,0));$('#totalPlays').textContent=state.plays;$('#totalPending').textContent=state.requests.filter(r=>r.status==='pending').length;
 $('#reqRows').innerHTML=reqs.length?reqs.map(r=>{const accName=state.users[r.account]?state.users[r.account].name:r.account;const diff=String(r.user).toLowerCase()!==String(r.account);
  return `<tr><td>${new Date(r.time).toLocaleString('id-ID')}</td><td><span class="tag ${r.type}">${r.type==='deposit'?'DEPOSIT':'WITHDRAW'}</span></td><td><b>${escapeHtml(r.user)}</b>${diff?`<br><small class="muted">akun: ${escapeHtml(accName)}</small>`:''}</td><td style="color:#57e6ac">◆ ${fmt(r.amount)}</td><td>${statusBadge(r.status)}</td><td>${r.status==='pending'?`<button class="btn btn-ok" data-act="acc" data-id="${r.id}">ACC</button> <button class="btn btn-no" data-act="rej" data-id="${r.id}">Tolak</button>`:'—'}</td></tr>`}).join(''):'<tr><td colspan="6">Belum ada pengajuan.</td></tr>';
 $('#userRows').innerHTML=users.length?users.map(u=>`<tr><td><b>${escapeHtml(u.name)}</b></td><td style="color:#57e6ac">◆ ${fmt(u.balance)}</td><td>${u.sessions}</td><td><span style="color:#57e6ac">● ACTIVE</span></td></tr>`).join(''):'<tr><td colspan="4">Belum ada pemain.</td></tr>'}
function decide(id,act){const r=state.requests.find(x=>x.id===id);if(!r||r.status!=='pending')return;const acc=state.users[r.account];
 if(act==='acc'){if(r.type==='deposit'){if(!acc){toast('Akun pemain tidak ditemukan.');return}acc.balance+=r.amount}r.status='approved'}
 else{if(r.type==='withdraw'&&acc)acc.balance+=r.amount;r.status='rejected'}
 r.decidedAt=Date.now();save();renderAdmin();renderLeaderboard();toast((r.type==='deposit'?'Deposit ':'Withdraw ')+(act==='acc'?'di-ACC.':'ditolak.'))}
$('#reqRows').onclick=e=>{const b=e.target.closest('button[data-act]');if(b)decide(b.dataset.id,b.dataset.act)};
$('#adminBtn').onclick=openAdminLogin;$('#adminBack').onclick=()=>showPage('lobby');$('#refreshAdmin').onclick=renderAdmin;

/* ===== Lobby ===== */
function renderGrid(){$('#gameGrid').innerHTML=games.map(g=>`<article class="game-card" data-game="${g.id}" style="--glow:${g.glow}"><div class="game-card-top"><span class="game-icon">${g.tag}</span><span class="play-arrow">↗</span></div><div class="game-art"><img src="${g.image}" alt="${g.name}" loading="lazy"></div><h3>${g.name}</h3><p>${g.desc}</p></article>`).join('');document.querySelectorAll('[data-game]').forEach(el=>el.onclick=()=>openGame(el.dataset.game))}
function renderLeaderboard(){const arr=Object.values(state.users).sort((a,b)=>b.balance-a.balance).slice(0,5);$('#leaderboardList').innerHTML=arr.length?arr.map((u,i)=>`<div class="leader-row"><span>${['🥇','🥈','🥉','④','⑤'][i]} &nbsp; ${escapeHtml(u.name)}</span><span>◆ ${fmt(u.balance)}</span></div>`).join(''):'<div class="leader-row"><span>Belum ada pemain</span><span>—</span></div>'}

/* ===== Helper game ===== */
function gameShell(g,visual,controls){return `<div class="game-header"><div class="eyebrow">RELX GAMBLE / ${g.tag}</div><h1>${g.name}</h1><p>${g.desc}</p></div><div class="game-board"><div class="game-visual" id="gameVisual">${visual}</div><div class="game-controls">${controls}</div><div class="result" id="result">Siap bermain? Tentukan taruhan lalu mulai.</div><div class="game-extra"><span>Saldo: <b id="gameBalance">${fmt(current()?current().balance:0)} ◆</b></span><span>KOIN SERVER RELX</span></div></div>`}
function betField(){return `<div class="field"><label>TARUHAN (KOIN)</label><input id="bet" type="text" inputmode="numeric" autocomplete="off" value="1.000.000"></div>`}
function modeBar(){return `<div class="mode-wrap"><div class="mode-tabs" id="modeTabs">${['mudah','sedang','sulit'].map((m,i)=>`<button type="button" class="mode-btn${i===0?' active':''}" data-mode="${m}">${m[0].toUpperCase()+m.slice(1)}</button>`).join('')}</div><div class="mode-info" id="modeInfo"></div></div>`}
function bindModes(onChange){let cur='mudah';const tabs=document.querySelectorAll('#modeTabs .mode-btn');const apply=m=>{cur=m;tabs.forEach(t=>t.classList.toggle('active',t.dataset.mode===m));onChange(m)};tabs.forEach(t=>t.onclick=()=>{if(!t.disabled)apply(t.dataset.mode)});apply(cur);return{get:()=>cur,lock:v=>tabs.forEach(t=>t.disabled=v)}}
function setResult(msg,type='',detail=''){const e=$('#result');if(!e)return;e.className='result '+type;e.innerHTML=escapeHtml(msg)+(detail?'<small>'+escapeHtml(detail)+'</small>':'')}
function takeBet(){const u=current();if(!u)return 0;const b=parseAmount($('#bet').value);if(!Number.isFinite(b)||b<1){setResult('Masukkan jumlah taruhan yang valid.','bad');return 0}if(u.balance<b){setResult('Saldo tidak cukup. Silakan Deposit dulu.','bad');return 0}u.balance-=b;u.sessions++;state.plays++;save();return b}
function settle(tok,bet,payout,detail=''){payout=Math.floor(payout);const u=current();if(u&&payout>0)u.balance+=payout;save();const profit=payout-bet;
 if(tok===gameToken){if(profit>0){setResult('Kamu menang +'+fmt(profit)+' Koin','good',detail);showWin(profit)}else if(profit===0)setResult('Balik modal. Taruhan dikembalikan.','',detail);else setResult('Kamu kalah -'+fmt(-profit)+' Koin','bad',detail)}
 renderLeaderboard();return profit}
function pickWeighted(t){let r=Math.random()*t.reduce((s,x)=>s+x[1],0);for(const x of t){r-=x[1];if(r<0)return x[0]}return t[0][0]}

/* ===== Game ===== */
function openGame(id){if(!requireUser())return;const g=games.find(x=>x.id===id);if(!g)return;const tok=++gameToken;showPage('gamePage');
 ({crash:gameCrash,coinflip:gameCoinflip,blackjack:gameBlackjack,mines:gameMines,dice:gameDice,plinko:gamePlinko,case:gameCase})[id](g,tok)}

function gameCrash(g,tok){
 $('#gameMount').innerHTML=gameShell(g,`<div style="text-align:center"><div id="plane" class="big-emoji">✈️</div><div id="multiplier" style="font:700 36px var(--display);color:#63e7ad;margin-top:12px">1.00x</div><small style="color:#8298b2">FLIGHT MULTIPLIER</small></div>`,`${betField()}<button class="btn btn-primary" id="startCrash">Launch flight</button><button class="btn btn-ghost" id="cashCrash" disabled>Cash out</button>`);
 const RTP=.85,RATE=.11;let live=false,m=1,b=0,crashAt=1,iv=null,t0=0;
 const stop=()=>{clearInterval(iv);iv=null;live=false};
 const reset=()=>{$('#multiplier').textContent='1.00x'};
 $('#startCrash').onclick=()=>{if(live)return;b=takeBet();if(!b)return;reset();
  crashAt=Math.min(100,Math.max(1,Math.floor(100*RTP/(1-Math.random()))/100));m=1;
  if(crashAt<=1){settle(tok,b,0,'Pesawat jatuh di 1.00x');return}
  t0=Date.now();live=true;$('#startCrash').disabled=true;$('#cashCrash').disabled=false;setResult('Pesawat terbang... cash out sebelum jatuh!');
  iv=setInterval(()=>{if(tok!==gameToken){stop();return}
   m=Math.exp(RATE*(Date.now()-t0)/1000);
   if(m>=crashAt){m=crashAt;$('#multiplier').textContent=m.toFixed(2)+'x';stop();$('#startCrash').disabled=false;$('#cashCrash').disabled=true;settle(tok,b,0,'Pesawat jatuh di '+crashAt.toFixed(2)+'x');return}
   $('#multiplier').textContent=m.toFixed(2)+'x'},100)};
 $('#cashCrash').onclick=()=>{if(!live)return;const at=m;stop();$('#startCrash').disabled=false;$('#cashCrash').disabled=true;settle(tok,b,b*at,'Cash out di '+at.toFixed(2)+'x')};
}

function gameCoinflip(g,tok){
 $('#gameMount').innerHTML=gameShell(g,`<div id="coinVisual" class="big-emoji">🪙</div><div class="visual-note">PILIH SISI KOIN</div>`,`${modeBar()}${betField()}<div class="field"><label>PILIHAN</label><select id="side"><option value="heads">Heads</option><option value="tails">Tails</option></select></div><button class="btn btn-primary" id="flip">Flip coin</button>`);
 const mm=bindModes(m=>{const c=COIN[m];$('#modeInfo').textContent='Menang x'+c.mult+' · peluang menang '+Math.round(c.chance*100)+'%'});
 let busy=false;
 $('#flip').onclick=()=>{if(busy)return;const b=takeBet();if(!b)return;busy=true;mm.lock(true);$('#flip').disabled=true;
  const c=COIN[mm.get()],chosen=$('#side').value,win=Math.random()<c.chance,actual=win?chosen:(chosen==='heads'?'tails':'heads');
  $('#coinVisual').animate([{transform:'rotateY(0)'},{transform:'rotateY(900deg) scale(1.2)'},{transform:'rotateY(1800deg)'}],{duration:700});
  setTimeout(()=>{busy=false;if(tok===gameToken){mm.lock(false);$('#flip').disabled=false}settle(tok,b,win?b*c.mult:0,'Koin menunjukkan '+actual.toUpperCase())},720)}
}

function gameBlackjack(g,tok){
 $('#gameMount').innerHTML=gameShell(g,`<div style="width:100%;text-align:center"><small style="color:#86a1bc">DEALER <b id="bjDealerScore"></b></small><div id="dealerCards" class="visual-cards" style="margin:10px 0"></div><div style="height:12px"></div><small style="color:#86a1bc">KAMU <b id="bjScore"></b></small><div id="playerCards" class="visual-cards" style="margin:10px 0"></div></div>`,`${betField()}<button class="btn btn-primary" id="bjStart">Deal new hand</button><button class="btn btn-ghost" id="bjHit" disabled>Hit</button><button class="btn btn-ghost" id="bjStand" disabled>Stand</button>`);
 const R=['A','2','3','4','5','6','7','8','9','10','J','Q','K'],S=['♠','♥','♦','♣'];
 const card=()=>({r:R[Math.floor(Math.random()*13)],s:S[Math.floor(Math.random()*4)]});
 const val=c=>c.r==='A'?11:(c.r==='10'||c.r==='J'||c.r==='Q'||c.r==='K')?10:Number(c.r);
 const total=h=>{let t=h.reduce((s,c)=>s+val(c),0),a=h.filter(c=>c.r==='A').length;while(t>21&&a>0){t-=10;a--}return t};
 const cardHtml=(h,hide)=>h.map((c,i)=>hide&&i===1?'<div class="playing-card sm">?</div>':`<div class="playing-card sm${(c.s==='♥'||c.s==='♦')?' red':''}">${c.r}${c.s}</div>`).join('');
 let active=false,b=0,player=[],dealer=[];
 const paint=hide=>{$('#dealerCards').innerHTML=cardHtml(dealer,hide);$('#playerCards').innerHTML=cardHtml(player,false);$('#bjScore').textContent=player.length?total(player):'';$('#bjDealerScore').textContent=dealer.length?(hide?val(dealer[0]):total(dealer)):''};
 const buttons=on=>{$('#bjHit').disabled=!on;$('#bjStand').disabled=!on;$('#bjStart').disabled=on};
 const end=(payout,detail)=>{active=false;buttons(false);paint(false);settle(tok,b,payout,detail)};
 const dealerPlay=()=>{while(total(dealer)<17)dealer.push(card());const p=total(player),d=total(dealer);
  if(d>21)end(b*2,'Dealer bust ('+d+')');else if(p>d)end(b*2,'Kamu '+p+' vs Dealer '+d);else if(p===d)end(0,'Seri '+p+' = dealer menang');else end(0,'Kamu '+p+' vs Dealer '+d)};
 $('#bjStart').onclick=()=>{if(active)return;b=takeBet();if(!b)return;player=[card(),card()];dealer=[card(),card()];active=true;buttons(true);paint(true);
  if(total(player)===21){if(total(dealer)===21)end(b,'Blackjack seri');else end(b*2.2,'Blackjack! (bayar 6:5)');return}
  setResult('Giliranmu. Hit untuk kartu, Stand untuk berhenti.')};
 $('#bjHit').onclick=()=>{if(!active)return;player.push(card());paint(true);const t=total(player);if(t>21)end(0,'Bust! Total kamu '+t);else if(t===21)dealerPlay()};
 $('#bjStand').onclick=()=>{if(active)dealerPlay()};
}

function gameMines(g,tok){
 $('#gameMount').innerHTML=gameShell(g,`<div style="text-align:center"><div class="mine-grid" id="mineGrid">${Array.from({length:25},(_,i)=>`<button class="mine-cell" data-cell="${i}" disabled>?</button>`).join('')}</div><p style="font-size:10px;color:#8498b2">Pilih kotak aman, hindari ranjau.</p></div>`,`${modeBar()}${betField()}<button class="btn btn-primary" id="mineStart">Mulai</button><button class="btn btn-ghost" id="mineCash" disabled>Ambil hadiah</button>`);
 const mm=bindModes(m=>{const c=MINES[m];$('#modeInfo').textContent=c.mines+' ranjau · hadiah maks x'+c.cap});
 let active=false,b=0,found=0,mines=[];
 const cells=()=>document.querySelectorAll('.mine-cell');
 const mult=k=>{const c=MINES[mm.get()];let p=1;for(let i=0;i<k;i++)p*=(25-i)/(25-c.mines-i);return Math.min(c.cap,Math.max(1,p*MINES_RTP))};
 const finish=()=>{active=false;mm.lock(false);$('#mineStart').disabled=false;$('#mineCash').disabled=true;cells().forEach(c=>c.disabled=true)};
 const cash=()=>{if(!active||!found)return;const mx=mult(found);for(const c of cells())if(mines.includes(Number(c.dataset.cell))){c.textContent='💣'}finish();settle(tok,b,b*mx,'Multiplier x'+mx.toFixed(2)+' · '+found+' kotak aman')};
 $('#mineStart').onclick=()=>{if(active)return;b=takeBet();if(!b)return;active=true;found=0;mines=[];const pool=Array.from({length:25},(_,i)=>i);for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}mines=pool.slice(0,MINES[mm.get()].mines);
  cells().forEach(x=>{x.textContent='?';x.className='mine-cell';x.disabled=false});mm.lock(true);$('#mineStart').disabled=true;$('#mineCash').disabled=true;setResult('Pilih kotak. Setiap kotak aman menaikkan hadiah.','','Multiplier saat ini x1.00')};
 cells().forEach(x=>x.onclick=()=>{if(!active||x.disabled)return;const n=Number(x.dataset.cell);x.disabled=true;
  if(mines.includes(n)){x.textContent='💣';x.classList.add('mine');cells().forEach(c=>{if(mines.includes(Number(c.dataset.cell)))c.textContent='💣'});finish();settle(tok,b,0,'Kamu menginjak ranjau');return}
  found++;x.textContent='◆';x.classList.add('revealed');$('#mineCash').disabled=false;
  const c=MINES[mm.get()],mx=mult(found);
  if(mx>=c.cap||found>=25-c.mines){cash();return}
  setResult('Aman! '+found+' kotak terbuka.','good','Multiplier saat ini x'+mx.toFixed(2)+' · ambil hadiah sekarang atau lanjut')});
 $('#mineCash').onclick=cash;
}

function gameDice(g,tok){
 $('#gameMount').innerHTML=gameShell(g,`<div class="dice-pair"><div class="die" id="dieA">⚀</div><div class="die" id="dieB">⚄</div></div><div class="visual-note">TOTAL DICE: <b id="diceTotal">6</b></div>`,`${betField()}<div class="field"><label>PREDIKSI TOTAL</label><select id="diceGuess"><option value="low">2–6 (LOW) x2</option><option value="mid">7 (LUCKY 7) x5</option><option value="high">8–12 (HIGH) x2</option></select></div><button class="btn btn-primary" id="rollDice">Roll dice</button>`);
 const F=['⚀','⚁','⚂','⚃','⚄','⚅'];let busy=false;
 $('#rollDice').onclick=()=>{if(busy)return;const b=takeBet();if(!b)return;busy=true;
  const a=1+Math.floor(Math.random()*6),c=1+Math.floor(Math.random()*6),t=a+c,gs=$('#diceGuess').value;
  $('#dieA').textContent=F[a-1];$('#dieB').textContent=F[c-1];$('#diceTotal').textContent=t;
  const ok=(gs==='low'&&t<=6)||(gs==='mid'&&t===7)||(gs==='high'&&t>=8),mult=gs==='mid'?5:2;
  busy=false;settle(tok,b,ok?b*mult:0,'Total dadu '+t)}
}

function gamePlinko(g,tok){
 const ROWS=8,DX=30,DY=26,CX=150;let pegs='';
 for(let i=0;i<ROWS;i++)for(let j=0;j<=i;j++)pegs+=`<i class="peg" style="left:${CX+(j-i/2)*DX-3}px;top:${22+i*DY-3}px"></i>`;
 $('#gameMount').innerHTML=gameShell(g,`<div class="pl-stage" id="plStage">${pegs}<div class="pl-ball" id="plBall" style="display:none"></div><div class="pl-buckets" id="plBuckets"></div></div>`,`${modeBar()}${betField()}<button class="btn btn-primary" id="dropBall">Drop ball</button>`);
 const mm=bindModes(m=>{$('#modeInfo').textContent='Hadiah terbesar x'+Math.max(...PLINKO[m])+' di pinggir · tengah paling sering';
  $('#plBuckets').innerHTML=PLINKO[m].map((x,k)=>`<div class="pl-bucket ${x>=1.5?'hi':x>=1?'mid':'lo'}" data-k="${k}" style="left:${CX+(k-4)*DX-(DX-4)/2}px">${x}x</div>`).join('')});
 let busy=false;
 $('#dropBall').onclick=()=>{if(busy)return;const b=takeBet();if(!b)return;busy=true;mm.lock(true);$('#dropBall').disabled=true;
  const mode=mm.get(),table=PLINKO[mode];let r=0;const pts=[{x:CX-7,y:4-7}];
  for(let i=1;i<=ROWS;i++){if(Math.random()<.5)r++;pts.push({x:CX+(2*r-i)*DX/2-7,y:4+i*DY-7})}
  pts.push({x:pts[ROWS].x,y:pts[ROWS].y+12});
  document.querySelectorAll('.pl-bucket.hit').forEach(e=>e.classList.remove('hit'));
  const ball=$('#plBall');ball.style.display='block';
  const anim=ball.animate(pts.map(p=>({transform:`translate(${p.x}px,${p.y}px)`})),{duration:1300,fill:'forwards',easing:'ease-in'});
  const mult=table[r];
  const done=()=>{busy=false;if(tok===gameToken){mm.lock(false);$('#dropBall').disabled=false;const bk=document.querySelector('.pl-bucket[data-k="'+r+'"]');if(bk)bk.classList.add('hit')}settle(tok,b,b*mult,'Bola mendarat di '+mult+'x')};
  let fired=false;const once=()=>{if(fired)return;fired=true;done()};anim.onfinish=once;setTimeout(once,1500)}
}

function gameCase(g,tok){
 $('#gameMount').innerHTML=gameShell(g,`<div style="text-align:center"><div id="caseBox" class="big-emoji">🎁</div><div style="font:700 13px var(--display);color:#9bb8d8;margin-top:15px">MYSTERY CASE</div><small style="color:#7f94ad">BUKA DAN LIHAT HADIAHMU</small></div>`,`${betField()}<button class="btn btn-primary" id="openCase">Buka case</button>`);
 let busy=false;
 $('#openCase').onclick=()=>{if(busy)return;const b=takeBet();if(!b)return;busy=true;$('#openCase').disabled=true;const box=$('#caseBox');
  box.animate([{transform:'rotate(0) scale(1)'},{transform:'rotate(-12deg) scale(1.2)'},{transform:'rotate(12deg) scale(1.2)'},{transform:'scale(1)'}],{duration:750});
  const mult=pickWeighted(CASE_TABLE);
  setTimeout(()=>{busy=false;if(tok===gameToken){box.textContent=['🪨','🪙','💎','⚡','👑'][Math.floor(Math.random()*5)];$('#openCase').disabled=false}settle(tok,b,b*mult,'Multiplier hadiah '+mult+'x')},760)}
}

/* ===== Navigasi & init ===== */
$('#backBtn').onclick=()=>{gameToken++;showPage('lobby');renderLeaderboard()};
document.querySelectorAll('[data-home]').forEach(x=>x.onclick=e=>{e.preventDefault();gameToken++;showPage('lobby')});
document.querySelectorAll('[data-games]').forEach(x=>x.onclick=e=>{e.preventDefault();showPage('lobby');$('#games').scrollIntoView({behavior:'smooth'})});
document.querySelectorAll('[data-leaderboard]').forEach(x=>x.onclick=e=>{e.preventDefault();showPage('lobby');$('#leaderboard').scrollIntoView({behavior:'smooth'})});
$('#howBtn').onclick=()=>alert('Cara bermain:\n1. Masuk dengan username dan password (akun baru otomatis dibuat).\n2. Deposit koin lewat tombol Deposit, tunggu Admin ACC.\n3. Pilih game, pilih mode (Mudah/Sedang/Sulit), atur taruhan.\n4. Mau cairkan koin? Klik Withdraw.');
window.addEventListener('storage',e=>{if(e.key!==KEY||!e.newValue)return;try{state=loadState()}catch(_){return}updateHeader();renderLeaderboard();if($('#adminPage').classList.contains('active'))renderAdmin()});
renderGrid();renderLeaderboard();updateHeader();
