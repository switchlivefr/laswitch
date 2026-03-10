const SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
const API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';
const SHEETS = {
  'switch':       'SWiTCH',
  'osl':          'OSLSWiTCH',
  'pitchSw':      'PITCH SWiTCH',
  'regles':       'REGLES',
  'pitchOsl':     'PITCH ONE SHOT LIVE',
  'inscriptions': 'INSCRIPTIONS'
};
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRxLRh2URcPDRhMKC9mQwDsToEBTGCkrRrULgAFqYSvaldTh2wWRZGP7vbZa9eMYWP/exec';
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
  const allRows = (data.values || []).map(row => row.map(cell => String(cell || '').trim()));
  const hiddenRows = await getHiddenRows(name);
  return { rows: allRows.filter((_, i) => !hiddenRows[i]), sheetName: name };
}
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'POST' && action === 'setMode') {
    try {
      const body = await request.json();
      const mode = body.mode === 'gif' ? 'gif' : 'video';
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


  // GET : lecture des sheets
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try { result[key] = await readSheet(name); }
      catch(e) { result[key] = { error: e.message }; }
    }
    const homeMode = await env.LASWITCH_KV.get('home_mode');
    const resaMode = await env.LASWITCH_KV.get('resa_mode');
    result.homeMode = homeMode || 'video';
    result.resaMode = resaMode || 'on';
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
