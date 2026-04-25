// Cloudflare Pages middleware — content negotiation for vendor pages.
// When Accept: text/markdown is requested on /vendors/<slug>, serves the
// pre-built companion .md file from the static asset bundle.
type ASSETSBinding = { fetch(request: Request): Promise<Response> };

export const onRequest = async (context: {
  request: Request;
  next(): Promise<Response>;
  env: { ASSETS: ASSETSBinding };
}): Promise<Response> => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  const match = url.pathname.match(/^\/vendors\/([^/]+)\/?$/);
  if (match) {
    const accept = request.headers.get('Accept') ?? '';
    if (accept.includes('text/markdown')) {
      const slug = match[1];
      const mdRequest = new Request(new URL(`/vendors/${slug}.md`, url));
      const mdResponse = await env.ASSETS.fetch(mdRequest);
      if (mdResponse.ok) {
        return new Response(mdResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }
  }

  return next();
};
