import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import app, { Room } from '../worker.js';

class D1 {
  constructor() { this.db=new DatabaseSync(':memory:'); this.db.exec(readFileSync(new URL('../migrations/0001_auth.sql',import.meta.url),'utf8')); }
  prepare(sql){ const statement=this.db.prepare(sql); const handle=(params)=>({first:async()=>statement.get(...params)||null,all:async()=>({results:statement.all(...params)}),run:async()=>({meta:{changes:statement.run(...params).changes}})});return {...handle([]),bind(...params){return handle(params)}}; }
}
class Storage { data=new Map(); async get(key){return structuredClone(this.data.get(key));} async put(key,val){this.data.set(key,structuredClone(val));} }
const db=new D1(), room=new Room({storage:new Storage()});
const env={ DB:db, ADMIN_PASSWORD:'UmaSenhaMuitoForte-NaoReal-789', ROOM:{idFromName:code=>code,get:()=>room}, ASSETS:{fetch:async()=>new Response('homepage')} };
const host='https://rpg.test';
async function call(path, data, cookies='',origin=host){const req=new Request(host+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{Origin:origin,'Content-Type':'application/json'}),...(cookies?{Cookie:cookies}:{})},body:data===undefined?undefined:JSON.stringify(data)});const res=await app.fetch(req,env);return {status:res.status, data:await res.json(),cookie:res.headers.get('Set-Cookie')?.split(';')[0]||''};}
const strong='UmaSenhaDeTeste!123';
let r=await call('/api/auth/register',{username:'Jogador1',email:'jogador@exemplo.com',password:strong});assert.equal(r.status,201);
r=await call('/api/auth/login',{login:'Jogador1',password:strong});assert.equal(r.status,403);
r=await call('/api/admin/login',{password:'nao-e-a-senha'});assert.equal(r.status,401);
r=await call('/api/admin/login',{password:env.ADMIN_PASSWORD});assert.equal(r.status,200);const adminCookie=r.cookie;
r=await call('/api/admin/users',undefined,adminCookie);assert.equal(r.data.users.length,1);const uid=r.data.users[0].id;
r=await call('/api/admin/decision',{id:uid,status:'approved'},adminCookie);assert.equal(r.status,200);
r=await call('/api/auth/login',{login:'Jogador1',password:strong});assert.equal(r.status,200);const playerCookie=r.cookie;
r=await call('/api/auth/me',undefined,playerCookie);assert.equal(r.data.authenticated,true);
r=await call('/api/ABCD/create',{game:'jjk',capacity:2},playerCookie);assert.equal(r.status,200);const roomToken=r.data.tok;
r=await call('/api/auth/register',{username:'Convidado2',email:'convidado@exemplo.com',password:strong});assert.equal(r.status,201);
let newId=(await call('/api/admin/users',undefined,adminCookie)).data.users.find(u=>u.username==='Convidado2').id;
await call('/api/admin/decision',{id:newId,status:'approved'},adminCookie);
r=await call('/api/auth/login',{login:'Convidado2',password:strong});const guestCookie=r.cookie;
r=await call('/api/ABCD/join',{},guestCookie);assert.equal(r.data.slot,2);
r=await call('/api/ABCD/act',{slot:2,i:0,s:0},guestCookie);assert.equal(r.status,409);
r=await call('/api/ABCD/state',{tok:roomToken,snap:{o:2,b:[['Atacar',0]],h:'Teste'}},playerCookie);assert.equal(r.status,200);
r=await call('/api/ABCD/act',{slot:1,i:0,s:1},guestCookie);assert.equal(r.status,403);
r=await call('/api/ABCD/act',{slot:2,i:0,s:1},guestCookie);assert.equal(r.status,200);
r=await call('/api/ABCD/act',{slot:2,i:0,s:0},guestCookie);assert.equal(r.status,409);
r=await call('/api/auth/login',{login:'Jogador1',password:strong},'', 'https://evil.example');assert.equal(r.status,403);
r=await call('/api/admin/decision',{id:newId,status:'blocked'},adminCookie);assert.equal(r.status,200);
r=await call('/api/ABCD/state',undefined,guestCookie);assert.equal(r.status,401);
r=await call('/api/auth/login',{login:'Convidado2',password:strong});assert.equal(r.status,403);
// A troca do segredo deve revogar sessões administrativas anteriores.
env.ADMIN_PASSWORD='NovaSenhaAdminMuitoForte!456';
r=await call('/api/admin/users',undefined,adminCookie);assert.equal(r.status,403);
r=await call('/api/admin/login',{password:env.ADMIN_PASSWORD});assert.equal(r.status,200);
console.log('PASS: 23 verificações de cadastro, administração, segurança e multiplayer');
