export type GroceryLine = {
    id: string;
    text: string;
    query: string;
    include: boolean;
    review: boolean;
};
export function productQuery(text: string): string {
    let q = text.trim().replace(/^[\s•\-*]+/, '').replace(/^(?:\d+(?:[.,]\d+)?\s*\/\s*\d+|\d+(?:[.,]\d+)?|[½¼¾])\s*/, '');
    q = q.replace(/^(?:(?:kg|g|mg|ml|cl|dl|l|grammes?|kilogrammes?|millilitres?|litres?)\b\s*|(?:cuillères?\s+à\s+(?:soupe|café)|gousses?|pincées?|feuilles?|cubes?)\b\s*)/i, '').replace(/^(?:de\s+|d[’'])/i, '');
    return q.trim() || text.trim();
}
export function scaleIngredient(text: string, ratio: number): {
    text: string;
    review: boolean;
} {
    const t = text.trim();
    if (ratio === 1)
        return { text: t, review: false };
    const m = t.match(/^(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?|[½¼¾])\s*(.*)$/);
    if (!m)
        return { text: t, review: true };
    if (/^(?:à\s*\d|[-–]\s*\d)/.test(m[2]))
        return { text: t, review: true };
    const fractions: Record<string, number> = { '½': .5, '¼': .25, '¾': .75 };
    const n = m[1] in fractions ? fractions[m[1]] : m[1].includes('/') ? Number(m[1].split('/')[0]) / Number(m[1].split('/')[1]) : Number(m[1].replace(',', '.'));
    if (!Number.isFinite(n) || !Number.isFinite(ratio) || ratio <= 0)
        return { text: t, review: true };
    return { text: (Math.round(n * ratio * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' ' + m[2], review: false };
}
export function groceryLines(ingredients: string, ratio = 1): GroceryLine[] { return ingredients.split('\n').map(x => x.trim()).filter(Boolean).map((text, i) => { const scaled = scaleIngredient(text, ratio); return { id: String(i), text: scaled.text, query: productQuery(text), include: !/^\s*(?:\d+\s*)?(?:ml|cl|l)?\s*(?:d[’']|de\s+)?eau\b/i.test(text), review: scaled.review }; }); }
export type Merchant = 'carrefour' | 'auchan';
export const merchants = {carrefour:{name:'Carrefour',home:'https://www.carrefour.fr/'},auchan:{name:'Auchan',home:'https://www.auchan.fr/'}};
export function grocerySearchUrl(query: string,merchant:Merchant='carrefour') { return (merchant==='auchan'?'https://www.auchan.fr/recherche?text=':'https://www.carrefour.fr/s?q=') + encodeURIComponent(query.trim()); }
export function groceryExport(lines: GroceryLine[]) { return lines.filter(x => x.include).map(x => x.text).join('\n'); }
