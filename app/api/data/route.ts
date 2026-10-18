import { examples } from '../../../lib/recipe-examples';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
const json = (d: unknown, s = 200) => Response.json(d, { status: s });
export async function GET() {
    const u = await getChatGPTUser();
    if (!u)
        return json({ error: 'Connectez-vous pour ouvrir votre carnet.' }, 401);
    const db = env.DB!;
    const families = await db.prepare('SELECT f.* FROM families f JOIN members m ON m.family=f.id WHERE m.user=?').bind(u.userId).all();
    const recipes = await db.prepare('SELECT r.* FROM recipes r JOIN members m ON m.family=r.family WHERE m.user=? ORDER BY r.created DESC').bind(u.userId).all();
    const members = await db.prepare('SELECT m.* FROM members m WHERE m.family IN (SELECT family FROM members WHERE user=?)').bind(u.userId).all();
    const lists = await db.prepare('SELECT l.* FROM lists l JOIN members m ON m.family=l.family WHERE m.user=?').bind(u.userId).all();
    return json({ user: { id: u.userId, name: u.displayName }, families: families.results, recipes: recipes.results.map((r: any) => ({ ...r, ...JSON.parse(r.data) })), members: members.results, lists: lists.results, ai: !!(env as any).OPENAI_API_KEY });
}
export async function POST(req: Request) {
    const u = await getChatGPTUser();
    if (!u)
        return json({ error: 'Connexion requise' }, 401);
    if (req.headers.get('origin') !== new URL(req.url).origin)
        return json({ error: 'Origine refusée' }, 403);
    const db = env.DB!;
    try {
        const b: any = await req.json();
        const id = crypto.randomUUID();
        if (b.action === 'createFamily') {
            const name = String(b.name || '').trim().slice(0, 100);
            if (!name)
                return json({ error: 'Donnez un nom au carnet' }, 400);
            await db.batch([db.prepare('INSERT INTO families(id,name,owner,invite) VALUES(?,?,?,?)').bind(id, name, u.userId, crypto.randomUUID()), db.prepare('INSERT INTO members(id,family,user,name) VALUES(?,?,?,?)').bind(crypto.randomUUID(), id, u.userId, u.displayName)]);
            return json({ id });
        }
        if (b.action === 'join') {
            const f: any = await db.prepare('SELECT * FROM families WHERE invite=?').bind(String(b.code)).first();
            if (!f)
                return json({ error: 'Invitation introuvable ou expirée' }, 404);
            const m = await db.prepare('SELECT id FROM members WHERE family=? AND user=?').bind(f.id, u.userId).first();
            if (!m)
                await db.prepare('INSERT INTO members(id,family,user,name) VALUES(?,?,?,?)').bind(id, f.id, u.userId, u.displayName).run();
            return json({ id: f.id });
        }
        const member = await db.prepare('SELECT id FROM members WHERE family=? AND user=?').bind(String(b.family), u.userId).first();
        if (!member)
            return json({ error: 'Accès à ce carnet refusé' }, 403);
        if (b.action === 'importExamples') {
            const selected = Array.isArray(b.ids) ? examples.filter(x => b.ids.includes(x.id)) : examples;
            if (!selected.length)
                return json({ error: 'Choisissez au moins une recette' }, 400);
            const statements = selected.map(recipe => { const { id: sampleId, example, ...rest } = recipe; return db.prepare('INSERT OR IGNORE INTO recipes(id,family,creator,data,created) VALUES(?,?,?,?,?)').bind('example:' + b.family + ':' + sampleId, b.family, u.userId, JSON.stringify({ ...rest, exampleSource: sampleId }), new Date().toISOString()); });
            await db.batch(statements);
            return json({ ok: true, count: selected.length });
        }
        if (b.action === 'rotate') {
            const f: any = await db.prepare('SELECT owner FROM families WHERE id=?').bind(b.family).first();
            if (f.owner !== u.userId)
                return json({ error: 'Réservé au propriétaire' }, 403);
            await db.prepare('UPDATE families SET invite=? WHERE id=?').bind(crypto.randomUUID(), b.family).run();
            return json({ ok: true });
        }
        if (b.action === 'saveRecipe') {
            const d = b.recipe;
            if (!d || !String(d.title || '').trim() || !String(d.ingredients || '').trim() || !String(d.steps || '').trim())
                return json({ error: 'Titre, ingrédients et préparation sont obligatoires' }, 400);
            const data = JSON.stringify({ title: String(d.title).slice(0, 200), author: String(d.author || u.displayName).slice(0, 150), story: String(d.story || '').slice(0, 10000), ingredients: String(d.ingredients).slice(0, 20000), steps: String(d.steps).slice(0, 30000), category: String(d.category || 'Plats'), servings: Math.max(1, Math.min(100, Number(d.servings) || 4)), time: String(d.time || ''), photo: (String(d.photo || '').startsWith('/api/photo?') || examples.some(r => r.photo && r.photo === d.photo)) ? String(d.photo) : '', parent: d.parent || null, exampleSource: examples.some(r => r.id === d.exampleSource) ? d.exampleSource : undefined });
            if (d.parent) {
                const p = await db.prepare('SELECT id FROM recipes WHERE id=? AND family=?').bind(d.parent, b.family).first();
                if (!p)
                    return json({ error: 'Recette originale introuvable' }, 400);
            }
            if (d.id) {
                const r: any = await db.prepare('SELECT creator FROM recipes WHERE id=? AND family=?').bind(d.id, b.family).first();
                if (!r || r.creator !== u.userId)
                    return json({ error: 'Seul l’auteur peut modifier cette recette' }, 403);
                await db.prepare('UPDATE recipes SET data=? WHERE id=? AND family=?').bind(data, d.id, b.family).run();
            }
            else
                await db.prepare('INSERT INTO recipes(id,family,creator,data,created) VALUES(?,?,?,?,?)').bind(id, b.family, u.userId, data, new Date().toISOString()).run();
            return json({ ok: true });
        }
        if (b.action === 'deleteRecipe') {
            const recipe:any = await db.prepare('SELECT creator FROM recipes WHERE id=? AND family=?').bind(b.id,b.family).first();
            if (!recipe) return json({error:'Cette recette est introuvable dans ce carnet'},404);
            if (recipe.creator !== u.userId) return json({error:'Seul l’auteur peut supprimer cette recette'},403);
            await db.prepare('DELETE FROM recipes WHERE id=? AND family=? AND creator=?').bind(b.id, b.family, u.userId).run();
            return json({ ok: true });
        }
        if (b.action === 'list') {
            if (!Array.isArray(b.items) || b.items.length > 500)
                return json({ error: 'Liste invalide' }, 400);
            await db.prepare('INSERT INTO lists(family,data) VALUES(?,?) ON CONFLICT(family) DO UPDATE SET data=excluded.data').bind(b.family, JSON.stringify(b.items)).run();
            return json({ ok: true });
        }
        return json({ error: 'Action inconnue' }, 400);
    }
    catch {
        return json({ error: 'Impossible d’enregistrer. Réessayez.' }, 400);
    }
}
