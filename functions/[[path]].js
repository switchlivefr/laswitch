export async function onRequest(context) {
  const url = new URL(context.request.url);
  const destination = 'https://laswitch.net' + url.pathname + url.search;
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${destination}">
  <link rel="canonical" href="${destination}">
  <title>La SWiTCH</title>
</head>
<body>
  <p>Redirection en cours... <a href="${destination}">Cliquez ici</a></p>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}
