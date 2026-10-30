# Graph Report - backoffice  (2026-10-30)

## Corpus Check
- 123 files · ~71,902 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1157 nodes · 3569 edges · 68 communities (43 shown, 25 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 257 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `68258c60`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Shared UI Components
- Frontend Dependencies
- URL Routing and Migrations
- Artist Pages and Riders
- Docker Compose Setup
- User and Task Models
- Finance and Integrations Pages
- Accounting and Invoice Models
- Notifications and API Tests
- Settings and Integration Checks
- Promo Mailing
- Chat and Access Helpers
- API Client and Tasks
- Password Reset and Webhooks
- Microsoft Graph Integration
- Odoo Integration
- finance/views.py
- TypeScript Config
- Django App Configs
- Date Formatting Utilities
- body
- Provider Errors and Uploads
- Frontend Translations
- Legacy Password Hasher
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- import_legacy.py
- promo/services.py
- core/services.py
- audit
- Moonshine Backoffice
- Asset
- api.py
- Release
- urls.py
- Booking
- dashboard
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- 0005_staff_data.py
- 0003_seed_release_steps.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 90 edges
2. `api()` - 81 edges
3. `Icon()` - 71 edges
4. `audit()` - 67 edges
5. `body()` - 54 edges
6. `post()` - 50 edges
7. `actor()` - 47 edges
8. `HttpError` - 42 edges
9. `settings()` - 40 edges
10. `useToast()` - 40 edges

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

## Communities (68 total, 25 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.15
Nodes (25): Act, act_create(), act_delete(), act_dict(), _act_payload(), act_update(), advancing(), artist_dict() (+17 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.08
Nodes (40): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+32 more)

### Community 2 - "queue.py"
Cohesion: 0.12
Nodes (13): Stack, deadlines(), involved(), Command, Job, Meta, Schedule, claim_next() (+5 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (41): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, _Canvas, _char_width(), _clean() (+33 more)

### Community 4 - "require"
Cohesion: 0.19
Nodes (22): require(), advancing_pdf(), artist(), artists(), asset_file(), booking(), contracts(), delete_act() (+14 more)

### Community 5 - "Shared UI Components"
Cohesion: 0.12
Nodes (45): Icon(), Empty(), ErrorBox(), formValues(), Loading(), PageTitle(), Stat(), ActivityPage() (+37 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "URL Routing and Migrations"
Cohesion: 0.09
Nodes (12): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+4 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.14
Nodes (46): download(), euroInput(), BackLink(), Tabs(), useAction(), useToast(), Artist, ArtistPage() (+38 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "User and Task Models"
Cohesion: 0.15
Nodes (19): LoginAttempt, assigned(), audit_log(), change_password(), check_origin(), create_task(), create_user(), do_login() (+11 more)

### Community 11 - "Finance and Integrations Pages"
Cohesion: 0.07
Nodes (54): saveBlob(), eur(), stamp(), Badge(), Orb(), IntegrationsPage(), KEYS, Kind (+46 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.10
Nodes (28): done(), cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage (+20 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.09
Nodes (11): Notification, Meta, notifications(), AiProviderTests, ApiTests, ChatProfileTests, ResetTests, MissingTests (+3 more)

### Community 14 - "Settings and Integration Checks"
Cohesion: 0.14
Nodes (14): test_connection(), _call(), config(), extract(), models(), _text_to_dict(), NoCredentialRedirect, secure_url() (+6 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.14
Nodes (18): Template, Meta, add_contact(), campaign(), _campaign(), campaigns(), contacts(), delete_campaign() (+10 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.09
Nodes (15): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+7 more)

### Community 17 - "API Client and Tasks"
Cohesion: 0.12
Nodes (21): api(), ApiError, size(), ResetPassword(), submit(), test(), save(), toggle() (+13 more)

### Community 18 - "Password Reset and Webhooks"
Cohesion: 0.12
Nodes (9): PasswordReset, Setting, digest(), forgot(), reset(), settings(), connections(), check() (+1 more)

### Community 19 - "Microsoft Graph Integration"
Cohesion: 0.16
Nodes (12): _drive_base(), _drive_token(), drive_upload(), _ensure_folder(), graph(), graph_pages(), graph_token(), send_mail() (+4 more)

### Community 20 - "Odoo Integration"
Cohesion: 0.33
Nodes (3): poll_odoo_bank(), Odoo, odoo_overview()

### Community 21 - "finance/views.py"
Cohesion: 0.13
Nodes (11): mark_read(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview(), settle() (+3 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.12
Nodes (5): CoreConfig, FinanceConfig, JobsConfig, ProductionConfig, PromoConfig

### Community 24 - "Date Formatting Utilities"
Cohesion: 0.35
Nodes (12): asDate(), dayNumber(), fullDate(), longDate(), monthShort(), shortDate(), today(), locale() (+4 more)

### Community 25 - "body"
Cohesion: 0.17
Nodes (28): actor(), body(), set_setting(), save_settings(), test_connection(), post(), add_act(), add_booking() (+20 more)

### Community 26 - "Provider Errors and Uploads"
Cohesion: 0.18
Nodes (8): classify(), _doc(), retry(), review(), upload(), HttpError, dm_done(), import_contacts()

### Community 28 - "Frontend Translations"
Cohesion: 0.31
Nodes (8): ATTRS, current, D, lang, P, start(), t(), translateNode()

### Community 50 - "import_legacy.py"
Cohesion: 0.11
Nodes (17): Command, stamp(), js(), when(), AuditLog, Meta, Task, Meta (+9 more)

### Community 51 - "promo/services.py"
Cohesion: 0.13
Nodes (23): notify(), Campaign, Meta, Contact, Meta, Recipient, Meta, campaign_create() (+15 more)

### Community 52 - "core/services.py"
Cohesion: 0.26
Nodes (7): uid(), save_secrets(), secret_values(), bank(), opensign(), outlook(), insert_transactions()

### Community 53 - "audit"
Cohesion: 0.22
Nodes (15): audit(), ChecklistItem, Meta, Event, Meta, asset_add_file(), asset_add_link(), checklist_add() (+7 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "Asset"
Cohesion: 0.20
Nodes (9): Asset, Meta, asset_content(), asset_delete(), asset_get(), add_assets(), event_remove(), queue_pending_syncs() (+1 more)

### Community 56 - "api.py"
Cohesion: 0.29
Nodes (6): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), safe_error()

### Community 57 - "Release"
Cohesion: 0.22
Nodes (10): Release, Meta, ReleaseStep, Meta, label_artists(), release_dict(), release_save(), seed_steps() (+2 more)

### Community 59 - "Booking"
Cohesion: 0.31
Nodes (9): Artist, Meta, Booking, Meta, artist_create(), artist_delete(), artist_update(), booking_add() (+1 more)

### Community 60 - "dashboard"
Cohesion: 0.32
Nodes (7): dashboard(), archive_sent(), asset_drive_path(), _drive_root(), event_dict(), _event_folder(), event_listing()

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

## Knowledge Gaps
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `audit()` connect `audit` to `production/services.py`, `queue.py`, `User and Task Models`, `Accounting and Invoice Models`, `Settings and Integration Checks`, `Promo Mailing`, `Chat and Access Helpers`, `Password Reset and Webhooks`, `import_legacy.py`, `core/services.py`, `finance/views.py`, `promo/services.py`, `Asset`, `api.py`, `body`, `Provider Errors and Uploads`, `Booking`, `Release`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07629288274449565 - nodes in this community are weakly interconnected._
- **Why does `require()` connect `require` to `User and Task Models`, `Promo Mailing`, `finance/views.py`, `body`, `Provider Errors and Uploads`, `Asset Upload`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Why does `User` connect `Chat and Access Helpers` to `queue.py`, `User and Task Models`, `Notifications and API Tests`, `import_legacy.py`, `Password Reset and Webhooks`, `promo/services.py`, `finance/views.py`, `dashboard`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.05608322026232474 - nodes in this community are weakly interconnected._
- **Should `Shared UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.12326530612244897 - nodes in this community are weakly interconnected._