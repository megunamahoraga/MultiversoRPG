// Multiverso RPG — autenticação com D1, moderação e salas com Durable Objects.
// Necessário: binding DB (D1), secret ADMIN_PASSWORD e migration 0001_auth.sql.
const COOKIE = 'mvrpg_session';
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;
const te = new TextEncoder();
const json = (o, status=200, headers={}) => new Response(JSON.stringify(o), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const err = (message,status=400) => json({err:message},status);
const sha = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const hex = (b) => Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const makeHash = async (pass,salt) => hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:te.encode(salt),iterations:130000},await crypto.subtle.importKey('raw',te.encode(pass),'PBKDF2',false,['deriveBits']),256));
const safeSame = (a,b) => {const x=te.encode(a),y=te.encode(b); let diff=x.length^y.length; for(let i=0;i<Math.max(x.length,y.length);i++)diff |= (x[i]||0)^(y[i]||0);return diff===0;};
const cookieValue = req => (req.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
const cookie = (token,req,clear=false) => `${COOKIE}=${clear?'':token}; Path=/; HttpOnly; SameSite=Strict; ${new URL(req.url).protocol==='https:'?'Secure; ':''}${clear?'Max-Age=0':'Max-Age='+Math.floor(SESSION_MS/1000)}`;
const requireOrigin = req => { if(req.method==='GET'||req.method==='HEAD')return true;const origin=req.headers.get('Origin');return !!origin && origin === new URL(req.url).origin; };
async function rateLimit(env, key, limit, period){
 const now=Date.now(), expires=now+period;
 await env.DB.prepare(`INSERT INTO auth_limits(key,count,expires) VALUES(?,1,?)
   ON CONFLICT(key) DO UPDATE SET
   count=CASE WHEN auth_limits.expires<=? THEN 1 ELSE auth_limits.count+1 END,
   expires=CASE WHEN auth_limits.expires<=? THEN excluded.expires ELSE auth_limits.expires END`)
  .bind(key,expires,now,now).run();
 const row=await env.DB.prepare('SELECT count FROM auth_limits WHERE key=?').bind(key).first();
 return Number(row?.count||0)<=limit;
}
async function getSession(req,env){const token=cookieValue(req);if(!/^[a-f0-9]{64}$/.test(token))return null;const h=await sha(token),adminHash=await sha(token+'|ADMIN|'+(env.ADMIN_PASSWORD||''));const s=await env.DB.prepare('SELECT s.user_id,s.role,s.expires,u.username,u.status FROM sessions s LEFT JOIN users u ON s.user_id=u.id WHERE s.token_hash IN (?,?)').bind(h,adminHash).first();if(!s||s.expires<Date.now()||(s.role==='player'&&s.status!=='approved'))return null;return s;}
async function makeSession(env,id,role,req,username){const token=randomToken(),hash=await sha(role==='admin'?token+'|ADMIN|'+env.ADMIN_PASSWORD:token),exp=Date.now()+(role==='admin'?8*60*60*1000:SESSION_MS);await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,role,expires,created_at) VALUES(?,?,?,?,?)').bind(hash,id,role,exp,Date.now()).run();return json({ok:true,role,username},200,{'Set-Cookie':cookie(token,req)});}
async function authRoute(req,env,path){
 if(!env.DB)return err('Banco D1 não configurado. Veja LEIA-ME.md.',503);
 const op=path.replace('/api/auth/',''), post=req.method==='POST';
 if(op==='me'&&req.method==='GET'){const user=await getSession(req,env);return json(user?{authenticated:true,role:user.role,username:user.username||'Administrador'}:{authenticated:false});}
 if(op==='logout'&&post){const token=cookieValue(req);if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash IN (?,?)').bind(await sha(token),await sha(token+'|ADMIN|'+(env.ADMIN_PASSWORD||''))).run();return json({ok:true},200,{'Set-Cookie':cookie('',req,true)});}
 if(op==='register'&&post){const ip=req.headers.get('CF-Connecting-IP')||'unknown';if(!await rateLimit(env,'register:'+ip,5,3600000))return err('Muitos cadastros. Tente mais tarde.',429);
  const j=await req.json().catch(()=>({}));const name=String(j.username||'').trim(),email=String(j.email||'').trim().toLowerCase(),password=String(j.password||'');
  if(!/^[a-zA-Z0-9_]{3,24}$/.test(name))return err('Usuário deve ter 3 a 24 letras, números ou _.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160)return err('E-mail inválido.');
  if(password.length<10||password.length>128)return err('A senha deve ter entre 10 e 128 caracteres.');
  if(!await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('registrations').first().then(x=>!x||x.value!=='disabled'))return err('Novos cadastros estão desativados.',403);
  const salt=randomToken(),passHash=await makeHash(password,salt),id=crypto.randomUUID();
  try{await env.DB.prepare('INSERT INTO users(id,username,email,password_hash,salt,status,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,name,email,passHash,salt,'pending',Date.now()).run();}catch(e){return err('Usuário ou e-mail já cadastrado.',409);}
  return json({ok:true,message:'Cadastro enviado! Aguarde a aprovação do administrador.'},201);
 }
 if(op==='login'&&post){const ip=req.headers.get('CF-Connecting-IP')||'unknown';if(!await rateLimit(env,'login:'+ip,15,15*60000))return err('Muitas tentativas. Tente novamente em 15 minutos.',429);
  const j=await req.json().catch(()=>({})),login=String(j.login||'').trim(),pass=String(j.password||'');if(!login||!pass)return err('Informe usuário e senha.');
  const u=await env.DB.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE OR email=? COLLATE NOCASE').bind(login,login).first();
  if(!u||!safeSame(await makeHash(pass,u.salt),u.password_hash))return err('Usuário ou senha inválidos.',401);
  if(u.status==='pending')return err('Cadastro aguardando aprovação do administrador.',403);
  if(u.status==='blocked')return err('Acesso bloqueado pelo administrador.',403);
  if(u.status==='rejected')return err('Cadastro não aprovado.',403);
  return makeSession(env,u.id,'player',req,u.username);
 }
 return err('Rota inválida.',404);
}
async function adminRoute(req,env,path){
 if(!env.DB)return err('Banco D1 não configurado.',503);
 const op=path.replace('/api/admin/','');
 if(op==='login'&&req.method==='POST'){
  const ip=req.headers.get('CF-Connecting-IP')||'unknown';if(!await rateLimit(env,'admin:'+ip,6,15*60000))return err('Muitas tentativas. Aguarde 15 minutos.',429);
  if(!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD.length<12)return err('Defina um segredo ADMIN_PASSWORD forte (mínimo 12 caracteres) na Cloudflare.',503);
  const j=await req.json().catch(()=>({}));if(!safeSame(await sha(String(j.password||'')),await sha(env.ADMIN_PASSWORD)))return err('Senha administrativa incorreta.',401);
  return makeSession(env,null,'admin',req,'Administrador');
 }
 const s=await getSession(req,env);if(!s||s.role!=='admin')return err('Acesso restrito ao administrador.',403);
 if(op==='users'&&req.method==='GET'){
  const rows=await env.DB.prepare('SELECT id,username,email,status,created_at FROM users ORDER BY CASE status WHEN \'pending\' THEN 0 WHEN \'approved\' THEN 1 ELSE 2 END,created_at DESC LIMIT 500').all();return json({users:rows.results||[]});
 }
 if(op==='decision'&&req.method==='POST'){
  const j=await req.json().catch(()=>({})),status=String(j.status||''),id=String(j.id||'');if(!['approved','rejected','blocked','pending'].includes(status)||!id)return err('Ação inválida.');
  const r=await env.DB.prepare('UPDATE users SET status=? WHERE id=?').bind(status,id).run();if(!r.meta?.changes)return err('Jogador não encontrado.',404);
  if(status!=='approved')await env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(id).run();return json({ok:true});
 }
 if(op==='settings'&&req.method==='GET'){const v=await env.DB.prepare('SELECT value FROM settings WHERE key=?').bind('registrations').first();return json({registrations:v?.value!=='disabled'});}
 if(op==='settings'&&req.method==='POST'){const j=await req.json().catch(()=>({}));if(typeof j.registrations!=='boolean')return err('Configuração inválida.');await env.DB.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('registrations',j.registrations?'enabled':'disabled').run();return json({ok:true});}
 return err('Rota inválida.',404);
}
export class Room {
 constructor(state){this.s=state;this.d=null;}
 async load(){if(!this.d)this.d=(await this.s.storage.get('d'))||{v:0,snap:null,acts:[],n:0,q:0,tok:null,capacity:4,game:'jjk',members:{}};return this.d;}
 async fetch(req){const u=new URL(req.url),op=u.pathname.split('/').pop(),q=u.searchParams,d=await this.load(),uid=req.headers.get('X-RPG-Verified-User');
  if(!uid)return err('Não autorizado.',401);
  const j=req.method==='POST'?await req.json().catch(()=>({})):{};
  const save=()=>this.s.storage.put('d',d);
  d.members=d.members||{};
  if(op==='create'&&req.method==='POST'){
   if(d.tok)return err('exists',409);
   const capacity=Number(j.capacity);if(!Number.isSafeInteger(capacity)||capacity<1||capacity>100)return err('Escolha entre 1 e 100 jogadores.');
   if(!['jjk','ghoul','db','ds'].includes(j.game))return err('Campanha inválida.');
   d.game=j.game;d.capacity=capacity;d.tok=crypto.randomUUID();d.n=1;d.hostUser=uid;d.members[uid]=1;await save();return json({tok:d.tok,game:d.game});
  }
  if(!d.tok)return err('Sala não encontrada. Confira o código.',404);
  if(op==='join'&&req.method==='POST'){
   let slot=d.members[uid];if(!slot){if(d.n>=d.capacity)return err('Sala lotada.',409);slot=++d.n;d.members[uid]=slot;await save();}
   return json({slot,capacity:d.capacity,game:d.game});
  }
  if(!d.members[uid])return err('Entre nesta sala primeiro.',403);
  if(op==='state'&&req.method==='POST'){
   if(uid!==d.hostUser||j.tok!==d.tok)return err('Somente o anfitrião pode atualizar o jogo.',403);
   if(!j.snap||typeof j.snap!=='object'||Array.isArray(j.snap)||!Array.isArray(j.snap.b)||!Number.isSafeInteger(j.snap.o)||j.snap.o<1||j.snap.o>d.n)return err('Estado inválido.');
   if(j.snap.b.length>81||j.snap.b.some(b=>!Array.isArray(b)||b.length>5))return err('Botões inválidos.',413);
   const raw=JSON.stringify(j.snap);if(raw.length>200000)return err('Estado muito grande.',413);
   d.v++;j.snap.ver=d.v;d.snap=j.snap;await save();return json({v:d.v});
  }
  if(op==='state'&&req.method==='GET')return +q.get('v')===d.v?json({v:d.v}):json({v:d.v,snap:d.snap});
  if(op==='act'&&req.method==='POST'){
   if(d.members[uid]===1||j.slot!==d.members[uid])return err('Jogador inválido.',403);
   if(!Number.isSafeInteger(j.i)||j.i<0||j.i>80||!Number.isSafeInteger(j.s))return err('Ação inválida.');
   if(!d.snap||d.snap.o!==d.members[uid]||j.s!==d.v)return err('Aguarde a sua vez ou atualize a sala.',409);
   if(!Array.isArray(d.snap.b)||j.i>=d.snap.b.length||d.snap.b[j.i][1])return err('Esta opção não está disponível neste turno.',409);
   d.q++;d.acts.push({q:d.q,p:d.members[uid],i:j.i,s:j.s,v:typeof j.v==='string'?j.v.slice(0,128):null});d.acts=d.acts.slice(-30);await save();return json({ok:1});
  }
  if(op==='acts'&&req.method==='GET'){
   if(uid!==d.hostUser||q.get('tok')!==d.tok)return err('Acesso negado.',403);
   const after=+q.get('after')||0;return json({n:d.n,capacity:d.capacity,acts:d.acts.filter(x=>x.q>after)});
  }
  return err('Rota inválida.',404);
 }
}
export default {
 async fetch(req,env){const url=new URL(req.url),path=url.pathname;
  if(!path.startsWith('/api/'))return env.ASSETS?env.ASSETS.fetch(req):new Response('Página não encontrada.',{status:404});
  if(!requireOrigin(req))return err('Origem não autorizada.',403);
  try{
   if(path.startsWith('/api/auth/'))return authRoute(req,env,path);
   if(path.startsWith('/api/admin/'))return adminRoute(req,env,path);
   if(!env.DB)return err('Banco D1 não configurado.',503);
   const session=await getSession(req,env);if(!session)return err('Faça login com uma conta aprovada.',401);
   if(session.role!=='player')return err('Entre com uma conta de jogador para participar.',403);
   const m=path.match(/^\/api\/([A-Z0-9]{4,8})\/(create|join|state|act|acts)$/);if(!m)return err('Rota não encontrada.',404);
   const h=new Headers(req.headers);h.set('X-RPG-Verified-User',session.user_id);
   const verified=new Request(req,{headers:h});return env.ROOM.get(env.ROOM.idFromName(m[1])).fetch(verified);
  }catch(e){console.error('RPG API error',String(e));return err('Erro interno. Verifique o banco e as configurações do servidor.',500);}
 }
};
