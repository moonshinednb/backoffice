import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api, saveBlob } from '../lib/api';
import { can, useAuth } from '../lib/auth';
import { eur, shortDate, size } from '../lib/format';
import { Badge, Empty, ErrorBox, Icon, Loading, Modal, PageTitle, Stat, useAction, useToast } from '../lib/ui';
import { FormDialog } from '../production/common';
import { Doc, DocumentBadge, UploadZone, useDocuments, useUpload } from './shared';
import { InvoiceTable } from './Work';

const refreshFinance = (qc: ReturnType<typeof useQueryClient>) => ['documents', 'review-count', 'dashboard', 'transactions'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

/* --- Facturen ------------------------------------------------------------- */

const FILTERS = [['all', 'Alle facturen'], ['review', 'Controle nodig'], ['posted', 'Geboekt'], ['awaiting_ai', 'In verwerking']] as const;

export function InvoicesPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') || 'all';
  const [search, setSearch] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  const { upload } = useUpload();
  const q = useDocuments();
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const term = search.toLowerCase();
  const docs = q.data.documents.filter((d) => (filter === 'all' || d.status === filter || (filter === 'awaiting_ai' && d.status === 'processing'))
    && [d.name, d.details.supplier, d.details.number].some((v) => String(v || '').toLowerCase().includes(term)));
  const clear = () => { setSearch(''); setParams({}); };
  return <>
    <PageTitle title="Facturen" sub="Ontvangst, controle en boeking" actions={<><a className="button ghost" href="/api/export"><Icon name="download" /> Export</a><button className="primary" onClick={() => upload()}><Icon name="plus" /> Factuur toevoegen</button></>} />
    <div className="toolbar"><div className="search"><Icon name="search" /><input aria-label="Zoek facturen" placeholder="Zoek crediteur of factuurnummer" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="tabs">{FILTERS.map(([v, t]) => <button key={v} className={filter === v ? 'active' : ''} onClick={() => setParams(v === 'all' ? {} : { status: v })}>{t}</button>)}</div></div>
    <section className="card"><InvoiceTable docs={docs} onOpen={setDoc} empty={filter !== 'all' || search
      ? <Empty title="Geen resultaten in deze weergave" sub={<>Geen facturen gevonden voor “{search || 'filter ' + filter}”. <button className="text-link" onClick={clear}>Filters wissen</button></>} icon="invoice" /> : undefined} /></section>
    <p className="helper">De originele bijlage blijft bewaard. Alleen geverifieerde facturen worden in Odoo geboekt.</p>
    <InvoiceDialog id={doc} onClose={() => setDoc(null)} />
  </>;
}

type Line = { key: number; description: string; net: number; tax: string; reverse_rate?: number; deductible?: boolean };
const TAXES = [['9', '9%'], ['21', '21%'], ['0', '0%'], ['reverse_eu', 'Verlegd EU'], ['reverse_non_eu', 'Verlegd buiten EU'], ['exempt', 'Vrijgesteld']];

