export type ExtractedRecipe={title:string;ingredients:string;steps:string;servings:number|null;time:string;warnings:string[];rawText:string;confidence:number};
const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const cooking=/^(?:\d+[.)°-]?\s*)?(?:pr[eé]chauff|chauff|m[eé]lang|ajout|vers|fai(?:re|tes)|cuir|enfourn|batt|fouett|laiss|[eé]pluch|[eé]minc|coup|lav|[eé]tal|dispos|r[eé]part|serv|incorpor|r[eé]serv|[eé]goutt|assaisonn|mix|port|retir|d[eé]pos|mettr|m ett|mettez|cass|remu|couvr|couvrir|d[eé]moul|tremp|saupoudr|blanch|mont|dans\s+(?:un|une|le|la)|(?:deux|trois|plusieurs)\s+couches)/i;
const ingredient=/^(?:(?:\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[¼½¾])\s*(?:kg|g|mg|ml|cl|dl|l)\b|(?:\d+(?:[.,]\d+)?|[¼½¾])\s+\p{L}|un(?:e)?\s+(?:pinc[eé]e|cuill[eè]re|gousse)|quelques\s+|sel\b|poivre\b)/iu;
function cleanLine(s:string){return s.replace(/\*+/g,'').replace(/^[\s•●▪·–—-]+/,'').replace(/\s+/g,' ').trim()}
export function parseRecipeText(raw:string,confidence=100):ExtractedRecipe{
 const warnings:string[]=[];const lines=raw.replace(/\r/g,'').split('\n').map(cleanLine).filter(Boolean);const ing:string[]=[],steps:string[]=[],other:string[]=[];let section:'start'|'ingredients'|'steps'='start';let title='';let servings:number|null=null;const times:string[]=[];
 for(const line of lines){const n=normalized(line);
  const people=line.match(/(?:pour\s+)?(\d{1,2})\s*(?:personnes?|pers\.?|portions?|convives?)/i);if(people)servings=Number(people[1]);
  const timing=/^(?:(?:temps\s+(?:de\s+)?)?(?:preparation|cuisson|repos|total|duree))\s*[:：-]?\s*(\d+\s*(?:h(?:eures?)?|min(?:utes?)?)(?:\s*\d+\s*(?:min(?:utes?)?)?)?)/i.exec(n);
  if(timing){times.push(line);continue}
  if(/^(?:pour\s+)?\d{1,2}\s*(?:personnes?|pers\.?|portions?|convives?)[ .:]*$/i.test(n))continue;
  if(/^(?:les\s+)?ingredients?\b/.test(n)){section='ingredients';const rest=line.replace(/^(?:les\s+)?ingr[eé]dients?\s*[:：-]?\s*/i,'').replace(/(?:pour\s+)?\d{1,2}\s*(?:personnes?|pers\.?|portions?)/i,'').trim();if(rest&&ingredient.test(rest))ing.push(rest);continue}
  if(/^(?:(?:la\s+)?preparation|(?:les\s+)?etapes|instructions|realisation|methode|en cuisine|deroulement|recette)\s*[:：-]?\s*$/.test(n)){section='steps';continue}
  const instructionHeading=/^(?:pr[eé]paration|[eé]tapes|instructions)\s*[:：]\s*(.+)/i.exec(line);if(instructionHeading){section='steps';steps.push(instructionHeading[1]);continue}
  if(/^(?:conseils?|astuces?|notes?|bon appetit)\s*[:：!]?/.test(n)){other.push(line);continue}
  if(section==='ingredients'){if(cooking.test(line)){section='steps';steps.push(line.replace(/^\d+[.)°-]\s*/,''))}else ing.push(line);continue}
  if(section==='steps'){const isNew=cooking.test(line)||/^\d+[.)°-]\s*/.test(line);const text=line.replace(/^\d+[.)°-]\s*/,'');if(!isNew&&steps.length&&!/[.!?:]$/.test(steps[steps.length-1]))steps[steps.length-1]+=' '+text;else steps.push(text);continue}
  if(cooking.test(line)){section='steps';steps.push(line.replace(/^\d+[.)°-]\s*/,''));continue}
  if(ingredient.test(line)){section='ingredients';ing.push(line);continue}
  if(!title&&line.length>3&&line.length<160&&!/^(?:recette|cuisine|ingredients)$/i.test(n)){title=line;continue}other.push(line);
 }
 if(!title)warnings.push('Le titre n’a pas été identifié. Ajoutez-le.');
 if(!ing.length)warnings.push('Les ingrédients n’ont pas été identifiés. Consultez le texte extrait.');
 if(!steps.length)warnings.push('Les étapes n’ont pas été identifiées. Consultez le texte extrait.');
 if(confidence<70)warnings.push('La lecture est incertaine : contrôlez attentivement chaque mot et chaque quantité.');
 if(!servings)warnings.push('Le nombre de personnes n’a pas été trouvé. Renseignez-le.');
 if(other.length)warnings.push('Certains passages sont restés dans le texte original : vérifiez qu’aucune information utile ne manque.');
 return {title,ingredients:ing.join('\n'),steps:steps.join('\n'),servings,time:times.join(' · '),warnings,rawText:raw,confidence};
}
