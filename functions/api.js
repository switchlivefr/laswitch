const SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
const API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';
const SHEETS = {
  'switch':       'SWiTCH',
  'osl':          'OSLSWiTCH',
  'pitchSw':      'PITCH SWiTCH',
  'regles':       'REGLES',
  'pitchOsl':     'PITCH ONE SHOT LIVE',
  'inscriptions':    'INSCRIPTIONS',
  'contactSw':       'CONTACT SWiTCH',
  'information':     'INFORMATION',
  'informationLieu': 'INFORMATION LIEU',
  'pitchSwBig':    'PITCH SWiTCH BIG',
  'reglesBig':     'REGLES BIG',
  'proRaceCafe':   'PRO RACE CAFE',
  'reservation':   'RESERVATION',
  'promoSw':       'PROMO SWiTCH',
  'pitchMesPrestas': 'PITCH MES PRESTAS'
};
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-6BtAXoKEx2oWbfFt8u3N6XuKMjfZ7f7ReGDn7wbkbz9JlJnRv0fR5Zqm8JWyDpM1/exec';
const FB_APP_ID = '3170724703113870';
const VIDEOS_SHEET = 'VIDEOS';

const R2_PUBLIC_BASE = 'https://www.laswitch.net/photos/switch';

async function getHiddenRows(sheetTitle) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}&fields=sheets(properties(title),data(rowMetadata(hiddenByUser)))&includeGridData=false`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) return [];
  const sheet = (data.sheets || []).find(s => s.properties && s.properties.title === sheetTitle);
  if (!sheet || !sheet.data || !sheet.data[0] || !sheet.data[0].rowMetadata) return [];
  return sheet.data[0].rowMetadata.map(m => m.hiddenByUser === true);
}

async function readSheet(name) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(name)}?key=${API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const allRows = (data.values || []).map(row => row.map(cell => String(cell || '').trim().replace(/[`\u2018\u2019\u201A\u201B]/g, "'")));
  const hiddenRows = await getHiddenRows(name);
  return { rows: allRows.filter((_, i) => !hiddenRows[i]), sheetName: name };
}