/** Review an invoice: correct the extracted fields, save, and post to Odoo. */
export function InvoiceDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const docs = useDocuments(!!id);
  const d = docs.data?.documents.find((x) => x.id === id);
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const loaded = useRef('');
  useEffect(() => {
    if (!d || loaded.current === d.id) return;
    loaded.current = d.id;
    setError('');
    setLines((d.details.lines?.length ? d.details.lines : [{ description: '', net: 0, tax: '21' }]).map((l: any, n: number) => ({ ...l, key: n })));
  }, [d]);
  useEffect(() => { if (!id) loaded.current = ''; }, [id]);
  if (!id) return null;
  if (!d) return <Modal title="Factuur controleren" open onClose={onClose}>{docs.isPending ? <Loading /> : <p className="helper">Deze factuur bestaat niet meer.</p>}</Modal>;
  const i = d.details;
  const locked = d.status === 'posted' || !!d.odoo_id || d.status === 'processing' || !can.write(user);
  function values() {
    const data = new FormData(form.current!);
    const s = (k: string) => String(data.get(k) ?? '');
    return { ...i, supplier: s('supplier'), number: s('number'), date: s('date'), currency: i.currency || 'EUR', total: Math.round(Number(s('total')) * 100),
      iban: s('iban'), kvk: s('kvk'), vat_id: s('vat_id'), country: s('country'), aliases: s('aliases').split(',').map((x) => x.trim()).filter(Boolean),
      reverse_confirmed: data.has('reverse_confirmed'),
      lines: lines.map((l) => ({ description: s('line_description_' + l.key), net: Math.round(Number(s('line_net_' + l.key)) * 100), tax: s('line_tax_' + l.key), reverse_rate: +s('line_reverse_' + l.key), deductible: data.has('line_deductible_' + l.key) })) };
  }
  async function save() {
    if (!form.current!.reportValidity()) throw new Error('Vul de verplichte factuurvelden in.');
    const r = await api<{ warnings: string[] }>(`/documents/${d!.id}`, { method: 'PATCH', body: { details: values() } });
    return r.warnings || [];
  }
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const saveOnly = () => act(async () => { const w = await save(); refreshFinance(qc); toast(w.length ? 'Opgeslagen · ' + w.join(' ') : 'Factuur opgeslagen.'); onClose(); });
  const post = () => {
    if (!confirm('Factuur boeken in Odoo?\n\nDit schrijft naar het grootboek. Controleer crediteur, nummer, bedrag en btw-regels.')) return;
    act(async () => { await save(); await api(`/documents/${d!.id}/post`, { method: 'POST' }); refreshFinance(qc); toast('Factuur geboekt in Odoo.'); onClose(); });
  };
  const retry = () => {
    if (!confirm('Factuur opnieuw uitlezen?\n\nAlle handmatige correcties worden overschreven met de gegevens uit het bestand.')) return;
    act(async () => { await api(`/documents/${d!.id}/retry`, { method: 'POST' }); refreshFinance(qc); toast('Factuur wordt opnieuw uitgelezen.'); onClose(); });
  };
  const print = () => { document.body.classList.add('printing-invoice'); window.print(); setTimeout(() => document.body.classList.remove('printing-invoice'), 400); };
  const input = (name: string, label: string, value: any, type = 'text', extra: Record<string, any> = {}) =>
    <div className="field"><label htmlFor={`f-${name}`}>{label}</label><input id={`f-${name}`} name={name} type={type} defaultValue={value ?? ''} {...extra} /></div>;
  return (
    <Modal title="Factuur controleren" open onClose={onClose} error={error}
      footer={locked ? <button onClick={onClose}>Sluiten</button> : <><button onClick={saveOnly} disabled={busy}>Opslaan</button><button className="primary" onClick={post} disabled={busy}><Icon name="check" /> Opslaan & boeken</button></>}>
      {d.error ? <div className="notice">{d.error}</div> : null}
      <div className="row-actions"><DocumentBadge d={d} /><a className="button small" href={`/api/documents/${d.id}/file`}><Icon name="download" /> Origineel</a>
        {!locked ? <><button className="small ghost" onClick={retry}><Icon name="spark" /> Opnieuw uitlezen</button><button className="small ghost" onClick={print}><Icon name="download" /> Afdrukken</button></> : null}</div>
      <p className="helper">{d.name}{i.confidence ? ' · ' + Math.round(i.confidence * 100) + '% herkenningszekerheid' : ''}</p>
      <form id="invoice-form" ref={form} key={d.id} onSubmit={(e) => { e.preventDefault(); saveOnly(); }}>
        <fieldset disabled={locked} className="plain-fieldset">
          <div className="form-grid">
            {input('supplier', 'Crediteur', i.supplier, 'text', { required: true })}
            {input('number', 'Factuurnummer', i.number, 'text', { required: true })}
            {input('date', 'Factuurdatum', i.date, 'date', { required: true })}
            {input('total', 'Totaal incl. btw (€)', i.total !== undefined ? (i.total / 100).toFixed(2) : '', 'number', { step: '0.01', required: true })}
            {input('iban', 'IBAN', i.iban)}{input('kvk', 'KvK-nummer', i.kvk)}{input('vat_id', 'Btw-nummer', i.vat_id)}
            {input('country', 'Landcode', i.country || 'NL', 'text', { maxLength: 2 })}
          </div>
          {input('aliases', 'Artiestennaam / aliases (komma’s)', (i.aliases || []).join(', '))}
          <h3>Factuurregels</h3>
          <div id="invoice-lines">{lines.map((l, n) => <div className="invoice-line" key={l.key}>
            <div className="line-label"><label>Regel {n + 1}</label><button className="icon-btn small ghost" type="button" aria-label="Regel verwijderen"
              onClick={() => confirm('Regel verwijderen? Dit kan niet ongedaan worden gemaakt.') && setLines(lines.filter((x) => x.key !== l.key))}><Icon name="close" /></button></div>
            <div className="form-grid">
              {input('line_description_' + l.key, 'Omschrijving', l.description)}
              {input('line_net_' + l.key, 'Excl. btw (€)', ((l.net || 0) / 100).toFixed(2), 'number', { step: '0.01', min: '0.01', required: true })}
              <div className="field"><label>Btw</label><select name={'line_tax_' + l.key} defaultValue={l.tax}>{TAXES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></div>
              <div className="field"><label>Tarief verlegging</label><select name={'line_reverse_' + l.key} defaultValue={l.reverse_rate === 9 ? '9' : '21'}><option value="21">21%</option><option value="9">9%</option></select></div>
              <label><input name={'line_deductible_' + l.key} type="checkbox" defaultChecked={l.deductible !== false} /> Btw aftrekbaar</label>
            </div></div>)}</div>
          {!locked ? <button type="button" className="small" onClick={() => setLines([...lines, { key: Date.now(), description: '', net: 0, tax: '21' }])}><Icon name="plus" /> Regel toevoegen</button> : null}
          <div className="divider" />
          <label><input name="reverse_confirmed" type="checkbox" defaultChecked={!!i.reverse_confirmed} /> Btw-verlegging gecontroleerd en bevestigd</label>
        </fieldset>
      </form>
      <p className="helper">{locked && (d.odoo_id || d.status === 'posted') ? 'Deze factuur is gekoppeld aan Odoo. Correcties lopen via de bestaande Odoo-boeking.' : 'Controleer de gegevens vóór het boeken. Btw-codes moeten gekoppeld zijn aan jouw Odoo-administratie.'}</p>
    </Modal>
  );
}

