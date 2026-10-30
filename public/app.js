'use strict';
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=c=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format((c||0)/100);
const date=v=>v?new Date(typeof v==='number'?v*1000:v+'T12:00:00').toLocaleDateString('nl-NL',{day:'numeric',month:'short'}):'—';
const icons={user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',eye:'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',arrow:'M4 12h16 M14 6l6 6-6 6',moon:'M20 15.6A8.5 8.5 0 0 1 8.4 4a8.5 8.5 0 1 0 11.6 11.6Z',dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',invoice:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M8 13h8 M8 17h5',bank:'M3 9h18 M4 20h16 M6 10v7 M12 10v7 M18 10v7 M2 7l10-5 10 5',check:'M4 12l5 5L20 6',tasks:'M9 5h12 M9 12h12 M9 19h12 M3 5h.01 M3 12h.01 M3 19h.01',tax:'M4 3h16v18l-4-2-4 2-4-2-4 2Z M8 7h8 M8 11h8 M8 15h4',folder:'M3 7V5a2 2 0 0 1 2-2h5l2 4h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',plug:'M8 3v5 M16 3v5 M6 8h12v3a6 6 0 0 1-12 0Z M12 17v5',users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z',plus:'M12 5v14 M5 12h14',upload:'M12 16V3 M7 8l5-5 5 5 M3 15v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5',download:'M12 3v13 M7 11l5 5 5-5 M3 16v4h18v-4',mail:'M3 5h18v14H3Z M3 5l9 7 9-7',search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',logout:'M9 21H3V3h6 M9 12h12 M17 8l4 4-4 4',chevron:'M9 5l7 7-7 7',close:'M6 6l12 12 M6 18 18 6',menu:'M3 6h18 M3 12h18 M3 18h18',spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',lock:'M5 11h14v10H5Z M8 11V7a4 4 0 0 1 8 0v4',wallet:'M20 8H4V4h14v4 M4 8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16V8 M15 12h5v5h-5Z',clock:'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',info:'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',edit:'M16 3l5 5-12 12-6 1 1-6Z M13 6l5 5',refresh:'M20 7V3l-4 4 M20 7A8 8 0 0 0 5 5 M4 17v4l4-4 M4 17a8 8 0 0 0 15 2'};
const icon=(name)=>`<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${icons[name]||icons.invoice}"/></svg>`;
const pages=[['dashboard','Overzicht','dashboard'],['events','Evenementen','folder'],['invoices','Facturen','invoice'],['bank','Bank & pin','bank'],['vat','Btw-overzicht','tax'],['files','Documenten','folder'],['tasks','Taken','tasks'],['integrations','Koppelingen','plug'],['users','Gebruikers','users'],['settings','Instellingen','settings']];
pages.splice(3,0,['odoo','Odoo-administratie','bank']);
const PRIMARY=8;
let odooCache=null,odooLoading=false,odooError='',odooEpoch=0;
function odooSelect(key,label,value,rows){
  if(!rows)return input(key,label,value,'number','min="1"');
  return `<div class="field"><label for="f-${key}">${label}</label><select id="f-${key}" name="${key}"><option value="">Kies ${label.toLowerCase()}</option>${value&&!rows.some(r=>r.id===+value)?`<option value="${esc(value)}" selected>ID ${esc(value)} · niet gevonden</option>`:''}${rows.map(r=>`<option value="${r.id}" ${r.id===+value?'selected':''}>${esc((r.code?r.code+' · ':'')+r.name)}</option>`).join('')}</select></div>`
}
function odooView(){return title('Odoo-administratie','Live gegevens uit jouw Odoo-account',`<button data-action="odoo-refresh">${icon('refresh')} Vernieuwen</button>${user.role==='admin'?'<button data-config="odoo">Koppeling instellen</button>':''}`)+`<div id="odoo-results">${odooBody()}</div>`}
function odooBody(){
  if(odooError)return `<div class="error-box">${esc(odooError)}</div><p class="helper">Controleer de koppeling onder Koppelingen en probeer opnieuw.</p>`;
  if(!odooCache)return '<div class="empty"><div class="spinner"></div>Odoo-administratie ophalen…</div>';
  const r=odooCache,c=r.catalog,m=r.mapping,chosen=(rows,id)=>rows.find(x=>x.id===+id),journal=chosen(c.journals,m.odoo_purchase_journal),account=chosen(c.accounts,m.odoo_expense_account);
  const money=(v,cur)=>{try{return esc(new Intl.NumberFormat('nl-NL',{style:'currency',currency:cur}).format(v||0))}catch{return esc((v||0)+' '+cur)}};
  const payment={not_paid:'Onbetaald',partial:'Deels betaald',in_payment:'Betaling onderweg',paid:'Betaald',reversed:'Teruggedraaid',blocked:'Geblokkeerd'};
  return `<div class="stats">${stat('Inkoopfacturen',r.counts.total,'Inclusief creditnota’s','invoice')}${stat('Geboekt',r.counts.posted,'In jouw Odoo-administratie','check')}${stat('Openstaand',r.counts.unpaid,'Geboekt · nog niet betaald','wallet')}${stat('Concepten',r.counts.draft,'Nog niet geboekt','edit')}</div>
  <section class="card"><div class="card-head"><div><h2>Recente inkoopfacturen</h2><p>Laatste 50 · rechtstreeks uit Odoo · ${date(r.checked)}</p></div></div>${r.invoices.length?`<div class="table-wrap"><table><thead><tr><th>Crediteur / nummer</th><th>Datum</th><th>Status</th><th class="amount">Totaal</th><th class="amount">Nog te betalen</th></tr></thead><tbody>${r.invoices.map(i=>`<tr><td><strong>${esc(i.partner_id?.[1]||'Onbekende crediteur')}</strong><div class="helper">${esc(i.name||'Concept')} ${i.ref?'· '+esc(i.ref):''}${i.move_type==='in_refund'?' · Creditnota':''}</div></td><td>${date(i.invoice_date||null)}</td><td>${badge(i.state==='draft'?'Concept':i.state==='cancel'?'Geannuleerd':payment[i.payment_state]||'Geboekt',i.payment_state==='paid'?'lime':'')}</td><td class="amount">${money(i.amount_total,i.currency_id?.[1]||'EUR')}</td><td class="amount">${money(i.amount_residual,i.currency_id?.[1]||'EUR')}</td></tr>`).join('')}</tbody></table></div>`:empty('Nog geen inkoopfacturen in Odoo','Er staan voor dit account geen inkoopfacturen of creditnota’s.','','invoice')}</section>
  <section class="card card-pad section-gap"><h2>Boeken vanuit Moonshine</h2><div class="odoo-mapping"><div><span>Inkoopdagboek</span><strong>${esc(journal?.name||'Nog kiezen')}</strong></div><div><span>Kostenrekening</span><strong>${account?esc(account.code+' · '+account.name):'Nog kiezen'}</strong></div><div><span>Btw-mapping</span><strong>${Object.keys(m.odoo_tax_map||{}).length} codes ingesteld</strong></div></div><p class="helper">${journal&&account&&Object.keys(m.odoo_tax_map||{}).length?'De boekingsinstellingen zijn ingevuld. Controleer ze vóór je een factuur boekt.':'De verbinding werkt; kies nog het inkoopdagboek, de kostenrekening en btw-codes om vanuit Moonshine te boeken.'}</p>${user.role==='admin'?'<button data-config="odoo">Boekingsinstellingen</button>':''}</section>
  <details class="card card-pad section-gap"><summary>Beschikbare dagboeken en btw-codes</summary><div class="odoo-catalog"><div><h3>Dagboeken</h3>${c.journals.map(j=>`<p>${esc(j.name)} <span class="helper">· ID ${j.id} · ${j.type==='purchase'?'Inkoop':'Bank'}</span></p>`).join('')}</div><div><h3>Inkoop-btw</h3>${c.taxes.map(t=>`<p>${esc(t.name)} <span class="helper">· ID ${t.id}</span></p>`).join('')}</div></div></details><p class="helper">Dit overzicht leest Odoo. Facturen onder ‘Facturen’ en cijfers op ‘Overzicht’ gaan over documenten die Moonshine heeft ontvangen; Odoo-facturen worden daar niet dubbel geïmporteerd.</p>`;
}
async function loadOdoo(force=false){
  if(odooLoading)return;
  if(odooCache&&!force)return;
  if(demo){odooError='Log in om jouw Odoo-administratie te bekijken.';if($('#odoo-results'))$('#odoo-results').innerHTML=odooBody();return}
  odooLoading=true;const epoch=odooEpoch;odooError='';
  if(force&&$('#odoo-results'))$('#odoo-results').innerHTML='<div class="empty">Odoo-administratie ophalen…</div>';
  try{const r=await api('/odoo/overview');if(epoch===odooEpoch&&user)odooCache=r}catch(e){if(epoch===odooEpoch&&user)odooError=e.message}
  finally{if(epoch===odooEpoch){odooLoading=false;if($('#odoo-results'))$('#odoo-results').innerHTML=odooBody()}}
}
let user=null,csrf='',state=null,demo=false,page='dashboard',filter='all',search='',taskFilter='open',settingsCache=null,vatCache=null,toastTimer,pollTimer,uploading=false,shellRendered=false;
let vatYear=null,vatQuarter=null,searchTimer=0,lastSignature='',lastUpdated=0,eventsApi=null;
const roleName=r=>({admin:'Beheerder',finance:'Administratie',viewer:'Alleen lezen'}[r]||r);
// Shared with events.js, which is a separate module with its own state.
window.__csrf='';window.__state=null;
window.__toast=(t,e)=>toast(t,e);
window.__modal=(t,b,f)=>modal(t,b,f);
window.__closeModal=()=>$('#dialog').close();
function toast(text,error=false){const el=$('#toast');el.textContent=text;el.className='show'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',4500)}
async function api(path,opts={}){if(demo&&opts.method&&opts.method!=='GET')throw new Error('De voorbeeldweergave is alleen-lezen. Log in om wijzigingen op te slaan.');const headers={'X-CSRF-Token':csrf,...opts.headers};if(opts.body&&!(opts.body instanceof FormData)){headers['Content-Type']='application/json';opts.body=JSON.stringify(opts.body)}const r=await fetch('/api'+path,{...opts,headers});const data=await r.json();if(!r.ok){if(r.status===401&&path==='/logout')return {};if(r.status===401&&path!=='/login'&&!demo){resetSession();renderLogin()}throw new Error(data.error||'Handeling mislukt.')}return data}
function demoState(){const now=Date.now()/1000;const docs=[['Voltage Agency','VA-2026-041','invoice-voltage.pdf',174400,'review','9','NL',97],['Rent-All','RA-2026-1820','rent-all-techniek.pdf',363000,'posted','21','NL',99],['The North Quarter','TNQ-0082','artist-fee.pdf',125000,'review','reverse_non_eu','GB',89],['Club BASIS','CB-2026-103','zaalhuur-basis.pdf',242000,'posted','21','NL',99],['Hotel NH Utrecht','NH-09262','hotel-bon.jpg',16350,'posted','9','NL',98],['Toolstation','TS-203841','materiaal.pdf',8495,'awaiting_ai','21','NL',0]].map((d,i)=>({id:String(i+1).padStart(24,'0'),name:d[2],mime:'application/pdf',size:132000+i*13300,source:i===5?'Upload':'Outlook',status:d[4],odoo_id:d[4]==='posted'?100+i:null,error:i===2?'Btw-verlegging vraagt bevestiging.':null,created:now-i*3200,details:{supplier:d[0],number:d[1],date:'2026-10-05',currency:'EUR',country:d[6],total:d[3],confidence:d[7]/100,lines:[{description:i===0?'DJ-optreden Moonshine':'Levering Moonshine',net:Math.round(d[3]/(1+(+d[5]||0)/100)),tax:d[5]}],explanation:'Voorbeeld van een uitgelezen factuur.'}}));return {documents:docs,transactions:[{id:'tx-demo1',external_id:'ING/demo1',source:'ING',date:'2026-10-05',description:'RENT-ALL RA-2026-1820',amount:-363000,fee:0,category:'unknown',status:'open'},{id:'tx-demo2',source:'SumUp',date:'2026-10-04',description:'Pinomzet Moonshine — bar',amount:648000,fee:12312,vat_rate:21,category:'sales',status:'open'},{id:'tx-demo3',source:'ING',date:'2026-10-06',description:'SumUp verzameluitbetaling',amount:635688,fee:0,category:'settlement',status:'open'}],tasks:[{id:'task-demo1',title:'Btw-verlegging The North Quarter controleren',description:'Controleer leverancier en plaats van dienst.',priority:'high',due:'2026-10-07',done:0,assignee:'demo'},{id:'task-demo2',title:'ING-bankkoppeling aansluiten',priority:'normal',due:'2026-10-09',done:0,assignee:'demo'},{id:'task-demo3',title:'OneDrive-map voor facturen instellen',priority:'normal',due:'2026-10-10',done:0},{id:'task-demo4',title:'Facturen van september controleren',priority:'normal',due:'2026-10-03',done:1}],users:[{id:'demo',name:'Peppy',username:'peppy',role:'admin',active:1}],audit:[{id:1,action:'Rent-All geboekt in Odoo',actor:'Claude',created:now-1800},{id:2,action:'Artist fee vraagt btw-controle',actor:'Claude',created:now-3200},{id:3,action:'Pinrapport ontvangen',actor:'SumUp',created:now-6400}],matches:[{transaction_id:'tx-demo1',document_id:docs[1].id,score:99,reasons:['Exact bedrag','Factuurnummer'],supplier:'Rent-All',ambiguous:false}],connections:['Odoo','Claude','Outlook','OneDrive','Microsoft To Do','ING','SumUp'].map((name,i)=>({name,id:['odoo','claude','microsoft','onedrive','todo','ing','sumup'][i],status:i<4?'verified':'not_connected'})),finance_email:'finance@moonshinednb.nl',company:'Moonshine'}}
function renderLogin(error=''){
  $('#app').innerHTML=`<main class="studio-login">
    <section class="brand-stage" aria-label="Moonshine">
      <div class="stage-top"><span>MOONSHINE</span></div>
      <div class="sculpture-view"><img class="scene-fallback" src="/assets/moonshine-logo.svg" alt="Moonshine"><canvas class="logo-scene" role="img" aria-label="Moonshine-logo in chroom op een ruwe grijze ondergrond"></canvas></div>
      <div class="stage-bottom"><h1>Premium <span>Backoffice.</span></h1><p>Manage your team, content, documents and more.<br>All in one place.</p><div class="stage-progress" aria-hidden="true"><i></i></div></div>
    </section>
    <div class="private-badge">${icon('lock')} Private workspace</div>
    <section class="access-panel"><div class="access-form">
      <img class="access-logo" src="/assets/moonshine-logo.svg" alt="Moonshine">
      <p class="access-kicker">TEAM ACCESS</p><h2>Welkom <span>terug.</span></h2>
      <p class="access-copy">Je administratie, documenten en team.<br>Alles op één plek.</p>
      <form id="login-form">${error?`<div class="error-box">${esc(error)}</div>`:''}
        <div class="field"><label for="username">Gebruikersnaam</label><div class="input-icon">${icon('user')}<input id="username" name="username" autocomplete="username" value="peppy" required></div></div>
        <div class="field"><label for="password">Wachtwoord</label><div class="input-icon">${icon('lock')}<input id="password" name="password" type="password" autocomplete="current-password" placeholder="Vul je wachtwoord in" required><button type="button" class="password-visibility" data-action="show-password" aria-label="Wachtwoord tonen" aria-pressed="false">${icon('eye')}</button></div></div>
        <button class="primary" type="submit">Inloggen ${icon('arrow')}</button>
      </form>
      <button class="text-link login-help" data-action="login-help">Wachtwoord vergeten? ${icon('chevron')}</button>
      <button class="text-link demo-link" data-action="demo">Voorbeeldgegevens bekijken</button>
    </div><div class="access-bottom"><span>Moonshine Backoffice</span></div></section>
  </main>`;
}
/* Re-rendering the entire app every 20s was destroying and rebuilding the
   whole DOM 180 times an hour per tab: focus lost, mobile menu closing
   itself, hover dropped, images re-rasterised, table scroll reset.
   Now the shell renders once and only #content is swapped, and a render is
   skipped entirely when nothing the view depends on actually changed. */
function signature(){
  const docs=(state.documents||[]).map(d=>d.id+d.status+(d.odoo_id||'')+d.updated).join(',');
  const tasks=(state.tasks||[]).map(t=>t.id+t.done+t.title+(t.due||'')).join(',');
  const tx=(state.transactions||[]).map(t=>t.id+t.status+t.category).join(',');
  return page+filter+search+taskFilter+(state.users||[]).length+docs+tasks+tx+(state.matches||[]).length;
}
async function refresh(render=true){
  const currentUser=user;
  const next=demo?demoState():await api('/state');
  if(!user||user!==currentUser)return;
  state=next;
  window.__state=state;
  if(!render)return;
  const sig=signature();
  if(sig===lastSignature&&shellRendered)return;
  lastSignature=sig;
  renderApp();
}
const statusMap={posted:['Geboekt','lime'],review:['Controle nodig','amber'],awaiting_ai:['Wacht op AI','purple'],processing:['Wordt verwerkt','blue']};
function badge(text,color=''){return `<span class="badge ${color}">${esc(text)}</span>`}
function documentBadge(d){return badge(...(statusMap[d.status]||[d.status,'']))}
function connectionBadge(c){return c.status==='verified'?badge('Geverifieerd','lime'):c.status==='configured'?badge('Nog testen','amber'):badge('Niet gekoppeld')}
function title(name,sub='',actions=''){return `<header class="page-title"><div><p class="eyebrow">Moonshine backoffice</p><h1>${name}</h1>${sub?`<p>${sub}</p>`:''}</div><div class="row-actions">${actions}</div></header>`}
function empty(head,sub,action='',ico='folder'){return `<div class="empty">${icon(ico)}<strong>${head}</strong>${sub}${action?`<div>${action}</div>`:''}</div>`}
function uploadZone(){return `<div class="upload-zone" tabindex="0" role="button" aria-label="Factuur uploaden" data-action="upload">${iconWrap('upload','upload-symbol')}<h3>Factuur uploaden</h3><p>Sleep een factuur of bon naar dit venster.<br>PDF of afbeelding · maximaal 15 MB</p><button class="small" data-action="upload">Bestand kiezen</button></div>`}
function iconWrap(i,c){return `<div class="${c}">${icon(i)}</div>`}
function invoiceTable(docs,compact=false){
  if(!docs.length){
    // The old single empty state fired for ANY empty result, so filtering to
    // "Controle nodig" with zero matches told you to upload your first
    // invoice while you already had thousands. Distinguish the two cases.
    if(filter!=='all'||search){
      return empty('Geen resultaten in deze weergave',`Geen facturen gevonden voor "${esc(search||'filter '+filter)}". <button class="text-link" data-action="clear-filters">Filters wissen</button>`,'invoice');
    }
    return empty('Je inbox staat klaar','Upload je eerste factuur of sluit finance@ aan.','<button data-action="upload">'+icon('upload')+' Factuur uploaden</button>','invoice');
  }
  return `<div class="table-wrap"><table><thead><tr><th>Crediteur / factuur</th>${compact?'':'<th>Datum</th><th>Kanaal</th>'}<th class="amount">Bedrag</th><th>Status</th><th aria-label="Details"></th></tr></thead><tbody>${docs.map(d=>`<tr class="clickable" data-document="${esc(d.id)}" tabindex="0" role="button"><td><div class="supplier"><div class="supplier-icon">${icon('invoice')}</div><div><strong>${esc(d.details.supplier||d.name)}</strong><small>${esc(d.details.number||'Nog niet uitgelezen')}</small></div></div></td>${compact?'':`<td>${date(d.details.date)}</td><td>${esc(d.source)}</td>`}<td class="amount">${d.details.total?eur(d.details.total):'—'}</td><td>${documentBadge(d)}</td><td>${icon('chevron')}</td></tr>`).join('')}</tbody></table></div>`;
}
function expenseChart(){
  const now=new Date(),months=[];
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'),label:d.toLocaleDateString('nl-NL',{month:'short'}),value:0})}
  for(const d of state.documents){if(d.status!=='posted')continue;const m=months.find(m=>m.key===(d.details.date||'').slice(0,7));if(m)m.value+=d.details.total||0}
  const max=Math.max(10000,...months.map(m=>m.value)),total=months.reduce((v,m)=>v+m.value,0);
  return `<div class="chart-total">${eur(total)}</div><p class="chart-caption">Geboekte inkoopfacturen · afgelopen 6 maanden</p><svg class="expense-chart" viewBox="0 0 610 200" role="img" aria-label="Inkoopbedragen per maand: ${esc(months.map(m=>m.label+' '+eur(m.value)).join(', '))}">${[0,1,2,3].map(i=>`<line class="chart-grid" x1="65" y1="${18+i*48}" x2="591" y2="${18+i*48}"/><text class="chart-label" x="55" y="${22+i*48}" text-anchor="end">${esc(eur(max*(1-i/3)).replace(',00',''))}</text>`).join('')}${months.map((m,i)=>{const h=m.value/max*140;return `<rect class="chart-bar ${i===5?'current':''}" x="${86+i*86}" y="${162-h}" width="42" height="${h}" rx="3"/><text class="chart-label" x="${107+i*86}" y="185" text-anchor="middle">${esc(m.label)}</text>`}).join('')}</svg>${total?'':'<div class="chart-zero">Nog geen geboekte facturen in deze periode</div>'}`
}
function dashboard(){
  const docs=state.documents,posted=docs.filter(d=>d.status==='posted'),review=docs.filter(d=>d.status==='review'),pending=docs.filter(d=>d.status!=='posted'),tasks=state.tasks.filter(t=>!t.done),total=docs.reduce((s,d)=>s+(d.details.total||0),0),verified=state.connections.filter(c=>c.status==='verified').length;
  const attention=review.slice(0,2).map(d=>`<div class="attention-item"><div class="supplier-icon">${icon('invoice')}</div><div><strong>${esc(d.details.supplier||d.name)}</strong><small>${esc(d.details.number||'Factuur controleren')} · ${d.details.total?eur(d.details.total):'Nog uit te lezen'}</small></div><button data-document="${esc(d.id)}">Bekijken</button></div>`).join('');
  return title('Overzicht','Alle financiële bewegingen op één plek.',`<button class="ghost" data-action="export">${icon('download')} Exporteren</button><button class="primary" data-action="upload">${icon('plus')} Nieuwe factuur</button>`)+`
  <div class="stats">${stat('Ontvangen facturen',docs.length,`${eur(total)} totaal`,'invoice')}${stat('Geboekt in Odoo',posted.length,docs.length?`${Math.round(posted.length/docs.length*100)}% verwerkt`:'Nog geen boekingen','check')}${stat('Te controleren',review.length,'In de controle-inbox','clock')}${stat('Openstaande taken',tasks.length,'Voor jou en je team','tasks')}</div>
  <section class="card card-pad odoo-entry"><div><h2>Jouw Odoo-administratie</h2><p class="helper">Bekijk bestaande inkoopfacturen, openstaande posten en boekingsinstellingen.</p></div><button data-route="odoo">Odoo bekijken ${icon('arrow')}</button></section>
  <div class="dashboard-primary">
    <section class="card expense-overview"><div class="card-head"><h2>Financieel overzicht</h2><div class="chart-legend"><span><i></i>Inkoop</span><span><i></i>Deze maand</span></div></div>${expenseChart()}</section>
    <section class="card needs-attention"><div class="card-head"><div><h2>Jouw aandacht</h2><p>${review.length} facturen · ${tasks.length} open taken</p></div><button class="text-link" data-action="new-task">Nieuwe taak</button></div>${attention}${tasks.slice(0,attention?2:3).map(taskRow).join('')}${!review.length&&!tasks.length?empty('Alles bijgewerkt','Geen facturen of taken die aandacht vragen.','<button data-action="new-task">Taak toevoegen</button>','check'):''}<div class="attention-footer"><span>Moonshine-team</span><button class="text-link" data-route="tasks">Alle taken</button></div></section>
  </div>
  <div class="automation-strip"><span class="automation-indicator" aria-hidden="true"></span><div><strong>${verified>=3?'Verwerking actief':'Verwerking klaar voor aansluiting'}</strong><p>${verified} geverifieerde koppelingen · ${pending.length} facturen in behandeling</p></div><button data-route="integrations">Koppelingen</button></div>
  <div class="dashboard-secondary">
    <section class="card"><div class="card-head"><div><h2>Recente facturen</h2><p>De laatste ontvangen documenten</p></div><button class="text-link" data-route="invoices">Alle facturen</button></div>${invoiceTable(docs.slice(0,5),true)}<div class="table-foot">${icon('mail')} ${esc(state.finance_email)}</div></section>
    <aside class="stack"><section class="card card-pad">${uploadZone()}<div class="mail-info">${icon('mail')}${esc(state.finance_email)}</div></section><section class="card"><div class="card-head"><h2>Verbindingen</h2><button class="text-link" data-route="integrations">Beheren</button></div><div class="connections-compact">${state.connections.slice(0,4).map(c=>`<div class="conn-row"><span class="conn-logo">${esc(c.name.slice(0,2))}</span><div>${esc(c.name)}<small class="connection-description">${c.status==='verified'?'Geverifieerd':c.status==='configured'?'Nog testen':'Niet gekoppeld'}</small></div></div>`).join('')}</div></section></aside>
  </div><div class="dashboard-activity">${icon('clock')}<strong>Laatste activiteit</strong>${state.audit.length?state.audit.slice(0,2).map(a=>`<span>${esc(a.action)} · ${esc(a.actor)} · ${date(a.created)}</span>`).join(''):'<span>Nog geen activiteit</span>'}</div>`
}
function stat(label,value,sub,i,change=false){return `<article class="stat"><div class="stat-top">${label}${icon(i)}</div><strong>${value}</strong><small class="${change?'change':''}">${sub}</small></article>`}
function invoices(){return title('Facturen','Ontvangst, controle en boeking',`<button class="ghost" data-action="export">${icon('download')} Export</button><button class="primary" data-action="upload">${icon('plus')} Factuur toevoegen</button>`)+`<div class="toolbar"><div class="search">${icon('search')}<input id="invoice-search" aria-label="Zoek facturen" placeholder="Zoek crediteur of factuurnummer" value="${esc(search)}"></div><div class="tabs">${[['all','Alle facturen'],['review','Controle nodig'],['posted','Geboekt'],['awaiting_ai','In verwerking']].map(([v,t])=>`<button class="${filter===v?'active':''}" data-filter="${v}">${t}</button>`).join('')}</div></div><section class="card" id="invoice-results">${filteredInvoices()}</section><p class="helper">De originele bijlage blijft bewaard. Alleen geverifieerde facturen worden in Odoo geboekt.</p>`}
function filteredInvoices(){const q=search.toLowerCase();return invoiceTable(state.documents.filter(d=>(filter==='all'||d.status===filter||(filter==='awaiting_ai'&&d.status==='processing'))&&[d.name,d.details.supplier,d.details.number].some(v=>String(v||'').toLowerCase().includes(q))))}
function taskRow(t){const assignee=state.users.find(u=>u.id===t.assignee);return `<div class="task-row ${t.done?'done':''}"><input type="checkbox" ${t.done?'checked':''} data-task="${esc(t.id)}" aria-label="${esc(t.title)} afronden"><div><strong>${esc(t.title)}</strong><small>${t.due?date(t.due):'Geen deadline'}${assignee?' · '+esc(assignee.name):''}</small></div>${t.priority==='high'&&!t.done?badge('Prioriteit','amber'):''}<button class="icon-btn ghost task-edit" data-edit-task="${esc(t.id)}" aria-label="${esc(t.title)} bewerken">${icon('edit')}</button></div>`}
function tasks(){const list=state.tasks.filter(t=>taskFilter==='all'||taskFilter==='done'?taskFilter==='all'||t.done:!t.done);const connection=state.connections.find(c=>c.id==='todo');return title('Taken','Werk voor jou en het Moonshine-team',`<button class="primary" data-action="new-task">${icon('plus')} Nieuwe taak</button>`)+`<div class="toolbar"><div class="tabs">${[['open','Openstaand'],['done','Afgerond'],['all','Alle taken']].map(([v,t])=>`<button class="${taskFilter===v?'active':''}" data-task-filter="${v}">${t}</button>`).join('')}</div><div class="task-filters">${connectionBadge(connection)}</div></div><section class="card"><div class="card-head"><h2>${list.length} ${list.length===1?'taak':'taken'}</h2><button class="text-link" data-route="integrations">Microsoft To Do instellen</button></div>${list.length?list.map(taskRow).join(''):empty('Geen taken in deze lijst','Voeg een taak toe en wijs hem toe aan je team.','<button data-action="new-task">Nieuwe taak</button>','tasks')}</section><p class="helper">Lokale taken worden direct opgeslagen. Synchronisatie met Microsoft To Do start zodra de verbinding is ingesteld.</p>`}
function bank(){const tx=state.transactions;const pin=tx.filter(t=>t.source==='SumUp'&&t.category==='sales'),gross=pin.reduce((s,t)=>s+t.amount,0),fees=pin.reduce((s,t)=>s+t.fee,0),settled=tx.filter(t=>t.category==='settlement').reduce((s,t)=>s+t.amount,0);return title('Bank & pin','Transacties, pinomzet en aflettering',`<button class="ghost" data-action="csv-template">${icon('download')} CSV-template</button><button class="primary" data-action="import-bank">${icon('upload')} Bankexport importeren</button>`)+`<div class="stats">${stat('Banktransacties',tx.filter(t=>t.source==='ING').length,'Geïmporteerd of ontvangen','bank')}${stat('Te matchen',tx.filter(t=>t.amount<0&&t.status==='open').length,'Openstaande afschrijvingen','refresh')}${stat('Pinomzet',eur(gross),'Geclassificeerde SumUp-omzet','wallet')}${stat('Transactiekosten',eur(fees),'Apart van de omzet','invoice')}</div><section class="card"><div class="card-head"><div><h2>Voorgestelde matches</h2><p>Een boeking wordt pas afgeletterd na een geslaagde Odoo-verwerking.</p></div>${badge(state.matches.length+' voorstellen','purple')}</div>${state.matches.length?state.matches.map(m=>{const t=tx.find(t=>t.id===m.transaction_id);return `<div class="matching-grid"><div><strong>${esc(t.description)}</strong><small>ING · ${date(t.date)}</small><div class="match-amount">${eur(t.amount)}</div></div><div><strong>${esc(m.supplier)}</strong><small>${esc(m.reasons.join(' · '))}</small><div class="helper">${badge(m.ambiguous?'Meerdere kandidaten':m.score+'% overeenkomst',m.ambiguous?'amber':'lime')}</div></div><button data-match="${esc(m.transaction_id)}" data-match-doc="${esc(m.document_id)}" ${m.ambiguous?'disabled':''}>${icon('check')} Afletteren</button></div>`}).join(''):empty('Geen matches om te beoordelen','Importeer banktransacties en boek je facturen in Odoo.','','bank')}</section><section class="card section-gap"><div class="card-head"><h2>SumUp · tussenrekening</h2>${badge('Controleoverzicht','purple')}</div><div class="sumup-summary"><div><label>Bruto pinomzet</label><strong>${eur(gross)}</strong></div><div><label>Kosten</label><strong>${eur(fees)}</strong></div><div><label>Te ontvangen</label><strong>${eur(gross-fees-settled)}</strong></div></div><div class="split-note">Markeer ING-uitbetalingen als <strong>Verzameluitbetaling</strong> om dubbeltelling van omzet te voorkomen. Uitbetalingen worden via payout_id gekoppeld aan bruto pinomzet en kosten. Stel eerst de Odoo-tussenrekening, omzet- en kostenmapping in.</div></section><section class="card section-gap"><div class="card-head"><h2>Alle transacties</h2></div>${tx.length?`<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Omschrijving</th><th>Bron</th><th class="amount">Bedrag</th><th>Classificatie</th><th>Status</th><th></th></tr></thead><tbody>${tx.map(t=>`<tr><td>${date(t.date)}</td><td>${esc(t.description)}</td><td>${esc(t.source)}</td><td class="amount">${eur(t.amount)}</td><td>${esc({sales:'Omzet',settlement:'Verzameluitbetaling',fee:'Kosten',unknown:'Nog indelen'}[t.category])}${t.vat_rate?' · '+t.vat_rate+'%':''}</td><td>${badge(t.status==='matched'?'Afgeletterd':'Open',t.status==='matched'?'lime':'')}</td><td>${t.source==='ING'&&t.category==='settlement'&&t.status!=='matched'?`<button class="small" data-settle="${esc(t.id)}">Verwerken</button> `:''}<button class="icon-btn" data-transaction="${esc(t.id)}" aria-label="Transactie indelen">${icon('edit')}</button></td></tr>`).join('')}</tbody></table></div>`:empty('Je bankoverzicht staat klaar','Importeer een CSV of sluit de bank-webhook aan.','','bank')}</section>`}
function files(){return title('Documenten','Originele facturen en bonnen',`<button class="primary" data-action="upload">${icon('plus')} Bestand toevoegen</button>`)+`<div class="notice">${icon('info')} Je bestanden worden op de server bewaard en bij boeking aan Odoo gekoppeld. OneDrive-archivering kun je aanzetten bij Koppelingen.</div>${state.documents.length?`<div class="file-list">${state.documents.map(d=>`<article class="card file-card">${icon('invoice')}<h3>${esc(d.name)}</h3><p>${Math.round(d.size/1024)} KB · ${date(d.created)} · ${esc(d.source)}</p><footer>${documentBadge(d)}<button class="icon-btn" data-download="${esc(d.id)}" aria-label="${esc(d.name)} downloaden">${icon('download')}</button></footer>${d.details.onedrive_url?`<p class="helper">Ook gearchiveerd in OneDrive</p>`:''}</article>`).join('')}</div>`:`<section class="card card-pad">${uploadZone()}</section>`}`}
const integrationText={odoo:['OD','De boekhouding','Crediteuren, inkoopfacturen en originele bijlagen. Boek vanuit de backoffice rechtstreeks in Odoo.'],claude:['CL','Facturen lezen','Leest PDF’s en foto’s uit. Geeft twijfelgevallen door voor controle.'],microsoft:['OU','De finance-inbox','Ontvangt facturen uit finance@moonshinednb.nl. Achtergrondcontrole elke minuut; webhook optioneel.'],onedrive:['ON','Het documentarchief','Archiveert geboekte facturen in de ingestelde Moonshine-map.'],todo:['TO','Samen aan het werk','Synchroniseert taken met een Microsoft To Do-lijst via jouw Microsoft-account.'],ing:['IN','Banktransacties','Leest de bestaande ING-bankfeed vanuit Odoo. CSV-import en een beveiligde webhook zijn ook beschikbaar.'],sumup:['SU','Pin & uitbetalingen','Importeer omzet, kosten en uitbetalingen. Groepeer via payout_id; de flow boekt omzet en kosten en lettert de uitbetaling af.'],calendar:['AG','De agenda','Leest je Microsoft-agenda en zet evenementen als optreden in de agenda.'],promo:['PR','Promo-mail','Campagnes via je Outlook-mailbox met wachtrij en preview.'],labelgrid:['LG','Royalties','Haalt LabelGrid-statements op voor halfjaarlijkse afrekeningen. Alleen lezen.'],opensign:['OS','Contracten','Verstuurt contracten via OpenSign en volgt ondertekening.'],releases:['RE','Releases','Plant releases met status en royalty-koppeling.'],contracts:['CT','Contractoverzicht','Alle verstuurde en conceptcontracten op een rij.']};
function integrations(){return title('Koppelingen','Accounts en administratiestromen')+`<div class="panel-grid">${state.connections.map(c=>{const [logo,sub,desc]=integrationText[c.id];return `<section class="card integration-card"><div class="integration-title"><span class="conn-logo">${logo}</span><div><h2>${esc(c.name)}</h2><small>${sub}</small></div>${connectionBadge(c)}</div><p>${desc}</p><footer>${c.id==='odoo'?'<button class="primary" data-route="odoo">Administratie bekijken</button>':''}<button data-config="${c.id}">${icon('settings')} Instellen</button>${!['ing','sumup'].includes(c.id)?`<button class="ghost" data-test="${c.id}">${icon('refresh')} Verbinding testen</button>`:''}</footer></section>`}).join('')}</div><p class="helper">Een koppeling krijgt pas de status Geverifieerd na een geslaagde accountcontrole.</p>`}
function users(){return title('Gebruikers','Team, toegang en rechten',`<button class="primary" data-action="new-user">${icon('plus')} Gebruiker toevoegen</button>`)+`<section class="card"><div class="table-wrap"><table><thead><tr><th>Gebruiker</th><th>Gebruikersnaam</th><th>Rol</th><th>Status</th><th></th></tr></thead><tbody>${state.users.map(u=>`<tr><td><div class="supplier"><span class="avatar">${esc(u.name.slice(0,2).toUpperCase())}</span><strong>${esc(u.name)}</strong></div></td><td>${esc(u.username)}</td><td>${esc(roleName(u.role))}</td><td>${badge(u.active?'Actief':'Inactief',u.active?'lime':'')}</td><td>${u.id!==user.id?`<button class="small" data-user="${esc(u.id)}">Beheren</button>`:'Jij'}</td></tr>`).join('')}</tbody></table></div></section><div class="panel-grid section-gap"><section class="card card-pad"><h2>Beheerder</h2><p class="helper">Beheert gebruikers, koppelingen en instellingen. Kan facturen boeken en banktransacties afletteren.</p></section><section class="card card-pad"><h2>Administratie & alleen lezen</h2><p class="helper">Administratie kan facturen en taken verwerken. Alleen lezen kan gegevens bekijken en exporteren.</p></section></div>`}
/* The VAT period used to be rebuilt from `new Date()` on every render, so
   the 20s poll silently snapped a chosen quarter back to the current one.
   It now lives in the URL hash and survives re-renders and refreshes. */
function vatPeriod(){
  if(vatYear===null){
    const m=/(?:^|[#&])q(\d{4})-([1-4])(?:$|[&])/.exec(location.hash);
    vatYear=m?+m[1]:new Date().getFullYear();
    vatQuarter=m?+m[2]:Math.floor(new Date().getMonth()/3)+1;
  }
  return{y:vatYear,q:vatQuarter};
}
function setVatPeriod(y,q){
  vatYear=y;vatQuarter=q;
  history.replaceState(null,'','#vat?y='+y+'&q='+q);
}
async function vat(){
  const{y,q}=vatPeriod();
  return title('Btw-overzicht','Kwartaalcijfers per aangifterubriek',`<button class="ghost" data-action="vat-export">${icon('download')} Download overzicht</button>`)+`<div class="toolbar"><label for="vat-year">Jaar</label><select id="vat-year" class="vat-select">${[y-1,y,y+1].map(n=>`<option ${n===y?'selected':''}>${n}</option>`).join('')}</select><label for="vat-quarter">Kwartaal</label><select id="vat-quarter" class="vat-select">${[1,2,3,4].map(n=>`<option value="${n}" ${n===q?'selected':''}>Q${n}</option>`).join('')}</select></div><div class="notice">${icon('info')} Dit is een voorlopig werkoverzicht. Vergelijk het vóór indiening met het volledige btw-rapport in Odoo. Buitenlandse diensten worden gesplitst in EU (4b) en buiten EU (4a).</div><div id="vat-results"><div class="empty"><div class="spinner"></div>Btw-overzicht ophalen…</div></div>`}
async function loadVat(){try{const y=+$('#vat-year').value,q=+$('#vat-quarter').value;let r;if(demo){r={year:y,quarter:q,boxes:{'1a':{base:535537,tax:112463},'1b':{base:0,tax:0},'4a':{base:0,tax:0},'4b':{base:0,tax:0},'5b':{base:0,tax:106740}},due:5723,excluded:1,note:'Voorbeeldberekening met demonstratiedata.'}}else r=await api(`/vat?year=${y}&quarter=${q}`);vatCache=r;if(!$('#vat-results'))return;$('#vat-results').innerHTML=`<section class="card"><div class="table-wrap"><table><thead><tr><th>Rubriek</th><th>Omschrijving</th><th class="amount">Grondslag</th><th class="amount">Btw</th></tr></thead><tbody>${[['1a','Omzet · hoog tarief'],['1b','Omzet · laag tarief'],['4a','Verlegd · buiten de EU'],['4b','Verlegd · binnen de EU'],['5b','Voorbelasting']].map(([k,t])=>`<tr><td>${badge(k,'purple')}</td><td>${t}</td><td class="amount">${k==='5b'?'—':eur(r.boxes[k].base)}</td><td class="amount">${eur(r.boxes[k].tax)}</td></tr>`).join('')}</tbody></table></div></section><div class="vat-total"><div><span>Saldo btw · Q${q} ${y}</span><p>${r.due>=0?'Voorlopig te betalen':'Voorlopig terug te ontvangen'}</p></div><strong>${eur(Math.abs(r.due))}</strong></div><p class="helper">${esc(r.note)} ${r.excluded?`${r.excluded} omzetregel(s) zonder bruikbare btw-classificatie uitgesloten.`:''}</p>`}catch(e){if($('#vat-results'))$('#vat-results').innerHTML=`<div class="error-box">${esc(e.message)}</div>`}}
function settingsView(){return title('Instellingen','Bedrijfsgegevens, verwerking en beveiliging')+`<div class="settings-wide"><section class="card card-pad"><h2>Moonshine</h2><form id="company-form"><div class="form-grid"><div class="field"><label>Bedrijfsnaam</label><input name="company_name" value="${esc(state.company)}" required></div><div class="field"><label>Finance e-mailadres</label><input name="finance_email" type="email" value="${esc(state.finance_email)}" required></div></div><button type="submit" class="primary">Opslaan</button></form></section><section class="card card-pad section-gap"><h2>Automatische verwerking</h2><p class="helper">Claude leest facturen uit zodra de koppeling is ingesteld. Automatisch boeken kun je aanzetten na controle van de Odoo-rekeningen en btw-mapping. Onzekere gevallen blijven altijd in de controle-inbox.</p><button data-config="automation">Automatisering instellen</button></section><section class="card card-pad section-gap"><h2>Beveiliging</h2><p class="helper">Je wachtwoord wordt gehasht opgeslagen. Inlogsessies verlopen na 12 uur. De server is bedoeld voor besloten toegang via Tailscale HTTPS.</p><button data-action="password">${icon('lock')} Wachtwoord wijzigen</button></section><section class="card section-gap"><div class="card-head"><h2>Activiteitenlog</h2></div>${state.audit.length?`<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Gebruiker</th><th>Handeling</th></tr></thead><tbody>${state.audit.slice(0,30).map(a=>`<tr><td>${date(a.created)}</td><td>${esc(a.actor)}</td><td>${esc(a.action)}</td></tr>`).join('')}</tbody></table></div>`:empty('Nog geen activiteit','Je handelingen verschijnen hier.','','clock')}</section></div>`}
async function renderApp(){
  if(!user||!state)return;
  const raw=location.hash.slice(1)||'dashboard';
  const base=raw.startsWith('event-')?'events':raw;
  page=pages.some(p=>p[0]===base)?base:'dashboard';
  window.location.hash===('#'+raw)||history.replaceState(null,'','#'+raw);
  const admin=user.role==='admin',review=state.documents.filter(d=>d.status==='review').length;
  if(eventsApi&&page==='events'){
    // The events module owns this route entirely.
    await eventsApi.mount(raw);
    ensureShell(admin,review);
    return;
  }
  if(eventsApi&&page!=='events')eventsApi.reset();
  let html=page==='dashboard'?dashboard():page==='odoo'?odooView():page==='invoices'?invoices():page==='tasks'?tasks():page==='bank'?bank():page==='files'?files():page==='integrations'?integrations():page==='users'?users():page==='settings'?settingsView():await vat();
  if(!admin&&['users','settings'].includes(page))html=title('Geen toegang','Deze pagina is alleen beschikbaar voor beheerders.');
  ensureShell(admin,review);
  const content=$('#content');
  if(content)content.innerHTML=html;
  if(page==='vat')loadVat();
  if(page==='odoo')loadOdoo();
  const updated=$('#last-updated');if(updated&&lastUpdated)updated.textContent='Bijgewerkt '+new Date(lastUpdated).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
/* The sidebar, topbar and mobile menu live outside #content so a content
   update cannot destroy them. */
function shellMarkup(admin,review){
  return `<aside class="sidebar"><a class="brand" href="#dashboard"><img src="/assets/moonshine-logo.svg" alt="Moonshine"><div><div class="brand-name">Workspace</div><small>MOONSHINE TEAM</small></div></a><div class="nav-label">Werkplek</div><nav class="nav" aria-label="Hoofdnavigatie">${pages.slice(0,PRIMARY).map(([id,label,i])=>`<a href="#${id}" data-nav="${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${icon(i)}${label}${id==='invoices'&&review?`<span class="nav-count">${review}</span>`:''}</a>`).join('')}</nav><div class="nav-label">Beheer</div><nav class="nav" aria-label="Beheer">${pages.slice(PRIMARY).filter(p=>admin||p[0]==='integrations').map(([id,label,i])=>`<a href="#${id}" data-nav="${id}" class="${page===id?'active':''}">${icon(i)}${label}</a>`).join('')}</nav><div class="side-bottom"><div class="connection-mini">${icon('lock')} Besloten Moonshine-omgeving</div></div></aside>`;
}
function buildShell(admin,review){
  $('#app').innerHTML=`<div class="layout">${shellMarkup(admin,review)}<main class="main"><header class="topbar"><button class="mobile-menu icon-btn" data-action="menu" aria-label="Menu openen" aria-expanded="false">${icon('menu')}</button><div class="breadcrumb">Werkplek <span>/ ${esc(pages.find(p=>p[0]===page)[1])}</span></div><div class="top-actions"><span class="top-date">${new Date().toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'long'})}</span><span id="last-updated" class="last-updated"></span><button class="icon-btn ghost" data-action="attention" aria-label="Facturen die aandacht vragen">${icon('bell')}${review?'<span class="notification-count"></span>':''}</button>${profileMenuMarkup(admin)}</div></header><div id="demo-slot">${demo?`<div class="demo-banner"><span>Voorbeeldgegevens · wijzigingen worden niet opgeslagen</span><button class="small ghost" data-action="exit-demo">Voorbeeld sluiten</button></div>`:""}</div><div class="content" id="content"></div></main></div>`;
}
function ensureShell(admin,review){
  if(!shellRendered){buildShell(admin,review);shellRendered=true}
  document.querySelectorAll('[data-nav]').forEach(link=>{
    const active=link.dataset.nav===page;link.classList.toggle('active',active);
    if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  const crumb=$('.breadcrumb span');if(crumb)crumb.textContent='/ '+pages.find(p=>p[0]===page)[1];
  const invoiceLink=document.querySelector('[data-nav="invoices"]');
  if(invoiceLink){invoiceLink.querySelector('.nav-count')?.remove();if(review)invoiceLink.insertAdjacentHTML('beforeend',`<span class="nav-count">${review}</span>`)}
  const attention=document.querySelector('[data-action="attention"]');
  if(attention){attention.setAttribute('aria-label',review?`${review} facturen die aandacht vragen`:'Facturen die aandacht vragen');attention.querySelector('.notification-count')?.remove();if(review)attention.insertAdjacentHTML('beforeend','<span class="notification-count"></span>')}

}
function profileMenuMarkup(admin){
  return `<div class="profile-control"><button id="profile-trigger" class="profile-trigger" data-action="profile-menu" aria-label="Profielmenu van ${esc(user.name)}" aria-expanded="false" aria-controls="profile-menu"><span class="avatar" aria-hidden="true">${esc(user.name.slice(0,2).toUpperCase())}</span>${icon('chevron')}</button><div id="profile-menu" class="profile-menu" hidden><div class="profile-summary"><strong>${esc(user.name)}</strong><span>@${esc(user.username)} · ${esc(roleName(user.role))}</span>${demo?'<small>Voorbeeldweergave · alleen lezen</small>':''}</div><div class="profile-options" role="group" aria-label="Accountopties"><button data-action="profile">${icon('users')} Mijn profiel</button><button data-action="password" ${demo?'disabled':''}>${icon('lock')} Wachtwoord wijzigen</button>${admin?`<button data-route="settings">${icon('settings')} Werkplekinstellingen</button>`:''}</div><div class="profile-signout"><button data-action="logout">${icon('logout')} ${demo?'Voorbeeld sluiten':'Uitloggen'}</button></div></div></div>`;
}
function setProfileMenu(open,focus=false){
  const trigger=$('#profile-trigger'),menu=$('#profile-menu');
  if(!trigger||!menu)return;
  trigger.setAttribute('aria-expanded',String(open));menu.hidden=!open;
  if(focus){if(open)menu.querySelector('button:not(:disabled)')?.focus();else trigger.focus()}
}
function showProfile(){
  modal('Mijn profiel',`<div class="profile-detail"><span class="avatar" aria-hidden="true">${esc(user.name.slice(0,2).toUpperCase())}</span><div><h3>${esc(user.name)}</h3><p>${esc(roleName(user.role))}</p></div></div><dl class="profile-fields"><dt>Gebruikersnaam</dt><dd>${esc(user.username)}</dd><dt>Werkplek</dt><dd>Moonshine</dd><dt>Toegang</dt><dd>${esc(roleName(user.role))}</dd></dl><p class="helper">Een beheerder kan je naam en toegangsrechten aanpassen via Gebruikers.</p>`,`<button data-action="close-modal">Sluiten</button>${demo?'':`<button data-action="password">${icon('lock')} Wachtwoord wijzigen</button>`}`);
}
function resetSession(){
  odooEpoch++;odooCache=null;odooLoading=false;odooError='';
  clearTimeout(pollTimer);clearTimeout(searchTimer);
  demo=false;user=null;state=null;csrf='';window.__csrf='';window.__state=null;
  shellRendered=false;lastSignature='';settingsCache=null;vatCache=null;lastUpdated=0;
  vatYear=null;vatQuarter=null;filter='all';search='';taskFilter='open';
  eventsApi?.reset();if($('#dialog').open)$('#dialog').close();
}
document.addEventListener('focusin',e=>{
  if(!e.target.closest('.profile-control'))setProfileMenu(false);
});
/* Server errors land in .dialog-error, which was never announced: it has no
   role="alert", so a screen-reader user got silence on the primary error
   path for every save, post and match. Focus is now moved into the dialog
   on open (the old autofocus only worked the first time) and restored to the
   trigger on close. */
function modal(title,body,foot=''){
  const d=$('#dialog');
  d.__trigger=document.activeElement;
  d.innerHTML=`<div class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2><button class="icon-btn ghost" data-action="close-modal" aria-label="Sluiten">${icon('close')}</button></div><div class="dialog-body"><div class="dialog-error error-box" role="alert" aria-live="assertive"></div>${body}</div>${foot?`<div class="dialog-foot">${foot}</div>`:''}`;
  d.setAttribute('aria-labelledby','dialog-title');
  if(!d.open)d.showModal();
  // Re-running focus management on every open: previously the second and
  // later opens left focus on <body> and tabbing restarted from the top.
  const first=d.querySelector('input:not([type=hidden]),select,textarea,button:not([data-action=close-modal])');
  if(first)first.focus();
  else d.querySelector('.dialog-head button')?.focus();
}
function closeModal(){
  const d=$('#dialog');
  if(d.open)d.close();
  const trigger=d.__trigger;
  if(trigger&&trigger.isConnected)trigger.focus();
}
const input=(name,label,value='',type='text',extra='')=>`<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
const submitFoot=(form,text='Opslaan')=>`<button data-action="close-modal" class="ghost">Annuleren</button><button class="primary" type="submit" form="${form}">${text}</button>`;
function newTask(id=''){const t=state.tasks.find(t=>t.id===id)||{};modal(id?'Taak bewerken':'Nieuwe taak',`<form id="task-form" data-id="${esc(id)}">${input('title','Wat moet er gebeuren?',t.title||'','text','required autofocus')}<div class="field"><label for="task-description">Toelichting</label><textarea id="task-description" name="description" placeholder="Extra informatie voor het team">${esc(t.description||'')}</textarea></div><div class="form-grid">${input('due','Deadline',t.due||'','date')}<div class="field"><label for="task-assignee">Toewijzen aan</label><select id="task-assignee" name="assignee"><option value="">Niet toegewezen</option>${state.users.filter(u=>u.active).map(u=>`<option value="${esc(u.id)}" ${t.assignee===u.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select></div></div><label><input type="checkbox" name="high" ${t.priority==='high'?'checked':''}> Hoge prioriteit</label></form>`,submitFoot('task-form',id?'Wijzigingen opslaan':'Taak toevoegen'))}
function newUser(){modal('Gebruiker toevoegen',`<form id="user-form"><div class="form-grid">${input('name','Naam','','text','required')}${input('username','Gebruikersnaam','','text','required pattern="[a-zA-Z0-9._-]{3,40}"')}${input('password','Wachtwoord','','password','required minlength="8" autocomplete="new-password"')}<div class="field"><label>Rol</label><select name="role"><option value="finance">Administratie</option><option value="viewer">Alleen lezen</option><option value="admin">Beheerder</option></select></div></div><p class="helper">Het wachtwoord wordt alleen als hash opgeslagen.</p></form>`,submitFoot('user-form','Gebruiker toevoegen'))}
function editUser(id){const u=state.users.find(u=>u.id===id);modal('Gebruiker beheren',`<form id="edit-user-form" data-id="${esc(id)}"><p>${esc(u.name)} · ${esc(u.username)}</p><div class="field"><label>Rol</label><select name="role">${['finance','viewer','admin'].map(r=>`<option value="${r}" ${r===u.role?'selected':''}>${roleName(r)}</option>`).join('')}</select></div>${input('password','Nieuw wachtwoord (optioneel)','','password','minlength="8" autocomplete="new-password"')}<label><input type="checkbox" name="active" ${u.active?'checked':''}> Gebruiker heeft toegang</label></form>`,submitFoot('edit-user-form'))}
function showInvoice(id){const d=state.documents.find(d=>d.id===id),i=d.details,locked=d.status==='posted'||!!d.odoo_id||d.status==='processing';modal('Factuur controleren',`${d.error?`<div class="notice">${esc(d.error)}</div>`:''}<div class="row-actions">${documentBadge(d)}<button class="small" data-download="${esc(id)}">${icon('download')} Origineel</button>${!locked?`<button class="small ghost" data-retry="${esc(id)}">${icon('spark')} Opnieuw uitlezen</button><button class="small ghost" data-action="print-invoice">${icon('download')} Afdrukken</button>`:''}</div><p class="helper">${esc(d.name)}${i.confidence?' · '+Math.round(i.confidence*100)+'% herkenningszekerheid':''}</p><form id="invoice-form" data-id="${esc(id)}"><fieldset ${locked?'disabled':''} class="plain-fieldset"><div class="form-grid">${input('supplier','Crediteur',i.supplier,'text','required')}${input('number','Factuurnummer',i.number,'text','required')}${input('date','Factuurdatum',i.date,'date','required')}${input('total','Totaal incl. btw (€)',i.total!==undefined?(i.total/100).toFixed(2):'','number','step="0.01" required')}${input('iban','IBAN',i.iban)}${input('kvk','KvK-nummer',i.kvk)}${input('vat_id','Btw-nummer',i.vat_id)}${input('country','Landcode',i.country||'NL','text','maxlength="2"')}</div>${input('aliases','Artiestennaam / aliases (komma’s)',(i.aliases||[]).join(', '))}<h3>Factuurregels</h3><div id="invoice-lines">${(i.lines?.length?i.lines:[{description:'',net:0,tax:'21'}]).map((l,n)=>invoiceLine(l,n)).join('')}</div>${!locked?'<button type="button" class="small" data-action="add-line">'+icon('plus')+' Regel toevoegen</button>':''}<div class="divider"></div><label><input name="reverse_confirmed" type="checkbox" ${i.reverse_confirmed?'checked':''}> Btw-verlegging gecontroleerd en bevestigd</label></fieldset></form>${locked?'<p class="helper">Deze factuur is gekoppeld aan Odoo. Correcties lopen via de bestaande Odoo-boeking.</p>':'<p class="helper">Controleer de gegevens vóór het boeken. Btw-codes moeten gekoppeld zijn aan jouw Odoo-administratie.</p>'}`,locked?`<button data-action="close-modal">Sluiten</button>`:`<button form="invoice-form" type="submit">Opslaan</button><button class="primary" data-post="${esc(id)}">${icon('check')} Opslaan & boeken</button>`)}
function invoiceLine(l,n){return `<div class="invoice-line" data-line="${n}"><div class="line-label"><label>Regel ${n+1}</label><button class="icon-btn small ghost" type="button" data-remove-line="${n}" aria-label="Regel verwijderen">${icon('close')}</button></div><div class="form-grid">${input('line_description_'+n,'Omschrijving',l.description)}${input('line_net_'+n,'Excl. btw (€)',(l.net/100).toFixed(2),'number','step="0.01" min="0.01" required')}<div class="field"><label>Btw</label><select name="line_tax_${n}">${[['9','9%'],['21','21%'],['0','0%'],['reverse_eu','Verlegd EU'],['reverse_non_eu','Verlegd buiten EU'],['exempt','Vrijgesteld']].map(([v,t])=>`<option value="${v}" ${l.tax===v?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label>Tarief verlegging</label><select name="line_reverse_${n}"><option value="21" ${l.reverse_rate!==9?'selected':''}>21%</option><option value="9" ${l.reverse_rate===9?'selected':''}>9%</option></select></div><label><input name="line_deductible_${n}" type="checkbox" ${l.deductible!==false?'checked':''}> Btw aftrekbaar</label></div></div>`}
function invoiceValues(){const f=$('#invoice-form'),data=new FormData(f),old=state.documents.find(d=>d.id===f.dataset.id).details;return {...old,supplier:data.get('supplier'),number:data.get('number'),date:data.get('date'),currency:old.currency||'EUR',total:Math.round(Number(data.get('total'))*100),iban:data.get('iban'),kvk:data.get('kvk'),vat_id:data.get('vat_id'),country:data.get('country'),aliases:String(data.get('aliases')).split(',').map(s=>s.trim()).filter(Boolean),reverse_confirmed:data.has('reverse_confirmed'),lines:[...f.querySelectorAll('[data-line]')].map(el=>{const n=el.dataset.line;return {description:data.get('line_description_'+n),net:Math.round(Number(data.get('line_net_'+n))*100),tax:data.get('line_tax_'+n),reverse_rate:+data.get('line_reverse_'+n),deductible:data.has('line_deductible_'+n)}})}}
async function saveInvoice(){const f=$('#invoice-form');if(!f.reportValidity())throw new Error('Vul de verplichte factuurvelden in.');return api('/documents/'+f.dataset.id,{method:'PATCH',body:{details:invoiceValues()}})}
function transactionModal(id){const t=state.transactions.find(t=>t.id===id);modal('Transactie indelen',`<form id="transaction-form" data-id="${esc(id)}"><p>${esc(t.description)}</p><p>${eur(t.amount)} · ${esc(t.source)} · ${date(t.date)}</p><div class="field"><label>Categorie</label><select name="category">${[['unknown','Nog indelen'],['sales','Omzet'],['settlement','Verzameluitbetaling'],['fee','Bank- / transactiekosten']].map(([v,s])=>`<option value="${v}" ${t.category===v?'selected':''}>${s}</option>`).join('')}</select></div><div class="field"><label>Btw-tarief voor omzet</label><select name="vat_rate"><option value="">Nog onbekend</option>${[0,9,21].map(r=>`<option value="${r}" ${r===t.vat_rate?'selected':''}>${r}%</option>`).join('')}</select></div>${input('payout_id','SumUp payout-ID',t.payout_id)}<p class="helper">ING-uitbetalingen van SumUp zijn een verzameluitbetaling. Alleen de onderliggende pintransacties tellen als omzet.</p></form>`,submitFoot('transaction-form'))}
async function config(provider){if(user.role!=='admin')throw new Error('Alleen beheerders kunnen koppelingen instellen.');settingsCache=demo?{settings:{},configured_secrets:[]}:await api('/settings');const s=settingsCache.settings,secret=(key,label)=>input(key,label,'','password',`autocomplete="new-password" placeholder="${settingsCache.configured_secrets.includes(key)?'Ingesteld — leeg laten om te bewaren':'Nog niet ingesteld'}"`);let body='',name='';
if(provider==='odoo'){name='Odoo aansluiten';body=`<div class="form-grid">${input('odoo_url','Odoo-URL',s.odoo_url,'url','placeholder="https://jouw-odoo.nl" required')}${input('odoo_database','Databasenaam',s.odoo_database,'text','required placeholder="bijv. moonshine" autocomplete="off"')}${input('odoo_username','Odoo-login',s.odoo_username,'text','required autocomplete="off"')}${secret('odoo_api_key','Odoo API-sleutel')}${odooSelect('odoo_purchase_journal','Inkoopdagboek',s.odoo_purchase_journal,odooCache?.catalog.journals.filter(j=>j.type==='purchase'))}${odooSelect('odoo_expense_account','Kostenrekening',s.odoo_expense_account,odooCache?.catalog.accounts.filter(a=>a.account_type?.startsWith('expense')))}${odooSelect('odoo_bank_journal','ING-bankdagboek',s.odoo_bank_journal,odooCache?.catalog.journals.filter(j=>j.type==='bank'))}${odooSelect('odoo_bank_account','ING-bankrekening',s.odoo_bank_account,odooCache?.catalog.accounts.filter(a=>a.account_type==='asset_cash'))}</div><div class="field"><label>ING-aanvoer</label><select name="bank_mode"><option value="existing_feed" ${s.bank_mode!=='exclusive_import'?'selected':''}>ING-bankfeed is al in Odoo aanwezig</option><option value="exclusive_import" ${s.bank_mode==='exclusive_import'?'selected':''}>Alleen import via deze backoffice</option></select></div><label><input type="checkbox" name="odoo_bank_feed" ${s.odoo_bank_feed?'checked':''}> Open ING-bankregels uit Odoo ophalen</label><div class="field"><label>Btw-mapping (Odoo tax-ID per code)</label><textarea name="odoo_tax_map" spellcheck="false" placeholder='{"9": 12, "21": 14, "reverse_eu": 18, "reverse_non_eu": 19}'>${s.odoo_tax_map?esc(JSON.stringify(s.odoo_tax_map,null,2)):''}</textarea></div><p class="helper">Vul bij Databasenaam de naam van je Odoo-database in, zonder URL. Bij moonshine.odoo.com is dit doorgaans moonshine. Een opgeslagen API-sleutel blijft bewaard als je het sleutelveld leeg laat. Sla eerst de accountgegevens op en test de verbinding. De test toont beschikbare dagboeken, rekeningen en btw-codes. Gebruik codes voor Nederlandse inkoop, inclusief de juiste rapportagetags voor verlegging.</p>`}
if(provider==='claude'){name='Claude aansluiten';body=secret('anthropic_api_key','Anthropic API-sleutel')+input('anthropic_model','Claude-model-ID',s.anthropic_model,'text','placeholder="Vul het beschikbare model-ID in"')+'<p class="helper">Test na het opslaan de verbinding om beschikbare modellen te zien. Uploads worden pas naar Claude verzonden nadat deze koppeling is ingesteld.</p>'}
if(provider==='microsoft'){name='Outlook / Microsoft aansluiten';body=`<div class="form-grid">${input('microsoft_tenant','Microsoft tenant-ID',s.microsoft_tenant)}${input('microsoft_client_id','App client-ID',s.microsoft_client_id)}</div>${secret('microsoft_client_secret','Client secret (optioneel bij gedelegeerde toegang)')}${secret('microsoft_refresh_token','Refresh-token voor jouw Microsoft-account')}${secret('microsoft_access_token','Access-token (optioneel / tijdelijk)')}${input('finance_email','Finance-inbox',s.finance_email||state.finance_email,'email')}<label><input type="checkbox" name="mail_enabled" ${s.mail_enabled?'checked':''}> Facturen elke minuut uit Outlook ophalen</label><p class="helper">De app heeft leesrechten op de finance-inbox nodig. Een gedelegeerde verbinding met refresh-token ondersteunt ook Microsoft To Do. Een app-only verbinding ondersteunt To Do niet.</p>`}
if(provider==='onedrive'){name='OneDrive-archief instellen';body=input('onedrive_drive_id','Drive-ID',s.onedrive_drive_id)+input('onedrive_folder','Bestaande archiefmap',s.onedrive_folder||'Moonshine/Administratie')+`<label><input type="checkbox" name="onedrive_enabled" ${s.onedrive_enabled?'checked':''}> Geboekte facturen naar OneDrive archiveren</label><p class="helper">Gebruikt de Microsoft-verbinding. Zorg dat de archiefmap en jaarmappen al bestaan en dat de app schrijfrechten heeft.</p>`}
if(provider==='todo'){name='Microsoft To Do instellen';body=input('todo_list_id','To Do-lijst-ID',s.todo_list_id)+`<label><input type="checkbox" name="todo_enabled" ${s.todo_enabled?'checked':''}> Taken synchroniseren met Microsoft To Do</label><p class="helper">Test de verbinding om jouw lijsten te zien. Vereist gedelegeerde Microsoft-toegang met Tasks.ReadWrite. De backoffice synchroniseert elke minuut; een lokale wijziging wordt eerst naar Microsoft gestuurd.</p>`}
if(provider==='calendar'){name='Agenda aansluiten';body=input('calendar_id','Agenda-ID',s.calendar_id||'primary')+`<label><input type="checkbox" name="calendar_enabled" ${s.calendar_enabled?'checked':''}> Agenda synchroniseren en evenementen pushen</label><p class="helper">Gebruikt de Microsoft-verbinding. Vereist Calendars.ReadWrite. Test de verbinding om de agenda te controleren.</p>`}
if(provider==='promo'){name='Promo-mail instellen';body=input('promo_sender','Verzendmailbox',s.promo_sender||state.finance_email)+`<label><input type="checkbox" name="promo_sending" ${s.promo_sending?'checked':''}> Wachtrij automatisch verwerken (5 per minuut)</label><p class="helper">Verzendt via Microsoft Graph vanuit je eigen mailbox. Vereist Mail.Send. Importeer eerst contacten, maak een campagne en start hem pas na een testmail.</p>`}
if(provider==='labelgrid'){name='LabelGrid aansluiten';body=secret('labelgrid_api_key','LabelGrid API-sleutel')+input('labelgrid_label_id','Label-ID (optioneel)',s.labelgrid_label_id)+'<p class="helper">Alleen lezen: haalt royalty-statements op voor halfjaarlijkse artiestenafrekeningen. Test de verbinding om het aantal statements te zien.</p>'}
if(provider==='opensign'){name='OpenSign aansluiten';body=`<div class="form-grid">${input('opensign_base','OpenSign API-basis',s.opensign_base||'https://eu-app.opensignlabs.com/api/v1.2')}${input('opensign_template_id','Standaard template-ID',s.opensign_template_id)}</div>`+secret('opensign_api_key','OpenSign API-sleutel')+secret('opensign_webhook_secret','Webhook-handtekeningssleutel')+'<p class="helper">EU-cloud aanbevolen. Test eerst met een niet-vertrouwelijk document in de sandbox.</p>'}
if(provider==='releases'){name='Releases';body='<p class="helper">Releases zijn lokaal: titel, artiest, datum en status. Koppel optioneel een LabelGrid release-ID voor royalty-overzichten.</p>'}
if(provider==='contracts'){name='Contracten';body='<p class="helper">Contracten worden via OpenSign verstuurd. Stel eerst OpenSign in en test de verbinding.</p>'}
if(['ing','sumup'].includes(provider)){name=provider==='ing'?'ING aanvoer instellen':'SumUp aanvoer instellen';body=`<p class="helper">CSV-import werkt direct. Voor automatische aanvoer kan jouw bank- of SumUp-adapter transacties naar de beveiligde webhook sturen. De providerkoppeling wordt met jouw accounts ingericht.</p>${secret('bank_webhook_secret','Webhook bearer-sleutel (optioneel vervangen)')}<p class="helper mono">POST /api/webhooks/bank</p><p class="helper">Elke transactie heeft een stabiel external_id, datum, omschrijving, bedrag en optioneel kosten, omzetcategorie en btw-tarief. De webhook-sleutel blijft alleen op de server opgeslagen.</p>`}
if(provider==='sumup'){const sumupFields=`<h3>Odoo-boeking voor pinomzet</h3><div class="form-grid">${input('odoo_sales_journal','Verkoopdagboek-ID',s.odoo_sales_journal,'number','min="1"')}${input('odoo_sales_account','Omzetrekening-ID',s.odoo_sales_account,'number','min="1"')}${input('odoo_sumup_clearing_account','SumUp-tussenrekening-ID',s.odoo_sumup_clearing_account,'number','min="1"')}${input('odoo_fee_account','Kostenrekening-ID',s.odoo_fee_account,'number','min="1"')}</div><div class="field"><label>Verkoop-btw-mapping (JSON)</label><textarea name="odoo_output_tax_map" placeholder='{"9": 30, "21": 31}'>${s.odoo_output_tax_map?esc(JSON.stringify(s.odoo_output_tax_map,null,2)):''}</textarea></div><p class="helper">De tussenrekening moet een afletterbare debiteurenrekening zijn. De ING-bankrekening en het bankdagboek stel je onder Odoo in. Pintransacties en de uitbetaling moeten hetzelfde payout_id bevatten.</p>`;body+=sumupFields;}
if(provider==='automation'){name='Automatische verwerking';body=`<label><input type="checkbox" name="auto_post" ${s.auto_post?'checked':''}> Automatisch boeken bij minimaal 98% zekerheid</label><div class="notice">Activeer pas nadat Odoo-rekeningen en btw-codes getest zijn. Ontbrekende gegevens, verlegging, vreemde valuta en mogelijke duplicaten vragen altijd controle.</div><label><input type="checkbox" name="auto_match" ${s.auto_match?'checked':''}> Unieke bankmatches automatisch afletteren</label><label><input type="checkbox" name="auto_sumup" ${s.auto_sumup?'checked':''}> Sluitende SumUp-uitbetalingen automatisch verwerken</label><p class="helper">Automatisch afletteren gebruikt alleen unieke matches met exact bedrag én factuurnummer. Naamafwijkingen blijven ter controle.</p>`}
modal(name,`<form id="config-form" data-provider="${provider}">${body}</form>`,submitFoot('config-form'))}
function importBank(){modal('Bankexport importeren',`<form id="bank-form"><div class="field"><label>Bron</label><select name="source"><option>ING</option><option>SumUp</option></select></div><div class="field"><label for="bank-file">CSV-bestand</label><input id="bank-file" type="file" name="file" accept=".csv,text/csv" required></div><p class="helper">Gebruik het template: external_id, date, description, amount, fee, category, vat_rate, payout_id. Datum: JJJJ-MM-DD. Bedragen in euro’s. Elke transactie vereist een uniek ID uit de bron.</p><button type="button" class="small" data-action="csv-template">Template downloaden</button></form>`,submitFoot('bank-form','Transacties importeren'))}
function downloadBlob(text,name,type='text/csv'){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
async function chooseUpload(files){if(demo){toast('Log in om echte facturen te uploaden.',true);return}if(user.role==='viewer'){toast('Je hebt alleen leesrechten.',true);return}if(!files){const el=document.createElement('input');el.type='file';el.multiple=true;el.accept='.pdf,.jpg,.jpeg,.png,.webp';el.onchange=()=>chooseUpload(el.files);el.click();return}if(uploading){toast('Er loopt al een upload.');return}uploading=true;let added=0,duplicates=0;try{for(const f of files){if(f.size>15*1024*1024)throw new Error(`${f.name}: maximaal 15 MB.`);const fd=new FormData();fd.append('file',f);toast('Uploaden: '+f.name);const r=await api('/upload',{method:'POST',body:fd});for(const item of r.files){if(item.duplicate)duplicates++;else added++}}toast(`${added} bestand(en) opgeslagen${duplicates?` · ${duplicates} al aanwezig`:''}.`);await refresh()}catch(e){toast((added?`${added} bestand(en) opgeslagen. `:'')+e.message,true);await refresh().catch(()=>{})}finally{uploading=false}}
async function onAction(el){const a=el.dataset.action;if(a==='show-password'){const input=$('#password'),show=input.type==='password';input.type=show?'text':'password';el.setAttribute('aria-pressed',String(show));el.setAttribute('aria-label',show?'Wachtwoord verbergen':'Wachtwoord tonen');return}if(a==='login-help'){modal('Toegang herstellen','<p class="helper">Vraag een Moonshine-beheerder om je wachtwoord opnieuw in te stellen via Gebruikers. Er worden geen wachtwoorden per e-mail verstuurd.</p>', '<button data-action="close-modal">Sluiten</button>');return}// Setting location.hash queues a hashchange, and the handler re-rendered
// too, so both of these rendered twice: two full teardowns per click.
if(a==='demo'){demo=true;user={id:'demo',name:'Peppy',username:'peppy',role:'admin'};window.__csrf='';state=demoState();window.__state=state;location.hash='dashboard';lastSignature='';renderApp();return}
if(a==='profile-menu'){setProfileMenu($('#profile-trigger').getAttribute('aria-expanded')!=='true',true);return}
if(a==='profile'){setProfileMenu(false,true);showProfile();return}
if(a==='exit-demo'){resetSession();renderLogin();return}
if(a==='logout'){
  if(el.disabled)return;
  el.disabled=true;
  try{if(!demo)await api('/logout',{method:'POST'});resetSession();renderLogin()}
  finally{if(el.isConnected)el.disabled=false}
  return
}
if(a==='menu'){
  // The sidebar is outside #content now, so a background re-render can no
  // longer slam the mobile menu shut every 20 seconds. Keep the ARIA state
  // in sync too.
  const bar=$('.sidebar'),btn=document.querySelector('[data-action=menu]');
  const open=bar.classList.toggle('open');
  if(btn)btn.setAttribute('aria-expanded',String(open));
  return}
if(a==='odoo-refresh'){await loadOdoo(true);return}
if(a==='close-modal'){closeModal();return}
if(a==='clear-filters'){filter='all';search='';lastSignature='';renderApp();return}
if(a==='print-invoice'){document.body.classList.add('printing-invoice');window.print();setTimeout(()=>document.body.classList.remove('printing-invoice'),400);return}if(a==='upload')return chooseUpload();if(a==='new-task')return newTask();if(a==='new-user'){if(user.role!=='admin')throw new Error('Alleen beheerders kunnen gebruikers toevoegen.');return newUser()}if(a==='import-bank')return importBank();if(a==='attention'){filter='review';lastSignature='';location.hash='invoices';return}if(a==='export'){if(demo)throw new Error('Log in voor een echte export.');location.href='/api/export';return}if(a==='add-line'){const n=Date.now();$('#invoice-lines').insertAdjacentHTML('beforeend',invoiceLine({net:0,tax:'21'},n));return}if(a==='csv-template'){downloadBlob('external_id;date;description;amount;fee;category;vat_rate;payout_id\r\n','moonshine-bank-template.csv');return}if(a==='vat-export'){if(!vatCache)throw new Error('Laad eerst het btw-overzicht.');let text='rubriek;grondslag_eur;btw_eur\r\n';for(const [k,v]of Object.entries(vatCache.boxes))text+=`${k};${(v.base/100).toFixed(2)};${(v.tax/100).toFixed(2)}\r\n`;text+=`voorlopig_saldo;;${(vatCache.due/100).toFixed(2)}\r\n`;downloadBlob(text,`moonshine-btw-${vatCache.year}-Q${vatCache.quarter}.csv`);return}if(a==='password'){modal('Wachtwoord wijzigen',`<form id="password-form">${input('current','Huidig wachtwoord','','password','required autocomplete="current-password"')}${input('password','Nieuw wachtwoord','','password','required minlength="8" autocomplete="new-password"')}</form>`,submitFoot('password-form'));return}}
document.addEventListener('click',async e=>{
  if(!e.target.closest('.profile-control'))setProfileMenu(false);
  const menuChoice=e.target.closest('#profile-menu button');
  if(menuChoice)setProfileMenu(false,true);
  const nav=e.target.closest('a[data-nav]');
  if(nav){$('.sidebar')?.classList.remove('open');document.querySelector('[data-action=menu]')?.setAttribute('aria-expanded','false')}
  // Give the events module first refusal on its own routes and controls.
  if(eventsApi&&(page==='events'||page==='event')&&await eventsApi.handleClick(e.target.closest('button,tr,a,[data-action],[data-event],[data-event-tab],[data-event-unlink],[data-remove-slot],[data-remove-artist],[data-remove-post]')))return;
  const el=e.target.closest('button,[data-action],[data-document],[data-route]');if(!el)return;
  try{if(el.dataset.route){location.hash=el.dataset.route;return}if(el.dataset.document)return showInvoice(el.dataset.document);if(el.dataset.action)return await onAction(el);if(el.dataset.filter){filter=el.dataset.filter;lastSignature='';renderApp();return}
if(el.dataset.editTask)return newTask(el.dataset.editTask);
if(el.dataset.taskFilter){taskFilter=el.dataset.taskFilter;lastSignature='';renderApp();return}if(el.dataset.config)return await config(el.dataset.config);if(el.dataset.user)return editUser(el.dataset.user);if(el.dataset.transaction)return transactionModal(el.dataset.transaction);if(el.dataset.removeLine){
    // This destroyed a 40-line invoice line on a single unguarded click with
    // no undo. Ask first.
    const line=el.closest('[data-line]');
    if(!confirm('Regel verwijderen? Dit kan niet ongedaan worden gemaakt.'))return;
    line.remove();return}if(el.dataset.download){if(demo)throw new Error('Originele bestanden zijn alleen in de echte omgeving beschikbaar.');location.href='/api/documents/'+el.dataset.download+'/file';return}if(el.dataset.retry){
      // Retry overwrites every extracted field from the PDF, destroying any
      // manual correction with no warning and no diff.
      if(!confirm('Factuur opnieuw uitlezen?\n\nAlle handmatige correcties worden overschreven met de gegevens uit het bestand.'))return;
      await api('/documents/'+el.dataset.retry+'/retry',{method:'POST'});
      closeModal();toast('Factuur wordt opnieuw uitgelezen.');await refresh();return}if(el.dataset.post){
    // Posting writes to the general ledger. There was no confirmation at
    // all: one stray click booked a real invoice.
    if(!confirm('Factuur boeken in Odoo?\n\nDit schrijft naar het grootboek. Controleer crediteur, nummer, bedrag en btw-regels.'))return;
    el.disabled=true;
    try{
      await saveInvoice();
      await api('/documents/'+el.dataset.post+'/post',{method:'POST'});
      $('#dialog').close();toast('Factuur geboekt in Odoo.');await refresh();
    }catch(e){el.disabled=false;const box=$('.dialog-error');if(box)box.textContent=e.message;toast(e.message,true)}
    return}if(el.dataset.test){el.disabled=true;const r=await api('/connections/test',{method:'POST',body:{provider:el.dataset.test}});await refresh();modal('Verbinding gecontroleerd',`<div class="notice">${esc(r.message)}</div>${r.data?`<p class="helper">Beschikbare gegevens voor je configuratie:</p><pre class="test-results">${esc(JSON.stringify(r.data,null,2))}</pre>`:''}`,`<button data-action="close-modal">Sluiten</button>`);return}if(el.dataset.settle){
    // The most dangerous button in the app: posts sales, fees AND the
    // settlement, then reconciles the group. Zero friction previously.
    if(!confirm('SumUp-uitbetaling verwerken?\n\nDit boekt omzet, kosten en de uitbetaling in Odoo en lettert de groep af.'))return;
    el.disabled=true;
    try{await api('/sumup/settle',{method:'POST',body:{transaction_id:el.dataset.settle}});toast('SumUp-omzet, kosten en uitbetaling geboekt en afgeletterd.');await refresh()}
    catch(e){el.disabled=false;toast(e.message,true)}
    return}if(el.dataset.match){
      // Reconciliation posts a journal entry and reconciles both pairs in
      // Odoo. Irreversible, and it had no confirmation.
      if(!confirm('Banktransactie afletteren in Odoo?\n\nDit boekt en lettert de koppeling af. Controleer bedrag en factuurnummer.'))return;
      el.disabled=true;
      await api('/transactions/match',{method:'POST',body:{transaction_id:el.dataset.match,document_id:el.dataset.matchDoc}});
      toast('Afgeletterd in Odoo.');await refresh();return}}catch(error){if($('#dialog').open&&$('.dialog-error'))$('.dialog-error').textContent=error.message;else toast(error.message,true)}finally{if(el.isConnected)el.disabled=false}});
document.addEventListener('submit',async e=>{
  const f=e.target;
  if(!(f instanceof HTMLFormElement))return;
  e.preventDefault();
  // The events module owns its own forms.
  if(eventsApi&&(page==='events'||page==='event')){
    try{if(await eventsApi.handleSubmit(f))return}catch(error){toast(error.message,true)}
    return;
  }
  const data=new FormData(f),obj=Object.fromEntries(data),button=document.querySelector(`[form="${f.id}"]`),own=f.querySelector('button[type=submit]');if(button)button.disabled=true;if(own)own.disabled=true;try{if(f.id==='login-form'){const r=await api('/login',{method:'POST',body:obj});user=r.user;csrf=r.csrf;window.__csrf=csrf;demo=false;shellRendered=false;lastSignature='';vatYear=null;vatQuarter=null;location.hash='dashboard';await refresh();startPolling();return}if(f.id==='task-form'){await api('/tasks'+(f.dataset.id?'/'+f.dataset.id:''),{method:f.dataset.id?'PATCH':'POST',body:{...obj,priority:data.has('high')?'high':'normal'}});toast(f.dataset.id?'Taak bijgewerkt.':'Taak toegevoegd.')}if(f.id==='user-form'){await api('/users',{method:'POST',body:obj});toast('Gebruiker toegevoegd.')}if(f.id==='edit-user-form'){await api('/users/'+f.dataset.id,{method:'PATCH',body:{...obj,active:data.has('active')}});toast('Gebruiker bijgewerkt.')}if(f.id==='invoice-form'){const r=await saveInvoice();if(r.warnings?.length){$('.dialog-error').textContent=r.warnings.join(' · ');toast('Gegevens opgeslagen. Er zijn nog controlepunten.');await refresh(false);return}toast('Factuurgegevens opgeslagen.')}if(f.id==='transaction-form'){await api('/transactions/'+f.dataset.id,{method:'PATCH',body:{category:obj.category,vat_rate:obj.vat_rate===''?null:+obj.vat_rate,payout_id:obj.payout_id}});toast('Transactie ingedeeld.')}if(f.id==='bank-form'){const file=data.get('file');await api('/transactions/import',{method:'POST',body:{source:obj.source,csv:await file.text()}}).then(r=>toast(`${r.added} transacties geïmporteerd · ${r.duplicates} al aanwezig.`))}if(f.id==='config-form'){const cfg={},sv={},secretKeys=['odoo_api_key','anthropic_api_key','microsoft_client_secret','microsoft_access_token','microsoft_refresh_token','bank_webhook_secret','labelgrid_api_key','opensign_api_key','opensign_webhook_secret'];for(const [k,v] of data){if(secretKeys.includes(k)){if(v)sv[k]=v}else if((k==='odoo_tax_map'||k==='odoo_output_tax_map')){if(String(v).trim())cfg[k]=JSON.parse(v)}else cfg[k]=['odoo_purchase_journal','odoo_expense_account','odoo_bank_journal','odoo_bank_account','odoo_sales_journal','odoo_sales_account','odoo_sumup_clearing_account','odoo_fee_account'].includes(k)?v?+v:null:String(v)}for(const k of ['mail_enabled','onedrive_enabled','todo_enabled','auto_post','auto_match','auto_sumup','odoo_bank_feed','calendar_enabled','promo_sending'])if(f.querySelector(`[name="${k}"]`))cfg[k]=data.has(k);await api('/settings',{method:'POST',body:{settings:cfg,secrets:sv}});odooEpoch++;odooCache=null;odooLoading=false;odooError='';toast('Instellingen opgeslagen. Test nu de verbinding.')}if(f.id==='company-form'){await api('/settings',{method:'POST',body:{settings:obj}});toast('Bedrijfsgegevens opgeslagen.')}if(f.id==='password-form'){await api('/password',{method:'POST',body:obj});$('#dialog').close();resetSession();renderLogin('Wachtwoord gewijzigd. Log opnieuw in.');return}$('#dialog').close();await refresh()}catch(error){
    if(f.id==='login-form'){
      // Re-rendering the whole login screen wiped the password field and
      // dropped focus on <body>. Update in place instead: keep what the user
      // typed, keep focus, and announce the error.
      const box=document.querySelector('#login-form .error-box');
      if(box){box.textContent=error.message;box.setAttribute('role','alert');box.classList.add('visible')}
      else{$('#login-form').insertAdjacentHTML('afterbegin',`<div class="error-box visible" role="alert">${esc(error.message)}</div>`)}
      const password=document.querySelector('#password');
      if(password){password.setAttribute('aria-invalid','true');password.focus()}
    }
    else if($('#dialog').open&&$('.dialog-error'))$('.dialog-error').textContent=error.message;
    else toast(error.message,true);
  }finally{if(button?.isConnected)button.disabled=false;if(own?.isConnected)own.disabled=false}});
/* Search rebuilt the entire result set on every keystroke with no debounce,
   and because it replaced #invoice-results it destroyed .table-wrap, so the
   horizontal scroll position reset to 0 on every character typed. Now it
   is debounced and only the <tbody> is patched, so the scroll survives. */
document.addEventListener('input',e=>{
  if(e.target.id==='invoice-search'){
    search=e.target.value;
    clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>{
      const wrap=document.querySelector('#invoice-results .table-wrap');
      const table=document.querySelector('#invoice-results');
      if(!table)return;
      const next=filteredInvoices();
      const oldScroll=wrap?wrap.scrollLeft:0;
      table.innerHTML=next;
      const newWrap=document.querySelector('#invoice-results .table-wrap');
      if(newWrap)newWrap.scrollLeft=oldScroll;
    },150);
  }
});
document.addEventListener('change',async e=>{
  if(e.target.id==='vat-year'||e.target.id==='vat-quarter'){
    setVatPeriod(+$('#vat-year').value,+$('#vat-quarter').value);
    return loadVat();
  }
  if(e.target.dataset.task){try{await api('/tasks/'+e.target.dataset.task,{method:'PATCH',body:{done:e.target.checked}});await refresh();toast(e.target.checked?'Taak afgerond.':'Taak heropend.')}catch(error){e.target.checked=!e.target.checked;toast(error.message,true)}}});
document.addEventListener('dragover',e=>{const zone=e.target.closest('.upload-zone');if(zone){e.preventDefault();zone.classList.add('dragging')}});
document.addEventListener('dragleave',e=>{const zone=e.target.closest('.upload-zone');if(zone&&!zone.contains(e.relatedTarget))zone.classList.remove('dragging')});
document.addEventListener('drop',e=>{const zone=e.target.closest('.upload-zone');if(zone){e.preventDefault();zone.classList.remove('dragging');chooseUpload(e.dataTransfer.files)}});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('upload-zone')){e.preventDefault();chooseUpload();return}
  // Table rows are the main object in the app and were mouse-only: no
  // tabindex, no role, no key handling. Rows now carry tabindex/role, so
  // make them actually operable.
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('tr.clickable')){e.preventDefault();const id=e.target.dataset.document;if(id)showInvoice(id)}
  if($('#profile-trigger')?.getAttribute('aria-expanded')==='true'){
    if(e.key==='Escape'){e.preventDefault();setProfileMenu(false,true);return}
    const items=[...document.querySelectorAll('#profile-menu button:not(:disabled)')];
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
      e.preventDefault();let index=items.indexOf(document.activeElement);
      index=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
      items[index]?.focus();return
    }
  }else if(e.target.id==='profile-trigger'&&['ArrowDown','ArrowUp'].includes(e.key)){
    e.preventDefault();setProfileMenu(true,true);return
  }
  if(e.key==='Escape'&&$('#dialog').open)closeModal();
});
window.addEventListener('hashchange',()=>{
  if(!user)return;
  // Reset the VAT period when leaving the report, and pick up a new one.
  if(!location.hash.includes('q')&&page==='vat'){vatYear=null;vatQuarter=null}
  setProfileMenu(false);
  lastSignature='';
  renderApp();
});
/* Self-scheduling rather than setInterval: if a refresh is slower than the
   interval (very likely, given the server work), intervals stack up and
   race to overwrite the DOM. The catch is no longer empty - a failed poll
   is reported instead of freezing the UI silently. */
function startPolling(){
  clearTimeout(pollTimer);
  if(!user||demo)return;
  const tick=async()=>{
    if(user&&!demo&&!$('#dialog').open&&!uploading&&!document.hidden){
      try{
        const active=document.activeElement;
        const typing=active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName);
        if(!typing){
          await refresh();
          lastUpdated=Date.now();
          const label=$('#last-updated');
          if(label)label.textContent='Bijgewerkt '+new Date(lastUpdated).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
        }
      }catch(e){
        const label=$('#last-updated');
        if(label)label.textContent='Geen verbinding';
      }
    }
    if(user&&!demo)pollTimer=setTimeout(tick,20000);
  };
  pollTimer=setTimeout(tick,20000);
}
async function boot(){
  $('#app').innerHTML='<div class="loading"><div><div class="spinner"></div>Moonshine openen…</div></div>';
  eventsApi=window.__events||null;
  try{
    const r=await api('/me');
    user=r.user;csrf=r.csrf||r.user.csrf;window.__csrf=csrf;
    await refresh();startPolling();
  }catch{shellRendered=false;renderLogin()}
}
boot();
