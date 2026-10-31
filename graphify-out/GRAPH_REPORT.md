# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 173 files · ~93,598 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1507 nodes · 4845 edges · 99 communities (55 shown, 44 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 370 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `99a4dc7c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Label.tsx
- Frontend Dependencies
- django_db
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Work.tsx
- Accounting and Invoice Models
- Notifications and API Tests
- providers.py
- Promo Mailing
- User
- Calendar.tsx
- graph.py
- Events.tsx
- body
- planning/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- finance/views.py
- import_legacy.py
- connect.sh
- Frontend Translations
- claude.py
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- settings
- ssh.sh
- Moonshine Backoffice
- 0003_seed_release_steps.py
- django_db_models_deletion
- providers.py
- actor
- feedback/views.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- planning/services.py
- settings
- api
- meetings/views.py
- LegacyScryptHasher
- audit
- django_conf
- MissingTests
- test_feedback.py
- Feedback.tsx
- Release
- Asset
- feedback/services.py
- Event
- Projectkaart Moonshine Backoffice
- core/migrations/0001_initial.py
- 0005_staff_data.py
- send_mail
- MeetingTests
- finance/migrations/0001_initial.py
- planning/migrations/0001_initial.py
- 0005_voyages.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 132 edges
2. `api()` - 104 edges
3. `Icon()` - 89 edges
4. `audit()` - 88 edges
5. `HttpError` - 74 edges
6. `body()` - 73 edges
7. `actor()` - 67 edges
8. `post()` - 65 edges
9. `useToast()` - 56 edges
10. `Loading()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `done()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py

## Import Cycles
- None detected.

## Communities (99 total, 44 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.18
Nodes (24): act_dict(), advancing(), archive_sent(), artist_dict(), artist_get(), artist_list(), asset_dict(), asset_drive_path() (+16 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.08
Nodes (38): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+30 more)

