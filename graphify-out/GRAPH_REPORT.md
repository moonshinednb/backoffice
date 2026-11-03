# Graph Report - backoffice  (2026-11-03)

## Corpus Check
- 210 files · ~122,943 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1920 nodes · 6343 edges · 103 communities (65 shown, 38 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 516 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e570b315`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- actor
- Frontend Auth Context
- queue.py
- rules.py
- require
- Event.tsx
- Frontend Dependencies
- format.ts
- useToast
- Docker Compose Setup
- production/models.py
- Finance.tsx
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
- api
- steps.py
- Task
- meetings/services.py
- import_track_feedback.py
- Loading
- User
- test_design.py
- reset.py
- json
- settings
- hashlib
- Calendar.tsx
- api.py
- 0005_staff_data.py
- api.py
- restore.sh
- PlanningTests
- core/services.py
- Ontwerpregels Moonshine Backoffice
- 0011_venue_contacts.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 167 edges
2. `api()` - 134 edges
3. `audit()` - 115 edges
4. `Icon()` - 109 edges
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
- `Frontend (frontend/src)` --references--> `LegacyRedirect()`  [INFERRED]
  ARCHITECTURE.md → frontend/src/main.tsx
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py

## Import Cycles
- None detected.

## Communities (103 total, 38 thin omitted)

### Community 0 - "actor"
Cohesion: 0.09
Nodes (48): actor(), body(), mark_read(), create_task(), create_user(), save_settings(), create(), import_transactions() (+40 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (53): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+45 more)

### Community 2 - "queue.py"
Cohesion: 0.12
Nodes (14): Stack, safe_error(), Command, Job, Meta, Schedule, claim_next(), enqueue() (+6 more)

### Community 3 - "rules.py"
Cohesion: 0.06
Nodes (37): parse_date(), _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table() (+29 more)

### Community 4 - "require"
Cohesion: 0.10
Nodes (44): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contact_add() (+36 more)

### Community 5 - "Event.tsx"
Cohesion: 0.10
Nodes (49): download(), Icon(), PATHS, useAction(), MeetingPage(), MiniAction(), DriveButton(), useCanEdit() (+41 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (47): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, three@^0.180.0 (+39 more)

### Community 7 - "format.ts"
Cohesion: 0.09
Nodes (49): Frontend (frontend/src), asDate(), dayNumber(), eur(), fullDate(), longDate(), monthShort(), shortDate() (+41 more)

### Community 8 - "useToast"
Cohesion: 0.10
Nodes (45): euroInput(), size(), BackLink(), formValues(), Orb(), Artist, ArtistPage(), save() (+37 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.12
Nodes (19): queue(), act_create(), act_dict(), act_remove(), act_state(), act_update(), _artist(), _book() (+11 more)

### Community 11 - "Finance.tsx"
Cohesion: 0.11
Nodes (25): BOXES, CATEGORY, DocumentsPage(), FILTERS, InvoiceDialog(), save(), values(), Line (+17 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (28): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+20 more)

### Community 13 - "ApiTests"
Cohesion: 0.11
Nodes (6): AttentionTests, LineupTests, PeopleTests, sample_xlsx(), VoyageTests, EventChecklistTests

### Community 14 - "core/views.py"
Cohesion: 0.16
Nodes (15): profile_dict(), LoginAttempt, audit_log(), check_origin(), connections(), dashboard(), do_login(), do_logout() (+7 more)

### Community 15 - "graph.py"
Cohesion: 0.10
Nodes (18): copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), _ensure_folder(), item_children() (+10 more)

### Community 16 - "chat.py"
Cohesion: 0.14
Nodes (11): avatar(), delete_avatar(), messages(), _msg(), overview(), _thread(), upload_avatar(), ChatMessage (+3 more)

### Community 17 - "people.py"
Cohesion: 0.15
Nodes (21): download_item(), CrewMember, Meta, Guest, Meta, contact_dict(), contact_save(), copy_crew() (+13 more)

### Community 18 - "requests.py"
Cohesion: 0.20
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.23
Nodes (11): ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content(), delete_content() (+3 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.13
Nodes (9): comment(), delete(), detail(), review(), stream(), _track(), tracks(), update() (+1 more)

### Community 21 - "production/services.py"
Cohesion: 0.08
Nodes (48): audit(), send_mail(), UncertainSend, next_catalog(), Act, Artist, Meta, Asset (+40 more)

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
Cohesion: 0.14
Nodes (22): Campaign, Meta, Recipient, Meta, Template, Meta, campaign_create(), campaign_dict() (+14 more)

### Community 26 - "django_db"
Cohesion: 0.05
Nodes (25): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+17 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "set_setting"
Cohesion: 0.12
Nodes (7): set_setting(), EventFilesTests, EventUploadTests, MissingTests, ReleaseTests, RosterTests, VoyageDeliverableTests

### Community 31 - "HttpError"
Cohesion: 0.09
Nodes (12): send(), update_profile(), change_password(), _task_fields(), update_task(), update_user(), HttpError, artist_photo() (+4 more)

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "Backend-apps"
Cohesion: 0.11
Nodes (21): Backend-apps, VenueContact, Meta, export_xlsx(), file_name(), act_dict(), advancing(), archive_sent() (+13 more)

### Community 52 - "HttpError"
Cohesion: 0.16
Nodes (13): add_action(), board(), create(), delete_action(), detail(), _err(), extract(), _meeting() (+5 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "finance/views.py"
Cohesion: 0.22
Nodes (10): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+2 more)

### Community 56 - "production/models.py"
Cohesion: 0.14
Nodes (12): Command, stamp(), js(), when(), Contract, Meta, EventNote, Meta (+4 more)

### Community 57 - "odoo.py"
Cohesion: 0.33
Nodes (3): poll_odoo_bank(), Odoo, odoo_overview()

### Community 58 - "Event"
Cohesion: 0.14
Nodes (15): attention(), done_this_month(), entity_of(), focus(), items_for(), my_work(), team_work(), with_people() (+7 more)

### Community 59 - "core/models.py"
Cohesion: 0.14
Nodes (15): Notification, Meta, AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests (+7 more)

### Community 60 - "drive.py"
Cohesion: 0.08
Nodes (24): drive_item(), drive_upload(), ensure_path(), archive_past(), asset_section(), conf(), enabled(), event_base() (+16 more)

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
Cohesion: 0.40
Nodes (4): Afspraken, API (alle onder /api), Ontwerp (frontend), Projectkaart Moonshine Backoffice

### Community 66 - "planning/services.py"
Cohesion: 0.17
Nodes (16): OutlookLink, Meta, appt_kind(), _box(), check(), _day(), enabled(), _graph() (+8 more)

### Community 67 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

### Community 68 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 69 - "promo/views.py"
Cohesion: 0.14
Nodes (18): Contact, Meta, add_contact(), campaign(), _campaign(), campaigns(), contacts(), delete_campaign() (+10 more)

### Community 70 - "api"
Cohesion: 0.06
Nodes (47): api(), ApiError, Tabs(), ResetPassword(), submit(), AdminLayout(), ConfigDialog(), EventRoles() (+39 more)

### Community 71 - "steps.py"
Cohesion: 0.09
Nodes (27): AuditLog, Meta, also(), assigned(), deadlines(), done(), involved(), notifications() (+19 more)

### Community 72 - "Task"
Cohesion: 0.16
Nodes (6): Task, Meta, MyWorkTests, Action, Meta, MeetingTests

### Community 74 - "meetings/services.py"
Cohesion: 0.11
Nodes (14): Command, Meeting, Meta, action_dict(), create(), extract(), heuristic(), meeting_dict() (+6 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.07
Nodes (23): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+15 more)

### Community 79 - "Loading"
Cohesion: 0.10
Nodes (51): saveBlob(), Badge(), Empty(), ErrorBox(), Loading(), PageTitle(), Stat(), ActivityPage() (+43 more)

### Community 80 - "User"
Cohesion: 0.15
Nodes (3): User, make_task(), sync_task()

### Community 81 - "test_design.py"
Cohesion: 0.42
Nodes (3): DesignRulesTests, files(), hits()

### Community 82 - "reset.py"
Cohesion: 0.23
Nodes (4): PasswordReset, digest(), forgot(), reset()

### Community 83 - "json"
Cohesion: 0.31
Nodes (3): bank(), opensign(), outlook()

### Community 84 - "settings"
Cohesion: 0.10
Nodes (28): secret_values(), settings(), get_settings(), test_connection(), _call(), complete(), complete_json(), config() (+20 more)

### Community 92 - "Calendar.tsx"
Cohesion: 0.16
Nodes (18): useToast(), AppointmentDialog(), APPT_KINDS, CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso() (+10 more)

### Community 97 - "api.py"
Cohesion: 0.33
Nodes (5): auth_error(), http_error(), runtime_error(), unexpected(), value_error()

### Community 100 - "core/services.py"
Cohesion: 0.09
Nodes (4): Migration, Setting, uid(), save_secrets()

### Community 101 - "Ontwerpregels Moonshine Backoffice"
Cohesion: 0.22
Nodes (8): Componenten (v1.6, `system.css` onderaan), Iconen en beweging, Kleur, Mobiel, Ontwerpregels Moonshine Backoffice, Structuur, Tekst, Typografie

### Community 103 - "0011_venue_contacts.py"
Cohesion: 0.28
Nodes (4): Migration, move_contacts(), Migration, solo_acts()

## Knowledge Gaps
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend (frontend/src)` connect `format.ts` to `Projectkaart Moonshine Backoffice`, `Frontend Auth Context`, `Backend-apps`?**
  _High betweenness centrality (0.357) - this node is a cross-community bridge._
- **Are the 84 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 84 INFERRED edges - model-reasoned connections that need verification._
- **Should `actor` be split into smaller, more focused modules?**
  _Cohesion score 0.08956228956228957 - nodes in this community are weakly interconnected._
- **Why does `advancing()` connect `Backend-apps` to `format.ts`, `production/models.py`, `production/services.py`, `production/models.py`, `Event`?**
  _High betweenness centrality (0.341) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.06101914962674456 - nodes in this community are weakly interconnected._
- **Why does `WorkRow()` connect `format.ts` to `Event.tsx`, `Loading`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._