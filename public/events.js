/* Moonshine productie: evenementen, advancing, artiesten en label.

   Owns these routes; app.js keeps the shell (sidebar, topbar):
     #events, #events-past                       komende en afgelopen evenementen
     #event-<id>[-timetable|-venue|-notes|-info]  een evenement
     #event-<id>-artist-<booking>[-flight|-hotel|-ground]
     #artists, #artist-<id>[-tech|-hospitality|-files|-shows]
     #label

   Every view loads fresh from the API on navigation. The background poll in
   app.js never re-renders these pages, so a half-filled form survives, and
   unsaved changes are guarded when you click away.
*/
(() => {
  'use strict';

  const S = { route: { view: 'events' }, raw: '', events: [], overview: null, booking: null, artists: [], artist: null, releases: [], notes: [], dirty: false };

  const KIND = {
    tech_rider: 'Technical rider', hospitality_rider: 'Hospitality rider', rider: 'Rider', epk: 'EPK', logo: 'Logo’s',
    press_photo: 'Persfoto’s', press_video: 'Persvideo’s', bio: 'Bio / promotekst', visual: 'Visuals', invoice: 'Facturen',
    contract: 'Contracten', stage_plot: 'Stage plot', guestlist: 'Gastenlijst', production: 'Productieplanning', other: 'Overig',
  };
  const STATUS = { planning: ['In planning', 'amber'], confirmed: ['Bevestigd', 'lime'], live: ['Live', 'purple'], done: ['Afgelopen', 'blue'], cancelled: ['Geannuleerd', ''] };
  const BOOKED_BY = [['', 'Nog onbekend'], ['artist', 'Artiest'], ['agency', 'Agency'], ['venue', 'Venue'], ['moonshine', 'Moonshine']];
  const RELEASE = { planned: ['Gepland', 'amber'], scheduled: ['Ingepland', 'purple'], released: ['Uitgebracht', 'lime'] };

  const TECH_TEMPLATE = `# DJ-setup
- 3x Pioneer CDJ-3000, gelinkt via ethernet
- 1x Pioneer DJM-V10 of DJM-A9
- 2x booth monitors op oorhoogte, met eigen volumeregeling

# Booth
- Stevige, trillingsvrije tafel op heuphoogte
- Twee stopcontacten (230 V) bij de booth
- Geen drankjes op de tafel met apparatuur

# Opbouw
- Linecheck minimaal 30 minuten voor de set`;
  const HOSPITALITY_TEMPLATE = `# Catering
- Warme maaltijd voor 2 personen
- Water, frisdrank en vers fruit backstage

# Backstage
- Afsluitbare kleedruimte met spiegel
- 4 handdoeken

# Gastenlijst
- 4 plekken`;

  // --- Helpers ---------------------------------------------------------------

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (c) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
  const euroInput = (c) => (c ? (c / 100).toFixed(2).replace('.', ',') : '');
  const today = () => new Date().toLocaleDateString('sv-SE');
  const longDate = (v) => (v ? new Date(v + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Datum nog onbekend');
  const shortDate = (v) => (v ? new Date(v + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
  const month = (v) => new Date(v + 'T12:00:00').toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '');
  const stamp = (t) => (t ? new Date(t * 1000).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
  const size = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' kB');
  const toast = (text, error) => window.__toast(text, error);
  const role = () => { try { return user && user.role; } catch { return null; } };
  const isDemo = () => { try { return !!demo; } catch { return false; } };
  const canEdit = () => role() && role() !== 'viewer';
  const dis = () => (canEdit() ? '' : 'disabled');

  const PATHS = {
    warn: 'M12 3.5 2.5 20h19L12 3.5Z M12 10v4.5 M12 17.2h.01',
    ok: 'M4 4h16v16H4Z M8 12.4l2.7 2.7L16.2 9.4',
    plane: 'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z',
    bed: 'M2 4v16 M2 8h18a2 2 0 0 1 2 2v10 M2 17h20 M6 8v9',
    car: 'M5 17H3v-5l2-5h14l2 5v5h-2 M7 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M13 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M3 12h18',
    send: 'M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7Z',
    trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6',
    link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7 M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    file: 'M14 3H6v18h12V7Z M14 3v4h4',
    pdf: 'M14 3H6v18h12V7Z M14 3v4h4 M9 13h6 M9 17h4',
    back: 'M15 5l-7 7 7 7',
    cloud: 'M17.5 19H8a6 6 0 1 1 5.3-8.8A4.5 4.5 0 1 1 17.5 19Z',
  };
  const ico = (name) => (PATHS[name] ? `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${PATHS[name]}"/></svg>` : icon(name));

  async function api(path, opts = {}) {
    const headers = { 'X-CSRF-Token': window.__csrf, ...(opts.headers || {}) };
    let body = opts.body;
    if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch('/api' + path, { ...opts, headers, body });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Handeling mislukt.');
    return data;
  }

  const badge = (text, color = '') => `<span class="badge ${color}">${esc(text)}</span>`;
  // A live night pulses; every other status is a plain badge.
  const statusBadge = (s) => (s === 'live'
    ? `<span class="status-orb"><moon-orb state="listening" size="20" tone="accent" label="Live"></moon-orb>${badge('Live', 'purple')}</span>`
    : badge(...(STATUS[s] || [s || 'Onbekend', ''])));
  const backLink = (href, label) => `<a class="back-link" href="#${href}">${ico('back')} ${esc(label)}</a>`;
  const header = (eyebrow, name, sub, actions = '') =>
    `<header class="page-title"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(name)}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row-actions">${actions}</div></header>`;
  const emptyState = (head, sub, action = '', ic = 'folder') => `<div class="empty">${ico(ic)}<strong>${esc(head)}</strong><p>${esc(sub)}</p>${action ? `<div>${action}</div>` : ''}</div>`;
  const statTile = (label, value, sub, ic) => `<article class="stat"><div class="stat-top">${esc(label)}${ico(ic)}</div><strong>${esc(value)}</strong><small>${esc(sub)}</small></article>`;
  const tabs = (items, active) => `<nav class="seg-tabs" aria-label="Onderdelen">${items.map(([href, label, id]) => `<a href="#${href}" class="${active === id ? 'active' : ''}" ${active === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
  const statusIcon = (complete, cancelled) => (cancelled
    ? `<span class="adv-status off" title="Geannuleerd">${ico('close')}</span>`
    : complete ? `<span class="adv-status ok" title="Compleet">${ico('ok')}</span>` : `<span class="adv-status warn" title="Nog niet compleet">${ico('warn')}</span>`);

  function field(name, label, value, type = 'text', extra = '') {
    return `<div class="kv-field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra} ${dis()}></div>`;
  }
  function select(name, label, value, options, extra = '') {
    return `<div class="kv-field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}" ${extra} ${dis()}>${options.map(([v, l]) => `<option value="${esc(v)}" ${v === (value || '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
  }
  function area(name, label, value, rows = 3, extra = '') {
    return `<div class="kv-field wide"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" rows="${rows}" ${extra} ${dis()}>${esc(value)}</textarea></div>`;
  }
  const yesNo = [['', 'Nog onbekend'], ['yes', 'Ja'], ['no', 'Nee']];

  function setDialogError(message) {
    const box = document.querySelector('#dialog .dialog-error');
    if (box) box.textContent = message;
    else toast(message, true);
  }
  function closeDialog() {
    const dialog = document.querySelector('#dialog');
    if (dialog && dialog.open) dialog.close();
  }

  // --- Routing ---------------------------------------------------------------

  function parse(raw) {
    let m;
    if (raw === 'events-past') return { view: 'events', tab: 'past' };
    if ((m = /^event-([a-f0-9]{24})-artist-([a-f0-9]{24})(?:-(flight|hotel|ground))?$/.exec(raw))) return { view: 'booking', id: m[1], booking: m[2], sub: m[3] || '' };
    if ((m = /^event-([a-f0-9]{24})(?:-(timetable|venue|notes|info))?$/.exec(raw))) return { view: 'event', id: m[1], tab: m[2] || 'advancing' };
    if (raw === 'artists') return { view: 'artists' };
    if ((m = /^artist-([a-f0-9]{24})(?:-(tech|hospitality|files|shows))?$/.exec(raw))) return { view: 'artist', id: m[1], tab: m[2] || 'info' };
    if (raw === 'label') return { view: 'label' };
    return { view: 'events', tab: 'upcoming' };
  }

  async function load(route) {
    if (route.view === 'events') S.events = (await api('/events')).events;
    else if (route.view === 'event') {
      S.overview = await api(`/events/${route.id}/overview`);
      if (route.tab === 'notes') S.notes = (await api(`/events/${route.id}/notes`)).notes;
    } else if (route.view === 'booking') S.booking = await api(`/bookings/${route.booking}`);
    else if (route.view === 'artists') S.artists = (await api('/artists')).artists;
    else if (route.view === 'artist') S.artist = await api(`/artists/${route.id}`);
    else if (route.view === 'label') S.releases = (await api('/releases')).releases;
  }

  async function mount(raw) {
    const host = document.querySelector('#content');
    if (!host) return false;
    S.raw = raw;
    S.route = parse(raw);
    S.dirty = false;
    if (isDemo()) {
      host.innerHTML = header('Productie', 'Evenementen', '') + `<div class="notice">${ico('info')} Evenementen, artiesten en advancing werken alleen met een echte login. De voorbeeldweergave toont de financiën.</div>`;
      return true;
    }
    const slow = setTimeout(() => { if (S.raw === raw) host.innerHTML = '<div class="empty orb-loading"><moon-orb state="working" size="32"></moon-orb>Laden…</div>'; }, 180);
    try {
      await load(S.route);
      clearTimeout(slow);
      if (S.raw === raw) render();
    } catch (error) {
      clearTimeout(slow);
      if (S.raw === raw) host.innerHTML = `${backLink('events', 'Evenementen')}<div class="error-box">${esc(error.message)}</div>`;
    }
    return true;
  }

  async function reload() {
    await load(S.route);
    render();
  }

  function render() {
    const host = document.querySelector('#content');
    if (!host) return;
    const view = S.route.view;
    host.innerHTML = view === 'event' ? eventView() : view === 'booking' ? bookingView() : view === 'artists' ? artistsView()
      : view === 'artist' ? artistView() : view === 'label' ? labelView() : eventsView();
    // On a phone the page-title buttons scroll away on long forms; a
    // sticky bar keeps Opslaan within reach.
    const form = canEdit() && host.querySelector('form[data-guard]');
    if (form) host.insertAdjacentHTML('beforeend', `<div class="save-bar"><button class="primary" type="submit" form="${form.id}">Opslaan</button></div>`);
    S.dirty = false;
  }

  // --- Evenementenlijst ------------------------------------------------------

  function eventsView() {
    const now = today();
    const upcoming = S.events.filter((e) => !e.date || e.date >= now).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
    const past = S.events.filter((e) => e.date && e.date < now);
    const isPast = S.route.tab === 'past';
    const list = isPast ? past : upcoming;
    const rows = list.map((e) => {
      const p = e.progress || {};
      return `<tr class="clickable" data-href="event-${e.id}" tabindex="0">
        <td class="date-cell">${e.date ? `<div class="date-block"><strong>${new Date(e.date + 'T12:00:00').getDate()}</strong><span>${esc(month(e.date))}</span></div>` : '<div class="date-block muted"><strong>?</strong><span>datum</span></div>'}</td>
        <td><div class="event-name"><strong>${esc(e.name)}</strong><small>${esc(e.venue || 'Locatie nog onbekend')}${e.date ? ' · ' + esc(shortDate(e.date)) : ''}</small></div></td>
        <td>${statusBadge(e.status)}</td>
        <td>${p.artists ? `<div class="progress-line"><progress max="${p.artists}" value="${p.complete}"></progress><span>${p.complete}/${p.artists} artiesten compleet</span></div>` : '<span class="helper">Nog geen artiesten</span>'}</td>
        <td class="nowrap">${p.checklist ? `${p.checklist_done}/${p.checklist} venue` : '—'}</td>
        <td>${ico('chevron')}</td></tr>`;
    }).join('');
    const button = canEdit() ? `<button class="primary" data-action="new-event">${ico('plus')} Nieuw evenement</button>` : '';
    return header('Productie', 'Evenementen', 'Advancing per avond: artiesten, reis, riders en wat de venue heeft ontvangen.', button) +
      tabs([['events', `Komend <span class="count">${upcoming.length}</span>`, 'upcoming'], ['events-past', `Afgelopen <span class="count">${past.length}</span>`, 'past']], isPast ? 'past' : 'upcoming') +
      `<section class="card">${list.length
        ? `<div class="table-wrap"><table class="events-table"><thead><tr><th>Datum</th><th>Evenement</th><th>Status</th><th>Advancing</th><th>Venue</th><th aria-label="Openen"></th></tr></thead><tbody>${rows}</tbody></table></div>`
        : isPast ? emptyState('Nog geen afgelopen evenementen', 'Evenementen verschijnen hier zodra hun datum voorbij is.', '', 'calendar')
          : emptyState('Geen komende evenementen', 'Maak een evenement aan en zet de line-up erin. De advancing-checklist komt er automatisch bij.', button, 'calendar')}</section>`;
  }

  // --- Evenement -------------------------------------------------------------

  function eventView() {
    const o = S.overview;
    const e = o.event;
    const tab = S.route.tab;
    const s = o.summary;
    const first = o.acts.find((a) => a.start);
    const base = `event-${e.id}`;
    const actions = `<button class="ghost" data-action="download" data-url="/api/events/${e.id}/advancing.pdf">${ico('pdf')} Advancingblad</button>` +
      (canEdit() ? `<button class="primary" data-action="send-dialog">${ico('send')} Advancing versturen</button>` : '');
    return backLink(e.date && e.date < today() ? 'events-past' : 'events', 'Alle evenementen') +
      header('Evenement', e.name, `${esc(longDate(e.date))}${e.venue ? ' · ' + esc(e.venue) : ''} ${statusBadge(e.status)}`, actions) +
      `<div class="stats">
        ${statTile('Artiesten compleet', `${s.complete}/${s.artists}`, s.artists ? (s.complete === s.artists ? 'Alles is binnen' : `${s.artists - s.complete} nog niet compleet`) : 'Nog niemand geboekt', 'user')}
        ${statTile('Venue-checklist', `${s.checklist_done}/${s.checklist}`, e.venue ? 'Voor ' + e.venue : 'Venue nog onbekend', 'check')}
        ${statTile('Eerste act', first ? first.start : '—', e.doors ? 'Deuren ' + e.doors : 'Deuren nog onbekend', 'clock')}
        ${statTile('Acts', String(o.acts.length), o.acts.length ? 'In de timetable' : 'Nog geen timetable', 'calendar')}
      </div>` +
      tabs([[base, 'Advancing', 'advancing'], [base + '-timetable', `Timetable <span class="count">${o.acts.length}</span>`, 'timetable'],
        [base + '-venue', 'Venue', 'venue'], [base + '-notes', 'Notities', 'notes'], [base + '-info', 'Gegevens', 'info']], tab) +
      (tab === 'timetable' ? timetableTab(o) : tab === 'venue' ? venueTab(o) : tab === 'notes' ? notesTab(o) : tab === 'info' ? infoTab(o) : advancingTab(o));
  }

  function advancingTab(o) {
    const rows = o.bookings.map((b) => {
      const acts = o.acts.filter((a) => b.acts.includes(a.id));
      const times = acts.filter((a) => a.start).map((a) => `${a.start}–${a.end || '?'}`).join(', ');
      const cancelled = b.status === 'cancelled';
      const state = cancelled ? 'Geannuleerd' : b.complete ? 'Compleet' : `${b.missing.length} ${b.missing.length === 1 ? 'punt' : 'punten'} open`;
      return `<a class="adv-row" href="#event-${o.event.id}-artist-${b.id}">
        ${statusIcon(b.complete, cancelled)}
        <span class="adv-name"><strong>${esc(b.artist.name)}</strong><small>${esc(acts.map((a) => a.name).join(' · ') || 'Nog geen act')}</small></span>
        <span class="adv-when">${esc(times || '—')}</span>
        <span class="adv-state ${cancelled ? 'off' : b.complete ? 'ok' : 'warn'}">${esc(state)}</span>
        ${ico('chevron')}</a>`;
    }).join('');
    const open = o.bookings.filter((b) => b.status !== 'cancelled' && !b.complete);
    const counts = {};
    open.forEach((b) => b.missing.forEach((m) => { counts[m] = (counts[m] || 0) + 1; }));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const todo = o.checklist.filter((i) => i.status === 'todo' || i.status === 'done');
    const add = canEdit() ? `<button class="small" data-action="add-booking">${ico('plus')} Artiest toevoegen</button>` : '';
    return `<div class="adv-layout">
      <section class="card"><div class="card-head"><div><h2>Advancing overview</h2><p>Een vinkje betekent dat alles binnen is. Klik op een artiest voor gegevens, reis en content.</p></div>${add}</div>
        ${rows ? `<div class="adv-list">${rows}</div>` : emptyState('Nog geen artiesten', 'Voeg de line-up toe. Een bekende artiest neemt zijn riders, content en gegevens mee.', add, 'user')}</section>
      <aside class="adv-side">
        <section class="card card-pad"><h2>Nog te regelen</h2>${top.length
          ? `<ul class="todo-list">${top.map(([m, n]) => `<li><span>${esc(m)}</span><b>${n}×</b></li>`).join('')}</ul>`
          : `<p class="helper">${o.bookings.length ? 'Alle artiesten zijn compleet.' : 'Nog niets te regelen.'}</p>`}</section>
        <section class="card card-pad"><h2>${esc(o.event.venue || 'Venue')}</h2><p class="helper">${todo.length
          ? `${todo.length} ${todo.length === 1 ? 'onderdeel is' : 'onderdelen zijn'} nog niet naar de venue gestuurd.`
          : 'Alles is verstuurd of niet van toepassing.'}</p><a class="text-link" href="#event-${o.event.id}-venue">Naar de checklist ${ico('chevron')}</a></section>
      </aside></div>`;
  }

  function timetableTab(o) {
    const rows = o.acts.map((a) => `<tr>
      <td class="tt-time">${esc(a.start || '—')}${a.end ? ' – ' + esc(a.end) : ''}</td>
      <td><strong>${esc(a.name)}</strong>${a.note ? `<small class="block">${esc(a.note)}</small>` : ''}</td>
      <td>${a.artists.length ? a.artists.map((n) => `<span class="chip">${esc(n)}</span>`).join('') : '<span class="helper">Geen artiesten gekoppeld</span>'}</td>
      <td>${esc(a.stage || '')}</td>
      <td class="row-tools">${canEdit() ? `<button class="icon-btn ghost" data-action="edit-act" data-id="${a.id}" aria-label="${esc(a.name)} bewerken">${ico('edit')}</button><button class="icon-btn ghost" data-action="delete-act" data-id="${a.id}" aria-label="${esc(a.name)} verwijderen">${ico('trash')}</button>` : ''}</td></tr>`).join('');
    const add = canEdit() ? `<button class="small" data-action="add-act">${ico('plus')} Act toevoegen</button>` : '';
    return `<section class="card"><div class="card-head"><div><h2>Timetable</h2><p>Een act kan meerdere artiesten hebben, zoals een B2B. Tijden na middernacht sorteren gewoon na de avond.</p></div>${add}</div>
      ${rows ? `<div class="table-wrap"><table class="tt-table"><thead><tr><th>Tijd</th><th>Act</th><th>Artiesten</th><th>Stage</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
        : emptyState('Nog geen acts', o.bookings.length ? 'Plan de acts met set times en koppel de artiesten.' : 'Voeg eerst artiesten toe bij Advancing.', add, 'clock')}</section>`;
  }

  function venueTab(o) {
    const e = o.event;
    const states = [['todo', 'Te doen'], ['done', 'Klaar'], ['sent', 'Verstuurd'], ['na', 'N.v.t.']];
    const items = o.checklist.map((i) => `<div class="check-row is-${esc(i.status)}">
      <span class="check-mark">${i.status === 'sent' || i.status === 'done' ? ico('check') : i.status === 'na' ? ico('close') : ''}</span>
      <div class="check-main"><strong>${esc(i.label)}</strong><small>${i.status === 'sent' ? `Verstuurd ${esc(stamp(i.sent_at))}${i.sent_to ? ' naar ' + esc(i.sent_to) : ''}` : esc(i.notes || '')}</small></div>
      <div class="segmented" role="group" aria-label="Status: ${esc(i.label)}">${states.map(([v, l]) => `<button type="button" class="${i.status === v ? 'active' : ''}" data-action="check-status" data-id="${i.id}" data-status="${v}" aria-pressed="${i.status === v}" ${dis()}>${l}</button>`).join('')}</div>
      ${canEdit() && !i.key ? `<button class="icon-btn ghost tiny" data-action="delete-check" data-id="${i.id}" aria-label="${esc(i.label)} verwijderen">${ico('trash')}</button>` : '<span class="tiny-spacer"></span>'}
    </div>`).join('');
    const sends = o.sends.map((s) => `<li><span>${s.status === 'accepted' ? badge('Aangenomen door Outlook', 'lime') : s.status === 'uncertain' ? badge('Onzeker', 'amber') : badge('Mislukt', 'red')} ${esc(stamp(s.created))}</span>
      <small>${esc(s.recipients)} · ${s.attachments.length} bijlagen${s.error ? ' · ' + esc(s.error) : ''}</small></li>`).join('');
    return `<div class="adv-layout">
      <section class="card"><div class="card-head"><div><h2>Checklist voor ${esc(e.venue || 'de venue')}</h2><p>Vink af wat klaar is. <b>Advancing versturen</b> stuurt alles wat nog open staat in één mail via Outlook.</p></div>${canEdit() ? `<button class="small" data-action="add-check">${ico('plus')} Onderdeel</button>` : ''}</div>
        <div class="check-list">${items}</div></section>
      <aside class="adv-side">
        <section class="card card-pad"><h2>Contact venue</h2>${e.venue_email || e.venue_contact || e.venue_phone
          ? `<p class="contact-lines">${[e.venue_contact, e.venue_email, e.venue_phone].filter(Boolean).map(esc).join('<br>')}</p>`
          : '<p class="helper">Nog geen contactpersoon. Vul die in bij Gegevens; het e-mailadres wordt de standaardontvanger.</p>'}
          <a class="text-link" href="#event-${e.id}-info">Gegevens bewerken ${ico('chevron')}</a></section>
        <section class="card card-pad"><h2>Bestanden voor de venue</h2>${assetGroups('event', e.id, o.assets, ['guestlist', 'production', 'stage_plot', 'other'])}</section>
        <section class="card card-pad"><h2>Verzonden</h2>${sends ? `<ul class="send-list">${sends}</ul>` : '<p class="helper">Nog niets verstuurd.</p>'}</section>
      </aside></div>`;
  }

  function notesTab(o) {
    const rows = S.notes.map((n) => `<li><span>${esc(n.body)}</span><time>${esc(stamp(n.created))}</time></li>`).join('');
    return `<section class="card card-pad"><h2>Notities</h2><p class="helper">Alles wat je tijdens de voorbereiding of de opbouw niet mag vergeten.</p>
      ${canEdit() ? `<form id="event-note-form" class="inline-form"><label class="visually-hidden" for="event-note">Nieuwe notitie</label><input id="event-note" name="body" placeholder="Bijv. tweede monitor defect" required><button class="primary" type="submit">Toevoegen</button></form>` : ''}
      ${rows ? `<ul class="note-list">${rows}</ul>` : '<p class="helper">Nog geen notities.</p>'}</section>`;
  }

  function infoTab(o) {
    const e = o.event;
    return `<form id="event-info-form" class="card card-pad" data-guard>
        <h2>Evenement</h2>
        <div class="kv-grid">
          ${field('name', 'Naam *', e.name, 'text', 'required')}
          ${field('date', 'Datum', e.date, 'date')}
          ${field('venue', 'Locatie / venue', e.venue, 'text', 'placeholder="Luxor Live, Arnhem"')}
          ${field('doors', 'Deuren', e.doors, 'time')}
          ${field('capacity', 'Capaciteit', e.capacity || '', 'number', 'min="0"')}
          ${select('status', 'Status', e.status, Object.entries(STATUS).map(([k, [l]]) => [k, l]))}
        </div>
        <h2 class="sub">Contact bij de venue</h2>
        <div class="kv-grid">
          ${field('venue_contact', 'Contactpersoon', e.venue_contact)}
          ${field('venue_email', 'E-mail (meerdere met komma)', e.venue_email, 'text', 'placeholder="productie@venue.nl"')}
          ${field('venue_phone', 'Telefoon', e.venue_phone, 'tel')}
        </div>
        ${canEdit() ? '<div class="form-actions"><button class="primary" type="submit">Opslaan</button></div>' : ''}
      </form>
      ${canEdit() ? `<section class="card card-pad danger-zone"><h2>Evenement verwijderen</h2><p class="helper">Verwijdert dit evenement met timetable, boekingen, checklist en verzendlog. Artiesten, hun riders en content blijven bewaard, net als de mappen in OneDrive.</p><button class="danger" data-action="delete-event">${ico('trash')} Evenement verwijderen</button></section>` : ''}`;
  }

  // --- Artiest op een evenement (advancing) ----------------------------------

  function missingCard(b) {
    if (b.status === 'cancelled') return `<div class="notice">${ico('info')} Deze boeking is geannuleerd en telt niet mee voor de advancing.</div>`;
    if (b.complete) return `<div class="notice notice-ok">${ico('ok')} Advancing compleet. Alles wat de venue nodig heeft is binnen.</div>`;
    return `<div class="notice notice-warn missing">${ico('warn')}<div><strong>Nog nodig voor deze artiest</strong><div class="chips">${b.missing.map((m) => `<span class="chip warn">${esc(m)}</span>`).join('')}</div></div></div>`;
  }

  function bookingView() {
    const b = S.booking;
    if (S.route.sub) return travelView(S.route.sub);
    const a = b.artist;
    const e = b.event;
    const mine = b.acts.filter((x) => x.artist_ids.includes(a.id));
    const sub = (key, value, label, ic) => `<div class="kv-field"><label for="f-b_${key}">${label}</label><div class="yn-row">
      <select id="f-b_${key}" name="b_${key}" data-yes-link="${key}" ${dis()}>${yesNo.map(([v, l]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <button type="button" class="small ghost" data-action="subpage" data-sub="${key === 'grounds' ? 'ground' : key}" ${value === 'yes' ? '' : 'hidden'}>${ico(ic)} Gegevens</button></div></div>`;
    const actions = canEdit()
      ? `<button class="ghost" data-action="remove-booking">${ico('trash')} Van evenement halen</button><button class="primary" type="submit" form="booking-main">Opslaan</button>`
      : '';
    return backLink(`event-${e.id}`, e.name) +
      header(`Artiest · ${e.name}`, a.name, `${b.status === 'cancelled' ? badge('Geannuleerd') : b.complete ? badge('Compleet', 'lime') : badge(`${b.missing.length} punten open`, 'amber')} <a class="text-link" href="#artist-${a.id}">Profiel en riders ${ico('chevron')}</a>`, actions) +
      missingCard(b) +
      `<div class="booking-grid">
        <form id="booking-main" class="booking-form" data-guard>
          <section class="card card-pad">
            <h2>Artiest</h2>
            ${field('a_full_name', 'Volledige naam *', a.full_name, 'text', 'autocomplete="off"')}
            ${field('a_passport', 'Paspoort / ID', a.passport, 'text', `autocomplete="off" ${a.masked ? 'readonly' : ''}`)}
            ${field('a_date_of_birth', 'Geboortedatum', a.date_of_birth, a.masked ? 'text' : 'date', a.masked ? 'readonly' : '')}
            <p class="field-hint">Alleen nodig als Moonshine of de venue de vlucht of het hotel boekt. Gaat nooit mee in de mail naar de venue.</p>
            ${field('a_email', 'E-mail', a.email, 'email')}
            ${field('a_phone', 'Telefoon', a.phone, 'tel')}
            ${field('a_instagram', 'Instagram', a.instagram, 'text', 'placeholder="@naam"')}
            <h2 class="sub">Agency</h2>
            ${field('a_agency', 'Agency', a.agency)}
            ${field('a_agent', 'Agent', a.agent)}
            ${field('a_agent_email', 'E-mail agent', a.agent_email, 'email')}
            ${field('a_agent_phone', 'Telefoon agent', a.agent_phone, 'tel')}
            <p class="field-hint">Een e-mailadres van de artiest of de agent is genoeg.</p>
          </section>
          <section class="card card-pad">
            <h2>Boeking</h2>
            ${field('b_fee', 'Gage (€)', euroInput(b.fee), 'text', 'inputmode="decimal" placeholder="0,00"')}
            ${select('b_status', 'Status', b.status, [['confirmed', 'Bevestigd'], ['option', 'Optie'], ['cancelled', 'Geannuleerd']])}
            ${sub('flight', b.flight, 'Vlucht', 'plane')}
            ${sub('grounds', b.grounds, 'Grondvervoer', 'car')}
            ${sub('hotel', b.hotel, 'Hotel', 'bed')}
            ${field('a_rider_url', 'Riderlink', a.rider_url, 'url', 'placeholder="https://"')}
            ${field('a_epk_url', 'EPK-link', a.epk_url, 'url', 'placeholder="https://"')}
            <h2 class="sub">Acts</h2>
            ${mine.length ? `<ul class="act-list">${mine.map((x) => `<li><span><strong>${esc(x.name)}</strong><small>${esc(x.start ? `${x.start} – ${x.end || '?'}` : 'Nog geen tijd')}${x.stage ? ' · ' + esc(x.stage) : ''}</small></span>${canEdit() ? `<button type="button" class="icon-btn ghost tiny" data-action="edit-act" data-id="${x.id}" aria-label="${esc(x.name)} bewerken">${ico('edit')}</button>` : ''}</li>`).join('')}</ul>` : '<p class="helper">Nog niet ingepland in de timetable.</p>'}
            ${canEdit() ? `<button type="button" class="small" data-action="add-act" data-artist="${a.id}">${ico('plus')} Act toevoegen</button>` : ''}
            ${area('b_notes', 'Notities voor deze boeking', b.notes, 3)}
          </section>
        </form>
        <section class="card card-pad content-col">
          <h2>Content</h2>
          ${assetGroups('booking', b.id, b.assets, ['invoice'])}
          ${assetGroups('artist', a.id, b.artist_assets, ['logo', 'press_photo', 'press_video', 'bio', 'visual', 'tech_rider', 'hospitality_rider'])}
          <p class="field-hint">Logo’s, persfoto’s en riders horen bij de artiest en gaan mee naar elk volgend evenement. De technical rider bewerk je in het <a class="text-link" href="#artist-${a.id}-tech">profiel</a>.</p>
        </section>
      </div>`;
  }

  function travelView(kind) {
    const b = S.booking;
    const a = b.artist;
    const e = b.event;
    const save = canEdit() ? '<button class="primary" type="submit" form="travel-form">Opslaan</button>' : '';
    const head = (title) => backLink(`event-${e.id}-artist-${b.id}`, a.name) + header(`${a.name} · ${e.name}`, title, esc(longDate(e.date)), save);
    if (kind === 'flight') {
      const f = b.flight_info;
      const leg = (prefix, l, title) => `<section class="card card-pad"><h2>${title}</h2>
        ${field(prefix + '_from', 'Vertrekluchthaven', l.from, 'text', 'placeholder="Copenhagen (CPH)"')}
        ${field(prefix + '_to', 'Aankomstluchthaven', l.to, 'text', 'placeholder="Amsterdam Schiphol (AMS)"')}
        ${field(prefix + '_departure', 'Vertrek', l.departure, 'datetime-local')}
        ${field(prefix + '_arrival', 'Aankomst', l.arrival, 'datetime-local')}
        ${field(prefix + '_number', 'Vluchtnummer', l.number, 'text', 'placeholder="AB1234"')}</section>`;
      return head('Vluchtgegevens') + `<form id="travel-form" data-kind="flight" class="travel-grid" data-guard>
        <section class="card card-pad"><h2>Tickets</h2>
          ${select('tickets_booked', 'Tickets geboekt?', f.tickets_booked, yesNo)}
          ${select('booked_by', 'Geboekt door', f.booked_by, BOOKED_BY)}
          ${field('price', 'Prijs (€)', euroInput(f.price), 'text', 'inputmode="decimal" placeholder="0,00"')}
          ${area('notes', 'Notities', f.notes, 3)}
        </section>
        ${leg('in', f.inbound, 'Heen (inbound)')}${leg('out', f.outbound, 'Terug (outbound)')}
      </form>`;
    }
    if (kind === 'hotel') {
      const h = b.hotel_info;
      return head('Hotel') + `<form id="travel-form" data-kind="hotel" class="travel-grid two" data-guard>
        <section class="card card-pad"><h2>Boeking</h2>
          ${select('booked_by', 'Geboekt door', h.booked_by, BOOKED_BY)}
          ${field('name', 'Hotel', h.name)}
          ${field('address', 'Adres', h.address)}
          ${field('confirmation', 'Bevestigingsnummer', h.confirmation)}
          ${field('price', 'Prijs (€)', euroInput(h.price), 'text', 'inputmode="decimal" placeholder="0,00"')}
        </section>
        <section class="card card-pad"><h2>Verblijf</h2>
          ${field('check_in', 'Check-in', h.check_in, 'date')}
          ${field('check_out', 'Check-out', h.check_out, 'date')}
          ${field('rooms', 'Kamers', h.rooms, 'text', 'placeholder="1 single, 1 double"')}
          ${area('notes', 'Notities', h.notes, 3)}
        </section></form>`;
    }
    const g = b.ground_info;
    return head('Grondvervoer') + `<form id="travel-form" data-kind="ground" class="travel-grid two" data-guard>
      <section class="card card-pad"><h2>Ophalen</h2>
        ${select('booked_by', 'Geregeld door', g.booked_by, BOOKED_BY)}
        ${field('pickup_time', 'Ophaaltijd', g.pickup_time, 'datetime-local')}
        ${field('pickup_location', 'Ophaallocatie', g.pickup_location, 'text', 'placeholder="Schiphol, meeting point"')}
        ${field('dropoff_location', 'Afzetten bij', g.dropoff_location, 'text', 'placeholder="Hotel of venue"')}
      </section>
      <section class="card card-pad"><h2>Terug en chauffeur</h2>
        ${field('return_time', 'Terugrit', g.return_time, 'datetime-local')}
        ${field('return_location', 'Terug naar', g.return_location)}
        ${field('driver', 'Chauffeur', g.driver)}
        ${field('driver_phone', 'Telefoon chauffeur', g.driver_phone, 'tel')}
        ${area('notes', 'Notities', g.notes, 3)}
      </section></form>`;
  }

  // --- Bestanden -------------------------------------------------------------

  function assetGroups(ownerType, ownerId, assets, kinds) {
    return kinds.map((kind) => {
      const rows = assets.filter((a) => a.kind === kind);
      const tools = canEdit() ? `<span class="asset-tools">
        <label class="small-btn">${ico('upload')} Upload<input type="file" class="visually-hidden" data-upload="${kind}" data-owner-type="${ownerType}" data-owner-id="${ownerId}"></label>
        <button type="button" class="small-btn" data-action="add-link" data-kind="${kind}" data-owner-type="${ownerType}" data-owner-id="${ownerId}">${ico('link')} Link</button></span>` : '';
      return `<div class="asset-group"><div class="asset-head"><span>${esc(KIND[kind] || kind)}</span>${tools}</div>
        ${rows.length ? `<ul class="asset-list">${rows.map(assetRow).join('')}</ul>` : '<p class="asset-empty">Nog niets</p>'}</div>`;
    }).join('');
  }

  function assetRow(a) {
    const href = a.has_file ? `/api/assets/${a.id}/file` : a.url;
    let sync;
    if (!a.has_file) sync = `<span class="sync link" title="Externe link">${ico('link')}</span>`;
    else if (a.sync_status === 'synced') sync = `<a class="sync ok" href="${esc(a.onedrive_url)}" target="_blank" rel="noopener noreferrer" title="Opgeslagen in OneDrive">${ico('cloud')}</a>`;
    else if (a.sync_status === 'error') sync = `<button type="button" class="sync err" data-action="sync-asset" data-id="${a.id}" title="OneDrive: ${esc(a.error || 'mislukt')}. Klik om opnieuw te proberen.">${ico('warn')}</button>`;
    else sync = `<span class="sync pending" title="Lokaal opgeslagen. Wordt naar OneDrive gekopieerd zodra die koppeling aan staat.">${ico('cloud')}</span>`;
    return `<li><a class="asset-name" href="${esc(href)}" ${a.has_file ? 'download' : 'target="_blank" rel="noopener noreferrer"'}>${ico(a.has_file ? 'file' : 'link')}<span>${esc(a.name)}</span></a>
      <small>${a.has_file ? size(a.size) : ''}</small>${sync}
      ${canEdit() ? `<button type="button" class="icon-btn ghost tiny" data-action="delete-asset" data-id="${a.id}" aria-label="${esc(a.name)} verwijderen">${ico('close')}</button>` : ''}</li>`;
  }

  // --- Artiesten -------------------------------------------------------------

  function artistsView() {
    const rows = S.artists.map((a) => {
      const rider = a.has_tech_rider || a.has_rider_url || a.rider_files;
      return `<tr class="clickable" data-href="artist-${a.id}" tabindex="0" data-search="${esc((a.name + ' ' + a.full_name + ' ' + a.agency + ' ' + a.agent).toLowerCase())}">
        <td><div class="event-name"><strong>${esc(a.name)}</strong><small>${esc(a.full_name || 'Volledige naam ontbreekt')}</small></div></td>
        <td>${esc([a.agent, a.agency].filter(Boolean).join(' · ') || '—')}</td>
        <td>${rider ? `<span class="yes">${ico('ok')} Rider</span>` : '<span class="no">Geen rider</span>'}</td>
        <td>${a.has_epk ? `<span class="yes">${ico('ok')} EPK</span>` : '<span class="no">—</span>'}</td>
        <td class="nowrap">${a.booking_count} ${a.booking_count === 1 ? 'evenement' : 'evenementen'}</td>
        <td>${ico('chevron')}</td></tr>`;
    }).join('');
    const button = canEdit() ? `<button class="primary" data-action="new-artist">${ico('plus')} Nieuwe artiest</button>` : '';
    return header('Productie', 'Artiesten', 'Eén profiel per artiest: gegevens, riders, EPK en promo. Herbruikbaar voor elk evenement.', button) +
      `<section class="card">${S.artists.length ? `<div class="card-head"><div class="search-field"><label class="visually-hidden" for="artist-search">Zoek artiest</label><input id="artist-search" type="search" placeholder="Zoek op naam, agent of agency" data-filter-rows></div></div>
        <div class="table-wrap"><table class="artists-table"><thead><tr><th>Artiest</th><th>Agent</th><th>Rider</th><th>EPK</th><th>Optredens</th><th aria-label="Openen"></th></tr></thead><tbody>${rows}</tbody></table></div>`
        : emptyState('Nog geen artiesten', 'Artiesten ontstaan vanzelf als je ze op een evenement zet, of maak er hier een aan.', button, 'user')}</section>`;
  }

  function artistView() {
    const a = S.artist;
    const tab = S.route.tab;
    const base = `artist-${a.id}`;
    const form = { info: 'artist-form', tech: 'rider-form', hospitality: 'rider-form' }[tab];
    const actions = (tab === 'tech' || tab === 'hospitality' ? `<button class="ghost" data-action="download" data-url="/api/artists/${a.id}/rider.pdf?kind=${tab === 'tech' ? 'tech' : 'hospitality'}">${ico('pdf')} PDF</button>` : '') +
      (canEdit() && form ? `<button class="primary" type="submit" form="${form}">Opslaan</button>` : '');
    const files = a.assets.length;
    return backLink('artists', 'Alle artiesten') +
      header('Artiest', a.name, esc([a.full_name, a.agency].filter(Boolean).join(' · ') || 'Profiel'), actions) +
      tabs([[base, 'Gegevens', 'info'], [base + '-tech', 'Technical rider', 'tech'], [base + '-hospitality', 'Hospitality rider', 'hospitality'],
        [base + '-files', `Bestanden <span class="count">${files}</span>`, 'files'], [base + '-shows', `Optredens <span class="count">${a.bookings.length}</span>`, 'shows']], tab) +
      (tab === 'tech' || tab === 'hospitality' ? riderTab(a, tab) : tab === 'files' ? filesTab(a) : tab === 'shows' ? showsTab(a) : artistInfoTab(a));
  }

  function artistInfoTab(a) {
    return `<form id="artist-form" class="booking-form" data-guard>
        <section class="card card-pad"><h2>Gegevens</h2>
          ${field('name', 'Artiestennaam *', a.name, 'text', 'required')}
          ${field('full_name', 'Volledige naam', a.full_name)}
          ${field('passport', 'Paspoort / ID', a.passport, 'text', `autocomplete="off" ${a.masked ? 'readonly' : ''}`)}
          ${field('date_of_birth', 'Geboortedatum', a.date_of_birth, a.masked ? 'text' : 'date', a.masked ? 'readonly' : '')}
          ${field('nationality', 'Nationaliteit', a.nationality)}
          ${field('email', 'E-mail', a.email, 'email')}
          ${field('phone', 'Telefoon', a.phone, 'tel')}
          ${field('instagram', 'Instagram', a.instagram, 'text', 'placeholder="@naam"')}
        </section>
        <section class="card card-pad"><h2>Agency</h2>
          ${field('agency', 'Agency', a.agency)}
          ${field('agent', 'Agent', a.agent)}
          ${field('agent_email', 'E-mail agent', a.agent_email, 'email')}
          ${field('agent_phone', 'Telefoon agent', a.agent_phone, 'tel')}
          <h2 class="sub">Links</h2>
          ${field('rider_url', 'Riderlink', a.rider_url, 'url', 'placeholder="https://"')}
          ${field('epk_url', 'EPK-link', a.epk_url, 'url', 'placeholder="https://"')}
        </section>
        <section class="card card-pad wide-card"><h2>Promo</h2>
          ${area('bio', 'Bio / promotekst', a.bio, 6)}
          ${area('notes', 'Interne notities', a.notes, 3)}
        </section>
      </form>
      ${canEdit() ? `<section class="card card-pad danger-zone"><h2>Artiest verwijderen</h2><p class="helper">Kan alleen als de artiest niet meer op een evenement staat. Bestanden in OneDrive blijven bewaard.</p><button class="danger" data-action="delete-artist">${ico('trash')} Artiest verwijderen</button></section>` : ''}`;
  }

  function riderTab(a, tab) {
    const key = tab === 'tech' ? 'tech_rider' : 'hospitality_rider';
    const kinds = tab === 'tech' ? ['tech_rider', 'rider'] : ['hospitality_rider'];
    const value = a[key] || '';
    return `<div class="rider-layout">
      <form id="rider-form" class="card card-pad" data-guard data-key="${key}">
        <div class="rider-head"><h2>${tab === 'tech' ? 'Technical rider' : 'Hospitality rider'}</h2>${canEdit() ? `<button type="button" class="small ghost" data-action="insert-template" data-key="${key}">${ico('spark')} ${value.trim() ? 'Sjabloon onderaan toevoegen' : 'Begin met sjabloon'}</button>` : ''}</div>
        <label class="visually-hidden" for="f-${key}">Ridertekst</label>
        <textarea id="f-${key}" name="${key}" class="rider-editor" rows="22" spellcheck="true" placeholder="# DJ-setup\n- 3x CDJ-3000\n- DJM-V10" ${dis()}>${esc(value)}</textarea>
        <p class="field-hint">Begin een regel met <code>#</code> voor een kop en met <code>-</code> voor een opsomming. De PDF en de mail naar de venue worden hieruit gemaakt.</p>
      </form>
      <aside class="card card-pad"><h2>Riderbestanden</h2><p class="helper">Heeft de artiest een eigen PDF? Upload die hier; hij gaat mee naar de venue naast de rider hierboven.</p>
        ${assetGroups('artist', a.id, a.assets, kinds)}</aside>
    </div>`;
  }

  function filesTab(a) {
    return `<section class="card card-pad"><h2>Bestanden van ${esc(a.name)}</h2><p class="helper">Riders, EPK, logo’s, persfoto’s en video’s. Lokaal bewaard en, als de koppeling aan staat, in OneDrive onder Artiesten/${esc(a.name)}.</p>
      <div class="asset-columns">${assetGroups('artist', a.id, a.assets, ['tech_rider', 'hospitality_rider', 'rider', 'epk', 'logo', 'press_photo', 'press_video', 'bio', 'visual', 'contract', 'other'])}</div></section>`;
  }

  function showsTab(a) {
    const rows = a.bookings.map((b) => `<tr class="clickable" data-href="event-${b.event_id}-artist-${b.id}" tabindex="0">
      <td>${esc(shortDate(b.event_date))}</td><td><strong>${esc(b.event_name)}</strong></td><td>${esc(b.venue || '')}</td>
      <td>${b.status === 'cancelled' ? badge('Geannuleerd') : b.status === 'option' ? badge('Optie', 'amber') : badge('Bevestigd', 'lime')}</td><td>${ico('chevron')}</td></tr>`).join('');
    return `<section class="card">${rows ? `<div class="table-wrap"><table class="shows-table"><thead><tr><th>Datum</th><th>Evenement</th><th>Locatie</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
      : emptyState('Nog geen optredens', 'Zet de artiest op een evenement via Advancing.', '', 'calendar')}</section>`;
  }

  // --- Label -----------------------------------------------------------------

  function labelView() {
    const rows = S.releases.map((r) => `<tr>
      <td>${esc(shortDate(r.release_date))}</td><td><strong>${esc(r.title)}</strong>${r.notes ? `<small class="block">${esc(r.notes)}</small>` : ''}</td><td>${esc(r.artist || '—')}</td>
      <td>${badge(...(RELEASE[r.status] || [r.status, '']))}</td>
      <td class="row-tools">${canEdit() ? `<button class="icon-btn ghost" data-action="edit-release" data-id="${r.id}" aria-label="${esc(r.title)} bewerken">${ico('edit')}</button><button class="icon-btn ghost" data-action="delete-release" data-id="${r.id}" aria-label="${esc(r.title)} verwijderen">${ico('trash')}</button>` : ''}</td></tr>`).join('');
    const statements = (window.__state && window.__state.label_statements) || [];
    const button = canEdit() ? `<button class="primary" data-action="new-release">${ico('plus')} Nieuwe release</button>` : '';
    return header('Productie', 'Label', 'Releases van het Moonshine-label. Royalty-afrekeningen komen uit LabelGrid zodra die koppeling aan staat.', button) +
      `<section class="card"><div class="card-head"><div><h2>Releases</h2></div></div>${rows
        ? `<div class="table-wrap"><table class="release-table"><thead><tr><th>Datum</th><th>Titel</th><th>Artiest</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
        : emptyState('Nog geen releases', 'Plan een release met titel, artiest en datum.', button, 'music')}</section>
      <section class="card section-gap"><div class="card-head"><div><h2>LabelGrid-afrekeningen</h2><p>Alleen-lezen overzicht. Ophalen gaat via Koppelingen.</p></div></div>${statements.length
        ? `<div class="table-wrap"><table><thead><tr><th>Periode</th><th>Factuur</th><th>Status</th><th class="amount">Te ontvangen (USD)</th></tr></thead><tbody>${statements.map((s) => `<tr><td>${esc(s.period)}</td><td>${esc(s.invoice_number)}</td><td>${esc(s.status)}</td><td class="amount">${Number(s.total_due_usd || 0).toFixed(2)}</td></tr>`).join('')}</tbody></table></div>`
        : '<p class="helper card-pad-x">Nog geen afrekeningen opgehaald.</p>'}</section>`;
  }

  // --- Dialogen --------------------------------------------------------------

  function lineup() {
    if (S.route.view === 'booking' && S.booking) return S.booking.lineup;
    return (S.overview ? S.overview.bookings : []).filter((b) => b.status !== 'cancelled').map((b) => ({ artist_id: b.artist_id, name: b.artist.name }));
  }
  function currentActs() {
    return S.route.view === 'booking' && S.booking ? S.booking.acts : S.overview ? S.overview.acts : [];
  }
  function eventId() {
    return S.route.view === 'booking' && S.booking ? S.booking.event.id : S.overview ? S.overview.event.id : S.route.id;
  }

  function actDialog(act, presetArtist) {
    const ids = new Set(act ? act.artist_ids : presetArtist ? [presetArtist] : []);
    const people = lineup();
    window.__modal(act ? 'Act bewerken' : 'Act toevoegen', `<form id="act-form" data-id="${act ? act.id : ''}">
      <div class="form-grid">
        <div class="field"><label for="act-start">Start</label><input id="act-start" name="start" type="time" value="${esc(act ? act.start : '')}"></div>
        <div class="field"><label for="act-end">Eind</label><input id="act-end" name="end" type="time" value="${esc(act ? act.end : '')}"></div>
      </div>
      <fieldset class="check-group"><legend>Artiesten in deze act</legend>${people.length ? people.map((p) => `<label><input type="checkbox" name="artist_ids" value="${p.artist_id}" ${ids.has(p.artist_id) ? 'checked' : ''}> ${esc(p.name)}</label>`).join('') : '<p class="helper">Nog geen artiesten op dit evenement.</p>'}</fieldset>
      <div class="field"><label for="act-name">Naam van de act</label><input id="act-name" name="name" value="${esc(act ? act.name : '')}" placeholder="Leeg laten: namen van de artiesten, bijv. Dwonji B2B HDN"></div>
      <div class="form-grid">
        <div class="field"><label for="act-stage">Stage</label><input id="act-stage" name="stage" value="${esc(act ? act.stage : '')}" placeholder="Main"></div>
        <div class="field"><label for="act-note">Opmerking</label><input id="act-note" name="note" value="${esc(act ? act.note : '')}"></div>
      </div></form>`,
    `<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="act-form">${act ? 'Opslaan' : 'Toevoegen'}</button>`);
  }

  function packSummary(pv) {
    const files = pv.attachments.map((a) => `<li>${ico(a.source === 'generated' ? 'pdf' : 'file')}<span>${esc(a.name)}</span><small>${size(a.size)}</small></li>`).join('');
    const links = pv.links.map((l) => `<li>${ico('link')}<span>${esc(l.name)}</span><small>link</small></li>`).join('');
    return `<div class="pack"><div class="pack-head"><strong>${pv.attachments.length} ${pv.attachments.length === 1 ? 'bijlage' : 'bijlagen'}${pv.links.length ? ` en ${pv.links.length} ${pv.links.length === 1 ? 'link' : 'links'}` : ''}</strong><span>${size(pv.total_size)}</span></div>
      ${files || links ? `<ul class="pack-list">${files}${links}</ul>` : '<p class="helper">Kies hierboven wat er mee moet.</p>'}
      ${pv.warnings.length ? `<ul class="pack-warn">${pv.warnings.map((w) => `<li>${ico('warn')}<span>${esc(w)}</span></li>`).join('')}</ul>` : ''}</div>`;
  }

  async function sendDialog() {
    const o = S.overview;
    window.__modal('Advancing versturen', '<div class="empty orb-loading"><moon-orb state="composing" size="32"></moon-orb>Pakket samenstellen…</div>');
    let pv;
    try {
      pv = await api(`/events/${o.event.id}/send-preview`, { method: 'POST', body: {} });
    } catch (error) {
      setDialogError(error.message);
      document.querySelector('#dialog .dialog-body .empty')?.remove();
      return;
    }
    const chosen = new Set(pv.items.map((i) => i.id));
    const body = `<form id="send-form" class="send-form">
      ${pv.sender ? `<p class="helper">Wordt verstuurd vanaf <strong>${esc(pv.sender)}</strong> via Outlook. Een kopie van de documenten komt in de evenementmap in OneDrive als die koppeling aan staat.</p>`
        : `<div class="notice notice-warn">${ico('warn')}<span>Nog geen verzendadres ingesteld. Stel het in bij Koppelingen → Advancing. Het pakket kun je hieronder al controleren.</span></div>`}
      <div class="form-grid">
        <div class="field"><label for="send-to">Aan</label><input id="send-to" name="to" value="${esc(pv.to.join(', '))}" placeholder="productie@venue.nl" required data-preview></div>
        <div class="field"><label for="send-cc">Cc</label><input id="send-cc" name="cc" value="${esc(pv.cc.join(', '))}" placeholder="optioneel" data-preview></div>
      </div>
      <div class="field"><label for="send-subject">Onderwerp</label><input id="send-subject" name="subject" value="${esc(pv.subject)}" required></div>
      <div class="field"><label for="send-message">Bericht</label><textarea id="send-message" name="message" rows="5">${esc(pv.message)}</textarea></div>
      <fieldset class="check-group"><legend>Meesturen</legend>${o.checklist.map((i) => `<label><input type="checkbox" name="items" value="${i.id}" ${chosen.has(i.id) ? 'checked' : ''} data-preview> ${esc(i.label)}${i.status === 'sent' ? ` <span class="badge">al verstuurd</span>` : i.status === 'na' ? ' <span class="badge">n.v.t.</span>' : ''}</label>`).join('')}</fieldset>
      <div id="send-preview">${packSummary(pv)}</div></form>`;
    window.__modal('Advancing versturen', body, `<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="send-form" ${pv.sender ? '' : 'disabled'}>${ico('send')} Versturen via Outlook</button>`);
  }

  function sendPayload(form) {
    const data = new FormData(form);
    return { to: data.get('to') || '', cc: data.get('cc') || '', subject: data.get('subject') || '', message: data.get('message') || '', items: data.getAll('items') };
  }

  let previewTimer = 0;
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      const form = document.querySelector('#send-form');
      const host = document.querySelector('#send-preview');
      if (!form || !host || !S.overview) return;
      try {
        const pv = await api(`/events/${S.overview.event.id}/send-preview`, { method: 'POST', body: sendPayload(form) });
        host.innerHTML = packSummary(pv);
        setDialogError('');
      } catch (error) { setDialogError(error.message); }
    }, 350);
  }

  // --- Opslaan ---------------------------------------------------------------

  function fields(form) {
    const out = {};
    for (const [key, value] of new FormData(form)) if (typeof value === 'string') out[key] = value;
    return out;
  }

  async function saveBooking(form, quiet = false) {
    const values = fields(form);
    const artist = {};
    const booking = {};
    Object.entries(values).forEach(([key, value]) => {
      if (key.startsWith('a_')) artist[key.slice(2)] = value;
      else if (key.startsWith('b_')) booking[key.slice(2)] = value;
    });
    if (S.booking.artist.masked) { delete artist.passport; delete artist.date_of_birth; }
    booking.artist = artist;
    S.booking = await api(`/bookings/${S.booking.id}`, { method: 'PATCH', body: booking });
    S.dirty = false;
    if (!quiet) {
      toast(S.booking.complete ? 'Opgeslagen. Advancing compleet.' : 'Opgeslagen.');
      render();
    }
  }

  async function saveTravel(form, quiet = false) {
    const v = fields(form);
    const kind = form.dataset.kind;
    let body;
    if (kind === 'flight') {
      const leg = (p) => ({ from: v[p + '_from'], to: v[p + '_to'], departure: v[p + '_departure'], arrival: v[p + '_arrival'], number: v[p + '_number'] });
      body = { flight: 'yes', flight_info: { tickets_booked: v.tickets_booked, booked_by: v.booked_by, price: v.price, notes: v.notes, inbound: leg('in'), outbound: leg('out') } };
    } else if (kind === 'hotel') {
      body = { hotel: 'yes', hotel_info: v };
    } else {
      body = { grounds: 'yes', ground_info: v };
    }
    S.booking = await api(`/bookings/${S.booking.id}`, { method: 'PATCH', body });
    S.dirty = false;
    if (!quiet) {
      toast('Opgeslagen.');
      location.hash = `event-${S.booking.event.id}-artist-${S.booking.id}`;
    }
  }

  async function saveArtist(form, quiet = false) {
    const values = fields(form);
    if (S.artist.masked) { delete values.passport; delete values.date_of_birth; }
    S.artist = await api(`/artists/${S.artist.id}`, { method: 'PATCH', body: values });
    S.dirty = false;
    if (!quiet) { toast('Opgeslagen.'); render(); }
  }

  async function saveEventInfo(form, quiet = false) {
    await api(`/events/${S.overview.event.id}`, { method: 'PATCH', body: fields(form) });
    S.dirty = false;
    if (!quiet) { toast('Gegevens opgeslagen.'); await reload(); }
  }

  const SAVERS = { 'booking-main': saveBooking, 'travel-form': saveTravel, 'artist-form': saveArtist, 'rider-form': saveArtist, 'event-info-form': saveEventInfo };

  async function autosave() {
    if (!S.dirty) return;
    const form = document.querySelector('#content form[data-guard]');
    if (form && SAVERS[form.id]) await SAVERS[form.id](form, true);
  }

  const FORMS = {
    ...SAVERS,
    async 'event-new-form'(form) {
      const created = await api('/events', { method: 'POST', body: fields(form) });
      closeDialog();
      toast('Evenement aangemaakt. De venue-checklist staat klaar.');
      location.hash = `event-${created.id}`;
    },
    async 'booking-form'(form) {
      const result = await api(`/events/${S.overview.event.id}/bookings`, { method: 'POST', body: fields(form) });
      closeDialog();
      toast('Artiest toegevoegd. Vul nu de gegevens aan.');
      location.hash = `event-${S.overview.event.id}-artist-${result.booking_id}`;
    },
    async 'act-form'(form) {
      const data = new FormData(form);
      const body = { name: data.get('name') || '', start: data.get('start') || '', end: data.get('end') || '', stage: data.get('stage') || '', note: data.get('note') || '', artist_ids: data.getAll('artist_ids') };
      const id = form.dataset.id;
      if (id) await api(`/acts/${id}`, { method: 'PATCH', body });
      else await api(`/events/${eventId()}/acts`, { method: 'POST', body });
      closeDialog();
      toast(id ? 'Act bijgewerkt.' : 'Act toegevoegd.');
      await reload();
    },
    async 'check-form'(form) {
      S.overview = await api(`/events/${S.overview.event.id}/checklist`, { method: 'POST', body: fields(form) });
      closeDialog();
      render();
    },
    async 'link-form'(form) {
      await api('/assets', { method: 'POST', body: { ...fields(form), owner_type: form.dataset.ownerType, owner_id: form.dataset.ownerId, kind: form.dataset.kind } });
      closeDialog();
      toast('Link opgeslagen.');
      await reload();
    },
    async 'artist-new-form'(form) {
      const artist = await api('/artists', { method: 'POST', body: fields(form) });
      closeDialog();
      location.hash = `artist-${artist.id}`;
    },
    async 'release-form'(form) {
      const id = form.dataset.id;
      await api(id ? `/releases/${id}` : '/releases', { method: id ? 'PATCH' : 'POST', body: fields(form) });
      closeDialog();
      toast(id ? 'Release bijgewerkt.' : 'Release toegevoegd.');
      await reload();
    },
    async 'event-note-form'(form) {
      S.notes = (await api(`/events/${S.overview.event.id}/notes`, { method: 'POST', body: fields(form) })).notes;
      render();
    },
    async 'send-form'(form) {
      const button = document.querySelector('#dialog button[type=submit]');
      if (button) { button.disabled = true; button.innerHTML = '<moon-orb state="composing" size="20"></moon-orb> Versturen…'; }
      try {
        const response = await api(`/events/${S.overview.event.id}/send`, { method: 'POST', body: sendPayload(form) });
        const { result, ...overview } = response;
        S.overview = overview;
        closeDialog();
        if (result.status === 'uncertain') toast(result.error || 'Verzending onzeker. Controleer Verzonden items in Outlook.', true);
        else toast('Aangenomen door Outlook. De checklist is bijgewerkt.');
        render();
      } catch (error) {
        setDialogError(error.message);
        if (button) { button.disabled = false; button.innerHTML = `${ico('send')} Versturen via Outlook`; }
      }
    },
  };

  async function handleSubmit(form) {
    const handler = FORMS[form.id];
    if (!handler) return false;
    if (!canEdit()) { toast('Je hebt alleen leesrechten.', true); return true; }
    await handler(form);
    return true;
  }

  // --- Acties ----------------------------------------------------------------

  const ACTIONS = {
    'new-event'() {
      window.__modal('Nieuw evenement', `<form id="event-new-form">
        <div class="field"><label for="ne-name">Naam *</label><input id="ne-name" name="name" required placeholder="Moonshine 10YRS"></div>
        <div class="form-grid"><div class="field"><label for="ne-date">Datum</label><input id="ne-date" name="date" type="date"></div>
        <div class="field"><label for="ne-doors">Deuren</label><input id="ne-doors" name="doors" type="time"></div></div>
        <div class="field"><label for="ne-venue">Venue</label><input id="ne-venue" name="venue" placeholder="Luxor Live, Arnhem"></div></form>`,
      '<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="event-new-form">Aanmaken</button>');
    },
    async 'add-booking'() {
      const roster = (await api('/artists')).artists;
      const booked = new Set(S.overview.bookings.map((b) => b.artist_id));
      const options = roster.filter((a) => !booked.has(a.id));
      window.__modal('Artiest toevoegen', `<form id="booking-form">
        <div class="field"><label for="booking-artist">Artiest</label><input id="booking-artist" name="name" list="artist-options" placeholder="Zoek in de artiesten of typ een nieuwe naam" autocomplete="off" required></div>
        <datalist id="artist-options">${options.map((a) => `<option value="${esc(a.name)}"></option>`).join('')}</datalist>
        <p class="helper">Een bekende artiest neemt zijn gegevens, riders en content mee. Een nieuwe naam maakt een nieuw profiel aan.</p></form>`,
      '<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="booking-form">Toevoegen</button>');
    },
    async 'remove-booking'() {
      const b = S.booking;
      if (!confirm(`${b.artist.name} van ${b.event.name} halen? Acts blijven staan; facturen bij deze boeking worden verwijderd. Het artiestenprofiel blijft bestaan.`)) return;
      await api(`/bookings/${b.id}`, { method: 'DELETE' });
      S.dirty = false;
      toast('Boeking verwijderd.');
      location.hash = `event-${b.event.id}`;
    },
    async 'add-act'(el) { await autosave(); actDialog(null, el.dataset.artist); },
    async 'edit-act'(el) { await autosave(); actDialog(currentActs().find((a) => a.id === el.dataset.id)); },
    async 'delete-act'(el) {
      const act = currentActs().find((a) => a.id === el.dataset.id);
      if (!confirm(`Act ${act ? act.name : ''} verwijderen?`)) return;
      S.overview = await api(`/acts/${el.dataset.id}`, { method: 'DELETE' });
      render();
    },
    async 'check-status'(el) {
      S.overview = await api(`/checklist/${el.dataset.id}`, { method: 'PATCH', body: { status: el.dataset.status } });
      render();
    },
    'add-check'() {
      window.__modal('Onderdeel toevoegen', '<form id="check-form"><div class="field"><label for="check-label">Wat moet er naar de venue?</label><input id="check-label" name="label" required placeholder="Bijv. lichtplot of merchandise-afspraken"></div></form>',
        '<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="check-form">Toevoegen</button>');
    },
    async 'delete-check'(el) {
      if (!confirm('Dit onderdeel van de checklist verwijderen?')) return;
      S.overview = await api(`/checklist/${el.dataset.id}`, { method: 'DELETE' });
      render();
    },
    'send-dialog'() { return sendDialog(); },
    async 'add-link'(el) {
      await autosave();
      window.__modal(`Link toevoegen: ${KIND[el.dataset.kind] || ''}`, `<form id="link-form" data-owner-type="${esc(el.dataset.ownerType)}" data-owner-id="${esc(el.dataset.ownerId)}" data-kind="${esc(el.dataset.kind)}">
        <div class="field"><label for="link-url">Link</label><input id="link-url" name="url" type="url" required placeholder="https://"></div>
        <div class="field"><label for="link-name">Naam (optioneel)</label><input id="link-name" name="name" placeholder="Bijv. EPK 2026 of persvideo Dekmantel"></div>
        <p class="helper">Handig voor grote video’s of mappen in WeTransfer, Dropbox of Google Drive. De link gaat mee in de mail naar de venue.</p></form>`,
      '<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="link-form">Opslaan</button>');
    },
    async 'delete-asset'(el) {
      if (!confirm('Dit bestand verwijderen? Een kopie in OneDrive blijft bewaard.')) return;
      await autosave();
      await api(`/assets/${el.dataset.id}`, { method: 'DELETE' });
      toast('Verwijderd.');
      await reload();
    },
    async 'sync-asset'(el) {
      await autosave();
      try { await api(`/assets/${el.dataset.id}/sync`, { method: 'POST' }); toast('Opgeslagen in OneDrive.'); } catch (error) { toast(error.message, true); }
      await reload();
    },
    async 'delete-event'() {
      const e = S.overview.event;
      if (!confirm(`${e.name} verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
      await api(`/events/${e.id}`, { method: 'DELETE' });
      S.dirty = false;
      toast('Evenement verwijderd.');
      location.hash = 'events';
    },
    'new-artist'() {
      window.__modal('Nieuwe artiest', '<form id="artist-new-form"><div class="field"><label for="na-name">Artiestennaam *</label><input id="na-name" name="name" required></div></form>',
        '<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="artist-new-form">Aanmaken</button>');
    },
    async 'delete-artist'() {
      if (!confirm(`${S.artist.name} verwijderen? Alle lokale bestanden van deze artiest worden verwijderd.`)) return;
      await api(`/artists/${S.artist.id}`, { method: 'DELETE' });
      S.dirty = false;
      toast('Artiest verwijderd.');
      location.hash = 'artists';
    },
    'insert-template'(el) {
      const area = document.querySelector(`#f-${el.dataset.key}`);
      if (!area) return;
      const template = el.dataset.key === 'tech_rider' ? TECH_TEMPLATE : HOSPITALITY_TEMPLATE;
      area.value = area.value.trim() ? area.value.trimEnd() + '\n\n' + template : template;
      S.dirty = true;
      area.focus();
    },
    async download(el) {
      await autosave();
      const response = await fetch(el.dataset.url, { headers: { 'X-CSRF-Token': window.__csrf } });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Downloaden is niet gelukt.');
      }
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = /filename\*=UTF-8''([^;]+)/.exec(disposition);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = match ? decodeURIComponent(match[1]) : 'moonshine.pdf';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    },
    async subpage(el) {
      await autosave();
      location.hash = `event-${S.booking.event.id}-artist-${S.booking.id}-${el.dataset.sub}`;
    },
    'new-release'() { releaseDialog(); },
    'edit-release'(el) { releaseDialog(S.releases.find((r) => r.id === el.dataset.id)); },
    async 'delete-release'(el) {
      const release = S.releases.find((r) => r.id === el.dataset.id);
      if (!confirm(`Release ${release ? release.title : ''} verwijderen?`)) return;
      await api(`/releases/${el.dataset.id}`, { method: 'DELETE' });
      await reload();
    },
  };

  function releaseDialog(r) {
    window.__modal(r ? 'Release bewerken' : 'Nieuwe release', `<form id="release-form" data-id="${r ? r.id : ''}">
      <div class="field"><label for="rl-title">Titel *</label><input id="rl-title" name="title" required value="${esc(r ? r.title : '')}"></div>
      <div class="form-grid"><div class="field"><label for="rl-artist">Artiest</label><input id="rl-artist" name="artist" value="${esc(r ? r.artist : '')}"></div>
      <div class="field"><label for="rl-date">Releasedatum</label><input id="rl-date" name="release_date" type="date" value="${esc(r ? r.release_date : '')}"></div></div>
      <div class="form-grid"><div class="field"><label for="rl-status">Status</label><select id="rl-status" name="status">${Object.entries(RELEASE).map(([k, [l]]) => `<option value="${k}" ${(r ? r.status : 'planned') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="rl-grid">LabelGrid-ID (optioneel)</label><input id="rl-grid" name="labelgrid_release_id" value="${esc(r ? r.labelgrid_release_id : '')}"></div></div>
      <div class="field"><label for="rl-notes">Notities</label><textarea id="rl-notes" name="notes" rows="3">${esc(r ? r.notes : '')}</textarea></div></form>`,
    `<button data-action="close-modal">Annuleren</button><button class="primary" type="submit" form="release-form">${r ? 'Opslaan' : 'Toevoegen'}</button>`);
  }

  async function handleClick(event) {
    const el = event.target.closest('[data-action],[data-href]');
    if (!el) return false;
    const inside = document.querySelector('#content')?.contains(el) || document.querySelector('#dialog')?.contains(el);
    if (!inside) return false;
    if (el.dataset.href && !el.dataset.action) {
      if (event.target.closest('a,button,input,select,label')) return false;
      if (!guard()) return true;
      location.hash = el.dataset.href;
      return true;
    }
    const action = ACTIONS[el.dataset.action];
    if (!action) return false;
    event.preventDefault();
    try { await action(el); } catch (error) { toast(error.message, true); }
    return true;
  }

  // --- Wijzigingen bewaken ---------------------------------------------------

  function guard() {
    if (!S.dirty) return true;
    if (confirm('Je hebt wijzigingen die nog niet zijn opgeslagen. Toch verlaten?')) { S.dirty = false; return true; }
    return false;
  }

  document.addEventListener('click', (event) => {
    if (!S.dirty) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link || link.closest('#dialog')) return;
    if (!guard()) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('beforeunload', (event) => { if (S.dirty) { event.preventDefault(); event.returnValue = ''; } });

  document.addEventListener('input', (event) => {
    const t = event.target;
    if (t.closest && t.closest('#content form[data-guard]')) S.dirty = true;
    if (t.matches && t.matches('[data-filter-rows]')) {
      const q = t.value.trim().toLowerCase();
      document.querySelectorAll('#content tr[data-search]').forEach((row) => { row.hidden = !!q && !row.dataset.search.includes(q); });
    }
  });

  document.addEventListener('change', async (event) => {
    const t = event.target;
    if (!t.matches) return;
    if (t.closest('#content form[data-guard]')) S.dirty = true;
    if (t.matches('select[data-yes-link]')) {
      const button = t.parentElement.querySelector('[data-action="subpage"]');
      if (button) button.hidden = t.value !== 'yes';
    }
    if (t.matches('#dialog [data-preview]')) schedulePreview();
    if (t.matches('input[type=file][data-upload]')) {
      const file = t.files && t.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { toast('Maximaal 20 MB per bestand. Zet grotere bestanden (video) als link.', true); t.value = ''; return; }
      const body = new FormData();
      body.append('owner_type', t.dataset.ownerType);
      body.append('owner_id', t.dataset.ownerId);
      body.append('kind', t.dataset.upload);
      body.append('file', file);
      const label = t.closest('label');
      if (label) { label.classList.add('busy'); label.insertAdjacentHTML('afterbegin', '<moon-orb state="weaving" size="20" label="Uploaden"></moon-orb>'); }
      try {
        await autosave();
        await api('/assets', { method: 'POST', body });
        toast(`${file.name} opgeslagen.`);
        await reload();
      } catch (error) {
        toast(error.message, true);
        label?.classList.remove('busy');
        label?.querySelector('moon-orb')?.remove();
        t.value = '';
      }
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const row = event.target.closest && event.target.closest('#content [data-href]');
    if (row && event.target === row && guard()) location.hash = row.dataset.href;
  });

  window.__events = {
    mount,
    handleClick,
    handleSubmit,
    reset() { S.dirty = false; },
    get route() { return S.raw; },
  };
})();
