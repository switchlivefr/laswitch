const SHEET_ID = '1Z8GftsfaAgwDNuXLMTNrQwCV6V5W-hpHlI893INosSw';
const API_KEY  = 'AIzaSyCTADjNIhq3jXSJiI_WO_jPsp63pTklT_A';

const SHEETS = {
  'switch':   'SWiTCH',
  'osl':      'OSLSWiTCH',
  'pitchSw':  'PITCH SWiTCH',
  'regles':   'REGLES',
  'pitchOsl': 'PITCH ONE SHOT LIVE'
};

// Get hidden rows for a sheet using spreadsheets.get with rowMetadata
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
  // Get values
  const valUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(name)}?key=${API_KEY}`;
  const valRes = await fetch(valUrl);
  const valData = await valRes.json();
  if (valData.error) throw new Error(valData.error.message);
  
  const allRows = (valData.values || []).map(row => row.map(cell => String(cell || '').trim()));
  
  // Get hidden rows
  const hiddenRows = await getHiddenRows(name);
  
  // Filter out hidden rows
  const rows = allRows.filter((_, i) => !hiddenRows[i]);
  
  return { rows, sheetName: name };
}

exports.handler = async function() {
  try {
    const result = {};
    for (const [key, name] of Object.entries(SHEETS)) {
      try { result[key] = await readSheet(name); }
      catch(e) { result[key] = { error: e.message }; }
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(result)
    };
  } catch(err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
