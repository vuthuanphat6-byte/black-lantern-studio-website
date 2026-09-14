import assert from 'node:assert/strict';
const origin='https://blacklantern.games';
async function get(path,options={}) {
  return fetch(new URL(path,origin),{signal:AbortSignal.timeout(15000),redirect:'manual',...options});
}
const sitemapResponse=await get('/sitemap-0.xml');
assert.equal(sitemapResponse.status,200);
const sitemap=await sitemapResponse.text();
const pages=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>new URL(m[1]));
const assets=new Set(['/robots.txt','/sitemap-index.xml','/social.jpg','/favicon.png','/downloads/black-lantern-press-kit.zip','/api/health']);
for(const url of pages){
  assert.equal(url.origin,origin);
  const response=await get(url.pathname);
  assert.equal(response.status,200,url.pathname);
  assert.ok(!response.headers.get('x-robots-tag')?.includes('noindex'));
  assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  const html=await response.text();
  assert.ok(!html.includes('static.cloudflareinsights.com'),'Unexpected injected analytics');
  assert.ok(html.includes('href="'+url.href+'"'),url.pathname+' canonical');
  assert.equal([...html.matchAll(/<h1\b/g)].length,1);
  assert.ok(!/<meta[^>]+name="robots"[^>]+noindex/.test(html));
  for(const match of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)){
    const path=match[1];if(path.startsWith('/_astro/')||path.startsWith('/downloads/'))assets.add(path);
  }
  console.log('PAGE 200 '+url.pathname);
}
for(const path of assets){const response=await get(path,{method:'HEAD'});assert.equal(response.status,200,path);}
assert.equal((await get('/not-a-real-black-lantern-page/')).status,404);
assert.equal((await get('/.env')).status,404);
assert.equal((await get('/api/contact')).status,405);
const redirect=await fetch('http://blacklantern.games/tro-choi/?qa=1',{redirect:'manual',signal:AbortSignal.timeout(15000)});
assert.equal(redirect.status,308);
assert.equal(redirect.headers.get('location'),origin+'/tro-choi/?qa=1');
console.log(JSON.stringify({ok:true,pages:pages.length,assets:assets.size,httpsRedirect:true,real404:true,checkedAt:new Date().toISOString()}));