// Lecture SWiTCH : garde les lignes header (i<4) + celles dont col B (index 1) = FALSE
// Lecture SWiTCH : renvoie TOUTES les lignes sans filtrage.
// Le front filtre selon le mode (admin = tout afficher, user = seulement col B FALSE)
async function readSwitchSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('SWiTCH')}?key=${API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const allRows = (data.values || []).map(row => row.map(cell => String(cell || '').trim().replace(/[`\u2018\u2019\u201A\u201B]/g, "'")));
  return { rows: allRows, sheetName: 'SWiTCH' };
}

// Lecture OSLSWiTCH :
//   - Lit I1 (ligne 0, col 8) pour determiner le mode
//   - Si I1 = false/vide -> garde header (i<4) + col B (index 1) = FALSE
//   - Si I1 = true       -> garde header (i<4) + col D (index 3) = TRUE
async function readOslSheet() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('OSLSWiTCH')}?key=${API_KEY}`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const allRows = (data.values || []).map(row => row.map(cell => String(cell || '').trim().replace(/[`\u2018\u2019\u201A\u201B]/g, "'")));
  const i1val = (allRows[0] && allRows[0][8]) ? allRows[0][8].trim().toLowerCase() : '';
  const i1IsTrue = (i1val === 'true' || i1val === 'vrai');
  const isFalse = v => { const s = v.trim().toLowerCase(); return s === 'false' || s === 'faux'; };
  const isTrue  = v => { const s = v.trim().toLowerCase(); return s === 'true'  || s === 'vrai'; };
  let filtered;
  if (i1IsTrue) {
    // Mode I1=TRUE : afficher celles dont col D (index 3) = TRUE
    filtered = allRows.filter((row, i) => i < 4 || isTrue(row[3] || ''));
  } else {
    // Mode I1=FALSE : afficher celles dont col B (index 1) = FALSE
    filtered = allRows.filter((row, i) => i < 4 || isFalse(row[1] || ''));
  }
  return { rows: filtered, sheetName: 'OSLSWiTCH' };
}

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/marco-switch-ajoutnomfb') {
    return new Response(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Ajouter Nom FB">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0a0a0f">

<link rel="apple-touch-icon" href="/icon-192-ajoutnomfb.png">
<title>Ajouter un nom</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#0a0a0f;
  --card:#13131f;
  --border:#1e1e30;
  --border2:#2a2a40;
  --gold:#f2c94c;
  --gglo:rgba(242,201,76,.25);
  --cyan:#34d1c0;
  --white:#ece9e0;
  --muted:#5a5a78;
  --muted2:#7a7a95;
  --green:#4caf7d;
  --r:14px;
  --rs:8px;
}
/* ── Modale admin ── */
.moverlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:500;align-items:center;justify-content:center;padding:14px;touch-action:none}
.moverlay.open{display:flex}
.mbox{background:var(--card);border:1px solid var(--border2);border-radius:var(--r);width:100%;max-width:460px;max-height:82vh;display:flex;flex-direction:column;overflow:hidden;touch-action:auto}
.mhead{padding:16px 18px 12px;border-bottom:1px solid var(--border);flex-shrink:0}
.mhead h3{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;color:var(--cyan)}
.mbody{padding:16px 18px;overflow-y:auto;flex:1;-webkit-overflow-scrolling:touch}
.mfoot{padding:12px 18px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:8px}
.mbtn{flex:1;padding:12px;border-radius:var(--rs);border:none;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:700;cursor:pointer;-webkit-appearance:none}
.mbtn.sec{background:var(--card);border:1px solid var(--border2);color:var(--muted2)}
html{height:100%;overscroll-behavior:none}
body{
  background:var(--bg);
  color:var(--white);
  font-family:'DM Sans',sans-serif;
  min-height:100dvh;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-start;
  padding:0 20px 8px;
  padding-top:max(32px,env(safe-area-inset-top));
  overscroll-behavior:none;
}
body::before{
  content:'';position:fixed;inset:0;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(242,201,76,.08) 0%,transparent 70%);
  pointer-events:none;
}
.wrap{position:relative;z-index:1;width:100%;max-width:460px;display:flex;flex-direction:column;align-items:center}
.title{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(38px,10vw,56px);
  letter-spacing:4px;color:var(--gold);
  text-shadow:0 0 40px var(--gglo);
  text-align:center;margin-bottom:2px;
}
.subtitle{
  font-family:'DM Sans',sans-serif;font-size:12px;
  color:var(--white);letter-spacing:2px;text-transform:uppercase;
  text-align:center;margin-bottom:22px;
}
.field{
  width:100%;background:var(--card);border:1px solid var(--border);
  border-radius:var(--r);padding:14px 18px;
  font-family:'DM Sans',sans-serif;font-size:17px;font-weight:600;
  color:var(--white);outline:none;-webkit-appearance:none;
  transition:border-color .2s,box-shadow .2s;caret-color:var(--gold);
}
.field:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(242,201,76,.12)}
.field::placeholder{color:var(--muted);font-weight:400}
.ac-wrap{position:relative;width:100%;margin-bottom:12px}
.ac-wrap.narrow{max-width:380px;margin-left:auto;margin-right:auto;margin-top:16px}
.dropdown{
  display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:100;
  background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  overflow:hidden;max-height:190px;overflow-y:auto;
}
.dropdown.open{display:block}
.dd-item{
  padding:11px 18px;font-size:15px;font-weight:600;color:var(--white);
  cursor:pointer;border-bottom:1px solid var(--border);
}
.dd-item:last-child{border-bottom:none}
.dd-item:active,.dd-item.hover{background:rgba(242,201,76,.1);color:var(--gold)}
.dd-item em{font-style:normal;color:var(--gold)}
.feedback{
  width:100%;min-height:30px;text-align:center;
  font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;
  color:var(--green);margin-bottom:8px;opacity:0;transition:opacity .2s;
}
.feedback.visible{opacity:1}
.feedback.abandon{color:#e8407a}
.btn{
  width:100%;background:var(--gold);color:#000;border:none;border-radius:var(--r);
  padding:15px;font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;
  cursor:pointer;transition:opacity .15s,transform .1s,background .2s,color .2s;-webkit-appearance:none;
}
.btn:disabled{opacity:.35;cursor:default}
.btn:not(:disabled):active{transform:scale(0.98);opacity:.9}
.btn.reset-mode{
  background:transparent;
  color:var(--gold);
  border:2px solid var(--gold);
  font-size:17px;
  letter-spacing:2px;
}
.btn.reset-mode:not(:disabled):active{transform:scale(0.98);opacity:.8}
.btn.pin-mode{
  background:#e8407a;
  color:#fff;
  border:none;
  font-size:16px;
  letter-spacing:1.5px;
  line-height:1.2;
  padding:13px 15px;
}
.btn.pin-mode.no-pin:disabled{opacity:1;cursor:default}
.btn.autre-nom-mode{
  background:transparent;
  color:var(--green);
  border:2px solid var(--green);
  font-size:17px;
  letter-spacing:2px;
}
.btn.autre-nom-mode:not(:disabled):active{transform:scale(0.98);opacity:.8}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{
  display:none;width:22px;height:22px;
  border:3px solid rgba(0,0,0,.2);border-top-color:#000;
  border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;
}
.btn.loading .btn-label{display:none}
.btn.loading .spinner{display:block}
</style>
<script>
const __manifest = {
  name: "Ajouter Nom FB",
  short_name: "Nom FB",
  start_url: "/marco_switch_ajoutnomfb.html",
  scope: "/marco_switch_ajoutnomfb.html",
  display: "standalone",
  background_color: "#0a0a0f",
  theme_color: "#0a0a0f",
  icons: [
    { src: "/icon-192-ajoutnomfb.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512-ajoutnomfb.png", sizes: "512x512", type: "image/png" }
  ]
};
const __blob = new Blob([JSON.stringify(__manifest)], {type: 'application/manifest+json'});
const __url = URL.createObjectURL(__blob);
document.querySelector('link[rel="manifest"]') && document.querySelector('link[rel="manifest"]').remove();
const __link = document.createElement('link');
__link.rel = 'manifest';
__link.href = __url;
document.head.appendChild(__link);
</script>
</head>
<body>
<div class="wrap">
  <div class="title">SWiTCH</div>
  <div class="subtitle">Ajouter un nom Facebook</div>

  <div class="ac-wrap" id="ac-nom">
    <input class="field" id="nom-input" type="text"
      placeholder="Nom exact Facebook…"
      autocomplete="off" autocorrect="off" spellcheck="false">
    <div class="dropdown" id="dd-nom"></div>
  </div>

  <div class="ac-wrap narrow" id="ac-prenom">
    <input class="field" id="prenom-input" type="text"
      placeholder="Prénom"
      autocomplete="off" autocorrect="off" spellcheck="false">
    <div class="dropdown" id="dd-prenom"></div>
  </div>

  <div class="feedback" id="feedback"></div>

  <button class="btn" id="submit-btn" disabled>
    <span class="btn-label" id="btn-label">AJOUTER</span>
    <div class="spinner"></div>
  </button>

  <button onclick="openAdminM();swLoadAdminRequests()"
    style="width:100%;margin-top:12px;background:transparent;color:var(--white);border:1px solid var(--border2);border-radius:var(--r);padding:14px;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;cursor:pointer;-webkit-appearance:none">
    DEMANDES D'ACCÈS EN ATTENTE
  </button>
</div>

<script>
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-6BtAXoKEx2oWbfFt8u3N6XuKMjfZ7f7ReGDn7wbkbz9JlJnRv0fR5Zqm8JWyDpM1/exec';
var SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
var API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';

var DATA = [];
var prenoms_col_g = [];
var state = { nomSelectionne: false, prenomExistant: '', codePin: '', resultShown: false };

function norm(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function matches(input, candidate) {
  var tokens = norm(input).split(/\s+/).filter(Boolean);
  var words  = norm(candidate).split(/\s+/).filter(Boolean);
  return tokens.every(function(tok){
    return words.some(function(w){ return w.indexOf(tok) === 0; });
  });
}
function highlight(text, input) {
  var tokens = norm(input).split(/\s+/).filter(Boolean);
  var result = text;
  tokens.forEach(function(tok){
    var safe = tok.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    var re = new RegExp('(' + safe + ')', 'gi');
    result = result.replace(re,'<em>$1</em>');
  });
  return result;
}

function loadData() {
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + SHEET_ID +
            '/values/IDS_APPLI?key=' + API_KEY + '&_=' + Date.now();
  DATA = [];
  prenoms_col_g = [];
  return fetch(url).then(function(r){ return r.json(); }).then(function(d){
    var rows = d.values || [];
    var pset = {};
    rows.forEach(function(row){
      var nom    = (row[0] || '').trim();
      var pin    = (row[5] || '').trim();
      var prenom = (row[6] || '').trim();
      if (nom) DATA.push({ nom: nom, prenom: prenom, pin: pin });
      if (prenom) pset[norm(prenom)] = prenom;
    });
    prenoms_col_g = Object.values(pset);
  }).catch(function(){});
}

function showDropdown(ddEl, items, inputVal, onSelect) {
  if (!items.length) { ddEl.classList.remove('open'); return; }
  ddEl.innerHTML = '';
  items.forEach(function(item){
    var div = document.createElement('div');
    div.className = 'dd-item';
    div.innerHTML = highlight(item, inputVal);
    div.addEventListener('mousedown', function(e){ e.preventDefault(); });
    div.addEventListener('click', function(){ onSelect(item); });
    ddEl.appendChild(div);
  });
  ddEl.classList.add('open');
}
function hideDropdown(ddEl){ ddEl.classList.remove('open'); }

var nomInput, prenomInput, ddNom, ddPrenom, feedbackEl, submitBtn, btnLabel;

window.addEventListener('load', function(){
  nomInput    = document.getElementById('nom-input');
  prenomInput = document.getElementById('prenom-input');
  ddNom       = document.getElementById('dd-nom');
  ddPrenom    = document.getElementById('dd-prenom');
  feedbackEl  = document.getElementById('feedback');
  submitBtn   = document.getElementById('submit-btn');
  btnLabel    = document.getElementById('btn-label');

  loadData();

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function(){
      document.body.style.height = window.visualViewport.height + 'px';
      window.scrollTo(0,0);
    });
  }

  nomInput.addEventListener('input', function(){
    if (state.resultShown) return;
    if (state.nomSelectionne) { doFullReset(); return; }
    hideFeedback();
    var val = nomInput.value;
    if (norm(val).replace(/\s/g,'').length < 2) { hideDropdown(ddNom); return; }
    var filtered = DATA.map(function(d){ return d.nom; })
      .filter(function(n){ return matches(val, n); }).slice(0,8);
    showDropdown(ddNom, filtered, val, function(selected){
      nomInput.value = selected;
      hideDropdown(ddNom);
      selectNom(selected);
    });
  });

  nomInput.addEventListener('focus', function(){
    if (state.nomSelectionne) { doFullReset(); setTimeout(function(){ nomInput.focus(); },10); }
  });
  nomInput.addEventListener('blur', function(){
    setTimeout(function(){ hideDropdown(ddNom); }, 150);
  });

  prenomInput.addEventListener('input', function(){
    if (state.resultShown) return;
    hideFeedback();
    updateBtn();
  });

  submitBtn.addEventListener('click', function(){
    // Mode "ENTRER UN AUTRE NOM" ou "AUTRE NOM FACEBOOK" → reset complet
    if (state.resultShown) {
      doFullReset();
      setTimeout(function(){ nomInput.focus(); }, 50);
      return;
    }
    doSubmit();
  });

  // Clic ailleurs sur la page → reset complet (si un résultat est affiché)
  document.addEventListener('click', function(e){
    if (!state.resultShown) return;
    var wrap = document.querySelector('.wrap');
    if (!wrap.contains(e.target)) {
      doFullReset();
      setTimeout(function(){ nomInput.focus(); }, 50);
    }
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Enter') {
      if (state.resultShown) {
        doFullReset();
        setTimeout(function(){ nomInput.focus(); }, 50);
        return;
      }
      if (!submitBtn.disabled) doSubmit();
    }
  });

  setTimeout(function(){ nomInput.focus(); }, 300);
});

function selectNom(nom) {
  state.nomSelectionne = true;
  var found = DATA.find(function(d){ return d.nom === nom; });
  state.prenomExistant = found ? found.prenom : '';
  state.codePin        = found ? found.pin    : '';
  prenomInput.value = '';
  prenomInput.placeholder = state.prenomExistant || 'Prénom';
  submitBtn.disabled = true;
  btnLabel.textContent = 'AJOUTER';
  setTimeout(function(){ prenomInput.focus(); }, 50);
}

function updateBtn() {
  var prenomSaisi = prenomInput.value.trim();
  if (!prenomSaisi) {
    submitBtn.disabled = true;
    btnLabel.textContent = 'AJOUTER';
    submitBtn.className = 'btn';
    return;
  }
  if (state.nomSelectionne) {
    // Prénom identique → mode réinitialisation PIN (rouge) ou pas de PIN
    if (state.prenomExistant && norm(prenomSaisi) === norm(state.prenomExistant)) {
      submitBtn.disabled = false;
      submitBtn.className = 'btn pin-mode';
      if (!state.codePin) {
        // Colonne F vide → pas de code PIN à réinitialiser
        btnLabel.textContent = 'PAS DE CODE PIN À RÉINITIALISER';
        submitBtn.disabled = true;
        submitBtn.classList.add('no-pin');
        setTimeout(function() {
          doFullReset();
          setTimeout(function(){ nomInput.focus(); }, 50);
        }, 4000);
      } else {
        btnLabel.textContent = 'RÉINITIALISER LE CODE PIN ' + state.codePin;
      }
    } else {
      submitBtn.disabled = false;
      submitBtn.className = 'btn';
      btnLabel.textContent = (state.prenomExistant && norm(prenomSaisi) !== norm(state.prenomExistant))
        ? 'REMPLACER' : 'AJOUTER';
    }
  } else {
    submitBtn.disabled = !nomInput.value.trim();
    submitBtn.className = 'btn';
    btnLabel.textContent = 'AJOUTER';
  }
}

function doSubmit() {
  var nom    = nomInput.value.trim();
  var prenom = prenomInput.value.trim();
  if (!nom || !prenom || submitBtn.disabled) return;

  // Prénom identique → réinitialisation code PIN (seulement si PIN non vide)
  if (state.nomSelectionne && state.prenomExistant && norm(prenom) === norm(state.prenomExistant)) {
    if (!state.codePin) return; // pas de PIN → bouton désactivé, on ne fait rien
    doResetPin(nom);
    return;
  }

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  var isReplace = (state.nomSelectionne && state.prenomExistant && norm(prenom) !== norm(state.prenomExistant));
  var action = isReplace ? 'replacePrenom' : 'addAppliName';

  var url = APPS_SCRIPT_URL
    + '?action=' + action
    + '&name='   + encodeURIComponent(nom)
    + '&prenom=' + encodeURIComponent(prenom);

  fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(data){
      submitBtn.classList.remove('loading');
      if (data.ok) {
        showFeedback(isReplace ? 'REMPLACÉ !' : 'AJOUTÉ !', false);
        showResetBtn();
      } else {
        showFeedback('ERREUR', true);
      }
    })
    .catch(function(){
      submitBtn.classList.remove('loading');
      showFeedback('ERREUR RÉSEAU', true);
    });
}

function doResetPin(nom) {
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  var url = APPS_SCRIPT_URL
    + '?action=resetPin'
    + '&name=' + encodeURIComponent(nom);

  fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(data){
      submitBtn.classList.remove('loading');
      if (data.ok) {
        showFeedback('CODE PIN RÉINITIALISÉ !', true);
        showAutreNomBtn();
      } else {
        showFeedback('ERREUR', true);
      }
    })
    .catch(function(){
      submitBtn.classList.remove('loading');
      showFeedback('ERREUR RÉSEAU', true);
    });
}

function showResetBtn() {
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');
  submitBtn.className = 'btn reset-mode';
  btnLabel.textContent = 'ENTRER UN AUTRE NOM';
}

function showAutreNomBtn() {
  submitBtn.disabled = false;
  submitBtn.classList.remove('loading');
  submitBtn.className = 'btn autre-nom-mode';
  btnLabel.textContent = 'AUTRE NOM FACEBOOK';
}

function showFeedback(msg, isAbandon) {
  feedbackEl.textContent = msg;
  feedbackEl.className = 'feedback visible' + (isAbandon ? ' abandon' : '');
  state.resultShown = true;
  submitBtn.disabled = true;
}
function hideFeedback() {
  feedbackEl.className = 'feedback';
  feedbackEl.textContent = '';
  state.resultShown = false;
}
function doFullReset() {
  state.nomSelectionne = false;
  state.prenomExistant = '';
  state.codePin        = '';
  state.resultShown    = false;
  nomInput.value       = '';
  prenomInput.value    = '';
  prenomInput.placeholder = 'Prénom';
  nomInput.disabled    = true;
  hideDropdown(ddNom);
  hideDropdown(ddPrenom);
  hideFeedback();
  btnLabel.textContent = 'AJOUTER';
  submitBtn.disabled   = true;
  submitBtn.className  = 'btn';
  loadData().then(function(){
    nomInput.disabled = false;
    setTimeout(function(){ nomInput.focus(); }, 50);
  });
}
</script>
</body>
</html>

<!-- MODALE DEMANDES D'ACCÈS -->
<div class="moverlay" id="m-sw-admin" onclick="if(event.target===this)closeAdminM()">
  <div class="mbox" style="display:flex;flex-direction:column;max-height:calc(88vh - 64px)">
    <div class="mhead" style="text-align:center;flex-shrink:0">
      <h3 style="color:var(--gold)">DEMANDES D'ACCES</h3>
      <div id="sw-admin-count" style="font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:1px;color:var(--gold)">Chargement...</div>
    </div>
    <div class="mbody" style="text-align:left;overflow-y:auto;flex:1;min-height:0">
      <div id="sw-admin-list" style="padding:0 4px"></div>
    </div>
    <div class="mfoot" style="flex-direction:row;gap:8px">
      <button onclick="swLoadAdminRequests()" style="flex:1;background:var(--border2);border:none;border-radius:8px;padding:10px;color:var(--white);font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;cursor:pointer">ACTUALISER</button>
      <button onclick="closeAdminM()" style="flex:1;background:#1877f2;border:none;border-radius:8px;padding:10px;color:#fff;font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;cursor:pointer">AJOUT NOM FACEBOOK</button>
    </div>
  </div>
</div>

<!-- Modale saisie prénom pour validation -->
<div id="m-sw-admin-prenom" style="display:none;position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:24px">
  <div style="background:var(--card);border:1px solid #1877f2;border-radius:var(--r);width:100%;max-width:340px;padding:28px 24px 24px;display:flex;flex-direction:column;gap:16px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:#1877f2;letter-spacing:2px;text-align:center">Prénom</div>
    <input id="sw-admin-prenom-input" type="text" placeholder="Prénom…" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false"
      style="width:100%;background:var(--bg);border:1px solid var(--border2);border-radius:var(--rs);padding:14px 16px;font-family:'DM Sans',sans-serif;font-size:17px;font-weight:600;color:var(--white);outline:none;caret-color:#1877f2;-webkit-appearance:none"
      onfocus="this.style.borderColor='#1877f2'" onblur="this.style.borderColor='var(--border2)'"
      oninput="var v=this.value;this.value=v.charAt(0).toUpperCase()+v.slice(1)"
      onkeydown="if(event.key==='Enter')swAdminPrenomAjouter()">
    <div id="sw-admin-prenom-err" style="display:none;font-size:12px;color:#e53935;text-align:center;margin-top:-8px"></div>
    <button id="sw-admin-prenom-addbtn" onclick="swAdminPrenomAjouter()"
      style="width:100%;background:#1877f2;color:#fff;border:none;border-radius:var(--rs);padding:14px;font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:2px;cursor:pointer">AJOUTER</button>
  </div>
</div>

<script>
var ADMIN_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-6BtAXoKEx2oWbfFt8u3N6XuKMjfZ7f7ReGDn7wbkbz9JlJnRv0fR5Zqm8JWyDpM1/exec';
var ADMIN_API_BASE = '/api';

function openAdminM() {
  var el = document.getElementById('m-sw-admin');
  if (el) el.classList.add('open');
}
function closeAdminM() {
  var el = document.getElementById('m-sw-admin');
  if (el) el.classList.remove('open');
}

function swLoadAdminRequests() {
  var list  = document.getElementById('sw-admin-list');
  var count = document.getElementById('sw-admin-count');
  if (!list) return;
  list.innerHTML = '<div style="color:var(--muted2);font-size:13px;padding:12px;text-align:center">Chargement...</div>';
  var limit = Date.now() - 48 * 3600 * 1000;
  fetch(ADMIN_APPS_SCRIPT_URL + '?action=getAccessRequests')
    .then(function(r){ return r.json(); })
    .then(function(data) {
      var rows = (data.rows || []).filter(function(r){
        if (r.validated) return true;
        return (r.timestamp || 0) > limit;
      });
      var pending = rows.filter(function(r){ return !r.validated; }).length;
      if (count) count.textContent = pending + ' EN ATTENTE · ' + (rows.length - pending) + ' VALIDEES';
      list.innerHTML = '';
      if (!rows.length) {
        list.innerHTML = '<div style="color:var(--muted2);font-size:13px;padding:12px;text-align:center">Aucune demande</div>';
        return;
      }
      rows.sort(function(a,b){ return (a.validated?1:0)-(b.validated?1:0)||(b.timestamp||0)-(a.timestamp||0); });
      rows.forEach(function(row) {
        var isVal = row.validated;
        var nom = (row.name||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
        var d = document.createElement('div');
        d.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border);gap:8px';
        var info = '<div style="flex:1"><div style="font-size:14px;font-weight:700;color:' + (isVal?'var(--muted2)':'var(--white)') + '">' + nom + '</div><div style="font-size:11px;color:var(--muted2)">' + (row.date||'') + '</div></div>';
        d.innerHTML = info;
        if (isVal) {
          var tag = document.createElement('div');
          tag.textContent = 'VALIDE';
          tag.style.cssText = 'color:#34d1c0;font-size:12px;font-weight:700;font-family:Bebas Neue,sans-serif;letter-spacing:1px;flex-shrink:0';
          d.appendChild(tag);
        } else {
          var btn = document.createElement('button');
          btn.textContent = 'VALIDER';
          btn.style.cssText = 'background:#34d1c0;border:none;border-radius:8px;padding:8px 14px;color:#000;font-family:Bebas Neue,sans-serif;font-size:14px;letter-spacing:1px;cursor:pointer;flex-shrink:0';
          btn.onclick = (function(n,b){ return function(){ swAdminValidate(n,b); }; })(row.name||'', btn);
          d.appendChild(btn);
        }
        list.appendChild(d);
      });
    })
    .catch(function(){
      list.innerHTML = '<div style="color:#e53935;font-size:13px;padding:12px">Erreur de chargement</div>';
    });
}

function swAdminValidate(name, btn) {
  btn.textContent = '...'; btn.disabled = true;
  fetch(ADMIN_API_BASE + '?action=getPrenom&name=' + encodeURIComponent(name))
    .then(function(r){ return r.json(); })
    .then(function(data) {
      var prenom = (data.prenom || '').trim();
      if (!prenom) {
        btn.textContent = 'VALIDER'; btn.disabled = false;
        swAdminAskPrenom(name, btn);
      } else {
        swAdminDoValidate(name, btn);
      }
    })
    .catch(function(){ swAdminDoValidate(name, btn); });
}

function swAdminDoValidate(name, btn) {
  if (btn) { btn.textContent = '...'; btn.disabled = true; }
  fetch(ADMIN_APPS_SCRIPT_URL + '?action=validateRequest&name=' + encodeURIComponent(name))
    .then(function(r){ return r.json(); })
    .then(function(data) {
      if (data.ok) {
        var tag = document.createElement('div');
        tag.textContent = 'VALIDE';
        tag.style.cssText = 'color:#34d1c0;font-size:12px;font-weight:700;font-family:Bebas Neue,sans-serif;letter-spacing:1px;flex-shrink:0';
        if (btn && btn.parentNode) btn.parentNode.replaceChild(tag, btn);
      } else {
        if (btn) { btn.textContent = 'ERREUR'; btn.disabled = false; }
      }
    })
    .catch(function(){ if (btn) { btn.textContent = 'ERREUR'; btn.disabled = false; } });
}

function swAdminAskPrenom(name, btn) {
  var overlay = document.getElementById('m-sw-admin-prenom');
  if (!overlay) return;
  overlay._targetName = name;
  overlay._targetBtn  = btn;
  var input = document.getElementById('sw-admin-prenom-input');
  if (input) input.value = '';
  var errEl = document.getElementById('sw-admin-prenom-err');
  if (errEl) errEl.style.display = 'none';
  overlay.style.display = 'flex';
  setTimeout(function(){ if (input) input.focus(); }, 120);
}

function swAdminPrenomAjouter() {
  var overlay = document.getElementById('m-sw-admin-prenom');
  if (!overlay) return;
  var name   = overlay._targetName;
  var btn    = overlay._targetBtn;
  var input  = document.getElementById('sw-admin-prenom-input');
  var errEl  = document.getElementById('sw-admin-prenom-err');
  var addBtn = document.getElementById('sw-admin-prenom-addbtn');
  var prenom = (input ? input.value.trim() : '');
  if (!prenom) {
    if (errEl) { errEl.textContent = 'Saisis un prénom'; errEl.style.display = 'block'; }
    return;
  }
  if (addBtn) { addBtn.textContent = '...'; addBtn.disabled = true; }
  fetch(ADMIN_APPS_SCRIPT_URL + '?action=setPrenom&name=' + encodeURIComponent(name) + '&prenom=' + encodeURIComponent(prenom))
    .then(function(r){ return r.json(); })
    .then(function(){
      overlay.style.display = 'none';
      if (addBtn) { addBtn.textContent = 'AJOUTER'; addBtn.disabled = false; }
      swAdminDoValidate(name, btn);
    })
    .catch(function(){
      overlay.style.display = 'none';
      if (addBtn) { addBtn.textContent = 'AJOUTER'; addBtn.disabled = false; }
      swAdminDoValidate(name, btn);
    });
}

/* Ouvrir la modale au chargement — NE TOUCHE PAS au formulaire principal */
window.addEventListener('DOMContentLoaded', function() {
  openAdminM();
  swLoadAdminRequests();
});
</script>
`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }
    });
  }

  if (url.pathname !== '/api') {
    return env.ASSETS.fetch(request);
  }

  const action = url.searchParams.get('action');

  if (request.method === 'POST' && action === 'setMode') {
    try {
      const body = await request.json();
      const mode = ['gif','video','photos','alternance'].includes(body.mode) ? body.mode : 'video';
      await env.LASWITCH_KV.put('home_mode', mode);
      return new Response(JSON.stringify({ ok: true, mode }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setResa') {
    try {
      const body = await request.json();
      const mode = body.mode === 'off' ? 'off' : 'on';
      await env.LASWITCH_KV.put('resa_mode', mode);
      return new Response(JSON.stringify({ ok: true, mode }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'inscrire') {
    try {
      const body = await request.json();
      const r = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titre: body.titre, nom: body.nom })
      });
      const data = await r.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setVideo') {
    try {
      const body = await request.json();
      await env.LASWITCH_KV.put('video_url', body.url || '');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setGifIndex') {
    try {
      const body = await request.json();
      const index = parseInt(body.index) || 0;
      await env.LASWITCH_KV.put('gif_index', String(index));
      return new Response(JSON.stringify({ ok: true, index }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST' && action === 'setPitchMode') {
    try {
      const body = await request.json();
      const mode = body.mode === 'gif' ? 'gif' : 'normal';
      await env.LASWITCH_KV.put('pitch_mode', mode);
      return new Response(JSON.stringify({ ok: true, mode }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // GET assets : photos listées depuis R2 directement via env.R2_BUCKET, videos/gifs depuis GitHub
  if (request.method === 'GET' && action === 'getAssets') {
    try {
      // Photos : R2 si dispo, fallback GitHub
      let photos = [];
      if (env.R2_BUCKET) {
        try {
          const listed = await env.R2_BUCKET.list({ prefix: 'photos/switch/', delimiter: '/' });
          photos = listed.objects
            .filter(obj => obj.key.match(/\.(jpg|jpeg|png|webp)$/i))
            .map(obj => {
              const name = obj.key.split('/').pop();
              const fullUrl = `${R2_PUBLIC_BASE}/${encodeURIComponent(name)}`;
              return { name, url: fullUrl, full: fullUrl };
            });
        } catch(e) { photos = []; }
      }
      if (!photos.length) {
        try {
          const ghRes = await fetch('https://api.github.com/repos/switchlivefr/laswitch/contents/assets/photos', { headers: { 'User-Agent': 'laswitch-app' } });
          const ghData = await ghRes.json();
          if (Array.isArray(ghData)) photos = ghData.filter(f => f.name.match(/\.(jpg|jpeg|png|webp)$/i) && f.name !== '.gitkeep').map(f => ({ name: f.name, url: f.download_url, full: f.download_url }));
        } catch(e) { photos = []; }
      }

      // Videos : R2 videos/switch/events/ en priorité, fallback GitHub
      let videosData = [];
      if (env.R2_BUCKET) {
        try {
          const videosListed = await env.R2_BUCKET.list({ prefix: 'videos/switch/events/', delimiter: '/' });
          videosData = videosListed.objects
            .filter(obj => obj.key.match(/\.(mp4|webm|ogg)$/i))
            .map(obj => {
              const name = obj.key.split('/').pop();
              return { name, url: `https://www.laswitch.net/videos/switch/events/${encodeURIComponent(name)}` };
            });
        } catch(e) { videosData = []; }
      }
      // Fallback GitHub si R2 vide
      let assetsData = null;
      if (!videosData.length) {
        try {
          const videosRes = await fetch('https://api.github.com/repos/switchlivefr/laswitch/contents/assets', {
            headers: { 'User-Agent': 'laswitch-app' }
          });
          assetsData = await videosRes.json();
        } catch(e) { assetsData = null; }
      }

      // Gifs depuis R2
      let gifsData = [];
      if (env.R2_BUCKET) {
        try {
          const gifsListed = await env.R2_BUCKET.list({ prefix: 'gifs/', delimiter: '/' });
          gifsData = gifsListed.objects
            .filter(obj => obj.key.match(/\.(gif|jpg|jpeg|png|webp)$/i))
            .map(obj => ({
              name: obj.key.split('/').pop(),
              url: `https://www.laswitch.net/gifs/${encodeURIComponent(obj.key.split('/').pop())}`
            }));
        } catch(e) { gifsData = []; }
      }
      // Fallback GitHub si R2 vide
      if (!gifsData.length) {
        try {
          const gifsRes = await fetch('https://api.github.com/repos/switchlivefr/laswitch/contents/assets/Gif', {
            headers: { 'User-Agent': 'laswitch-app' }
          });
          const gifsRaw = await gifsRes.json();
          if (Array.isArray(gifsRaw)) gifsData = gifsRaw.filter(f => f.name.match(/\.(gif|jpg|jpeg|png|webp)$/i) && f.name !== '.gitkeep').map(f => ({ name: f.name, url: f.download_url }));
        } catch(e) { gifsData = []; }
      }

      const videos = videosData.length
        ? videosData
        : (Array.isArray(assetsData)
            ? assetsData.filter(f => f.name.match(/\.mp4$/i))
                .map(f => ({ name: f.name, url: f.download_url }))
            : []);
      const gifs = Array.isArray(gifsData)
        ? gifsData.filter(f => f.name && f.name.match(/\.(gif|jpg|jpeg|png|webp)$/i) && f.name !== '.gitkeep')
            .map(f => ({ name: f.name, url: f.url || f.download_url }))
        : [];

      return new Response(JSON.stringify({ photos, videos, gifs }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=300'
        }
      });
    } catch(e) {
      return new Response(JSON.stringify({ photos: [], videos: [], gifs: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET photos Pro Race Cafe depuis R2
  if (request.method === 'GET' && action === 'getPrcPhotos') {
    try {
      let photos = [];
      if (env.R2_BUCKET) {
        const listed = await env.R2_BUCKET.list({ prefix: 'photos/proracecafe/reservation/', delimiter: '/' });
        photos = listed.objects
          .filter(obj => obj.key.match(/\.(jpg|jpeg|png|webp)$/i))
          .map(obj => {
            const name = obj.key.split('/').pop();
            return { name, url: `https://www.laswitch.net/photos/proracecafe/reservation/${encodeURIComponent(name)}` };
          });
      }
      return new Response(JSON.stringify({ photos }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=300' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ photos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET photos depuis Google Drive
  if (request.method === 'GET' && action === 'getPhotos') {
    try {
      const folderId = '1UCSMq48CuBEFWWgTUB7QoxY7Fzgf2xW2';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("'" + folderId + "' in parents and mimeType contains 'image/' and trashed=false")}&key=${API_KEY}&fields=${encodeURIComponent('files(id,name,imageMediaMetadata(width,height))')}&pageSize=50&orderBy=name`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Drive API error: ' + r.status);
      const data = await r.json();
      if (data.error) throw new Error('Drive: ' + data.error.message);
      const photos = (data.files || []).map(f => ({
        id: f.id,
        name: f.name,
        landscape: f.imageMediaMetadata ? f.imageMediaMetadata.width > f.imageMediaMetadata.height : false,
        thumb: `https://lh3.googleusercontent.com/d/${f.id}=w220`,
        full:  `https://lh3.googleusercontent.com/d/${f.id}=w1200`
      }));
      return new Response(JSON.stringify({ photos }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=300' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ photos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET fbId depuis un nom (pour Accès SWiTCH sans Facebook)
  if (request.method === 'GET' && action === 'getFbIdFromName') {
    try {
      const name = (url.searchParams.get('name') || '').trim().toLowerCase();
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/IDS_FBK?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      const rows = (data.values || []).slice(1);
      for (const row of rows) {
        if ((row[1] || '').trim().toLowerCase() === name) {
          return new Response(JSON.stringify({ fbId: row[0] }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
      return new Response(JSON.stringify({ fbId: '' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ fbId: '' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET videos par ID Facebook
  if (request.method === 'GET' && action === 'getVideos') {
    try {
      const fbId = (url.searchParams.get('fbid') || '').trim();
      const nom = (url.searchParams.get('nom') || '').trim().toLowerCase();
      const fullname = (url.searchParams.get('fullname') || '').trim().toLowerCase();

      // fbid=ALL = mode admin → toutes les vidéos
      const isAdmin = fbId === 'ALL';

      if (!fbId) return new Response(JSON.stringify({ videos: [] }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });

      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(VIDEOS_SHEET)}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);

      const rows = (data.values || []).slice(1);
      const videos = [];
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const youtube = (row[0] || '').trim();
        const phrase  = (row[1] || '').trim();
        const personnes = (row[2] || '').trim();
        const date    = (row[3] || '').trim();
        const fb_ids  = (row[4] || '').trim();
        const ids_facebook = (row[5] || '').trim();
        const titre   = (row[6] || '').trim();
        const phrase2 = (row[7] || '').trim();
        const lieu    = (row[8] || '').trim();
        const rowIndex = rowIdx + 2; // +1 pour header, +1 pour 1-based
        if (!youtube) continue;

        if (!isAdmin) {
          // Chercher l'ID Facebook dans la colonne fb_ids
          const ids = fb_ids.split('|').map(i => i.trim());
          if (!ids.includes(fbId)) continue;
        }

        videos.push({ youtube, phrase, personnes, date, fb_ids, ids_facebook, titre, phrase2, lieu, rowIndex });
      }

      // Tri du plus récent au plus ancien
      videos.sort((a, b) => {
        const parseDate = d => {
          if (!d) return 0;
          const p = d.split('/');
          if (p.length === 3) return new Date(p[2], p[1]-1, p[0]).getTime();
          return 0;
        };
        return parseDate(b.date) - parseDate(a.date);
      });

      return new Response(JSON.stringify({ videos }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      });
    } catch(e) {
      return new Response(JSON.stringify({ videos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET getIdsAppli : tous les noms + fb_id depuis IDS_APPLI col A (nom) + col H (fb_id)
  // Source unique pour toutes les barres de recherche de lappli
  if (request.method === 'GET' && action === 'getIdsAppli') {
    try {
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('IDS_APPLI')}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      const ids = rows
        .map(row => ({ name: (row[0]||'').trim(), fb_id: (row[7]||'').trim() }))
        .filter(item => item.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
      return new Response(JSON.stringify({ ids }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=300' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ ids: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }


  // GET getFbLink : lien Facebook d'un utilisateur depuis IDS_APPLI (col A=nom, H=fb_id, I=lien)
  // Si col I remplie → utilise tel quel
  // Sinon construit automatiquement depuis l'ID :
  //   - purement numérique → https://www.facebook.com/profile.php?id=XXXXX
  //   - alphanumérique (slug) → https://www.facebook.com/slug
  if (request.method === 'GET' && action === 'getFbLink') {
    try {
      const fbId = (url.searchParams.get('fbid') || '').trim();
      const name = (url.searchParams.get('name') || '').trim().toLowerCase();

      // Fonction de construction du lien depuis un ID brut
      const buildFbLink = (id) => {
        if (!id) return '';
        return /^\d+$/.test(id)
          ? `https://www.facebook.com/profile.php?id=${id}`
          : `https://www.facebook.com/${id}`;
      };

      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/IDS_APPLI?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      for (const row of rows) {
        const rowName  = (row[0] || '').trim().toLowerCase();
        const rowFbId  = (row[7] || '').trim();   // col H = ID brut
        const rowLink  = (row[8] || '').trim();   // col I = lien manuel (prioritaire)
        if ((fbId && rowFbId === fbId) || (name && rowName === name)) {
          const link = rowLink || buildFbLink(rowFbId) || buildFbLink(fbId);
          return new Response(JSON.stringify({ link }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
      // Pas trouvé dans le sheet → construire depuis le fbId passé en paramètre
      const link = buildFbLink(fbId);
      return new Response(JSON.stringify({ link }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ link: '', error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET getPrenom — cherche dans IDS_APPLI col A (nom) → col G (index 6) = prénom
  if (request.method === 'GET' && action === 'getPrenom') {
    try {
      const name = (url.searchParams.get('name') || '').trim().toLowerCase();
      if (!name) return new Response(JSON.stringify({ prenom: '' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('IDS_APPLI')}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      const match = rows.find(row => (row[0]||'').trim().toLowerCase() === name);
      const prenom = match ? (match[6]||'').trim() : '';
      return new Response(JSON.stringify({ prenom }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch(e) {
      return new Response(JSON.stringify({ prenom: '', error: e.message }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  }

  // GET IDS_FBK : liste des IDs Facebook pour la recherche admin
  if (request.method === 'GET' && action === 'getIdsFbk') {
    try {
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent('IDS_FBK')}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      const ids = rows
        .filter(row => row[0] && row[1])
        .map(row => ({ fb_id: row[0].trim(), name: row[1].trim(), nb: parseInt(row[2]||0) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
      return new Response(JSON.stringify({ ids }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'max-age=300' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ ids: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET searchVideos : recherche par phrase (mode texte libre)
  if (request.method === 'GET' && action === 'searchVideos') {
    try {
      const query = (url.searchParams.get('q') || '').trim().toLowerCase();
      if (!query) return new Response(JSON.stringify({ videos: [] }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(VIDEOS_SHEET)}?key=${API_KEY}`;
      const r = await fetch(sheetUrl);
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rows = (data.values || []).slice(1);
      const videos = [];
      for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
        const row = rows[rowIdx];
        const youtube = (row[0] || '').trim();
        const phrase  = (row[1] || '').trim();
        const personnes = (row[2] || '').trim();
        const date    = (row[3] || '').trim();
        const fb_ids  = (row[4] || '').trim();
        const ids_facebook = (row[5] || '').trim();
        const titre   = (row[6] || '').trim();
        const phrase2 = (row[7] || '').trim();
        const lieu    = (row[8] || '').trim();
        const rowIndex = rowIdx + 2;
        if (!youtube) continue;
        if (!phrase.toLowerCase().includes(query) && !personnes.toLowerCase().includes(query) && !titre.toLowerCase().includes(query) && !phrase2.toLowerCase().includes(query)) continue;
        videos.push({ youtube, phrase, personnes, date, fb_ids, ids_facebook, titre, phrase2, lieu, rowIndex });
      }
      videos.sort((a, b) => {
        const parseDate = d => { if (!d) return 0; const p = d.split('/'); if (p.length === 3) return new Date(p[2], p[1]-1, p[0]).getTime(); return 0; };
        return parseDate(b.date) - parseDate(a.date);
      });
      return new Response(JSON.stringify({ videos }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ videos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // POST setVideoMeta — écrit phrase2 (col H), fb_ids (col E), ids_facebook (col F) dans VIDEOS
  if (request.method === 'POST' && action === 'setVideoMeta') {
    try {
      const body = await request.json();
      const rowIndex    = parseInt(body.rowIndex || 0);
      const phrase2     = String(body.phrase2 || '');
      const fb_ids      = String(body.fb_ids || '');
      const ids_facebook = String(body.ids_facebook || '');
      if (!rowIndex) return new Response(JSON.stringify({ error: 'rowIndex manquant' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      const scriptUrl = APPS_SCRIPT_URL + '?action=setVideoMeta&rowIndex=' + rowIndex +
        '&phrase2=' + encodeURIComponent(phrase2) +
        '&fb_ids=' + encodeURIComponent(fb_ids) +
        '&ids_facebook=' + encodeURIComponent(ids_facebook);
      const r = await fetch(scriptUrl);
      const data = await r.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  }

  // POST setPrenom — écrit le prénom en colonne G de IDS_APPLI via Apps Script
  if (request.method === 'POST' && action === 'setPrenom') {
    try {
      const body = await request.json();
      const name   = (body.name   || '').trim();
      const prenom = (body.prenom || '').trim();
      if (!name || !prenom) return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      const scriptUrl = APPS_SCRIPT_URL + '?action=setPrenom&name=' + encodeURIComponent(name) + '&prenom=' + encodeURIComponent(prenom);
      const r = await fetch(scriptUrl);
      const data = await r.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
  }

  // GET : lecture des sheets
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try {
        if (key === 'switch') {
          result[key] = await readSwitchSheet();
        } else if (key === 'osl') {
          result[key] = await readOslSheet();
        } else {
          result[key] = await readSheet(name);
        }
      }
      catch(e) { result[key] = { error: e.message }; }
    }
    const homeMode = await env.LASWITCH_KV.get('home_mode');
    const resaMode = await env.LASWITCH_KV.get('resa_mode');
    const videoUrl = await env.LASWITCH_KV.get('video_url');
    result.homeMode = homeMode || 'video';
    const gifIndex = await env.LASWITCH_KV.get('gif_index');
    result.gifIndex = parseInt(gifIndex) || 0;
    result.resaMode = resaMode || 'on';
    const pitchMode = await env.LASWITCH_KV.get('pitch_mode');
    result.pitchMode = pitchMode || 'normal';
    if (videoUrl) result.videoUrl = videoUrl;
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      }
    });
  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export default {
  fetch: handleRequest
};
