'use strict';
(() => {
  const name=document.getElementById('name'), toggle=document.getElementById('compare-passport'), panel=document.getElementById('comparison');
  const {calculate,convert,InputError,format}=globalThis.Numerology;
  function render() {
    panel.hidden=!toggle.checked;
    if(!toggle.checked) {panel.textContent='';return;}
    const locale=document.documentElement.lang==='en'?'en':'ja', content=NumerologyData.content[locale], ui=content.ui;
    if(!/[\u3041-\u3096]/.test(name.value)) {panel.textContent=ui.passportReading;return;}
    try {
      const a=calculate(convert(name.value)), converted=convertPassport(name.value,NumerologyData.rules,NumerologyData.passport);
      const numbers=n=>`E ${n.expression.number??'—'} / S ${n.soul.number??'—'} / P ${n.personality.number??'—'}`;
      const line=(mode,n)=>`${mode}: ${n.roman.toUpperCase()} → ${numbers(n)}`;
      if(converted.roman===null) {panel.textContent=line(ui.passportA,a)+'\n'+ui.passportUnavailable+'\n'+ui.passportHint;return;}
      const b=calculate(converted.roman), state=a.expression.letters===b.expression.letters?'passportSame':numbers(a)===numbers(b)?'passportSpellingOnly':'passportDifferent';
      panel.textContent=[line(ui.passportA,a),line(ui.passportB,b),ui[state],ui.passportHint].join('\n');
    } catch(ex) {
      if(!(ex instanceof InputError)) throw ex;
      panel.textContent=format(content.errors[ex.code],...ex.values);
    }
  }
  toggle.addEventListener('change',render);
  name.addEventListener('input',event=>{if(!event.isComposing)render();});
  name.addEventListener('compositionstart',()=>{panel.textContent='';});
  name.addEventListener('compositionend',render);
  document.getElementById('example').addEventListener('click',render);
  document.addEventListener('numerology-language',render);
  render();
})();
