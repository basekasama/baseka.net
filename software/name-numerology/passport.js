(() => {
// Same kana-token rules as Numerology.Core/PassportConverter.cs. Exhaustive D parity is checked.
function convertPassport(input, basic, rules) {
  const reading = input.normalize('NFKC').trim().replaceAll('’', "'").replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  const fail=(status,reason)=>({version:rules.version,reading,status,roman:null,reasons:[reason]});
  if (!reading.length || reading.length>80) return fail('unsupported','reading-length');
  if (/[\uD800-\uDFFF]/u.test(reading)) return fail('unsupported','invalid-unicode');
  if (reading.includes('ゔ')) return fail('ambiguous','vu-spelling-choices');
  const tokens=[], boundary=k=>[' ',"'",'-'].includes(k), vowel=c=>!!c&&'aeiou'.includes(c);
  for(let i=0;i<reading.length;i++) {
    const c=reading[i], pair=reading.slice(i,i+2);
    if (boundary(c)||['っ','ー'].includes(c)) {tokens.push([c,c]);continue;}
    if(rules.pairs[pair]) {tokens.push([pair,rules.pairs[pair]]);i++;continue;}
    const roman=rules.overrides[c]??basic.kana[c];
    if(roman) tokens.push([c,roman]); else return fail('unsupported','unsupported-kana:'+c);
  }
  let result='', previousVowel='', approximate=false; const reasons=new Set();
  for(let i=0;i<tokens.length;i++) {
    const [kana,roman]=tokens[i], next=tokens[i+1]&&!boundary(tokens[i+1][0])?tokens[i+1][1]:'';
    if(boundary(kana)) {result+=roman;previousVowel='';reasons.add('explicit-boundary');continue;}
    if(kana==='っ') {
      if(!/^[a-z]/.test(next)||vowel(next[0])||next[0]==='n') return fail('unsupported','sokuon-context');
      result+=next.startsWith('ch')?'t':next[0];previousVowel='';reasons.add('sokuon');continue;
    }
    if(kana==='ー') {
      if(!previousVowel) return fail('unsupported','long-mark-context');
      reasons.add('long-mark-omission');approximate=true;continue;
    }
    if(kana==='ん') {
      const bmp=next.length>0&&'bmp'.includes(next[0]);result+=bmp?'m':'n';
      if(next.length&&(vowel(next[0])||next[0]==='y')) result+="'";
      reasons.add(bmp?'n-before-bmp':'n');previousVowel='';continue;
    }
    const omit=kana==='う'&&['o','u'].includes(previousVowel)||kana==='お'&&previousVowel==='o'&&next.length>0;
    if(omit) {approximate=true;reasons.add(kana==='う'?'kana-long-u':'kana-long-o-internal');} else result+=roman;
    if(rules.overrides[kana]) reasons.add('historical-kana');
    if(rules.pairs[kana]&&basic.pairs[kana]!==roman) reasons.add('reference-foreign-pair');
    previousVowel=vowel(roman.at(-1))?roman.at(-1):'';
  }
  if(!/[a-z]/.test(result)) return fail('unsupported','no-letters');
  reasons.add('basic-table');return {version:rules.version,reading,status:approximate?'approximate':'generated',roman:result.toUpperCase(),reasons:[...reasons].sort()};
}

globalThis.convertPassport=convertPassport;
})();