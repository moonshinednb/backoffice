# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 182 files · ~100,870 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1620 nodes · 5268 edges · 88 communities (50 shown, 38 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 412 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7ddd0df5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Loading
- Frontend Dependencies
- django_db
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Work.tsx
- Accounting and Invoice Models
- ApiTests
- secret_values
- django_db_models_deletion
- User
- Calendar.tsx
- body
- Events.tsx
- api.py
- planning/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- finance/views.py
- useAction
- connect.sh
- Frontend Translations
- core/migrations/0001_initial.py
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- User
- ssh.sh
- Moonshine Backoffice
- @tanstack/react-query
- settings
- Odoo
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- planning/services.py
- settings
- api
- meetings/services.py
- LegacyScryptHasher
- Event
- urls.py
- core/services.py
- feedback/views.py
- Feedback.tsx
- notify.py
- core/models.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 141 edges
2. `api()` - 110 edges
3. `audit()` - 94 edges
4. `Icon()` - 94 edges
5. `HttpError` - 77 edges
6. `body()` - 75 edges
7. `actor()` - 71 edges
8. `post()` - 68 edges
9. `Loading()` - 57 edges
10. `useToast()` - 57 edges

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

## Communities (88 total, 38 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.05
Nodes (84): Command, stamp(), js(), when(), audit(), next_catalog(), queue(), Act (+76 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.08
Nodes (37): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+29 more)

### Community 2 - "queue.py"
Cohesion: 0.13
Nodes (13): Stack, Command, Job, Meta, Schedule, claim_next(), enqueue(), handlers() (+5 more)

### Community 3 - "PDF Writer"
Cohesion: 0.05
Nodes (42): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, _Canvas, _char_width(), _clean() (+34 more)

### Community 4 - "require"
Cohesion: 0.10
Nodes (41): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contracts() (+33 more)

### Community 5 - "Loading"
Cohesion: 0.12
Nodes (45): saveBlob(), Badge(), Empty(), ErrorBox(), Loading(), PageTitle(), ActivityPage(), AdminHome() (+37 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "django_db"
Cohesion: 0.09
Nodes (10): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+2 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.14
Nodes (41): euroInput(), BackLink(), formValues(), Artist, ArtistPage(), save(), Rider(), Row (+33 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.14
Nodes (19): LoginAttempt, audit_log(), change_password(), check_origin(), connections(), create_task(), dashboard(), do_login() (+11 more)

### Community 11 - "Work.tsx"
Cohesion: 0.07
Nodes (64): asDate(), dayNumber(), eur(), longDate(), monthShort(), ROLE, shortDate(), stamp() (+56 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.10
Nodes (27): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+19 more)

### Community 13 - "ApiTests"
Cohesion: 0.12
Nodes (12): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, ResetTests, ReleaseTests, RosterTests, VoyageDeliverableTests (+4 more)

### Community 14 - "secret_values"
Cohesion: 0.21
Nodes (7): secret_values(), bank(), opensign(), outlook(), labelgrid_pull(), Contract, Meta

### Community 15 - "django_db_models_deletion"
Cohesion: 0.10
Nodes (9): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+1 more)

### Community 16 - "User"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "Calendar.tsx"
Cohesion: 0.21
Nodes (13): useToast(), AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item (+5 more)

### Community 18 - "body"
Cohesion: 0.15
Nodes (33): actor(), body(), create_user(), save_settings(), test_connection(), comment(), create(), update() (+25 more)

### Community 19 - "Events.tsx"
Cohesion: 0.43
Nodes (6): Tabs(), AdminLayout(), StatusBadge(), EventRow, Events(), EventTabs()

### Community 20 - "api.py"
Cohesion: 0.19
Nodes (8): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), safe_error(), refresh_recent(), send_batch()

### Community 21 - "planning/views.py"
Cohesion: 0.18
Nodes (11): ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content(), delete_content() (+3 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.20
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "finance/views.py"
Cohesion: 0.12
Nodes (14): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+6 more)

### Community 26 - "useAction"
Cohesion: 0.16
Nodes (21): fullDate(), today(), useAction(), Action, Meeting, MeetingPage(), MiniAction(), NAMES (+13 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "core/migrations/0001_initial.py"
Cohesion: 0.17
Nodes (4): Migration, Migration, Migration, Migration

### Community 51 - "promo/services.py"
Cohesion: 0.08
Nodes (39): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+31 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "@tanstack/react-query"
Cohesion: 0.29
Nodes (7): Files, HINT, Item, Row(), Section, size(), @tanstack/react-query

### Community 57 - "settings"
Cohesion: 0.10
Nodes (24): test_connection(), _call(), complete(), complete_json(), config(), extract(), models(), _text_to_dict() (+16 more)

### Community 58 - "Odoo"
Cohesion: 0.28
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 60 - "drive.py"
Cohesion: 0.06
Nodes (35): create_folder(), _drive_base(), drive_children(), drive_item(), _drive_token(), ensure_path(), item_children(), move_item() (+27 more)

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
Cohesion: 0.18
Nodes (16): graph_token(), OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph() (+8 more)

### Community 67 - "settings"
Cohesion: 0.17
Nodes (8): PasswordReset, digest(), forgot(), reset(), settings(), poll_odoo_bank(), check(), send_email()

### Community 68 - "api"
Cohesion: 0.09
Nodes (40): api(), ApiError, download(), size(), Icon(), PATHS, Stat(), ResetPassword() (+32 more)

### Community 69 - "meetings/services.py"
Cohesion: 0.07
Nodes (27): copy_item(), download_item(), Command, Action, Meta, Meeting, Meta, action_dict() (+19 more)

### Community 71 - "Event"
Cohesion: 0.16
Nodes (17): is_upcoming(), EventStep, Meta, _active(), due(), event_steps(), make_task(), _mark() (+9 more)

### Community 74 - "core/services.py"
Cohesion: 0.10
Nodes (8): Setting, uid(), save_secrets(), set_setting(), MicrosoftTokenTests, PlanningTests, EventFilesTests, MissingTests

### Community 75 - "feedback/views.py"
Cohesion: 0.06
Nodes (30): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+22 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.18
Nodes (14): avg(), DECISION, FeedbackTrack(), upload(), grade(), mark(), Player(), Review (+6 more)

### Community 83 - "notify.py"
Cohesion: 0.18
Nodes (11): AuditLog, Meta, Notification, Meta, assigned(), deadlines(), done(), involved() (+3 more)

### Community 84 - "core/models.py"
Cohesion: 0.18
Nodes (4): Task, Meta, MeetingTests, TableTests

## Knowledge Gaps
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `PDF Writer` to `queue.py`?**
  _High betweenness centrality (0.364) - this node is a cross-community bridge._
- **Are the 68 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 68 INFERRED edges - model-reasoned connections that need verification._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05402930402930403 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `PDF Writer` to `Frontend Auth Context`?**
  _High betweenness centrality (0.362) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.08135593220338982 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12923076923076923 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.05472636815920398 - nodes in this community are weakly interconnected._