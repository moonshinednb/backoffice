# Graph Report - backoffice  (2026-11-04)

## Corpus Check
- 210 files · ~123,283 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1923 nodes · 6381 edges · 101 communities (61 shown, 40 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 521 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `91d269fb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- body
- Frontend Auth Context
- queue.py
- rules.py
- require
- Event.tsx
- Frontend Dependencies
- EventChecklist.tsx
- useToast
- Docker Compose Setup
- production/models.py
- Work.tsx
- Accounting and Invoice Models
- ApiTests
- core/views.py
- graph.py
- chat.py
- people.py
- requests.py
- planning/views.py
- feedback/views.py
- production/services.py
- TypeScript Config
- Django App Configs
- voyages.py
- promo/services.py
- django_db
- connect.sh
- Frontend Translations
- set_setting
- Security Headers Middleware
- HttpError
- Docker Backup Script
- JS Type Declarations
- versions-lib.sh
- Backend-apps
- HttpError
- ssh.sh
- Moonshine Backoffice
- finance/views.py
- production/models.py
- odoo.py
- Event
- core/models.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- Projectkaart Moonshine Backoffice
- planning/services.py
- pwa.tsx
- Feedback.tsx
- promo/views.py
- Showday.tsx
- steps.py
- django_db_models_deletion
- meetings/services.py
- import_track_feedback.py
- Loading
- notify.py
- Release
- audit
- run_worker.py
- settings
- hashlib
- production/migrations/0001_initial.py
- 0003_seed_release_steps.py
- restore.sh
- PlanningTests
- django_conf
- Ontwerpregels Moonshine Backoffice
- 0011_venue_contacts.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 167 edges
2. `api()` - 135 edges
3. `audit()` - 115 edges
4. `Icon()` - 110 edges
5. `HttpError` - 93 edges
6. `actor()` - 92 edges
7. `body()` - 89 edges
8. `post()` - 79 edges
9. `Loading()` - 69 edges
10. `useCanEdit()` - 66 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Structuur` --references--> `PageTitle()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Iconen en beweging` --references--> `Orb()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py

## Import Cycles
- None detected.

## Communities (101 total, 40 thin omitted)

### Community 0 - "body"
Cohesion: 0.26
Nodes (13): body(), contact_update(), crew_update(), event_step_update(), guest_update(), update_act(), update_artist(), update_booking() (+5 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.05
Nodes (66): ApiError, Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth() (+58 more)

### Community 2 - "queue.py"
Cohesion: 0.18
Nodes (11): Stack, sync_todo(), Job, Meta, Schedule, claim_next(), handlers(), periodic() (+3 more)

### Community 3 - "rules.py"
Cohesion: 0.05
Nodes (39): DesignRulesTests, files(), hits(), parse_date(), _Canvas, _char_width(), _clean(), _pdf_string() (+31 more)

### Community 4 - "require"
Cohesion: 0.09
Nodes (53): actor(), require(), labelgrid_pull(), LabelStatement, Meta, add_act(), add_booking(), add_check() (+45 more)

### Community 5 - "Event.tsx"
Cohesion: 0.07
Nodes (76): api(), download(), size(), Icon(), Empty(), MoreMenu(), useAction(), save() (+68 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (47): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, three@^0.180.0 (+39 more)

### Community 7 - "EventChecklist.tsx"
Cohesion: 0.16
Nodes (18): CONTENT_STATUS, done(), KIND, MyWork(), People(), useMyWork(), Work, WorkItem (+10 more)

### Community 8 - "useToast"
Cohesion: 0.13
Nodes (33): BackLink(), Artist, ArtistPage(), save(), uploadPhoto(), Rider(), Row, BookingPage() (+25 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.15
Nodes (15): queue(), act_create(), act_dict(), act_remove(), act_state(), act_update(), _artist(), _book() (+7 more)

### Community 11 - "Work.tsx"
Cohesion: 0.06
Nodes (62): saveBlob(), eur(), shortDate(), stamp(), locale(), Tabs(), AdminLayout(), IntegrationsPage() (+54 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (29): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+21 more)

### Community 14 - "core/views.py"
Cohesion: 0.16
Nodes (15): LoginAttempt, audit_log(), check_origin(), connections(), dashboard(), do_login(), do_logout(), get_settings() (+7 more)

### Community 15 - "graph.py"
Cohesion: 0.10
Nodes (23): copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload(), _ensure_folder() (+15 more)

### Community 16 - "chat.py"
Cohesion: 0.13
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "people.py"
Cohesion: 0.11
Nodes (24): download_item(), crew_from_lineup(), CrewMember, Meta, Guest, Meta, VenueContact, Meta (+16 more)

### Community 18 - "requests.py"
Cohesion: 0.22
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.19
Nodes (10): _apply(), calendar(), content(), content_dict(), create_content(), delete_content(), outlook_create(), outlook_remove() (+2 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.13
Nodes (10): comment(), create(), delete(), detail(), review(), stream(), _track(), tracks() (+2 more)

### Community 21 - "production/services.py"
Cohesion: 0.11
Nodes (37): Artist, Meta, Asset, Meta, act_dict(), advancing(), archive_sent(), artist_create() (+29 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.20
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "promo/services.py"
Cohesion: 0.06
Nodes (34): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), spa(), PasswordReset, digest() (+26 more)

### Community 26 - "django_db"
Cohesion: 0.08
Nodes (11): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+3 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "set_setting"
Cohesion: 0.08
Nodes (14): set_setting(), parse_xlsx(), _plus(), PeopleTests, sample_xlsx(), VenueContactTests, DriveTreeTests, EventFilesTests (+6 more)

### Community 31 - "HttpError"
Cohesion: 0.07
Nodes (28): mark_read(), reset(), change_password(), create_task(), create_user(), save_settings(), _task_fields(), test_connection() (+20 more)

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "Backend-apps"
Cohesion: 0.17
Nodes (7): Backend-apps, send_mail(), UncertainSend, asset_content(), asset_drive_path(), add_assets(), sync_asset()

### Community 52 - "HttpError"
Cohesion: 0.15
Nodes (14): add_action(), board(), create(), delete_action(), detail(), _err(), extract(), _meeting() (+6 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "finance/views.py"
Cohesion: 0.12
Nodes (15): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+7 more)

### Community 56 - "production/models.py"
Cohesion: 0.11
Nodes (19): Command, stamp(), js(), when(), Act, Booking, Meta, Event (+11 more)

### Community 57 - "odoo.py"
Cohesion: 0.31
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "Event"
Cohesion: 0.15
Nodes (11): Task, Meta, worked_by(), done_this_month(), entity_of(), focus(), items_for(), my_work() (+3 more)

### Community 59 - "core/models.py"
Cohesion: 0.08
Nodes (18): Notification, Meta, uid(), User, AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests (+10 more)

### Community 60 - "drive.py"
Cohesion: 0.10
Nodes (21): drive_item(), archive_past(), asset_section(), conf(), enabled(), event_base(), event_cover(), event_files() (+13 more)

### Community 61 - "Moonshine Backoffice: werkafspraken voor Claude"
Cohesion: 0.25
Nodes (7): Code, graphify, Moonshine Backoffice: werkafspraken voor Claude, Productie, Verbinden vanuit een cloud-sessie, Versies en terugrollen, Werkwijze bij wijzigingen

### Community 62 - "Moonshine Backoffice — UX-review, 11 oktober 2026"
Cohesion: 0.29
Nodes (6): Hersteld, Moonshine Backoffice — UX-review, 11 oktober 2026, Referenties en ontwerpkeuze, Verificatie, Vervolg: homepage volgens aangeleverde referentie, Vervolgpunten

### Community 63 - "Moonshine: OpenSign en promomailer"
Cohesion: 0.33
Nodes (5): Aanbevolen volgorde, Controles die we moeten toevoegen, Moonshine: OpenSign en promomailer, OpenSign: technisch passend, betaalde API nodig, Promomailer: goed te integreren

### Community 64 - "Functionele en beveiligingsreview"
Cohesion: 0.33
Nodes (5): Functionaliteit en grenzen, Functionele en beveiligingsreview, Operationele open punten, Verholpen, Verificatie

### Community 65 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.29
Nodes (6): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, LegacyRedirect()

### Community 66 - "planning/services.py"
Cohesion: 0.15
Nodes (16): OutlookLink, Meta, appt_kind(), _box(), check(), _day(), enabled(), _graph() (+8 more)

### Community 67 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

### Community 68 - "Feedback.tsx"
Cohesion: 0.13
Nodes (24): Orb(), DriveButton(), avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade() (+16 more)

### Community 69 - "promo/views.py"
Cohesion: 0.13
Nodes (18): add_contact(), campaign(), _campaign(), campaigns(), contacts(), create_campaign(), delete_campaign(), delete_contact() (+10 more)

### Community 70 - "Showday.tsx"
Cohesion: 0.36
Nodes (8): longDate(), useOverview(), Guest, isShowNight(), night(), nowMinutes(), People, ShowdayPage()

### Community 71 - "steps.py"
Cohesion: 0.14
Nodes (17): attention(), EventStep, Meta, _active(), auto_check(), due(), event_steps(), make_task() (+9 more)

### Community 72 - "django_db_models_deletion"
Cohesion: 0.11
Nodes (9): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+1 more)

### Community 74 - "meetings/services.py"
Cohesion: 0.07
Nodes (25): Command, Action, Meta, Meeting, Meta, action_dict(), create(), extract() (+17 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.08
Nodes (22): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+14 more)

### Community 79 - "Loading"
Cohesion: 0.10
Nodes (61): asDate(), dayNumber(), euroInput(), fullDate(), monthShort(), today(), Badge(), ErrorBox() (+53 more)

### Community 80 - "notify.py"
Cohesion: 0.15
Nodes (12): AuditLog, Meta, also(), assigned(), deadlines(), done(), involved(), notifications() (+4 more)

### Community 81 - "Release"
Cohesion: 0.18
Nodes (11): next_catalog(), Release, Meta, ReleaseStep, Meta, release_dict(), release_save(), seed_steps() (+3 more)

### Community 82 - "audit"
Cohesion: 0.25
Nodes (11): audit(), ChecklistItem, Meta, act_delete(), checklist_add(), checklist_delete(), checklist_update(), event_create() (+3 more)

### Community 84 - "settings"
Cohesion: 0.07
Nodes (29): Setting, save_secrets(), secret_values(), settings(), bank(), opensign(), outlook(), test_connection() (+21 more)

### Community 100 - "django_conf"
Cohesion: 0.14
Nodes (5): Migration, Migration, Migration, Migration, Migration

### Community 101 - "Ontwerpregels Moonshine Backoffice"
Cohesion: 0.22
Nodes (8): Componenten (v1.6, `system.css` onderaan), Iconen en beweging, Kleur, Mobiel, Ontwerpregels Moonshine Backoffice, Structuur, Tekst, Typografie

### Community 103 - "0011_venue_contacts.py"
Cohesion: 0.28
Nodes (4): Migration, move_contacts(), Migration, solo_acts()

## Knowledge Gaps
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend (frontend/src)` connect `Projectkaart Moonshine Backoffice` to `production/services.py`, `EventChecklist.tsx`?**
  _High betweenness centrality (0.359) - this node is a cross-community bridge._
- **Are the 84 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 84 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.048539518900343644 - nodes in this community are weakly interconnected._
- **Why does `advancing()` connect `production/services.py` to `Projectkaart Moonshine Backoffice`, `production/models.py`, `audit`, `Backend-apps`, `production/models.py`?**
  _High betweenness centrality (0.342) - this node is a cross-community bridge._
- **Should `rules.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05153153153153153 - nodes in this community are weakly interconnected._
- **Why does `WorkRow()` connect `EventChecklist.tsx` to `Projectkaart Moonshine Backoffice`, `Work.tsx`, `Event.tsx`, `Loading`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.0855094726062468 - nodes in this community are weakly interconnected._