/* --- Odoo ------------------------------------------------------------------- */

type Ref = { id: number; name: string; code?: string; type?: string };
export type OdooOverview = { checked: number; counts: Record<string, number>; mapping: Record<string, any>;
  invoices: { id: number; name: string; ref: string; move_type: string; partner_id: [number, string] | false; invoice_date: string | false; state: string; payment_state: string; amount_total: number; amount_residual: number; currency_id: [number, string] | false }[];
  catalog: { journals: Ref[]; accounts: (Ref & { account_type?: string })[]; taxes: Ref[] } };
const PAYMENT: Record<string, string> = { not_paid: 'Onbetaald', partial: 'Deels betaald', in_payment: 'Betaling onderweg', paid: 'Betaald', reversed: 'Teruggedraaid', blocked: 'Geblokkeerd' };
export const useOdoo = (enabled = true) => useQuery({ queryKey: ['odoo'], queryFn: () => api<OdooOverview>('/odoo/overview'), enabled, staleTime: 120000, retry: false });

export function OdooPage() {
  const { user } = useAuth();
  const q = useOdoo();
  const money = (v: number, cur: string) => { try { return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: cur }).format(v || 0); } catch { return (v || 0) + ' ' + cur; } };
  const admin = user?.role === 'admin';
  const title = <PageTitle title="Odoo-administratie" sub="Live gegevens uit jouw Odoo-account" actions={<><button onClick={() => q.refetch()} disabled={q.isFetching}><Icon name="refresh" /> Vernieuwen</button>{admin ? <Link className="button" to="/beheer/koppelingen?config=odoo">Koppeling instellen</Link> : null}</>} />;
  if (q.isPending || (q.isFetching && !q.data)) return <>{title}<Loading text="Odoo-administratie ophalen…" state="searching" /></>;
  if (q.error) return <>{title}<ErrorBox error={q.error} /><p className="helper">Controleer de koppeling onder Koppelingen en probeer opnieuw.</p></>;
  const r = q.data, c = r.catalog, m = r.mapping;
  const journal = c.journals.find((x) => x.id === +m.odoo_purchase_journal);
  const account = c.accounts.find((x) => x.id === +m.odoo_expense_account);
  const taxes = Object.keys(m.odoo_tax_map || {}).length;
  return <>{title}
    <div className="stats"><Stat label="Inkoopfacturen" value={r.counts.total} sub="Inclusief creditnota’s" icon="invoice" /><Stat label="Geboekt" value={r.counts.posted} sub="In jouw Odoo-administratie" icon="check" />
      <Stat label="Openstaand" value={r.counts.unpaid} sub="Geboekt · nog niet betaald" icon="wallet" /><Stat label="Concepten" value={r.counts.draft} sub="Nog niet geboekt" icon="edit" /></div>
    <section className="card"><div className="card-head"><div><h2>Recente inkoopfacturen</h2><p>Laatste 50 · rechtstreeks uit Odoo · {shortDate(r.checked)}</p></div></div>
      {r.invoices.length ? <div className="table-wrap"><table><thead><tr><th>Crediteur / nummer</th><th>Datum</th><th>Status</th><th className="amount">Totaal</th><th className="amount">Nog te betalen</th></tr></thead><tbody>
        {r.invoices.map((i) => { const cur = i.currency_id ? i.currency_id[1] : 'EUR'; return <tr key={i.id}>
          <td><strong>{i.partner_id ? i.partner_id[1] : 'Onbekende crediteur'}</strong><div className="helper">{i.name || 'Concept'} {i.ref ? '· ' + i.ref : ''}{i.move_type === 'in_refund' ? ' · Creditnota' : ''}</div></td>
          <td>{shortDate(i.invoice_date || null)}</td>
          <td><Badge color={i.payment_state === 'paid' ? 'lime' : ''}>{i.state === 'draft' ? 'Concept' : i.state === 'cancel' ? 'Geannuleerd' : PAYMENT[i.payment_state] || 'Geboekt'}</Badge></td>
          <td className="amount">{money(i.amount_total, cur)}</td><td className="amount">{money(i.amount_residual, cur)}</td></tr>; })}
      </tbody></table></div> : <Empty title="Nog geen inkoopfacturen in Odoo" sub="Er staan voor dit account geen inkoopfacturen of creditnota’s." icon="invoice" />}</section>
    <section className="card card-pad section-gap"><h2>Boeken vanuit Moonshine</h2>
      <div className="odoo-mapping"><div><span>Inkoopdagboek</span><strong>{journal?.name || 'Nog kiezen'}</strong></div><div><span>Kostenrekening</span><strong>{account ? account.code + ' · ' + account.name : 'Nog kiezen'}</strong></div><div><span>Btw-mapping</span><strong>{taxes} codes ingesteld</strong></div></div>
      <p className="helper">{journal && account && taxes ? 'De boekingsinstellingen zijn ingevuld. Controleer ze vóór je een factuur boekt.' : 'De verbinding werkt; kies nog het inkoopdagboek, de kostenrekening en btw-codes om vanuit Moonshine te boeken.'}</p>
      {admin ? <Link className="button" to="/beheer/koppelingen?config=odoo">Boekingsinstellingen</Link> : null}</section>
    <details className="card card-pad section-gap"><summary>Beschikbare dagboeken en btw-codes</summary><div className="odoo-catalog">
      <div><h3>Dagboeken</h3>{c.journals.map((j) => <p key={j.id}>{j.name} <span className="helper">· ID {j.id} · {j.type === 'purchase' ? 'Inkoop' : 'Bank'}</span></p>)}</div>
      <div><h3>Inkoop-btw</h3>{c.taxes.map((t) => <p key={t.id}>{t.name} <span className="helper">· ID {t.id}</span></p>)}</div></div></details>
    <p className="helper">Dit overzicht leest Odoo. Facturen onder ‘Facturen’ en cijfers op ‘Overzicht’ gaan over documenten die Moonshine heeft ontvangen; Odoo-facturen worden daar niet dubbel geïmporteerd.</p>
  </>;
}

