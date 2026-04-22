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
  'promoSw':       'PROMO SWiTCH'
};
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRxLRh2URcPDRhMKC9mQwDsToEBTGCkrRrULgAFqYSvaldTh2wWRZGP7vbZa9eMYWP/exec';
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

async function handleRequest(request, env) {
  const url = new URL(request.url);

  if (url.pathname === '/marco_switch_ajoutnomfb') {
    return new Response(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Ajouter Nom">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#0a0a0f">
<title>Ajouter un nom</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#0a0a0f;
  --card:#13131f;
  --border:#1e1e30;
  --gold:#f2c94c;
  --gglo:rgba(242,201,76,.25);
  --white:#ece9e0;
  --muted:#5a5a78;
  --green:#4caf7d;
  --r:14px;
}
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
.ac-wrap.narrow{max-width:380px;margin-left:auto;margin-right:auto}
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
  cursor:pointer;transition:opacity .15s,transform .1s;-webkit-appearance:none;
}
.btn:disabled{opacity:.35;cursor:default}
.btn:not(:disabled):active{transform:scale(0.98);opacity:.9}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{
  display:none;width:22px;height:22px;
  border:3px solid rgba(0,0,0,.2);border-top-color:#000;
  border-radius:50%;animation:spin .7s linear infinite;margin:0 auto;
}
.btn.loading .btn-label{display:none}
.btn.loading .spinner{display:block}
</style>
</head>
<body>
<div class="wrap">
  <div class="title">SWiTCH</div>
  <div class="subtitle">Ajouter un nom Facebook</div>

  <div class="ac-wrap" id="ac-nom">
    <input class="field" id="nom-input" type="text"
      placeholder="Nom exact Facebook\u2026"
      autocomplete="off" autocorrect="off" spellcheck="false">
    <div class="dropdown" id="dd-nom"></div>
  </div>

  <div class="ac-wrap narrow" id="ac-prenom">
    <input class="field" id="prenom-input" type="text"
      placeholder="Pr\u00e9nom"
      autocomplete="off" autocorrect="off" spellcheck="false">
    <div class="dropdown" id="dd-prenom"></div>
  </div>

  <div class="feedback" id="feedback"></div>

  <button class="btn" id="submit-btn" disabled onclick="submit()">
    <span class="btn-label" id="btn-label">AJOUTER</span>
    <div class="spinner"></div>
  </button>
</div>

<script>
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz-6BtAXoKEx2oWbfFt8u3N6XuKMjfZ7f7ReGDn7wbkbz9JlJnRv0fR5Zqm8JWyDpM1/exec';
var SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
var API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';

var DATA = [];
var prenoms_col_g = [];
var state = { nomSelectionne: false, prenomExistant: '', resultShown: false };

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
    var safe = tok.replace(new RegExp('[.*+?^$' + '{}()|[\\]\\\\]','g'),'\\$&');
    var re = new RegExp('(' + safe + ')', 'gi');
    result = result.replace(re,'<em>$1</em>');
  });
  return result;
}

function loadData() {
  var url = 'https://sheets.googleapis.com/v4/spreadsheets/' + SHEET_ID +
            '/values/IDS_APPLI?key=' + API_KEY;
  fetch(url).then(function(r){ return r.json(); }).then(function(d){
    var rows = d.values || [];
    var pset = {};
    rows.forEach(function(row){
      var nom    = (row[0] || '').trim();
      var prenom = (row[6] || '').trim();
      if (nom) DATA.push({ nom: nom, prenom: prenom });
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

  document.addEventListener('touchstart', function(e){
    if (!state.resultShown) return;
    if (!e.target.closest('#dd-nom') && !e.target.closest('#dd-prenom')) doFullReset();
  });

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
    var val = prenomInput.value;
    if (!val) { hideDropdown(ddPrenom); return; }
    var filtered = prenoms_col_g.filter(function(p){ return matches(val,p); }).slice(0,8);
    showDropdown(ddPrenom, filtered, val, function(selected){
      prenomInput.value = selected;
      hideDropdown(ddPrenom);
      updateBtn();
    });
  });
  prenomInput.addEventListener('blur', function(){
    setTimeout(function(){ hideDropdown(ddPrenom); }, 150);
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !submitBtn.disabled) submit();
  });

  setTimeout(function(){ nomInput.focus(); }, 300);
});

function selectNom(nom) {
  state.nomSelectionne = true;
  var found = DATA.find(function(d){ return d.nom === nom; });
  state.prenomExistant = found ? found.prenom : '';
  prenomInput.value = '';
  prenomInput.placeholder = state.prenomExistant || 'Pr\u00e9nom';
  submitBtn.disabled = true;
  btnLabel.textContent = 'AJOUTER';
}

