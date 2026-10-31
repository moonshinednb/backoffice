# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 128 files · ~74,981 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1206 nodes · 3728 edges · 77 communities (45 shown, 32 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 269 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2247c99`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- formValues
- Frontend Dependencies
- core/migrations/0001_initial.py
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Work.tsx
- Accounting and Invoice Models
- Notifications and API Tests
- Settings and Integration Checks
- Promo Mailing
- Chat and Access Helpers
- api
- graph.py
- Admin.tsx
- Odoo Integration
- finance/views.py
- TypeScript Config
- Django App Configs
- Date Formatting Utilities
- body
- import_legacy.py
- connect.sh
- Frontend Translations
- odoo.py
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- json
- ssh.sh
- Moonshine Backoffice
- notify.py
- api.py
- urls.py
- audit
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- django_db
- reset.py
- Release
- Asset
- LegacyScryptHasher
- http.py
- run_worker.py
- Artist
- MissingTests
- test_promo.py
- production/migrations/0001_initial.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 91 edges
2. `api()` - 82 edges
3. `Icon()` - 72 edges
4. `audit()` - 68 edges
5. `body()` - 54 edges
6. `post()` - 51 edges
7. `actor()` - 47 edges
8. `settings()` - 44 edges
9. `HttpError` - 44 edges
10. `useToast()` - 41 edges

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

## Communities (77 total, 32 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.13
Nodes (29): Act, act_create(), act_delete(), act_dict(), _act_payload(), act_update(), advancing(), archive_sent() (+21 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.08
Nodes (38): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+30 more)

### Community 2 - "queue.py"
Cohesion: 0.17
Nodes (12): Stack, safe_error(), Job, Meta, Schedule, claim_next(), handlers(), periodic() (+4 more)

### Community 3 - "PDF Writer"
Cohesion: 0.05
Nodes (42): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, _Canvas, _char_width(), _clean() (+34 more)

### Community 4 - "require"
Cohesion: 0.15
Nodes (26): require(), advancing_pdf(), artist(), artists(), asset_file(), booking(), contracts(), delete_act() (+18 more)

### Community 5 - "formValues"
Cohesion: 0.15
Nodes (11): Campaign, CampaignRow, Contact, GROUP, KIND, PromoCampaign(), save(), PromoContacts() (+3 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "core/migrations/0001_initial.py"
Cohesion: 0.14
Nodes (6): Migration, Migration, Migration, Migration, Migration, Migration

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.12
Nodes (52): download(), euroInput(), BackLink(), formValues(), Stat(), useAction(), useToast(), Artist (+44 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.14
Nodes (19): LoginAttempt, Task, Meta, assigned(), audit_log(), change_password(), connections(), create_task() (+11 more)

### Community 11 - "Work.tsx"
Cohesion: 0.10
Nodes (53): can, eur(), shortDate(), Icon(), Empty(), Orb(), BOXES, CATEGORY (+45 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (28): done(), cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage (+20 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.16
Nodes (7): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests, ReleaseTests

### Community 14 - "Settings and Integration Checks"
Cohesion: 0.16
Nodes (15): Setting, secret_values(), set_setting(), settings(), get_settings(), test_connection(), config(), models() (+7 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.11
Nodes (20): check_origin(), do_login(), HttpError, campaign(), _campaign(), campaigns(), contacts(), delete_campaign() (+12 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.09
Nodes (15): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+7 more)

### Community 17 - "api"
Cohesion: 0.12
Nodes (21): api(), ApiError, size(), ResetPassword(), submit(), test(), save(), toggle() (+13 more)

### Community 18 - "graph.py"
Cohesion: 0.15
Nodes (16): save_secrets(), _drive_base(), drive_item(), _drive_token(), drive_upload(), _ensure_folder(), ensure_path(), graph() (+8 more)

### Community 19 - "Admin.tsx"
Cohesion: 0.13
Nodes (36): saveBlob(), stamp(), Badge(), ErrorBox(), Loading(), PageTitle(), ActivityPage(), AdminHome() (+28 more)

### Community 21 - "finance/views.py"
Cohesion: 0.18
Nodes (11): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+3 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.12
Nodes (5): CoreConfig, FinanceConfig, JobsConfig, ProductionConfig, PromoConfig

### Community 24 - "Date Formatting Utilities"
Cohesion: 0.32
Nodes (12): asDate(), dayNumber(), fullDate(), longDate(), monthShort(), today(), locale(), Tabs() (+4 more)

### Community 25 - "body"
Cohesion: 0.17
Nodes (30): actor(), body(), create_user(), save_settings(), test_connection(), import_transactions(), match(), post() (+22 more)

### Community 26 - "import_legacy.py"
Cohesion: 0.12
Nodes (15): Command, stamp(), js(), when(), AuditLog, Meta, Contract, Meta (+7 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.31
Nodes (8): ATTRS, current, D, lang, P, start(), t(), translateNode()

### Community 29 - "odoo.py"
Cohesion: 0.24
Nodes (6): _call(), extract(), _text_to_dict(), secure_url(), odoo_catalog(), odoo_overview()

### Community 51 - "promo/services.py"
Cohesion: 0.13
Nodes (24): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+16 more)

### Community 52 - "json"
Cohesion: 0.33
Nodes (5): uid(), bank(), opensign(), outlook(), insert_transactions()

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "notify.py"
Cohesion: 0.24
Nodes (7): Notification, Meta, deadlines(), involved(), mark_read(), notifications(), notify()

### Community 56 - "api.py"
Cohesion: 0.33
Nodes (5): auth_error(), http_error(), runtime_error(), unexpected(), value_error()

### Community 59 - "audit"
Cohesion: 0.18
Nodes (18): audit(), queue(), ChecklistItem, Meta, Event, Meta, artist_delete(), asset_add_file() (+10 more)

### Community 60 - "drive.py"
Cohesion: 0.24
Nodes (11): conf(), enabled(), event_folder_name(), _place(), release_folder_name(), sync_booking(), sync_event(), sync_release() (+3 more)

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

### Community 66 - "django_db"
Cohesion: 0.11
Nodes (8): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration

### Community 67 - "reset.py"
Cohesion: 0.19
Nodes (4): PasswordReset, digest(), forgot(), reset()

### Community 68 - "Release"
Cohesion: 0.19
Nodes (11): next_catalog(), Release, Meta, ReleaseStep, Meta, label_artists(), release_dict(), release_save() (+3 more)

### Community 69 - "Asset"
Cohesion: 0.21
Nodes (10): Asset, Meta, artist_get(), asset_content(), asset_delete(), asset_dict(), asset_get(), add_assets() (+2 more)

### Community 73 - "Artist"
Cohesion: 0.60
Nodes (5): Artist, Meta, artist_create(), artist_update(), _name_taken()

## Knowledge Gaps
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `PDF Writer` to `queue.py`?**
  _High betweenness centrality (0.313) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `PDF Writer` to `Frontend Auth Context`?**
  _High betweenness centrality (0.310) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07720782654680064 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.054274084124830396 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05520614954577219 - nodes in this community are weakly interconnected._
- **Should `core/migrations/0001_initial.py` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._