### Community 2 - "queue.py"
Cohesion: 0.11
Nodes (14): Stack, safe_error(), Command, Job, Meta, Schedule, claim_next(), handlers() (+6 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (37): Backend-apps, _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table() (+29 more)

### Community 4 - "require"
Cohesion: 0.11
Nodes (34): require(), labelgrid_pull(), LabelStatement, Meta, add_act(), add_booking(), add_check(), add_note() (+26 more)

### Community 5 - "Label.tsx"
Cohesion: 0.12
Nodes (51): saveBlob(), fullDate(), Icon(), Badge(), Empty(), ErrorBox(), Loading(), PageTitle() (+43 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "django_db"
Cohesion: 0.12
Nodes (8): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.11
Nodes (57): download(), euroInput(), BackLink(), formValues(), useAction(), useToast(), MeetingPage(), MiniAction() (+49 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.12
Nodes (19): AuditLog, Meta, LoginAttempt, Setting, Task, Meta, audit_log(), check_origin() (+11 more)

### Community 11 - "Work.tsx"
Cohesion: 0.07
Nodes (58): can, asDate(), dayNumber(), eur(), longDate(), monthShort(), shortDate(), stamp() (+50 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.07
Nodes (30): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+22 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.12
Nodes (15): set_setting(), AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests, TableTests (+7 more)

### Community 14 - "providers.py"
Cohesion: 0.20
Nodes (9): uid(), save_secrets(), secret_values(), save_settings(), bank(), opensign(), outlook(), Contract (+1 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.09
Nodes (29): mark_read(), change_password(), create_task(), create_user(), _task_fields(), test_connection(), comment(), create() (+21 more)

### Community 16 - "User"
Cohesion: 0.06
Nodes (21): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), spa(), avatar(), delete_avatar() (+13 more)

### Community 17 - "Calendar.tsx"
Cohesion: 0.19
Nodes (13): AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS (+5 more)

### Community 18 - "graph.py"
Cohesion: 0.17
Nodes (15): copy_item(), download_item(), download_path(), _drive_base(), drive_children(), drive_item(), _drive_token(), drive_upload() (+7 more)

### Community 19 - "Events.tsx"
Cohesion: 0.48
Nodes (6): today(), Tabs(), StatusBadge(), EventRow, Events(), EventTabs()

### Community 20 - "body"
Cohesion: 0.26
Nodes (9): body(), review(), update_act(), update_artist(), update_booking(), update_check(), update_event(), update_release() (+1 more)

### Community 21 - "planning/views.py"
Cohesion: 0.13
Nodes (13): done(), update_task(), update_user(), _apply(), calendar(), content(), content_dict(), create_content() (+5 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.17
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "finance/views.py"
Cohesion: 0.14
Nodes (14): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+6 more)

### Community 26 - "import_legacy.py"
Cohesion: 0.15
Nodes (9): Command, stamp(), js(), when(), EventNote, Meta, Send, Meta (+1 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "claude.py"
Cohesion: 0.19
Nodes (9): _call(), complete(), complete_json(), config(), extract(), models(), _text_to_dict(), secure_url() (+1 more)

### Community 51 - "promo/services.py"
Cohesion: 0.07
Nodes (34): Notification, Meta, deadlines(), involved(), notifications(), notify(), Campaign, Meta (+26 more)

### Community 52 - "settings"
Cohesion: 0.13
Nodes (14): assigned(), settings(), action_dict(), create(), extract(), heuristic(), make_task(), meeting_dict() (+6 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 56 - "django_db_models_deletion"
Cohesion: 0.17
Nodes (5): Migration, Migration, Migration, Migration, Migration

### Community 57 - "providers.py"
Cohesion: 0.14
Nodes (11): test_connection(), graph(), graph_pages(), NoCredentialRedirect, odoo_catalog(), labelgrid_http(), opensign_create(), opensign_http() (+3 more)

### Community 58 - "actor"
Cohesion: 0.31
Nodes (8): actor(), update(), delete_act(), delete_artist(), delete_asset(), delete_booking(), delete_check(), delete_event()

### Community 59 - "feedback/views.py"
Cohesion: 0.19
Nodes (6): delete(), detail(), stream(), _track(), tracks(), upload()

### Community 60 - "drive.py"
Cohesion: 0.23
Nodes (13): conf(), enabled(), event_folder_name(), _place(), release_folder_name(), sync_booking(), sync_event(), sync_release() (+5 more)

### Community 61 - "Moonshine Backoffice: werkafspraken voor Claude"
Cohesion: 0.29
Nodes (6): Code, graphify, Moonshine Backoffice: werkafspraken voor Claude, Productie, Verbinden vanuit een cloud-sessie, Werkwijze bij wijzigingen

### Community 62 - "Moonshine Backoffice — UX-review, 11 oktober 2026"
Cohesion: 0.29
Nodes (6): Hersteld, Moonshine Backoffice — UX-review, 11 oktober 2026, Referenties en ontwerpkeuze, Verificatie, Vervolg: homepage volgens aangeleverde referentie, Vervolgpunten

### Community 63 - "Moonshine: OpenSign en promomailer"
Cohesion: 0.33
Nodes (5): Aanbevolen volgorde, Controles die we moeten toevoegen, Moonshine: OpenSign en promomailer, OpenSign: technisch passend, betaalde API nodig, Promomailer: goed te integreren

### Community 64 - "Functionele en beveiligingsreview"
Cohesion: 0.33
Nodes (5): Functionaliteit en grenzen, Functionele en beveiligingsreview, Operationele open punten, Verholpen, Verificatie

### Community 65 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

### Community 66 - "planning/services.py"
Cohesion: 0.16
Nodes (17): ContentItem, Meta, OutlookLink, Meta, _box(), check(), _day(), enabled() (+9 more)

### Community 67 - "settings"
Cohesion: 0.27
Nodes (5): PasswordReset, digest(), forgot(), reset(), send_email()

### Community 68 - "api"
Cohesion: 0.08
Nodes (34): api(), ApiError, size(), ResetPassword(), submit(), test(), KeysPage(), save() (+26 more)

### Community 69 - "meetings/views.py"
Cohesion: 0.12
Nodes (17): Command, Action, Meta, Meeting, Meta, add_action(), board(), create() (+9 more)

### Community 71 - "audit"
Cohesion: 0.16
Nodes (20): audit(), Act, Artist, Meta, ChecklistItem, Meta, act_create(), act_delete() (+12 more)

### Community 72 - "django_conf"
Cohesion: 0.29
Nodes (3): Migration, Migration, Migration

### Community 75 - "test_feedback.py"
Cohesion: 0.15
Nodes (11): Command, num(), who(), Track, Meta, docx(), fake(), FeedbackTests (+3 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.18
Nodes (14): avg(), DECISION, FeedbackTrack(), upload(), grade(), mark(), Player(), Review (+6 more)

### Community 80 - "Release"
Cohesion: 0.19
Nodes (11): next_catalog(), Release, Meta, ReleaseStep, Meta, label_artists(), release_dict(), release_save() (+3 more)

### Community 81 - "Asset"
Cohesion: 0.21
Nodes (10): Asset, Meta, asset_add_file(), asset_add_link(), asset_content(), asset_delete(), asset_get(), add_assets() (+2 more)

### Community 82 - "feedback/services.py"
Cohesion: 0.18
Nodes (11): Review, Meta, TrackLog, Meta, apply(), average(), display(), review_dict() (+3 more)

### Community 83 - "Event"
Cohesion: 0.36
Nodes (7): queue(), Event, Meta, booking_add(), event_create(), event_update(), seed_checklist()

### Community 89 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.33
Nodes (5): Afspraken, API (alle onder /api), Frontend (frontend/src), Projectkaart Moonshine Backoffice, LegacyRedirect()

## Knowledge Gaps
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `PDF Writer`?**
  _High betweenness centrality (0.320) - this node is a cross-community bridge._
- **Are the 65 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 65 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07667900581702802 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.312) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1103448275862069 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06384180790960452 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.10609756097560975 - nodes in this community are weakly interconnected._