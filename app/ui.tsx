'use client';
import { useEffect, useRef, useState } from 'react';
import { BookOpen, Plus, Search, Heart, Users, ShoppingBasket, ArrowUpRight, Clock, Camera, Mic, X, ChevronRight, ArrowLeft, Download, Check, Copy, Leaf, ChefHat, Trash2, LogOut, Sparkles, Menu, NotebookPen, Share2, ChevronDown, ArrowRight, SlidersHorizontal, CheckCircle2, Lock, MoreHorizontal } from 'lucide-react';
import VoiceRecipe from './voice-recipe';
import StepImprover from './step-improver';
import PhotoImport from './photo-import';
import type {ExtractedRecipe} from '../lib/recipe-ocr';
import { examples, type Recipe } from '../lib/recipe-examples';
import { groceryLines, grocerySearchUrl, groceryExport, merchants, type Merchant, type GroceryLine } from '../lib/grocery';
const blank: Recipe = { title: '', author: '', story: '', ingredients: '', steps: '', category: 'Plats', servings: 4, time: '', photo: '' };
export default function App() {
    const [data, setData] = useState<any>(null), [ready, setReady] = useState(false), [family, setFamily] = useState(''), [view, setView] = useState('recipes'), [search, setSearch] = useState(''), [category, setCategory] = useState('Toutes'), [modal, setModal] = useState(''), [selected, setSelected] = useState<Recipe | null>(null), [draft, setDraft] = useState<Recipe>({ ...blank }), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [familyName, setFamilyName] = useState(''), [joinCode, setJoinCode] = useState(''), [dictation, setDictation] = useState(''), [list, setList] = useState<any[]>([]), [chosen, setChosen] = useState<string[]>([]), [recording, setRecording] = useState(false), [mobile, setMobile] = useState(false), [editorStep, setEditorStep] = useState(0), [sort, setSort] = useState('recent'), [cookMode, setCookMode] = useState(false), [doneSteps, setDoneSteps] = useState<number[]>([]), [loadError, setLoadError] = useState(false), [discard, setDiscard] = useState(false), [scope, setScope] = useState('saved'), [orderSource, setOrderSource] = useState<Recipe | null>(null), [orderLines, setOrderLines] = useState<GroceryLine[]>([]), [orderPortions, setOrderPortions] = useState(4), [searched, setSearched] = useState<string[]>([]);
    const [merchant,setMerchant]=useState<Merchant>('carrefour');
    const shop=merchants[merchant];
    const closeRef = useRef<() => void>(() => { });
    const recognition = useRef<any>(null), fileRef = useRef<HTMLInputElement>(null);
    async function load() {
        setLoadError(false);
        try {
            const res = await fetch('/api/data');
            if (res.ok) {
                const d: any = await res.json();
                setData(d);
                setFamily(f => d.families.some((x: any) => x.id === f) ? f : d.families[0]?.id || '');
            }
            else if (res.status !== 401) {
                setLoadError(true);
            }
        }
        catch {
            setLoadError(true);
        }
        finally {
            setReady(true);
        }
    }
    useEffect(() => {
        load();
        const code = new URLSearchParams(location.search).get('invitation');
        if (code) {
            setJoinCode(code);
            setModal('join');
        }
    }, []);
    useEffect(() => { const l = data?.lists.find((x: any) => x.family === family); setList(l ? JSON.parse(l.data) : []); setChosen([]); }, [family, data]);
    useEffect(() => {
        if (message) {
            const t = setTimeout(() => setMessage(''), 6500);
            return () => clearTimeout(t);
        }
    }, [message]);
    useEffect(() => {
        if (!modal && !selected)
            return;
        const prior = document.activeElement as HTMLElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const timer = setTimeout(() => { const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]'); const dialog = dialogs[dialogs.length - 1]; dialog?.focus(); }, 40);
        function key(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (discard)
                    setDiscard(false);
                else
                    closeRef.current();
            }
            if (e.key === 'Tab') {
                const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
                const dialog = dialogs[dialogs.length - 1];
                if (!dialog)
                    return;
                const all = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]')].filter(el => el.offsetParent !== null);
                const first = all[0], last = all[all.length - 1];
                if (!first) {
                    e.preventDefault();
                    return;
                }
                if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
        document.addEventListener('keydown', key);
        return () => { clearTimeout(timer); document.body.style.overflow = overflow; document.removeEventListener('keydown', key); prior?.focus(); };
    }, [modal, selected?.id, discard]);
    useEffect(() => { setDoneSteps([]); setCookMode(false); }, [selected?.id]);
    useEffect(() => () => recognition.current?.stop(), []);
    async function api(body: any) {
        const r = await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, family: body.family || family }) });
        const d: any = await r.json();
        if (!r.ok)
            throw new Error(d.error || 'Une erreur est survenue');
        return d;
    }
    async function act(fn: () => Promise<void>) {
        setBusy(true);
        try {
            await fn();
        }
        catch (e: any) {
            setMessage(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    const active = data?.families.find((x: any) => x.id === family);
    const savedRecipes: Recipe[] = data ? data.recipes.filter((x: Recipe) => x.family === family) : [];
    const recipes: Recipe[] = [...savedRecipes, ...examples.filter(x => !savedRecipes.some(r => r.exampleSource === x.id))];
    const collectionRecipes = scope === 'examples' ? examples : savedRecipes;
    const filtered = collectionRecipes.filter(x => (category === 'Toutes' || x.category === category) && (x.title + ' ' + x.author + ' ' + x.ingredients).toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title, 'fr') : 0);
    const members = data?.members.filter((x: any) => x.family === family) || [];
    const mustLogin = () => {
        if (!data) {
            location.href = '/signin-with-chatgpt?return_to=' + encodeURIComponent(location.pathname + location.search);
            return true;
        }
        if (!family) {
            setModal('family');
            return true;
        }
        return false;
    };
    function create() {
        if (mustLogin())
            return;
        setDraft({ ...blank, author: data.user.name });
        setDictation('');
        setEditorStep(0);
        setSelected(null);
        setModal('edit');
    }
    function startVoice(){if(mustLogin())return;setDraft({...blank,author:data.user.name});setSelected(null);setModal('voice')}
    function startPhoto(){if(mustLogin())return;setDraft({...blank,author:data.user.name});setDictation('');setSelected(null);begin('photo')}
    function begin(mode:string){setEditorStep(0);if(mode==='photo'){setModal('scan');return}setModal('edit');if(mode==='voice')setDictation(' ')}
    function closeDialog() {
        if (busy)
            return;
        if (modal === 'edit' && (draft.title || draft.ingredients || draft.steps || draft.photo)) {
            setDiscard(true);
            return;
        }
        recognition.current?.stop();
        setModal('');
        setSelected(null);
        setDiscard(false);
    }
    closeRef.current = closeDialog;
    function nextStep() {
        if (editorStep === 0 && !draft.title.trim()) {
            setMessage('Donnez un nom à votre recette pour continuer.');
            return;
        }
        if (editorStep === 1 && !draft.title.trim()) {
            setEditorStep(0);
            setMessage('Ajoutez le nom de la recette avant de continuer.');
            return;
        }
        if (editorStep === 1 && (!draft.ingredients.trim() || !draft.steps.trim())) {
            setMessage('Ajoutez les ingrédients et au moins une étape.');
            return;
        }
        setEditorStep(v => Math.min(2, v + 1));
    }
    async function uploadPhoto(file:File){const form=new FormData();form.append('file',file);form.append('family',family);const r=await fetch('/api/photo',{method:'POST',body:form});const d:any=await r.json();if(!r.ok)throw new Error(d.error||'La photo n’a pas pu être enregistrée.');return d.url as string}
    async function upload(file:File){if(mustLogin())return;await act(async()=>{const url=await uploadPhoto(file);setDraft(x=>({...x,photo:url}))})}
    async function acceptPhoto(recipe:ExtractedRecipe,photo:File){setBusy(true);try{const url=await uploadPhoto(photo);setDraft(x=>({...x,title:recipe.title,ingredients:recipe.ingredients,steps:recipe.steps,servings:recipe.servings||x.servings,time:recipe.time,photo:url}));setEditorStep(recipe.steps.trim() ? 2 : 1);setModal('edit');setMessage('Fiche créée depuis la photo. Ajoutez vos souvenirs et enregistrez-la.')}finally{setBusy(false)}}
    async function ai(body: any) {
        const r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, family }) });
        const d: any = await r.json();
        if (!r.ok)
            throw new Error(d.error);
        return d;
    }
    function dictate() {
        const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!Speech) {
            setMessage('Utilisez le microphone du clavier de votre téléphone dans le champ de dictée.');
            return;
        }
        if (recording) {
            recognition.current?.stop();
            return;
        }
        const rec = new Speech();
        recognition.current = rec;
        rec.lang = 'fr-FR';
        rec.continuous = true;
        rec.interimResults = false;
        rec.onresult = (e: any) => {
            let t = '';
            for (let i = e.resultIndex; i < e.results.length; i++)
                t += e.results[i][0].transcript + ' ';
            setDictation(v => v + t);
        };
        rec.onerror = () => { setRecording(false); setMessage('Microphone indisponible. Vérifiez l’autorisation ou utilisez le clavier.'); };
        rec.onend = () => setRecording(false);
        try {
            rec.start();
            setRecording(true);
        }
        catch {
            setMessage('Impossible de démarrer le microphone.');
        }
    }
    async function saveList(items: any[]) { await api({ action: 'list', items }); setList(items); }
    async function importExamples(ids?: string[]) { if (mustLogin())
        return; await act(async () => { await api({ action: 'importExamples', ids }); await load(); setScope('saved'); setSearch(''); setCategory('Toutes'); setSelected(null); setMessage(ids?.length === 1 ? 'Recette ajoutée à votre carnet. Vous pouvez maintenant la modifier.' : 'Les six exemples ont été ajoutés à votre carnet.'); }); }
    function openOrder(recipe?: Recipe) { setOrderSource(recipe || null); setOrderPortions(recipe?.servings || 4); setOrderLines(recipe ? groceryLines(recipe.ingredients) : list.filter(x => !x.checked && String(x.text).trim()).map((x, i) => ({ ...groceryLines(x.text)[0], id: String(i) })).filter(x => x.text)); setSearched([]); setSelected(null); setModal('order'); }
    function changePortions(n: number) { if (!orderSource)
        return; const count = Math.max(1, Math.min(36, n)); setOrderPortions(count); const scaled = groceryLines(orderSource.ingredients, count / orderSource.servings); setOrderLines(scaled.map((x, i) => ({ ...x, include: orderLines[i]?.include ?? x.include, query: orderLines[i]?.query || x.query }))); }
    function changeOrderLine(id: string, patch: Partial<GroceryLine>) { setOrderLines(v => v.map(x => x.id === id ? { ...x, ...patch } : x)); }
    function printBook(rs: Recipe[]) { setSelected(null); setModal(''); setPrintRecipes(rs); setTimeout(() => window.print(), 120); }
    const [printRecipes, setPrintRecipes] = useState<Recipe[]>([]);
    return <><a href="#main-content" className="skip-link">Aller au contenu</a><div className="app-shell"><aside className={mobile ? 'sidebar open' : 'sidebar'}><a className="brand" href="/" aria-label="Abuelitas, accueil"><img src="/mamie-cheffe.png" alt=""/><div>abuelitas<span>LE CARNET DE FAMILLE</span></div></a><button className="family-switch" onClick={() => {
            if (!data) {
                mustLogin();
                return;
            }
            setModal('spaces');
        }}><span className="family-icon"><BookOpen size={21}/></span><span><small>CARNET</small><b>{active?.name || 'Mon carnet de famille'}</b></span><ChevronRight size={16}/></button><p className="nav-caption">MENU</p><nav>{[['recipes', BookOpen, 'Recettes'], ['family', Users, 'Famille'], ['shopping', ShoppingBasket, 'Courses']].map(([id, Icon, label]: any) => <button key={id} className={view === id ? 'nav-item active' : 'nav-item'} onClick={() => { setView(id); setMobile(false); }}><Icon size={20}/>{label}{id === 'recipes' && <span>{savedRecipes.length}</span>}</button>)}</nav><div className="sidebar-note"><span className="note-icon"><Heart size={21}/></span><h3>Cuisine en famille</h3><p>Partagez vos recettes avec vos proches.</p><button onClick={() => {
            if (mustLogin())
                return;
            setModal('invite');
        }}>Inviter un proche <ArrowUpRight size={15}/></button></div><button className="export-nav" onClick={() => printBook(savedRecipes)}><Download size={18}/>Exporter en PDF</button><div className="profile"><span className="avatar">{data?.user.name?.[0]?.toUpperCase() || 'A'}</span><div><b>{data?.user.name || 'Bienvenue'}</b><small>{data ? 'Votre espace privé' : 'Un carnet à partager'}</small></div>{data ? <a aria-label="Se déconnecter" href="/signout-with-chatgpt?return_to=/" target="_top"><LogOut size={17}/></a> : <a href="/signin-with-chatgpt?return_to=/" target="_top"><ArrowUpRight size={18}/></a>}</div></aside><main id="main-content"><header className="topbar"><button className="mobile-brand" onClick={() => setView('recipes')}><img src="/mamie-cheffe.png" alt=""/>abuelitas</button><span className="breadcrumb">Votre carnet de recettes</span><div className="header-actions"><span className="private"><Lock size={13}/> Carnet privé</span><button className="account-button" aria-label="Ouvrir mes carnets" onClick={() => {
            if (!data) {
                mustLogin();
                return;
            }
            setModal('spaces');
        }}>{data?.user.name?.[0]?.toUpperCase() || 'A'}</button></div></header>{view === 'recipes' ? <><section className="page-heading workspace-heading"><div><div className="eyebrow">{active?.name || 'ABUELITAS'}</div><h1>Mes recettes</h1><p>À cuisiner. À partager.</p></div><div className="workspace-actions"><button className="secondary" onClick={startPhoto}><Camera size={18}/>Importer une recette à partir d’une photo</button><button className="secondary" onClick={startVoice}><Mic size={18}/>Dicter une recette</button><button className="primary" onClick={create}><Plus size={18}/>Ajouter une recette</button></div></section>{loadError && <div className="error-banner" role="alert">Impossible de charger votre carnet.<button onClick={load}>Réessayer</button></div>}{!data && ready && <div className="demo-banner"><span><b>Bienvenue dans Abuelitas.</b> Connectez-vous pour enregistrer vos recettes.</span><a href="/signin-with-chatgpt?return_to=/" target="_top">Créer mon carnet <ArrowUpRight size={16}/></a></div>}{data && !family && <div className="demo-banner"><span>Créez votre premier carnet.</span><button onClick={() => setModal('family')}>Créer mon carnet</button></div>}<section className="collection"><div className="collection-title"><div className="scope-tabs" aria-label="Choisir les recettes affichées">{[['saved', 'Mon carnet'], ['examples', 'Inspirations']].map(([id,label])=><button key={id} className={scope===id?'active':''} aria-pressed={scope===id} onClick={()=>{setScope(id);setSearch('');setCategory('Toutes')}}>{label}{id==='saved'&&<span className="count-badge">{savedRecipes.length}</span>}</button>)}</div>{scope==='saved'&&savedRecipes.length>0&&<button className="text-button" onClick={()=>printBook(savedRecipes)}><Download size={16}/>Exporter</button>}</div>{scope==='examples'&&<div className="example-intro"><div><b>À essayer</b><p>Ouvrez une recette pour l’ajouter à votre carnet.</p></div></div>}<div className="search-row"><label className="search"><Search size={20}/><input aria-label="Rechercher une recette" placeholder="Rechercher une recette ou un ingrédient" value={search} onChange={e => setSearch(e.target.value)}/>{search && <button className="icon-btn" aria-label="Effacer la recherche" onClick={() => setSearch('')}><X size={17}/></button>}</label><label className="sort-select"><SlidersHorizontal size={16}/><select aria-label="Trier les recettes" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Plus récentes</option><option value="name">De A à Z</option></select></label></div><div className="filters"><div className="categories" aria-label="Catégories">{['Toutes', 'Entrées', 'Plats', 'Desserts', 'Autres'].map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'selected' : ''} onClick={() => setCategory(c)}>{c}{c === 'Toutes' && <span>{collectionRecipes.length}</span>}</button>)}</div><span className="result-count" aria-live="polite">{filtered.length} recette{filtered.length > 1 ? 's' : ''}</span></div>{!ready && <div className="loading-state" role="status">Chargement des recettes…</div>}<div className="recipe-grid" aria-busy={!ready}>{!ready&&[0,1,2].map(i=><div key={i} className="recipe-skeleton" aria-hidden="true"><div/><span/><span/></div>)}{ready && !loadError && filtered.map((r, i) => <button className="recipe-card" key={r.id} onClick={() => setSelected(r)}><div className="recipe-image">{r.photo ? <img loading="lazy" src={r.photo} alt={r.title}/> : <div className="photo-placeholder"><ChefHat size={50}/><span>{r.title}</span></div>}<span className="recipe-category">{r.category}</span>{r.example && <span className="example-badge">Exemple</span>}{r.parent && <span className="variant-label">Variante familiale</span>}</div><div className="recipe-info"><div className="recipe-author"><span className={'mini-avatar color-' + i}>{r.author[0]}</span>{r.author}</div><h3>{r.title}</h3><div className="recipe-meta"><span><Clock size={14}/>{r.time || 'Temps non précisé'}</span><span><Users size={14}/>{r.servings} personnes</span><span className="card-open"><ArrowUpRight size={17}/></span></div></div></button>)}{ready && !loadError && !filtered.length && <div className="empty"><img className="empty-mascot" src="/mamie-cheffe.png" alt=""/><h3>{collectionRecipes.length ? 'Aucune recette trouvée' : 'Votre première recette ?'}</h3><p>{collectionRecipes.length ? 'Essayez un autre mot ou retirez un filtre.' : 'Écrivez-la ou importez une photo.'}</p><button className="primary" onClick={() => {
                    if (collectionRecipes.length) {
                        setSearch('');
                        setCategory('Toutes');
                    }
                    else
                        create();
                }}>{collectionRecipes.length ? 'Effacer les filtres' : 'Ajouter une recette'}</button></div>}</div></section></> : view === 'family' ? <section className="inner-page"><div className="eyebrow">VOTRE CARNET</div><h1>La famille</h1><p>Invitez vos proches. Partagez vos recettes.</p><div className="action-row"><button className="primary" onClick={() => {
                if (mustLogin())
                    return;
                setModal('invite');
            }}><Plus size={18}/>Inviter un proche</button><button className="secondary" onClick={() => setModal('family')}>Nouveau carnet</button><button className="secondary" onClick={() => setModal('join')}>Rejoindre un carnet</button></div><div className="member-grid">{members.map((m: any) => <div className="member-card" key={m.id}><span className="avatar">{m.name[0]?.toUpperCase()}</span><h3>{m.name}</h3><p>{m.user === active?.owner ? 'Propriétaire' : 'Membre'}</p><small>{recipes.filter(r => r.creator === m.user).length} recettes partagées</small></div>)}</div>{!members.length && <div className="empty"><Users size={35}/><h3>Invitez votre famille</h3><button className="primary" onClick={() => mustLogin()}>Créer mon espace</button></div>}<div className="info-note">Chaque membre peut ajouter ses recettes et créer des variantes. Seul l’auteur peut modifier ou supprimer sa recette originale.</div></section> : <section className="inner-page"><div className="eyebrow">VOTRE LISTE</div><h1>Mes courses</h1><p>Choisissez vos recettes. Retrouvez les ingrédients ici.</p><div className="shopping-layout"><div className="panel"><h2>Au menu</h2>{recipes.map(r => <label className="recipe-check" key={r.id}><input type="checkbox" checked={chosen.includes(r.id!)} onChange={e => setChosen(v => e.target.checked ? [...v, r.id!] : v.filter(x => x !== r.id))}/><span>{r.title}<small>{r.servings} personnes</small></span></label>)}<button className="primary full" disabled={busy || !chosen.length} onClick={() => {
                if (mustLogin())
                    return;
                act(async () => { const ingredients = recipes.filter(r => chosen.includes(r.id!)).flatMap(r => r.ingredients.split('\n')).filter(x => x.trim()); const items = data.ai ? (await ai({ mode: 'shopping', text: ingredients.join('\n') })).items : ingredients.map(text => ({ text, category: 'À acheter', checked: false })); await saveList([...list, ...items]); setChosen([]); setMessage(data.ai ? 'Liste regroupée par IA. Vérifiez les quantités.' : 'Les ingrédients ont été ajoutés à votre liste.'); });
            }}><ShoppingBasket size={18}/>{busy ? 'Préparation…' : data?.ai ? 'Générer avec l’IA' : `Ajouter à ma liste (${chosen.length})`}</button><small className="hint">Les quantités suivent les portions des recettes.</small></div><div className="panel shopping-list"><div className="shopping-progress"><div style={{ width: `${list.length ? list.filter(x => x.checked).length / list.length * 100 : 0}%` }}/></div><div className="collection-title"><h2>Ma liste de courses <span>{list.filter(x => !x.checked).length} restants</span></h2><button className="icon-btn" aria-label="Copier la liste" onClick={() => act(async () => { await navigator.clipboard.writeText(list.map(x => (x.checked ? '✓ ' : '☐ ') + x.text).join('\n')); setMessage('Liste copiée'); })}><Copy size={18}/></button></div>{list.map((item, i) => <label className={item.checked ? 'shopping-item done' : 'shopping-item'} key={i}><input type="checkbox" disabled={busy} checked={item.checked} onChange={() => act(() => saveList(list.map((x, j) => j === i ? { ...x, checked: !x.checked } : x)))}/><span>{item.text}<small>{item.category}</small></span><button type="button" aria-label="Supprimer cet ingrédient" className="icon-btn" disabled={busy} onClick={e => { e.preventDefault(); act(() => saveList(list.filter((_, j) => i !== j))); }}><X size={15}/></button></label>)}{!list.length && <div className="empty"><ShoppingBasket size={35}/><p>Votre liste est vide. Ajoutez une recette ou un ingrédient.</p></div>}{list.some(x => !x.checked) && <button className="primary full" onClick={() => openOrder()}><ShoppingBasket size={18}/>Choisir une enseigne<ArrowUpRight size={17}/></button>}<form className="add-item" onSubmit={e => {
                e.preventDefault();
                if (mustLogin())
                    return;
                const f = e.currentTarget;
                const text = (new FormData(f).get('item') as string).trim();
                if (text)
                    act(async () => { await saveList([...list, { text, checked: false, category: 'Ajout personnel' }]); f.reset(); });
            }}><input aria-label="Ingrédient à ajouter" name="item" placeholder="Ajouter un ingrédient…" required maxLength={200}/><button aria-label="Ajouter" className="icon-btn"><Plus size={20}/></button></form></div></div></section>}<footer><span>abuelitas</span> Les recettes se transmettent.<Heart size={13}/></footer></main></div><nav className="bottom-nav" aria-label="Navigation principale">{[['recipes', BookOpen, 'Recettes'], ['shopping', ShoppingBasket, 'Courses'], ['family', Users, 'Famille']].map(([id, Icon, label]: any) => <button key={id} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => { setView(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Icon size={22}/><span>{label}</span>{id === 'shopping' && list.filter(x => !x.checked).length > 0 && <i>{list.filter(x => !x.checked).length}</i>}</button>)}<button className="bottom-create" onClick={create}><span className="add-circle"><Plus size={23}/></span><span>Ajouter</span></button></nav>
    {selected && <div className="overlay" onClick={() => setSelected(null)}><article role="dialog" aria-modal="true" aria-label={selected.title} tabIndex={-1} className={'dialog recipe-dialog ' + (cookMode ? 'cooking-mode' : '')} onClick={e => e.stopPropagation()}><button className="close icon-btn" aria-label="Fermer" onClick={() => setSelected(null)}><X /></button>{selected.photo && <img className="detail-image" src={selected.photo} alt={selected.title}/>}<div className="dialog-body"><div className="eyebrow">{selected.category} · {selected.time || 'Fait avec amour'}</div><h2>{selected.title}</h2><p className="byline">{selected.example ? 'Recette d’exemple · ' : ''}Par {selected.author} · {selected.servings} personnes</p>{data && !selected.example && selected.creator === data.user.id && <div className="recipe-management"><button className="secondary" onClick={()=>{setDraft({...selected});setEditorStep(0);setDictation('');setSelected(null);setModal('edit')}}><NotebookPen size={16}/>Modifier</button><button className="secondary danger" onClick={()=>setModal('delete')}><Trash2 size={16}/>Supprimer</button></div>}{selected.example&&<p className="example-note">Recette de démonstration · retrouvez vos recettes enregistrées dans « Mon carnet ».</p>}{selected.story && <blockquote>{selected.story}</blockquote>}{selected.parent && <p className="info-note">Variante de « {recipes.find(r => r.id === selected.parent)?.title || 'une recette familiale'} »</p>}<div className="detail-toolbar"><button className={cookMode ? 'primary' : 'secondary'} onClick={() => setCookMode(!cookMode)}><ChefHat size={18}/>{cookMode ? 'Quitter le mode cuisine' : 'Cuisiner'}</button><span>{selected.servings} personnes · {selected.ingredients.split('\n').filter(Boolean).length} ingrédients</span></div><div className="detail-columns"><section><h3>Les ingrédients</h3>{selected.ingredients.split('\n').filter(Boolean).map((x, i) => <p className="ingredient" key={i}><Leaf size={13}/>{x}</p>)}</section><section><h3>Préparation</h3>{selected.steps.split('\n').filter(Boolean).map((x, i) => <button aria-pressed={doneSteps.includes(i)} className={doneSteps.includes(i) ? 'step completed' : 'step'} key={i} onClick={() => setDoneSteps(v => v.includes(i) ? v.filter(n => n !== i) : [...v, i])}><span>{doneSteps.includes(i) ? <Check size={15}/> : i + 1}</span><p>{x}</p></button>)}</section></div><div className="action-row"><button className="primary" onClick={() => openOrder(selected)}><ShoppingBasket size={17}/>Faire mes courses</button>{selected.example && <button className="secondary" disabled={busy} onClick={() => importExamples([selected.id!])}><Plus size={17}/>Ajouter au carnet</button>}<button className="secondary" onClick={() => {
                if (mustLogin())
                    return;
                setChosen([selected.id!]);
                setSelected(null);
                setView('shopping');
            }}><ShoppingBasket size={17}/>Liste de courses</button><button className="secondary" onClick={() => {
                if (mustLogin())
                    return;
                setDraft({ ...selected, id: undefined, example: undefined, exampleSource: undefined, title: selected.title + ' — ma variante', parent: selected.example ? null : selected.id, author: data.user.name });
                setEditorStep(0);
                setDictation('');
                setSelected(null);
                setModal('edit');
            }}>Créer une variante</button><button className="secondary" onClick={() => printBook([selected])}><Download size={16}/>PDF</button></div>{recipes.filter(r => r.parent === selected.id).length > 0 && <section><h3>Les variantes de la famille</h3>{recipes.filter(r => r.parent === selected.id).map(r => <button key={r.id} className="variant-link" onClick={() => setSelected(r)}>{r.title} · {r.author}<ChevronRight size={15}/></button>)}</section>}</div></article></div>}
        {modal && <div className="overlay" onClick={closeDialog}><div role="dialog" aria-modal="true" aria-label={modal === 'edit' ? 'Éditeur de recette' : 'Votre carnet'} tabIndex={-1} className={'dialog ' + ((modal === 'edit'||modal==='scan'||modal==='voice') ? 'editor' : modal === 'order' ? 'order-dialog' : '')} onClick={e => e.stopPropagation()}><button className="close icon-btn" aria-label="Fermer" disabled={busy} onClick={closeDialog}><X /></button><div className="dialog-body">{discard && <div className="discard-warning" role="alert"><b>Quitter sans enregistrer ?</b><p>Vos modifications seront perdues.</p><div className="action-row"><button className="secondary" onClick={() => setDiscard(false)}>Continuer la recette</button><button className="secondary danger" onClick={() => { recognition.current?.stop(); setDiscard(false); setModal(''); setDraft({ ...blank }); }}>Abandonner</button></div></div>}{modal==='voice'?<VoiceRecipe onUse={recipe=>{setDraft(x=>({...x,...recipe}));setEditorStep(0);setModal('edit');setMessage('Dictée ajoutée. Vérifiez votre recette avant de l’enregistrer.')}}/>:modal==='scan'?<PhotoImport onUse={acceptPhoto} onBack={()=>setModal('edit')}/>:modal === 'order' ? <><div className="eyebrow">DE LA RECETTE AUX COURSES</div><h2>Choisir mes produits</h2><p>{orderSource?.title || 'Votre liste de courses'} · {orderLines.filter(x => x.include).length} ingrédients sélectionnés</p><fieldset className="merchant-picker"><legend>Mon enseigne</legend>{(Object.keys(merchants) as Merchant[]).map(id=><button type="button" key={id} aria-pressed={merchant===id} className={merchant===id?'merchant-option selected':'merchant-option'} onClick={()=>{setMerchant(id);setSearched([])}}><span>{merchants[id].name}</span>{merchant===id&&<Check size={18}/>}</button>)}</fieldset><div className="order-notice"><b>Recherche chez {shop.name}</b><p>Cherchez chaque produit, puis ajoutez-le sur le site de l’enseigne. Aucun ajout automatique au panier.</p></div>{orderSource && <div className="portion-picker"><span>Personnes</span><div><button className="icon-btn" disabled={orderPortions <= 1} aria-label="Une personne de moins" onClick={() => changePortions(orderPortions - 1)}>−</button><output aria-live="polite">{orderPortions}</output><button className="icon-btn" disabled={orderPortions >= 36} aria-label="Une personne de plus" onClick={() => changePortions(orderPortions + 1)}>+</button></div></div>}<div className="order-list-heading"><b>Les ingrédients</b><button className="text-button" onClick={() => setOrderLines(v => v.map(x => ({ ...x, include: !v.every(y => y.include) })))}>{orderLines.every(x => x.include) ? 'Tout décocher' : 'Tout sélectionner'}</button></div><small className="hint">Décochez ce que vous avez déjà. Vérifiez les quantités à l’achat.</small><div className="order-lines">{orderLines.map(item => <div className={item.include ? 'order-line' : 'order-line excluded'} key={item.id}><label className="order-include"><input type="checkbox" checked={item.include} onChange={e => changeOrderLine(item.id, { include: e.target.checked })}/><span>{item.text}{item.review && <small>Quantité à ajuster manuellement</small>}</span></label>{item.include && <div className="order-product"><label><span>Produit à rechercher</span><input aria-label={`Recherche pour ${item.text}`} value={item.query} onChange={e => changeOrderLine(item.id, { query: e.target.value })}/></label>{item.query.trim() ? <a className="secondary" href={grocerySearchUrl(item.query,merchant)} target="_blank" rel="noopener noreferrer" onClick={() => setSearched(v => v.includes(item.id) ? v : [...v, item.id])}>{searched.includes(item.id) ? 'Rechercher à nouveau' : 'Chercher chez '+shop.name}<ArrowUpRight size={15}/></a> : <span className="hint">Saisissez un produit</span>}</div>}{searched.includes(item.id) && item.include && <small className="search-status">Recherche ouverte · produit à ajouter sur le site</small>}</div>)}</div><div className="order-footer"><button className="secondary" disabled={!orderLines.some(x => x.include)} onClick={() => act(async () => { await navigator.clipboard.writeText(groceryExport(orderLines)); setMessage('Liste copiée avec les quantités.'); })}><Copy size={17}/>Copier ma liste</button><a className="primary" href={shop.home} target="_blank" rel="noopener noreferrer">Ouvrir {shop.name}<ArrowUpRight size={17}/></a></div><p className="hint">Prix et paiement sur le site de l’enseigne.</p></> : modal === 'choose' ? <><div className="eyebrow">UNE RECETTE DE PLUS À TRANSMETTRE</div><h2>Comment commence-t-on ?</h2><p>Choisissez ce qui vous convient. Vous pourrez tout modifier ensuite.</p><div className="method-list"><button onClick={() => begin('write')}><span className="quick-icon peach"><NotebookPen /></span><span><b>Écrire ma recette</b><small>Ingrédients, étapes et votre petite touche.</small></span><ArrowRight size={20}/></button><button onClick={() => begin('photo')}><span className="quick-icon sage"><Camera /></span><span><b>Importer une recette à partir d’une photo</b><small>{'Lecture du texte et fiche préremplie à vérifier.'}</small></span><ArrowRight size={20}/></button><button onClick={startVoice}><span className="quick-icon lilac"><Mic /></span><span><b>Dicter ma recette</b><small>Racontez-la avec vos propres mots.</small></span><ArrowRight size={20}/></button></div></> : modal === 'edit' ? <><div className="eyebrow">{draft.id ? 'MODIFIER LA RECETTE' : 'NOUVELLE RECETTE'} · ÉTAPE {editorStep + 1} SUR 3</div><h2>{['La recette', 'Ingrédients et étapes', 'Histoire et photo'][editorStep]}</h2><div className="wizard-progress" aria-label={`Étape ${editorStep + 1} sur 3`}>{['Recette', 'Préparation', 'Souvenirs'].map((x, i) => <span key={x} className={i <= editorStep ? 'active' : ''}><i>{i < editorStep ? <Check size={13}/> : i + 1}</i>{x}</span>)}</div><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
                    if (e.target.files?.[0])
                        upload(e.target.files[0]);
                    e.target.value = '';
                }}/>
            <form onSubmit={e => {
                    e.preventDefault();
                    if (editorStep < 2) {
                        nextStep();
                        return;
                    }
                    act(async () => { await api({ action: 'saveRecipe', recipe: draft }); await load(); setModal(''); setDictation(''); setDraft({ ...blank }); setMessage('Recette enregistrée. À vous les grandes tablées !'); });
                }}>
            {editorStep === 0 && <div className="wizard-panel">{dictation !== '' && <div className="info-note"><Mic size={17}/>Donnez un nom à votre recette. Vous pourrez la dicter à l’étape suivante.</div>}<label>Nom de la recette <span className="required">*</span><input autoFocus required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Le gâteau au chocolat de mamie" maxLength={200}/></label><div className="form-grid"><label>Recette de<input value={draft.author} onChange={e => setDraft({ ...draft, author: e.target.value })} placeholder="Mamie Jeanne"/></label><label>Catégorie<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{['Entrées', 'Plats', 'Desserts', 'Autres'].map(x => <option key={x}>{x}</option>)}</select></label><label>Personnes<input required type="number" min="1" max="100" value={draft.servings} onChange={e => setDraft({ ...draft, servings: Number(e.target.value) })}/></label><label>Temps total<input value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })} placeholder="30 min"/></label></div><div className="upload-zone">{draft.photo ? <img src={draft.photo} alt="Photo de la recette"/> : <span className="quick-icon peach"><Camera size={25}/></span>}<div><button type="button" className="text-button" disabled={busy} onClick={() => fileRef.current?.click()}>{draft.photo ? 'Changer la photo' : 'Ajouter une photo'}<Plus size={16}/></button><small>Facultatif · JPG, PNG, WebP · 8 Mo max.</small></div></div></div>}
            {editorStep === 1 && <div className="wizard-panel"><div className="editor-tools"><button type="button" className="secondary" onClick={() => setDictation(v => v || ' ')}><Mic size={17}/>Dicter</button><button type="button" className="secondary" disabled={busy} onClick={() => setModal('scan')}><Camera size={17}/>Scanner une recette</button></div>{dictation !== '' && <div className="dictation"><label>Votre dictée<textarea value={dictation} onChange={e => setDictation(e.target.value)} placeholder="Pour cette recette, il faut…"/></label><div className="action-row"><button type="button" className={recording ? 'primary' : 'secondary'} onClick={dictate}><Mic size={16}/>{recording ? 'Arrêter' : 'Démarrer le micro'}</button><button type="button" className="secondary" disabled={busy || !dictation.trim()} onClick={() => act(async () => {
                            if (data.ai) {
                                const out = await ai({ mode: 'dictation', text: dictation });
                                setDraft(x => ({ ...x, ...out }));
                                setMessage(out.uncertainties || 'Vérifiez les quantités avant d’enregistrer.');
                            }
                            else {
                                setDraft(x => ({ ...x, steps: [x.steps, dictation.trim()].filter(Boolean).join('\n') }));
                                setMessage('Dictée ajoutée. Complétez les ingrédients.');
                            }
                            recognition.current?.stop();
                            setDictation('');
                        })}>{data?.ai ? 'Structurer' : 'Utiliser cette dictée'}</button></div><small>Sur iPhone, vous pouvez aussi utiliser le micro du clavier.</small></div>}{draft.photo && <a className="manuscript-link" href={draft.photo} target="_blank" rel="noreferrer"><Camera size={15}/>Consulter la photo de référence<ArrowUpRight size={15}/></a>}<label>Ingrédients <span className="required">*</span><span className="field-help">Un ingrédient par ligne, avec sa quantité.</span><textarea required className="tall" value={draft.ingredients} onChange={e => setDraft({ ...draft, ingredients: e.target.value })} placeholder={'200 g de farine\n3 œufs\n100 g de sucre'}/></label><label>Préparation <span className="required">*</span><span className="field-help">Une étape par ligne, dans l’ordre.</span><textarea required className="tall" value={draft.steps} onChange={e => setDraft({ ...draft, steps: e.target.value })} placeholder={'Préchauffer le four à 180 °C.\nMélanger la farine, les œufs et le sucre.'}/></label><StepImprover key={draft.id||'new'} enabled={!!data?.ai} family={family} steps={draft.steps} ingredients={draft.ingredients} onApply={steps=>setDraft(x=>({...x,steps}))}/></div>}
            {editorStep === 2 && <div className="wizard-panel"><div className="recipe-summary">{draft.photo ? <img src={draft.photo} alt=""/> : <span className="quick-icon peach"><ChefHat /></span>}<div><b>{draft.title}</b><span>{draft.category} · {draft.servings} personnes · {draft.time || 'Temps libre'}</span></div><CheckCircle2 size={23}/></div><label>Une histoire ?<span className="field-help">Facultatif. Un souvenir ou un conseil.</span><textarea className="tall" value={draft.story} onChange={e => setDraft({ ...draft, story: e.target.value })} placeholder="Mamie préparait toujours cette recette pour nos anniversaires…"/></label><div className="save-destination"><Lock size={17}/><span>Enregistrée dans <b>{active?.name}</b><small>Visible uniquement par les membres du carnet.</small></span></div></div>}
            <div className="wizard-footer"><button type="button" className="secondary" disabled={busy} onClick={() => editorStep ? setEditorStep(v => v - 1) : closeDialog()}><ArrowLeft size={17}/>{editorStep ? 'Retour' : 'Annuler'}</button><button className="primary" disabled={busy}>{busy ? 'Enregistrement…' : editorStep === 2 ? 'Enregistrer' : 'Continuer'}{editorStep === 2 ? <Check size={17}/> : <ArrowRight size={17}/>}</button></div></form></> : modal === 'family' ? <><div className="eyebrow">CARNET PRIVÉ</div><h2>Créer un carnet</h2><p>Choisissez un nom. Invitez vos proches ensuite.</p><form onSubmit={e => {
                    e.preventDefault();
                    if (!data) {
                        mustLogin();
                        return;
                    }
                    act(async () => { const d = await api({ action: 'createFamily', name: familyName }); await load(); setFamily(d.id); setModal(''); setView('recipes'); });
                }}><label>Le nom du carnet<input autoFocus required maxLength={100} value={familyName} onChange={e => setFamilyName(e.target.value)} placeholder="À la table des Granier"/></label><button className="primary full" disabled={busy}>Créer le carnet</button></form></> : modal === 'join' ? <><h2>Rejoindre un carnet</h2><p>Collez votre lien ou code d’invitation.</p><form onSubmit={e => {
                    e.preventDefault();
                    if (!data) {
                        location.href = '/signin-with-chatgpt?return_to=' + encodeURIComponent('/?invitation=' + encodeURIComponent(joinCode.includes('invitation=') ? new URL(joinCode).searchParams.get('invitation') || joinCode : joinCode));
                        return;
                    }
                    act(async () => { const code = joinCode.includes('invitation=') ? new URL(joinCode).searchParams.get('invitation') : joinCode; const d = await api({ action: 'join', code }); await load(); setFamily(d.id); setModal(''); setView('recipes'); history.replaceState(null, '', '/'); });
                }}><label>Votre invitation<input required value={joinCode} onChange={e => setJoinCode(e.target.value)}/></label><button className="primary full" disabled={busy}>Rejoindre le carnet</button></form></> : modal === 'invite' ? <><div className="eyebrow">AGRANDIR LA TABLÉE</div><h2>Les recettes se partagent.</h2><p>Les personnes qui possèdent ce lien pourront rejoindre « {active?.name} » après connexion.</p><div className="invite-url">{typeof window !== 'undefined' ? location.origin : ''}/?invitation={active?.invite}</div><button className="primary full" onClick={() => act(async () => {
                    const url = location.origin + '/?invitation=' + active.invite;
                    if (navigator.share)
                        await navigator.share({ title: 'Rejoignez notre carnet Abuelitas', url });
                    else {
                        await navigator.clipboard.writeText(url);
                        setMessage('Invitation copiée');
                    }
                })}><Share2 size={17}/>Partager l’invitation</button>{active?.owner === data?.user.id && <button className="text-button" onClick={() => act(async () => { await api({ action: 'rotate' }); await load(); setMessage('Ancien lien désactivé. Le nouveau lien est prêt.'); })}>Renouveler le lien d’invitation</button>}<p className="hint">Le site est actuellement en accès privé propriétaire. Le partage entre comptes nécessite aussi l’ouverture de son accès.</p></> : modal === 'spaces' ? <><h2>Mes carnets</h2>{data?.families.map((f: any) => <button key={f.id} className="space-item" onClick={() => { setFamily(f.id); setModal(''); }}><BookOpen size={20}/>{f.name}{family === f.id && <Check size={18}/>}</button>)}<div className="action-row"><button className="primary" onClick={() => setModal('family')}>Créer un carnet</button><button className="secondary" onClick={() => setModal('join')}>Rejoindre</button></div></> : modal === 'delete' ? <><h2>Supprimer « {selected?.title} » ?</h2><p>Cette suppression est définitive. Les variantes déjà créées et votre liste de courses restent conservées.</p><button className="secondary" disabled={busy} onClick={() => setModal('')}>Annuler</button><button className="primary" disabled={busy} onClick={() => act(async () => { await api({ action: 'deleteRecipe', id: selected?.id, family: selected?.family }); setData((d:any)=>({...d,recipes:d.recipes.filter((r:Recipe)=>r.id!==selected?.id)})); setSelected(null); setModal(''); setMessage('Recette supprimée de votre carnet.'); await load(); })}>{busy ? 'Suppression…' : 'Supprimer définitivement'}</button></> : null}</div></div></div>}{message && <div role="status" className="toast"><span>{message}</span><button aria-label="Fermer" onClick={() => setMessage('')}><X size={17}/></button></div>}
    <div className="print-book"><div className="print-cover"><p>ABUELITAS</p><h1>{active?.name || 'Notre carnet de famille'}</h1><p>Des recettes, des histoires et beaucoup d’amour.</p></div>{printRecipes.map(r => <article key={r.id}><h1>{r.title}</h1><p>{r.author} · {r.servings} personnes · {r.time}</p>{r.photo && <img src={r.photo} alt=""/>}<blockquote>{r.story}</blockquote><h2>Ingrédients</h2><p style={{ whiteSpace: 'pre-line' }}>{r.ingredients}</p><h2>Préparation</h2><p style={{ whiteSpace: 'pre-line' }}>{r.steps}</p></article>)}</div></>;
}
