import test from 'node:test';import assert from 'node:assert/strict';
import {initialDemo,startDemoTask,advanceDemo} from '../ui/demo.js';
test('public state is synthetic with 22 roles and no private records or credentials',()=>{
 const s=initialDemo(0);assert.equal(s.businesses.length*s.roles.length,22);assert.equal(s.tasks.length,2);assert.ok(s.tasks.every(t=>t.id.startsWith('demo-')));assert.doesNotMatch(JSON.stringify(s),/Bearer|access-token|trycloudflare|\/Users\/|@/);
});
test('a visitor brief stays in its selected business and respects three session capacity',()=>{
 let s=initialDemo(0);s=startDemoTask(s,{businessId:'devsense',roleId:'email',prompt:'Try sample copy'},1);assert.equal(s.tasks.at(-1)?.businessId,'devsense');assert.equal(s.tasks.at(-1)?.roleId,'email');
 assert.throws(()=>startDemoTask(s,{businessId:'beleza',roleId:'email',prompt:'Fourth'},2),/three/i);assert.throws(()=>startDemoTask(s,{businessId:'unknown',roleId:'email',prompt:'x'},3));
});
test('simulated completion creates labeled sample output and downstream handoffs, never a sent action',()=>{
 const next=advanceDemo(initialDemo(0),12000);assert.ok(next.tasks.some(t=>t.status==='completed'));assert.ok(next.tasks.some(t=>t.roleId==='prospects'&&t.status==='working'));assert.ok(next.tasks.filter(t=>t.status==='working').length<=3);assert.ok(next.drafts.every(d=>d.content.includes('sample')));assert.doesNotMatch(JSON.stringify(next),/email sent|post published/i);
});
test('blank and excessive briefs cannot enter the demo and a fresh reset discards visitor text',()=>{
 const s=initialDemo(0);assert.throws(()=>startDemoTask(s,{businessId:'beleza',roleId:'email',prompt:' '},1));assert.throws(()=>startDemoTask(s,{businessId:'beleza',roleId:'email',prompt:'x'.repeat(2001)},1));
 const edit=startDemoTask(s,{businessId:'beleza',roleId:'email',prompt:'Visitor private example'},1);assert.match(JSON.stringify(edit),/Visitor private example/);assert.doesNotMatch(JSON.stringify(initialDemo(0)),/Visitor private example/);
});