/* --- Bank -------------------------------------------------------------------- */

type Tx = { id: string; source: string; date: string; description: string; amount: number; fee: number; vat_rate: number | null; category: string; status: string; payout_id: string };
type Match = { transaction_id: string; document_id: string; score: number; reasons: string[]; supplier: string; ambiguous: boolean };
const CATEGORY: Record<string, string> = { sales: 'Omzet', settlement: 'Verzameluitbetaling', fee: 'Kosten', unknown: 'Nog indelen' };

export function BankPage() {
  const qc = useQueryClient();
  const run = useAction();
  const toast = useToast();
  const { user } = useAuth();
  const edit = can.write(user);
  const [edit_, setEdit] = useState<Tx | null>(null);
  const [importing, setImporting] = useState(false);
  const q = useQuery({ queryKey: ['transactions'], queryFn: () => api<{ transactions: Tx[]; matches: Match[] }>('/transactions') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const tx = q.data.transactions;
  const pin = tx.filter((t) => t.source === 'SumUp' && t.category === 'sales');
  const gross = pin.reduce((s, t) => s + t.amount, 0), fees = pin.reduce((s, t) => s + t.fee, 0), settled = tx.filter((t) => t.category === 'settlement').reduce((s, t) => s + t.amount, 0);
  const template = () => saveBlob(new Blob(['external_id;date;description;amount;fee;category;vat_rate;payout_id\r\n'], { type: 'text/csv' }), 'moonshine-bank-template.csv');
  const match = (m: Match) => confirm('Banktransactie afletteren in Odoo?\n\nDit boekt en lettert de koppeling af. Controleer bedrag en factuurnummer.')
    && run(async () => { await api('/transactions/match', { method: 'POST', body: { transaction_id: m.transaction_id, document_id: m.document_id } }); refreshFinance(qc); }, 'Afgeletterd in Odoo.');
  const settle = (t: Tx) => confirm('SumUp-uitbetaling verwerken?\n\nDit boekt omzet, kosten en de uitbetaling in Odoo en lettert de groep af.')
    && run(async () => { await api('/sumup/settle', { method: 'POST', body: { transaction_id: t.id } }); refreshFinance(qc); }, 'SumUp-omzet, kosten en uitbetaling geboekt en afgeletterd.');
  return <>
    <PageTitle title="Bank & pin" sub="Transacties, pinomzet en aflettering" actions={<><button className="ghost" onClick={template}><Icon name="download" /> CSV-template</button>{edit ? <button className="primary" onClick={() => setImporting(true)}><Icon name="upload" /> Bankexport importeren</button> : null}</>} />
    <div className="stats"><Stat label="Banktransacties" value={tx.filter((t) => t.source === 'ING').length} sub="Geïmporteerd of ontvangen" icon="bank" />
      <Stat label="Te matchen" value={tx.filter((t) => t.amount < 0 && t.status === 'open').length} sub="Openstaande afschrijvingen" icon="refresh" />
      <Stat label="Pinomzet" value={eur(gross)} sub="Geclassificeerde SumUp-omzet" icon="wallet" /><Stat label="Transactiekosten" value={eur(fees)} sub="Apart van de omzet" icon="invoice" /></div>
    <section className="card"><div className="card-head"><div><h2>Voorgestelde matches</h2><p>Een boeking wordt pas afgeletterd na een geslaagde Odoo-verwerking.</p></div><Badge color="purple">{q.data.matches.length + ' voorstellen'}</Badge></div>
      {q.data.matches.length ? q.data.matches.map((m) => { const t = tx.find((x) => x.id === m.transaction_id); return <div key={m.transaction_id} className="matching-grid">
        <div><strong>{t?.description}</strong><small>ING · {shortDate(t?.date)}</small><div className="match-amount">{eur(t?.amount)}</div></div>
        <div><strong>{m.supplier}</strong><small>{m.reasons.join(' · ')}</small><div className="helper"><Badge color={m.ambiguous ? 'amber' : 'lime'}>{m.ambiguous ? 'Meerdere kandidaten' : m.score + '% overeenkomst'}</Badge></div></div>
        <button onClick={() => match(m)} disabled={m.ambiguous || !edit}><Icon name="check" /> Afletteren</button></div>; })
        : <Empty title="Geen matches om te beoordelen" sub="Importeer banktransacties en boek je facturen in Odoo." icon="bank" />}</section>
    <section className="card section-gap"><div className="card-head"><h2>SumUp · tussenrekening</h2><Badge color="purple">Controleoverzicht</Badge></div>
      <div className="sumup-summary"><div><label>Bruto pinomzet</label><strong>{eur(gross)}</strong></div><div><label>Kosten</label><strong>{eur(fees)}</strong></div><div><label>Te ontvangen</label><strong>{eur(gross - fees - settled)}</strong></div></div>
      <div className="split-note">Markeer ING-uitbetalingen als <strong>Verzameluitbetaling</strong> om dubbeltelling van omzet te voorkomen. Uitbetalingen worden via payout_id gekoppeld aan bruto pinomzet en kosten. Stel eerst de Odoo-tussenrekening, omzet- en kostenmapping in.</div></section>
    <section className="card section-gap"><div className="card-head"><h2>Alle transacties</h2></div>
      {tx.length ? <div className="table-wrap"><table><thead><tr><th>Datum</th><th>Omschrijving</th><th>Bron</th><th className="amount">Bedrag</th><th>Classificatie</th><th>Status</th><th /></tr></thead><tbody>
        {tx.map((t) => <tr key={t.id}><td>{shortDate(t.date)}</td><td>{t.description}</td><td>{t.source}</td><td className="amount">{eur(t.amount)}</td>
          <td>{CATEGORY[t.category]}{t.vat_rate ? ' · ' + t.vat_rate + '%' : ''}</td><td><Badge color={t.status === 'matched' ? 'lime' : ''}>{t.status === 'matched' ? 'Afgeletterd' : 'Open'}</Badge></td>
          <td>{edit && t.source === 'ING' && t.category === 'settlement' && t.status !== 'matched' ? <><button className="small" onClick={() => settle(t)}>Verwerken</button> </> : null}
            {edit && t.status === 'open' ? <button className="icon-btn" onClick={() => setEdit(t)} aria-label="Transactie indelen"><Icon name="edit" /></button> : null}</td></tr>)}
      </tbody></table></div> : <Empty title="Je bankoverzicht staat klaar" sub="Importeer een CSV of sluit de bank-webhook aan." icon="bank" />}</section>
    <FormDialog id="transaction-form" title="Transactie indelen" open={!!edit_} onClose={() => setEdit(null)} submit={async (form) => {
      const data = new FormData(form);
      await api(`/transactions/${edit_!.id}`, { method: 'PATCH', body: { category: data.get('category'), vat_rate: data.get('vat_rate') ? Number(data.get('vat_rate')) : null, payout_id: data.get('payout_id') || '' } });
      setEdit(null); toast('Transactie bijgewerkt.'); refreshFinance(qc);
    }}>{edit_ ? <div key={edit_.id}>
      <p>{edit_.description}</p><p>{eur(edit_.amount)} · {edit_.source} · {shortDate(edit_.date)}</p>
      <div className="field"><label htmlFor="tx-category">Categorie</label><select id="tx-category" name="category" defaultValue={edit_.category}>{[['unknown', 'Nog indelen'], ['sales', 'Omzet'], ['settlement', 'Verzameluitbetaling'], ['fee', 'Bank- / transactiekosten']].map(([v, s]) => <option key={v} value={v}>{s}</option>)}</select></div>
      <div className="field"><label htmlFor="tx-vat">Btw-tarief voor omzet</label><select id="tx-vat" name="vat_rate" defaultValue={edit_.vat_rate ?? ''}><option value="">Nog onbekend</option>{[0, 9, 21].map((r) => <option key={r} value={r}>{r}%</option>)}</select></div>
      <div className="field"><label htmlFor="tx-payout">SumUp payout-ID</label><input id="tx-payout" name="payout_id" defaultValue={edit_.payout_id} /></div>
      <p className="helper">ING-uitbetalingen van SumUp zijn een verzameluitbetaling. Alleen de onderliggende pintransacties tellen als omzet.</p></div> : null}
    </FormDialog>
    <FormDialog id="bank-form" title="Bankexport importeren" open={importing} onClose={() => setImporting(false)} label="Transacties importeren" submit={async (form) => {
      const data = new FormData(form);
      const file = data.get('file') as File;
      if (!file || !file.size) throw new Error('Kies een CSV-bestand.');
      if (file.size > 5 * 1024 * 1024) throw new Error('Maximaal 5 MB.');
      const r = await api<{ added: number; duplicates: number }>('/transactions/import', { method: 'POST', body: { source: data.get('source'), csv: await file.text() } });
      setImporting(false); toast(`${r.added ?? 0} transacties geïmporteerd${r.duplicates ? ` · ${r.duplicates} al aanwezig` : ''}.`); refreshFinance(qc);
    }}>
      <div className="field"><label htmlFor="bank-source">Bron</label><select id="bank-source" name="source"><option>ING</option><option>SumUp</option></select></div>
      <div className="field"><label htmlFor="bank-file">CSV-bestand</label><input id="bank-file" type="file" name="file" accept=".csv,text/csv" required /></div>
      <p className="helper">Gebruik het template: external_id, date, description, amount, fee, category, vat_rate, payout_id. Datum: JJJJ-MM-DD. Bedragen in euro’s. Elke transactie vereist een uniek ID uit de bron.</p>
      <button type="button" className="small" onClick={template}>Template downloaden</button>
    </FormDialog>
  </>;
}

/* --- Btw ------------------------------------------------------------------------ */

type Vat = { year: number; quarter: number; boxes: Record<string, { base: number; tax: number }>; due: number; excluded: number; note: string };
const BOXES = [['1a', 'Omzet · hoog tarief'], ['1b', 'Omzet · laag tarief'], ['4a', 'Verlegd · buiten de EU'], ['4b', 'Verlegd · binnen de EU'], ['5b', 'Voorbelasting']];

export function VatPage() {
  const [params, setParams] = useSearchParams();
  const now = new Date();
  const y = +(params.get('jaar') || now.getFullYear());
  const qn = +(params.get('kwartaal') || Math.floor(now.getMonth() / 3) + 1);
  const q = useQuery({ queryKey: ['vat', y, qn], queryFn: () => api<Vat>(`/vat?year=${y}&quarter=${qn}`) });
  const set = (yy: number, qq: number) => setParams({ jaar: String(yy), kwartaal: String(qq) }, { replace: true });
  function exportCsv() {
    const r = q.data;
    if (!r) return;
    const rows = [['rubriek', 'omschrijving', 'grondslag', 'btw'], ...BOXES.map(([k, t]) => [k, t, k === '5b' ? '' : (r.boxes[k].base / 100).toFixed(2), (r.boxes[k].tax / 100).toFixed(2)]), ['saldo', '', '', (r.due / 100).toFixed(2)]];
    saveBlob(new Blob([rows.map((x) => x.join(';')).join('\r\n')], { type: 'text/csv' }), `btw-${y}-Q${qn}.csv`);
  }
  return <>
    <PageTitle title="Btw-overzicht" sub="Kwartaalcijfers per aangifterubriek" actions={<button className="ghost" onClick={exportCsv} disabled={!q.data}><Icon name="download" /> Download overzicht</button>} />
    <div className="toolbar"><label htmlFor="vat-year">Jaar</label><select id="vat-year" className="vat-select" value={y} onChange={(e) => set(+e.target.value, qn)}>{[y - 1, y, y + 1].map((n) => <option key={n}>{n}</option>)}</select>
      <label htmlFor="vat-quarter">Kwartaal</label><select id="vat-quarter" className="vat-select" value={qn} onChange={(e) => set(y, +e.target.value)}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>Q{n}</option>)}</select></div>
    <div className="notice"><Icon name="info" /> Dit is een voorlopig werkoverzicht. Vergelijk het vóór indiening met het volledige btw-rapport in Odoo. Buitenlandse diensten worden gesplitst in EU (4b) en buiten EU (4a).</div>
    {q.isPending ? <Loading text="Btw-overzicht ophalen…" state="searching" /> : q.error ? <ErrorBox error={q.error} /> : <>
      <section className="card"><div className="table-wrap"><table><thead><tr><th>Rubriek</th><th>Omschrijving</th><th className="amount">Grondslag</th><th className="amount">Btw</th></tr></thead><tbody>
        {BOXES.map(([k, t]) => <tr key={k}><td><Badge color="purple">{k}</Badge></td><td>{t}</td><td className="amount">{k === '5b' ? '—' : eur(q.data.boxes[k].base)}</td><td className="amount">{eur(q.data.boxes[k].tax)}</td></tr>)}
      </tbody></table></div></section>
      <div className="vat-total"><div><span>Saldo btw · Q{qn} {y}</span><p>{q.data.due >= 0 ? 'Voorlopig te betalen' : 'Voorlopig terug te ontvangen'}</p></div><strong>{eur(Math.abs(q.data.due))}</strong></div>
      <p className="helper">{q.data.note} {q.data.excluded ? `${q.data.excluded} omzetregel(s) zonder bruikbare btw-classificatie uitgesloten.` : ''}</p>
    </>}
  </>;
}

/* --- Documenten ------------------------------------------------------------------- */

export function DocumentsPage() {
  const { upload } = useUpload();
  const q = useDocuments();
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const docs: Doc[] = q.data.documents;
  return <>
    <PageTitle title="Documenten" sub="Originele facturen en bonnen" actions={<button className="primary" onClick={() => upload()}><Icon name="plus" /> Bestand toevoegen</button>} />
    <div className="notice"><Icon name="info" /> Je bestanden worden op de server bewaard en bij boeking aan Odoo gekoppeld. OneDrive-archivering kun je aanzetten bij Koppelingen.</div>
    {docs.length ? <div className="file-list">{docs.map((d) => <article key={d.id} className="card file-card"><Icon name="invoice" /><h3>{d.name}</h3><p>{size(d.size)} · {shortDate(d.created)} · {d.source}</p>
      <footer><DocumentBadge d={d} /><a className="icon-btn button" href={`/api/documents/${d.id}/file`} aria-label={`${d.name} downloaden`}><Icon name="download" /></a></footer>
      {d.details.onedrive_url ? <p className="helper">Ook gearchiveerd in OneDrive</p> : null}</article>)}</div> : <section className="card card-pad"><UploadZone /></section>}
  </>;
}
