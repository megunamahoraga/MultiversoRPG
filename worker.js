// Servidor do RPG online: guarda salas e repassa as jogadas entre os celulares.
export class Room {
  constructor(state) { this.s = state; this.d = null; }
  async load() {
    if (!this.d) this.d = (await this.s.storage.get("d")) || { v: 0, snap: null, acts: [], n: 0, q: 0, tok: null, capacity: 4 };
    return this.d;
  }
  async fetch(req) {
    const u = new URL(req.url), op = u.pathname.split("/").pop(), q = u.searchParams, d = await this.load();
    const j = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const out = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: { "Content-Type": "application/json" } });
    const save = () => this.s.storage.put("d", d);
    if (op === "create") {
      if (d.tok) return out({ err: "exists" }, 409);
      const capacity = Number(j.capacity);
      if (!Number.isSafeInteger(capacity) || capacity < 1) return out({ err: "Quantidade de jogadores inválida" }, 400);
      d.capacity = capacity; d.tok = crypto.randomUUID(); d.n = 1; await save();
      return out({ tok: d.tok });
    }
    if (!d.tok) return out({ err: "Sala não encontrada. Confira o código." }, 404);
    if (op === "join") {
      let s = +q.get("s") || 0;
      if (!(Number.isSafeInteger(s) && s >= 2 && s <= d.n)) {
        if (d.n >= d.capacity) return out({ err: "Sala lotada. Peça ao anfitrião para criar outra sala." }, 409);
        s = ++d.n; await save();
      }
      return out({ slot: s, capacity: d.capacity });
    }
    if (op === "state" && req.method === "POST") {
      if (j.tok !== d.tok) return out({ err: "no" }, 403);
      if (!j.snap || typeof j.snap !== "object") return out({ err: "Estado inválido" }, 400);
      d.v++; j.snap.ver = d.v; d.snap = j.snap;
      return out({ v: d.v });
    }
    if (op === "state") return +q.get("v") === d.v ? out({ v: d.v }) : out({ v: d.v, snap: d.snap });
    if (op === "act") {
      if (!Number.isSafeInteger(j.slot) || j.slot < 2 || j.slot > d.n) return out({ err: "Jogador inválido" }, 403);
      d.q++; d.acts.push({ q: d.q, p: j.slot, i: j.i, s: j.s, v: j.v }); d.acts = d.acts.slice(-30);
      return out({ ok: 1 });
    }
    if (op === "acts") {
      if (q.get("tok") !== d.tok) return out({ err: "no" }, 403);
      const a = +q.get("after") || 0;
      return out({ n: d.n, capacity: d.capacity, acts: d.acts.filter(x => x.q > a) });
    }
    return out({ err: "?" }, 404);
  }
}
export default {
  async fetch(req, env) {
    const m = new URL(req.url).pathname.match(/^\/api\/([A-Z0-9]{4,8})\/(\w+)$/);
    if (!m) return new Response("Not found", { status: 404 });
    return env.ROOM.get(env.ROOM.idFromName(m[1])).fetch(req);
  }
};
