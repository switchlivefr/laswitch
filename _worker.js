export async function onRequest(context) {
  const url = new URL(context.request.url);
  const destination = 'https://laswitch.net' + url.pathname + url.search;
  return Response.redirect(destination, 301);
}
