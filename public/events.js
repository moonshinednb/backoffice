/* Moonshine events. Event-night workspace: advancing, artists, notes,
   documents, content and announce posts for one night, in one place.

   Split out of app.js because it is a genuinely different workflow: it is
   document-shaped rather than ledger-shaped, and keeping it separate stops
   app.js growing further. Exposes a single mount() the shell calls.
*/
(() => {
  'use strict';

  let events = [];
  let current = null;
  let notesCache = [];
  let syncState = { folder: null, files: [], drifted: [], busy: false };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const eur = (c) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
  const date = (v) => v ? new Date(v + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const api = (path, opts = {}) => {
    const headers = { 'X-CSRF-Token': window.__csrf, ...(opts.headers || {}) };
    if (opts.body && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    return fetch('/api' + path, { ...opts, headers }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Handeling mislukt.');
      return data;
    });
  };

  const statusBadge = (s) => {
    const map = { planning: ['In planning', 'amber'], confirmed: ['Bevestigd', 'lime'], live: ['Live', 'purple'], done: ['Afgelopen', 'blue'], cancelled: ['Geannuleerd', ''] };
    const [label, color] = map[s] || [s, ''];
    return `<span class="badge ${color}">${esc(label)}</span>`;
  };

  function listView(host, state) {
    const rows = events.map((e) => `
      <tr class="clickable" data-event="${esc(e.id)}">
        <td><div class="supplier"><div class="supplier-icon">${icon('folder')}</div>
          <div><strong>${esc(e.name)}</strong><small>${esc(e.venue || 'Locatie onbekend')}</small></div></div></td>
        <td>${date(e.date)}</td>
        <td>${statusBadge(e.status)}</td>
        <td>${e.slot_count} ${e.slot_count === 1 ? 'slot' : 'slots'} · ${e.artist_count} ${e.artist_count === 1 ? 'artiest' : 'artiesten'}</td>
        <td>${icon('chevron')}</td>
      </tr>`).join('');
    return header('Evenementen', 'Alles voor een avond op één plek', newEventButton()) +
      `<section class="card" id="event-results">${events.length ? `
        <div class="table-wrap"><table><thead><tr>
          <th>Evenement</th><th>Datum</th><th>Status</th><th>Omvang</th><th aria-label="Openen"></th>
        </tr></thead><tbody>${rows}</tbody></table></div>`
        : emptyState('Nog geen evenementen', 'Maak een avond aan om de programmering, artiesten en aankondigingen vast te leggen.', newEventButton(), 'folder')}
      </section>
      <p class="helper">Elk evenement wordt één map in OneDrive. Wat je hier opslaat is meteen vindbaar voor artiesten en agencies.</p>`;
  }

  function header(title, sub, actions) {
    return `<header class="page-title"><div><p class="eyebrow">Moonshine productie</p><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="row-actions">${actions || ''}</div></header>`;
  }
  function emptyState(head, sub, action, ico) {
    return `<div class="empty">${icon(ico || 'folder')}<strong>${esc(head)}</strong><p>${esc(sub)}</p>${action ? `<div>${action}</div>` : ''}</div>`;
  }
  function newEventButton() {
    return `<button class="primary" data-action="new-event">${icon('plus')} Nieuw evenement</button>`;
  }
  function icon(name) {
    const paths = {
      folder: 'M3 7V5a2 2 0 0 1 2-2h5l2 4h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
      chevron: 'M9 5l7 7-7 7', plus: 'M12 5v14 M5 12h14', upload: 'M12 16V3 M7 8l5-5 5 5 M3 15v5a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-5',
      download: 'M12 3v13 M7 11l5 5 5-5 M3 16v4h18v-4', check: 'M4 12l5 5L20 6',
      spark: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z', clock: 'M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
      mail: 'M3 5h18v14H3Z M3 5l9 7 9-7', edit: 'M16 3l5 5-12 12-6 1 1-6Z M13 6l5 5', close: 'M6 6l12 12 M6 18 18 6',
      info: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    };
    return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[name] || paths.folder}"/></svg>`;
  }

  function workspaceView(host, state) {
    const e = current;
    if (!e) return listView(host, state);
    const total = e.artists.reduce((s, a) => s + (a.fee || 0), 0);
    const unpaid = e.artists.filter((a) => !a.fee_paid).reduce((s, a) => s + (a.fee || 0), 0);
    const tabs = [
      ['advancing', 'Advancing'], ['artists', `Artiesten (${e.artists.length})`],
      ['content', `Content (${e.posts.length})`], ['notes', 'Notities'],
      ['docs', `Documenten (${e.documents.length})`], ['info', 'Gegevens'],
    ];
    const active = current.tab || 'advancing';
    return `<a class="text-link" href="#events" data-action="back-events">${icon('chevron')} Alle evenementen</a>` +
      header(e.name, `${date(e.date)}${e.venue ? ' · ' + e.venue : ''}`, `
        <button class="ghost" data-action="event-sync">${icon('upload')} Naar OneDrive</button>
        <button class="primary" data-action="event-save-all">${icon('check')} Opslaan</button>`) +
      `<div class="stats">
        ${stat('Status', statusBadge(e.status), e.doors ? 'Deuren ' + e.doors : 'Deuren onbekend')}
        ${stat('Gage', eur(total), unpaid ? eur(unpaid) + ' nog te betalen' : 'Alles betaald')}
        ${stat('Slots', e.advancing.length, 'Onderdelen in de avond')}
        ${stat('Capaciteit', e.capacity || '—', 'Toegestane bezoekers')}
      </div>` +
      syncBanner() +
      `<div class="tabs event-tabs">${tabs.map(([id, label]) =>
        `<button class="${active === id ? 'active' : ''}" data-event-tab="${id}">${esc(label)}</button>`).join('')}</div>` +
      `<section class="card" id="event-panel">${renderTab(active, e)}</section>`;
  }

  function stat(label, value, sub) {
    return `<article class="stat"><div class="stat-top">${esc(label)}${icon('clock')}</div><strong>${value}</strong><small>${esc(sub)}</small></article>`;
  }

  function syncBanner() {
    if (syncState.busy) return `<div class="notice">${icon('clock')} Bezig met synchroniseren…</div>`;
    if (syncState.drifted.length) {
      return `<div class="notice notice-warn">${icon('info')} De OneDrive-versie wijkt af op: ${esc(syncState.drifted.join(', '))}. Bekijk de map voordat je opnieuw opslaat.</div>`;
    }
    if (syncState.folder) return `<div class="notice">${icon('check')} Gepusht naar OneDrive: <strong>${esc(syncState.folder)}</strong> · ${syncState.files.length} bestanden.</div>`;
    return '';
  }

  function renderTab(tab, e) {
    if (tab === 'advancing') return advancingTab(e);
    if (tab === 'artists') return artistsTab(e);
    if (tab === 'content') return contentTab(e);
    if (tab === 'notes') return notesTab(e);
    if (tab === 'docs') return docsTab(e);
    return infoTab(e);
  }

  function advancingTab(e) {
    const rows = e.advancing.map((s, i) => `
      <tr>
        <td><input name="slot_start_${i}" value="${esc(s.start)}" placeholder="23:00" aria-label="Start ${i + 1}"></td>
        <td><input name="slot_end_${i}" value="${esc(s.end)}" placeholder="00:00" aria-label="Eind ${i + 1}"></td>
        <td><input name="slot_act_${i}" value="${esc(s.act)}" placeholder="Artiest" aria-label="Act ${i + 1}" required></td>
        <td><input name="slot_note_${i}" value="${esc(s.note)}" placeholder="Opmerking" aria-label="Opmerking ${i + 1}"></td>
        <td><button class="icon-btn ghost" data-remove-slot="${i}" aria-label="Slot verwijderen">${icon('close')}</button></td>
      </tr>`).join('');
    const total = e.advancing.reduce((s, x) => s + (x.end && x.start ? minutes(x.end) - minutes(x.start) : 0), 0);
    return `<div class="card-head"><div><h2>Advancing</h2><p>De volgorde van de avond. Dit is wat de dj en de deur zien.</p></div>
        <button class="small" data-action="add-slot">${icon('plus')} Slot toevoegen</button></div>
      <div class="table-wrap"><table><thead><tr><th>Start</th><th>Eind</th><th>Act</th><th>Opmerking</th><th></th></tr></thead>
      <tbody id="advancing-rows">${rows || `<tr><td colspan="5" class="helper">Nog geen slots. Voeg het eerste onderdeel toe.</td></tr>`}</tbody></table></div>
      ${total > 0 ? `<p class="helper">Totale programmering: ${Math.floor(total / 60)} uur ${total % 60} min.</p>` : ''}
      <p class="helper">Tijden zijn tekstvelden, zodat een avond over middernacht gewoon 23:00 → 02:00 kan lopen.</p>`;
  }
  function minutes(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || '').trim());
    return m ? (+m[1]) * 60 + (+m[2]) : 0;
  }

  function artistsTab(e) {
    const rows = e.artists.map((a, i) => `
      <tr>
        <td><input name="artist_name_${i}" value="${esc(a.name)}" aria-label="Naam ${i + 1}" required></td>
        <td><input name="artist_genre_${i}" value="${esc(a.genre)}" placeholder="Genre" aria-label="Genre ${i + 1}"></td>
        <td class="amount"><input name="artist_fee_${i}" value="${((a.fee || 0) / 100).toFixed(2)}" inputmode="decimal" aria-label="Gage ${i + 1}"></td>
        <td><label class="inline-check"><input name="artist_paid_${i}" type="checkbox" ${a.fee_paid ? 'checked' : ''}> Betaald</label></td>
        <td><label class="inline-check"><input name="artist_rider_${i}" type="checkbox" ${a.rider_done ? 'checked' : ''}> Rider</label></td>
        <td><button class="icon-btn ghost" data-remove-artist="${i}" aria-label="${esc(a.name)} verwijderen">${icon('close')}</button></td>
      </tr>`).join('');
    return `<div class="card-head"><div><h2>Artiesten</h2><p>Wie speelt, wat ze krijgen en wat nog ontbreekt.</p></div>
        <button class="small" data-action="add-artist">${icon('plus')} Artiest toevoegen</button></div>
      <div class="table-wrap"><table><thead><tr><th>Naam</th><th>Genre</th><th class="amount">Gage (€)</th><th>Betaling</th><th>Rider</th><th></th></tr></thead>
      <tbody id="artist-rows">${rows || `<tr><td colspan="6" class="helper">Nog geen artiesten.</td></tr>`}</tbody></table></div>
      <p class="helper">Rider afvinken zodra de technische rider van de artiest binnen is. Dit volgt de OneDrive-map, zodat je ziet wat er nog ontbreekt.</p>`;
  }

  function contentTab(e) {
    const rows = e.posts.map((p, i) => `
      <tr>
        <td><select name="post_kind_${i}" aria-label="Soort ${i + 1}">
          <option value="announce" ${p.kind === 'announce' ? 'selected' : ''}>Aankondiging artiest</option>
          <option value="content" ${p.kind === 'content' ? 'selected' : ''}>Content</option>
        </select></td>
        <td><input name="post_title_${i}" value="${esc(p.title)}" aria-label="Titel ${i + 1}"></td>
        <td><textarea name="post_body_${i}" rows="2" aria-label="Tekst ${i + 1}">${esc(p.body)}</textarea></td>
        <td><select name="post_channel_${i}" aria-label="Kanaal ${i + 1}">
          ${['instagram', 'facebook', 'site'].map((c) => `<option value="${c}" ${p.channel === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select></td>
        <td><button class="icon-btn ghost" data-remove-post="${i}" aria-label="Verwijderen">${icon('close')}</button></td>
      </tr>`).join('');
    return `<div class="card-head"><div><h2>Content & aankondigingen</h2><p>Teksten klaar om te delen. Van concept naar geplaatst.</p></div>
        <button class="small" data-action="add-post">${icon('plus')} Tekst toevoegen</button></div>
      <div class="table-wrap"><table><thead><tr><th>Soort</th><th>Titel</th><th>Tekst</th><th>Kanaal</th><th></th></tr></thead>
      <tbody id="post-rows">${rows || `<tr><td colspan="5" class="helper">Nog geen teksten.</td></tr>`}</tbody></table></div>
      <p class="helper">Teksten worden bewaard en met de avond meegestuurd naar OneDrive. Ze worden niet automatisch gepubliceerd.</p>`;
  }

  function notesTab() {
    const rows = notesCache.map((n) => `<li><span>${esc(n.body)}</span><time datetime="${esc(n.created)}">${date(n.created)}</time></li>`).join('');
    return `<div class="card-head"><div><h2>Notities</h2><p>Alles wat je niet mag vergeten tijdens de opbouw.</p></div></div>
      <form id="event-note-form" class="inline-form">
        <label class="visually-hidden" for="event-note">Nieuwe notitie</label>
        <input id="event-note" name="body" placeholder="Bijv. tweede monitor defect" required>
        <button class="primary" type="submit">Toevoegen</button>
      </form>
      ${notesCache.length ? `<ul class="note-list">${rows}</ul>` : '<p class="helper">Nog geen notities.</p>'}`;
  }

  function docsTab(e, state) {
    const linked = e.documents.map((d) => {
      const doc = (state.documents || []).find((x) => x.id === d.document_id);
      return `<tr><td>${esc(doc ? doc.name : d.document_id)}</td><td>${esc(d.label || '—')}</td>
        <td><button class="small" data-event-unlink="${esc(d.id)}">Ontkoppelen</button></td></tr>`;
    }).join('');
    const available = (state.documents || []).filter((d) => !e.documents.some((x) => x.document_id === d.id));
    return `<div class="card-head"><div><h2>Documenten bij deze avond</h2><p>Contracten, facturen en bonnen die bij dit evenement horen.</p></div></div>
      ${linked ? `<div class="table-wrap"><table><thead><tr><th>Bestand</th><th>Label</th><th></th></tr></thead><tbody>${linked}</tbody></table></div>`
        : '<p class="helper">Nog geen documenten gekoppeld.</p>'}
      <form id="event-doc-form" class="inline-form">
        <label class="visually-hidden" for="event-doc">Document kiezen</label>
        <select id="event-doc" name="document_id" required>
          <option value="">Kies een document…</option>
          ${available.map((d) => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}
        </select>
        <input name="label" placeholder="Label (optioneel)">
        <button class="primary" type="submit">Koppelen</button>
      </form>`;
  }

  function infoTab(e) {
    const f = (name, label, value, type, extra) =>
      `<div class="field"><label for="ev-${name}">${esc(label)}</label><input id="ev-${name}" name="${name}" type="${type || 'text'}" value="${esc(value ?? '')}" ${extra || ''}></div>`;
    return `<form id="event-info-form">
      <div class="form-grid">
        ${f('name', 'Naam', e.name, 'text', 'required')}
        ${f('date', 'Datum', e.date, 'date')}
        ${f('venue', 'Locatie', e.venue)}
        ${f('doors', 'Deuren', e.doors, 'text', 'placeholder="23:00"')}
        ${f('capacity', 'Capaciteit', e.capacity || '', 'number', 'min="0"')}
        <div class="field"><label for="ev-status">Status</label><select id="ev-status" name="status">
          ${['planning', 'confirmed', 'live', 'done', 'cancelled'].map((s) =>
            `<option value="${s}" ${e.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select></div>
      </div>
      <div class="field"><label for="ev-rider">Technische rider</label>
        <textarea id="ev-rider" name="rider" rows="6" placeholder="Licht, geluid, staging, contacten…">${esc(e.rider)}</textarea></div>
      <button class="primary" type="submit">Gegevens opslaan</button>
    </form>`;
  }

  function collect() {
    const rows = (id, prefix, fields) => [...document.querySelectorAll(`#${id} tr`)].map((tr, i) => {
      const out = {};
      for (const f of fields) {
        const el = tr.querySelector(`[name="${prefix}${f}_${i}"]`);
        out[f] = el ? el.value : '';
      }
      return out;
    });
    const checkboxes = (id, prefix) => [...document.querySelectorAll(`#${id} [name^="${prefix}"]`)];
    return {
      slots: rows('advancing-rows', 'slot', ['start', 'end', 'act', 'note']).filter((s) => s.act),
      artists: rows('artist-rows', 'artist', ['name', 'genre', 'fee']).filter((a) => a.name).map((a, i) => {
        const paid = document.querySelector(`[name="artist_paid_${i}"]`);
        const rider = document.querySelector(`[name="artist_rider_${i}"]`);
        return { ...a, fee_paid: paid && paid.checked ? 1 : 0, rider_done: rider && rider.checked ? 1 : 0 };
      }),
      posts: rows('post-rows', 'post', ['kind', 'title', 'body', 'channel']).filter((p) => p.title || p.body),
    };
  }

  async function loadNotes() {
    if (!current) return;
    const r = await api(`/events/${current.id}/notes`);
    notesCache = r.notes || [];
  }

  async function open(id, tab) {
    current = await api(`/events/${id}`);
    current.tab = tab || 'advancing';
    syncState = { folder: null, files: [], drifted: [], busy: false };
    if (current.tab === 'notes') await loadNotes();
    render();
  }

  async function saveAll() {
    if (!current) return;
    const data = collect();
    await api(`/events/${current.id}/advancing`, { method: 'PUT', body: { slots: data.slots } });
    await api(`/events/${current.id}/artists`, { method: 'PUT', body: { artists: data.artists } });
    await api(`/events/${current.id}/posts`, { method: 'PUT', body: { posts: data.posts } });
    window.__toast('Evenement opgeslagen.');
    await open(current.id, current.tab);
  }

  async function sync() {
    if (!current) return;
    syncState.busy = true;
    render();
    try {
      const r = await api(`/events/${current.id}/push`, { method: 'POST', body: {} });
      syncState = { folder: r.folder, files: r.files || [], drifted: [], busy: false };
      window.__toast('Naar OneDrive gestuurd.');
    } catch (e) {
      syncState.busy = false;
      window.__toast(e.message, true);
    }
    render();
  }

  async function pullCheck() {
    if (!current) return;
    try {
      const r = await api(`/events/${current.id}/pull`, { method: 'POST', body: {} });
      if (r.exists) {
        syncState.folder = r.folder;
        syncState.files = r.files || [];
        syncState.drifted = r.drifted || [];
        if (syncState.drifted.length) window.__toast('OneDrive wijkt af. Controleer de map.', true);
      } else {
        window.__toast('Nog geen map in OneDrive voor deze avond.');
      }
      render();
    } catch (e) { window.__toast(e.message, true); }
  }

  function render() {
    const host = document.querySelector('#content');
    if (!host) return;
    host.innerHTML = current ? workspaceView(host, window.__state) : listView(host, window.__state);
  }

  async function handleAction(action, el) {
    switch (action) {
      case 'new-event': return openNew();
      case 'back-events': current = null; render(); window.location.hash = 'events'; return;
      case 'add-slot': return addSlotRow();
      case 'add-artist': return addArtistRow();
      case 'add-post': return addPostRow();
      case 'event-save-all': return saveAll();
      case 'event-sync': return sync();
      case 'event-check-sync': return pullCheck();
    }
  }

  function openNew() {
    window.__modal('Nieuw evenement', `
      <form id="new-event-form">
        <div class="field"><label for="ne-name">Naam</label><input id="ne-name" name="name" required placeholder="Zaterdagnacht 14 november"></div>
        <div class="form-grid">
          <div class="field"><label for="ne-date">Datum</label><input id="ne-date" name="date" type="date" required></div>
          <div class="field"><label for="ne-venue">Locatie</label><input id="ne-venue" name="venue" value="Moonshine"></div>
        </div>
        <p class="helper">Je kunt later de programmering, artiesten, content en documenten toevoegen.</p>
      </form>`,
      `<button data-action="close-modal" class="ghost">Annuleren</button><button class="primary" type="submit" form="new-event-form">Aanmaken</button>`);
  }

  async function addSlotRow() {
    const body = document.querySelector('#advancing-rows');
    if (!body) return;
    const i = document.querySelectorAll('#advancing-rows tr').length;
    body.insertAdjacentHTML('beforeend', `<tr>
      <td><input name="slot_start_${i}" placeholder="23:00" aria-label="Start ${i + 1}"></td>
      <td><input name="slot_end_${i}" placeholder="00:00" aria-label="Eind ${i + 1}"></td>
      <td><input name="slot_act_${i}" placeholder="Artiest" aria-label="Act ${i + 1}" required></td>
      <td><input name="slot_note_${i}" placeholder="Opmerking" aria-label="Opmerking ${i + 1}"></td>
      <td><button class="icon-btn ghost" data-remove-slot="${i}" aria-label="Slot verwijderen">${icon('close')}</button></td></tr>`);
  }
  async function addArtistRow() {
    const body = document.querySelector('#artist-rows');
    if (!body) return;
    const i = document.querySelectorAll('#artist-rows tr').length;
    body.insertAdjacentHTML('beforeend', `<tr>
      <td><input name="artist_name_${i}" aria-label="Naam ${i + 1}" required></td>
      <td><input name="artist_genre_${i}" placeholder="Genre" aria-label="Genre ${i + 1}"></td>
      <td class="amount"><input name="artist_fee_${i}" value="0.00" inputmode="decimal" aria-label="Gage ${i + 1}"></td>
      <td><label class="inline-check"><input name="artist_paid_${i}" type="checkbox"> Betaald</label></td>
      <td><label class="inline-check"><input name="artist_rider_${i}" type="checkbox"> Rider</label></td>
      <td><button class="icon-btn ghost" data-remove-artist="${i}" aria-label="Verwijderen">${icon('close')}</button></td></tr>`);
  }
  async function addPostRow() {
    const body = document.querySelector('#post-rows');
    if (!body) return;
    const i = document.querySelectorAll('#post-rows tr').length;
    body.insertAdjacentHTML('beforeend', `<tr>
      <td><select name="post_kind_${i}" aria-label="Soort ${i + 1}"><option value="announce">Aankondiging artiest</option><option value="content">Content</option></select></td>
      <td><input name="post_title_${i}" aria-label="Titel ${i + 1}"></td>
      <td><textarea name="post_body_${i}" rows="2" aria-label="Tekst ${i + 1}"></textarea></td>
      <td><select name="post_channel_${i}" aria-label="Kanaal ${i + 1}"><option>instagram</option><option>facebook</option><option>site</option></select></td>
      <td><button class="icon-btn ghost" data-remove-post="${i}" aria-label="Verwijderen">${icon('close')}</button></td></tr>`);
  }

  async function handleSubmit(form) {
    if (form.id === 'new-event-form') {
      const data = Object.fromEntries(new FormData(form));
      const created = await api('/events', { method: 'POST', body: data });
      window.__closeModal();
      current = created;
      current.tab = 'advancing';
      syncState = { folder: null, files: [], drifted: [], busy: false };
      render();
      window.__toast('Evenement aangemaakt.');
      return true;
    }
    if (form.id === 'event-note-form') {
      const data = Object.fromEntries(new FormData(form));
      await api(`/events/${current.id}/notes`, { method: 'POST', body: data });
      await loadNotes();
      render();
      return true;
    }
    if (form.id === 'event-doc-form') {
      const data = Object.fromEntries(new FormData(form));
      await api(`/events/${current.id}/documents`, { method: 'POST', body: data });
      current = await api(`/events/${current.id}`);
      render();
      return true;
    }
    if (form.id === 'event-info-form') {
      const data = Object.fromEntries(new FormData(form));
      current = await api(`/events/${current.id}`, { method: 'PATCH', body: data });
      current.tab = 'info';
      render();
      window.__toast('Gegevens opgeslagen.');
      return true;
    }
    return false;
  }

  async function handleClick(el) {
    const data = el.dataset;
    if (data.event) return open(data.event);
    if (data.eventTab) {
      current.tab = data.eventTab;
      if (current.tab === 'notes') await loadNotes();
      return render();
    }
    if (data.removeSlot !== undefined) { el.closest('tr').remove(); return; }
    if (data.removeArtist !== undefined) { el.closest('tr').remove(); return; }
    if (data.removePost !== undefined) { el.closest('tr').remove(); return; }
    if (data.eventUnlink) {
      await api(`/events/${current.id}/documents`, { method: 'DELETE', body: { id: data.eventUnlink } });
      current = await api(`/events/${current.id}`);
      return render();
    }
    if (data.action) return handleAction(data.action, el);
  }

  async function load() {
    const r = await api('/events');
    events = r.events || [];
  }

  window.__events = {
    mount: async (hash) => {
      if (hash === 'events' || hash === 'event') {
        await load();
        current = null;
        render();
        return true;
      }
      if (hash && hash.startsWith('event-')) {
        await load();
        await open(hash.slice(6));
        return true;
      }
      return false;
    },
    // Called by the shell after a full state refresh so the panel stays live.
    refresh: async () => { if (current) { current = await api(`/events/${current.id}`); render(); } },
    list: async () => { await load(); },
    handleClick, handleSubmit, handleAction,
    get current() { return current; },
    reset() { current = null; notesCache = []; syncState = { folder: null, files: [], drifted: [], busy: false }; },
  };
})();