function updateBtn() {
  var prenomSaisi = prenomInput.value.trim();
  if (!prenomSaisi) { submitBtn.disabled = true; btnLabel.textContent = 'AJOUTER'; return; }
  if (state.nomSelectionne) {
    submitBtn.disabled = false;
    btnLabel.textContent = (state.prenomExistant && norm(prenomSaisi) !== norm(state.prenomExistant))
      ? 'REMPLACER' : 'AJOUTER';
  } else {
    submitBtn.disabled = !nomInput.value.trim();
    btnLabel.textContent = 'AJOUTER';
  }
}

function submit() {
  var nom    = nomInput.value.trim();
  var prenom = prenomInput.value.trim();
  if (!nom) return;

  if (state.nomSelectionne && state.prenomExistant && norm(prenom) === norm(state.prenomExistant)) {
    showFeedback('ABANDON', true);
    return;
  }

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  var action = (state.nomSelectionne && state.prenomExistant && norm(prenom) !== norm(state.prenomExistant))
    ? 'replacePrenom' : 'addAppliName';

  var url = APPS_SCRIPT_URL + '?action=' + action
    + '&name='   + encodeURIComponent(nom)
    + '&prenom=' + encodeURIComponent(prenom);

  fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(data){
      submitBtn.classList.remove('loading');
      showFeedback(data.ok ? 'AJOUT\u00c9 !' : 'ERREUR', !data.ok);
    })
    .catch(function(){
      submitBtn.classList.remove('loading');
      showFeedback('ERREUR R\u00c9SEAU', true);
    });
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
  state.resultShown    = false;
  nomInput.value       = '';
  prenomInput.value    = '';
  prenomInput.placeholder = 'Pr\u00e9nom';
  hideDropdown(ddNom);
  hideDropdown(ddPrenom);
  hideFeedback();
  btnLabel.textContent = 'AJOUTER';
  submitBtn.disabled   = true;
  submitBtn.classList.remove('loading');
}
</script>
</body>
</html>
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
      for (const row of rows) {
        const youtube = (row[0] || '').trim();
        const phrase  = (row[1] || '').trim();
        const personnes = (row[2] || '').trim();
        const date    = (row[3] || '').trim();
        const fb_ids  = (row[4] || '').trim();
        if (!youtube) continue;

        if (!isAdmin) {
          // Chercher l'ID Facebook dans la colonne fb_ids
          const ids = fb_ids.split('|').map(i => i.trim());
          if (!ids.includes(fbId)) continue;
        }

        videos.push({ youtube, titre: '', phrase, personnes, date, fb_ids });
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

      // Récupérer titres YouTube via oEmbed par lots de 10
      const fetchTitle = async (ytUrl) => {
        try {
          const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`;
          const res = await fetch(oembedUrl);
          if (!res.ok) return '';
          const d = await res.json();
          return d.title || '';
        } catch(e) { return ''; }
      };

      for (let i = 0; i < videos.length; i += 10) {
        const batch = videos.slice(i, i + 10);
        const titles = await Promise.all(
          batch.map(v => v.titre ? Promise.resolve(v.titre) : fetchTitle(v.youtube))
        );
        titles.forEach((t, j) => { if (t) videos[i + j].titre = t; });
      }

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
      for (const row of rows) {
        const youtube = (row[0] || '').trim();
        const phrase  = (row[1] || '').trim();
        const personnes = (row[2] || '').trim();
        const date    = (row[3] || '').trim();
        const fb_ids  = (row[4] || '').trim();
        if (!youtube) continue;
        if (!phrase.toLowerCase().includes(query) && !personnes.toLowerCase().includes(query)) continue;
        videos.push({ youtube, titre: '', phrase, personnes, date, fb_ids });
      }
      videos.sort((a, b) => {
        const parseDate = d => { if (!d) return 0; const p = d.split('/'); if (p.length === 3) return new Date(p[2], p[1]-1, p[0]).getTime(); return 0; };
        return parseDate(b.date) - parseDate(a.date);
      });
      // Titres YouTube
      const fetchTitle = async (ytUrl) => {
        try {
          const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`);
          if (!res.ok) return '';
          const d = await res.json();
          return d.title || '';
        } catch(e) { return ''; }
      };
      for (let i = 0; i < videos.length; i += 10) {
        const batch = videos.slice(i, i + 10);
        const titles = await Promise.all(batch.map(v => fetchTitle(v.youtube)));
        titles.forEach((t, j) => { if (t) videos[i + j].titre = t; });
      }
      return new Response(JSON.stringify({ videos }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }
      });
    } catch(e) {
      return new Response(JSON.stringify({ videos: [], error: e.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }

  // GET : lecture des sheets
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try { result[key] = await readSheet(name); }
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
