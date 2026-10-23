'use strict';
(() => {
  const byId = id => document.getElementById('inverse-' + id);
  const dictionary = byId('dataset'), rule = byId('rule'), weight = byId('weight'), initial = byId('initial');
  const passport = byId('passport'), sex = byId('sex');
  const selectedSex = () => dictionary.value === 'en' ? sex.value : '';
  const sexScope = () => text().recordedSexLabel + ': ' + text()[selectedSex() === 'M' ? 'sexM' : selectedSex() === 'F' ? 'sexF' : 'sexAny'];
  const usePassport = () => dictionary.value === 'ja' && passport.checked;
  const fields = ['e', 's', 'p'].map(byId);
  const indexes = globalThis.NumerologyIndexes;
  let engines;
  try {
    engines = Object.fromEntries(['ja','en'].map(language => [language,
      globalThis.NumerologyPriority.createLookupFromIndex(indexes[language], globalThis.NumerologyPriorityReferences, language==='ja'?globalThis.NumerologyRomaji:undefined,language==='en'?globalThis.NumerologyUsSex:undefined)]));
  } catch { engines = null; }
  let locale = document.documentElement.lang === 'en' ? 'en' : 'ja';
  let result = null, statusKey = 'initial';
  const explorers = engines ? Object.fromEntries(['ja','en'].map(language => [language,
    globalThis.NumerologyPriority.createExplorer(indexes[language],language==='ja'?globalThis.NumerologyRomaji:undefined,language==='en'?globalThis.NumerologyUsSex:undefined)])) : null;
  let explorerOpen = false, explorerResult = null, fixedComponent = '', fixedValue = '', explorerPage = 1;
  const text = () => globalThis.InverseText[locale];
  const friendlyLabels = {
    ja: {
      jaDataset: '日本語の名前',
      enDataset: '米国の名前（2024年）',
      r33: '11・22・33を残す',
      r0: '1〜9へ還元',
      passportA: '通常の表記',
      passportOff: '表記：通常の表記',
      passportOn: '表記：通常＋パスポート型'
    },
    en: {
      jaDataset: 'Japanese names',
      enDataset: 'US names (2024)',
      r33: 'Keep 11, 22 and 33',
      r0: 'Reduce to 1–9',
      passportA: 'Standard spelling',
      passportOff: 'Spelling: standard',
      passportOn: 'Spelling: standard + passport-inspired'
    }
  };
  const label = key => friendlyLabels[locale][key] ?? text()[key];
  const format = (s, ...values) => s.replace(/\{(\d+)\}/g, (_, i) => String(values[Number(i)]));
  const number = n => n.toLocaleString(locale);
  function options(select, pairs, selected) {
    select.replaceChildren(...pairs.map(([value, label]) => new Option(label, value)));
    select.value = selected;
    if (select.selectedIndex < 0) { select.value = ''; }
  }
  function fillNumbers() {
    const values = rule.value === 'R33' ? [1,2,3,4,5,6,7,8,9,11,22,33] : [1,2,3,4,5,6,7,8,9];
    fields.forEach((field, i) => options(field,
      [['',text().choose], ...(i ? [['-',text().absent]] : []), ...values.map(n => [String(n),String(n)])], field.value));
  }
  function scope() {
    const ja = dictionary.value === 'ja';
    byId('sex-panel').hidden=ja;
    byId('passport-panel').hidden=!ja; byId('passport-note').hidden=!usePassport();
    byId('matching-spellings-note').hidden=!usePassport();
    byId('scope').textContent = text()[ja ? 'jaScope' : 'enScope']+(ja?' '+label(usePassport()?'passportOn':'passportOff'):' '+sexScope());
    byId('source-details').textContent = text()[ja ? 'jaDetails' : 'enDetails'];
    byId('priority-details').hidden = !ja;
    byId('sample').textContent = text()[ja ? 'sampleJa' : 'sampleEn'];
    byId('name-heading').textContent = text()[ja ? 'nameJa' : 'nameEn'];
    for (const id of ['count-heading','share-heading','denominator']) { byId(id).hidden = ja; }
    byId('views').hidden = !ja;
    weight.parentElement.hidden = ja;
  }
  function fillWeight(selected) {
    options(weight, [['Uniform',text().uniform], ...(dictionary.value === 'en' ? [['Frequency',text().frequency]] : [])], selected);
    if (!weight.value) { weight.value = 'Uniform'; }
    weight.disabled = dictionary.value === 'ja';
  }
  function showStatus() {
    byId('status').textContent = statusKey ? text()[statusKey] : '';
    byId('status').hidden = explorerOpen;
    byId('status').classList.toggle('status', ['invalid','invalidInitial','unavailable'].includes(statusKey));
  }
  function clear(nextStatus = 'changed') {
    result = null; statusKey = nextStatus;
    byId('results').hidden = true; byId('rows').replaceChildren(); showStatus();
  }
  function render() {
    showStatus();
    if (explorerOpen || !result || result.allCount === 0) { return; }
    const ja = dictionary.value === 'ja';
    byId('summary').textContent = ja ? format(text().priorityCounts,number(result.preferredCount),number(result.allCount)) : format(text().found,number(result.allCount));
    byId('total').textContent = ja ? '' : format(text().sourceCount,number(result.matchingWeight));
    byId('share-note').textContent = text()[ja ? 'priorityHint' : weight.value === 'Uniform' ? 'uniformNote' : 'frequencyNote'] + (ja ? '' : ' ' + sexScope());
    for (const view of ['preferred','other','all']) {
      const count = result[view+'Count'];
      byId(view).textContent = format(text()[view+'Button'],number(count ?? 0));
      byId(view).disabled = !count || result.view === view;
      byId(view).setAttribute('aria-pressed',String(result.view === view));
    }
    byId('view-title').textContent = text()['view_'+result.view];
    byId('rows').replaceChildren(...result.candidates.map(candidate => {
      const row = document.createElement('tr');
      const values = [candidate.name,candidate.matches ? candidate.matches.map(m=>m.letters+'〈'+label(m.mode==='A'?'passportA':'passportB')+'〉').join('\n') : candidate.letters,...(ja ? [] : [number(candidate.count),
        candidate.dictionaryConditionalShare.toLocaleString(locale,{style:'percent',minimumFractionDigits:4,maximumFractionDigits:4})])];
      values.forEach((value,i) => {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) { cell.scope = 'row'; }
        cell.textContent = value; row.append(cell);
      });
      return row;
    }));
    byId('page').textContent = format(text().page,number(result.shownFrom),number(result.shownTo),number(result.viewCount),result.page,result.pageCount);
    byId('previous').disabled = !result.hasPrevious;
    byId('next').disabled = !result.hasNext;
    byId('results').hidden = false;
  }
  function search(view = 'auto', page = 1) {
    closeExplorer();
    clear('');
    if (!engines) { clear('unavailable'); return; }
    let normalized;
    try { normalized = globalThis.NumerologyPriority.normalizeInitial(initial.value); }
    catch { clear('invalidInitial'); return; }
    if (fields.some(field => field.value === '')) { clear('invalid'); return; }
    const [e,s,p] = fields.map(field => field.value === '-' ? null : Number(field.value));
    try {
      result = engines[dictionary.value].query({rule:rule.value,output:{e,s,p},weighting:weight.value,initial:normalized,view,page,includePassport:usePassport(),recordedSex:selectedSex()});
      initial.value = result.initial;
      statusKey = result.status === 'no-dictionary-match' ? 'empty' : result.status === 'no-priority-match' ? 'fallback' : '';
      render();
    } catch (error) { clear(error instanceof TypeError ? 'invalid' : 'unavailable'); }
  }
  function applyLanguage() {
    const old = {dictionary:dictionary.value || 'ja',rule:rule.value || 'R33',weight:weight.value || 'Uniform'};
    for (const node of document.querySelectorAll('[data-inverse-text]')) { node.textContent = text()[node.dataset.inverseText]; }
    options(dictionary,[['ja',label('jaDataset')],['en',label('enDataset')]],old.dictionary);
    options(rule,[['R33',label('r33')],['R0',label('r0')]],old.rule);
    options(sex,[['',text().sexAny],['M',text().sexM],['F',text().sexF]],sex.value);
    fillWeight(old.weight); fillNumbers(); scope(); render();
    if (explorerOpen) { refreshExplorer(); }
    document.querySelector('.tool-nav').setAttribute('aria-label',locale==='ja'?'ツール':'Tools');
    document.querySelector('#inverse-results .pagination').setAttribute('aria-label',locale==='ja'?'候補のページ':'Candidate pages');
    document.querySelector('#inverse-browse-list .pagination').setAttribute('aria-label',locale==='ja'?'組み合わせのページ':'Combination pages');
  }
  function resetExplorer() {
    fixedComponent = ''; fixedValue = ''; explorerPage = 1; explorerResult = null;
  }
  function closeExplorer() {
    explorerOpen = false; byId('explorer').hidden = true; byId('browse').hidden = false;
    byId('browse').setAttribute('aria-expanded','false');
    showStatus();
  }
  function baseChanged() {
    clear(); resetExplorer();
    if (explorerOpen) { refreshExplorer(); }
  }
  function refreshExplorer() {
    byId('explorer').hidden = false; byId('browse').hidden = true;
    byId('browse').setAttribute('aria-expanded','true');
    byId('results').hidden = true; byId('status').hidden = true;
    byId('browse-list').hidden = true; byId('clear-initial').hidden = true;
    byId('combinations').replaceChildren();
    options(byId('fix'),[['',text().noFilter],['E','E'],['S','S'],['P','P']],fixedComponent);
    byId('value-field').hidden = !fixedComponent;
    const scopeText = normalized => format(text().browseScope,label(dictionary.value==='ja'?'jaDataset':'enDataset'),label(rule.value==='R33'?'r33':'r0'),normalized || text().anyInitial)+(dictionary.value==='ja'?' '+label(usePassport()?'passportOn':'passportOff'):' '+sexScope());
    byId('browse-scope').textContent = scopeText(initial.value);
    if (!explorers) { byId('browse-status').textContent = text().unavailable; return; }
    try {
      const normalized = globalThis.NumerologyPriority.normalizeInitial(initial.value);
      initial.value = normalized;
      const query = {rule:rule.value,initial:normalized,component:fixedComponent,includePassport:usePassport(),recordedSex:selectedSex()};
      const values = explorers[dictionary.value].query(query).availableValues;
      if (fixedComponent && values.length && !values.includes(fixedValue)) { fixedValue = values[0]; explorerPage = 1; }
      if (!fixedComponent || !values.length) { fixedValue = ''; }
      options(byId('fixed-value'),values.map(v => [v,v==='-'?text()[fixedComponent==='S'?'noVowels':'noConsonants']:v]),fixedValue);
      explorerResult = explorers[dictionary.value].query({...query,value:fixedValue,page:explorerPage});
      explorerPage = explorerResult.page;
      byId('browse-scope').textContent = scopeText(normalized);
      byId('fix').disabled = explorerResult.totalGroups === 0;
      byId('fixed-value').disabled = values.length === 0;
      byId('browse-status').textContent = explorerResult.totalGroups ? '' : text()[normalized ? 'initialEmpty' : 'browseEmpty'];
      byId('clear-initial').hidden = explorerResult.totalGroups > 0 || normalized === '';
      byId('browse-list').hidden = explorerResult.totalGroups === 0;
      for (const row of explorerResult.rows) {
        const tr = document.createElement('tr');
        const {e,s,p} = row.output;
        for (const value of [e,s??'—',p??'—',number(row.allCount)]) {
          const td=document.createElement('td'); td.textContent=value; tr.append(td);
        }
        const td=document.createElement('td'), button=document.createElement('button');
        button.type='button'; button.className='secondary'; button.textContent=text().viewNames;
        button.setAttribute('aria-label',format(text().viewNamesFor,e,s??text().noVowels,p??text().noConsonants));
        button.addEventListener('click',()=>{
          [e,s,p].forEach((n,i)=>{fields[i].value=n===null?'-':String(n);});
          search(); byId('summary').focus();
        });
        td.append(button); tr.append(td); byId('combinations').append(tr);
      }
      const r=explorerResult;
      byId('browse-page').textContent=format(text().browsePage,r.shownFrom,r.shownTo,r.totalGroups,r.page,r.pageCount);
      byId('browse-previous').disabled=!r.hasPrevious; byId('browse-next').disabled=!r.hasNext;
    } catch {
      explorerResult=null; byId('fix').disabled=true; byId('fixed-value').disabled=true;
      byId('browse-status').textContent=text().invalidInitial;
    }
  }
  byId('browse').addEventListener('click',()=>{explorerOpen=true;refreshExplorer();byId('browse-title').focus();});
  byId('browse-close').addEventListener('click',()=>{closeExplorer();render();byId('browse').focus();});
  byId('fix').addEventListener('change',()=>{fixedComponent=byId('fix').value;fixedValue='';explorerPage=1;refreshExplorer();});
  byId('fixed-value').addEventListener('change',()=>{fixedValue=byId('fixed-value').value;explorerPage=1;refreshExplorer();});
  byId('browse-previous').addEventListener('click',()=>{if(explorerResult?.hasPrevious){explorerPage--;refreshExplorer();}});
  byId('browse-next').addEventListener('click',()=>{if(explorerResult?.hasNext){explorerPage++;refreshExplorer();}});
  byId('clear-initial').addEventListener('click',()=>{initial.value='';baseChanged();});
  sex.addEventListener('change',()=>{scope();baseChanged();});
  passport.addEventListener('change',()=>{scope();baseChanged();});
  dictionary.addEventListener('change', () => { fillWeight(dictionary.value==='en'?'Frequency':'Uniform'); scope(); baseChanged(); });
  rule.addEventListener('change', () => { fillNumbers(); baseChanged(); });
  weight.addEventListener('change', () => { closeExplorer(); clear(); });
  initial.addEventListener('input', () => baseChanged());
  fields.forEach(field => field.addEventListener('change', () => { closeExplorer(); clear(); }));
  byId('form').addEventListener('submit', event => { event.preventDefault(); search(); });
  byId('sample').addEventListener('click', () => {
    closeExplorer(); resetExplorer();
    rule.value='R33'; initial.value=''; fillNumbers();
    (dictionary.value==='ja'?[6,4,11]:[9,22,5]).forEach((n,i)=>{fields[i].value=String(n);}); search();
  });
  byId('reset').addEventListener('click', () => {
    closeExplorer(); resetExplorer();
    sex.value=''; passport.checked=false; dictionary.value='ja'; rule.value='R33'; initial.value=''; fillWeight('Uniform'); fillNumbers();
    [6,4,11].forEach((n,i)=>{fields[i].value=String(n);}); scope(); clear('initial');
  });
  for (const view of ['preferred','other','all']) { byId(view).addEventListener('click',()=>search(view)); }
  byId('previous').addEventListener('click', () => { if (result?.hasPrevious) { search(result.view,result.page-1); } });
  byId('next').addEventListener('click', () => { if (result?.hasNext) { search(result.view,result.page+1); } });
  document.addEventListener('numerology-language', event => { locale=event.detail; applyLanguage(); });
  applyLanguage(); [6,4,11].forEach((n,i)=>{fields[i].value=String(n);});
  if (!engines) { clear('unavailable'); }
})();
