const SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
const API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';

const SHEETS = {
  'switch':   'SWiTCH',
  'osl':      'OSLSWiTCH',
  'pitchSw':  'PITCH SWiTCH',
  'regles':   'REGLES',
  'pitchOsl': 'PITCH ONE SHOT LIVE'
};

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
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try { result[key] = await readSheet(name); }
      catch(e) { result[key] = { error: e.message }; }
    }
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
