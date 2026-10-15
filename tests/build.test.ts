import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {readFileSync,existsSync} from 'node:fs';import {join} from 'node:path';
test('share build uses relative asset paths and blocks API/network connections',()=>{
 const r=spawnSync(process.execPath,['build.mjs'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const html=readFileSync('dist/index.html','utf8');assert.match(html,/connect-src 'none'/);assert.match(html,/Public demo/);
 for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){assert.ok(!m[1].startsWith('/'));assert.ok(existsSync(join('dist',m[1])))}
 const js=readFileSync(join('dist',html.match(/src="([^"]+\.js)"/)![1]),'utf8');assert.doesNotMatch(js,/trycloudflare\.com|\/api\/state|studio-token|access-token|\/Users\//);
});
