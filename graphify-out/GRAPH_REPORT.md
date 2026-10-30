# Graph Report - backoffice  (2026-10-30)

## Corpus Check
- 126 files · ~72,500 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1166 nodes · 3579 edges · 62 communities (35 shown, 27 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 258 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0dd3528e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Promo.tsx
- Frontend Dependencies
- URL Routing and Migrations
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Finance and Integrations Pages
- Accounting and Invoice Models
- Notifications and API Tests
- Settings and Integration Checks
- Promo Mailing
- Chat and Access Helpers
- API Client and Tasks
- reset.py
- Admin.tsx
- Odoo Integration
- finance/views.py
- TypeScript Config
- Django App Configs
- Date Formatting Utilities
- body
- run_worker.py
- connect.sh
- Frontend Translations
- Legacy Password Hasher
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- core/services.py
- ssh.sh
- Moonshine Backoffice
- api.py
- urls.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
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

## Communities (62 total, 27 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.05
Nodes (89): Command, stamp(), js(), when(), Setting, audit(), labelgrid_pull(), Act (+81 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.07
Nodes (42): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+34 more)

### Community 2 - "queue.py"
Cohesion: 0.16
Nodes (11): Stack, sync_todo(), Job, Meta, Schedule, claim_next(), handlers(), periodic() (+3 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (41): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, _Canvas, _char_width(), _clean() (+33 more)

### Community 4 - "require"
Cohesion: 0.19
Nodes (22): require(), advancing_pdf(), artist(), artists(), asset_file(), booking(), contracts(), delete_act() (+14 more)

### Community 5 - "Promo.tsx"
Cohesion: 0.22
Nodes (7): Campaign, CampaignRow, Contact, GROUP, KIND, Recipient, STATUS

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "URL Routing and Migrations"
Cohesion: 0.09
Nodes (12): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+4 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.12
Nodes (53): download(), euroInput(), stamp(), BackLink(), formValues(), Stat(), useAction(), useToast() (+45 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.08
Nodes (29): AuditLog, Meta, LoginAttempt, Task, Meta, User, assigned(), deadlines() (+21 more)

### Community 11 - "Finance and Integrations Pages"
Cohesion: 0.09
Nodes (74): saveBlob(), eur(), shortDate(), Icon(), Badge(), Empty(), ErrorBox(), Loading() (+66 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.10
Nodes (26): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+18 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.09
Nodes (11): Notification, Meta, notifications(), AiProviderTests, ApiTests, ChatProfileTests, ResetTests, MissingTests (+3 more)

### Community 14 - "Settings and Integration Checks"
Cohesion: 0.12
Nodes (26): secret_values(), settings(), test_connection(), _call(), config(), extract(), models(), _text_to_dict() (+18 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.11
Nodes (20): HttpError, add_contact(), campaign(), _campaign(), campaigns(), contacts(), create_campaign(), delete_campaign() (+12 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.13
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "API Client and Tasks"
Cohesion: 0.12
Nodes (21): api(), ApiError, size(), ResetPassword(), submit(), save(), toggle(), saveLink() (+13 more)

### Community 18 - "reset.py"
Cohesion: 0.33
Nodes (4): PasswordReset, digest(), forgot(), reset()

### Community 19 - "Admin.tsx"
Cohesion: 0.12
Nodes (13): AdminLayout(), IntegrationsPage(), test(), KEYS, Kind, Provider, PROVIDERS, ROLES (+5 more)

### Community 20 - "Odoo Integration"
Cohesion: 0.26
Nodes (4): poll_odoo_bank(), Odoo, odoo_catalog(), odoo_overview()

### Community 21 - "finance/views.py"
Cohesion: 0.13
Nodes (14): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+6 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.12
Nodes (5): CoreConfig, FinanceConfig, JobsConfig, ProductionConfig, PromoConfig

### Community 24 - "Date Formatting Utilities"
Cohesion: 0.36
Nodes (11): asDate(), dayNumber(), fullDate(), longDate(), monthShort(), today(), locale(), Tabs() (+3 more)

### Community 25 - "body"
Cohesion: 0.15
Nodes (30): actor(), body(), mark_read(), set_setting(), do_logout(), save_settings(), test_connection(), post() (+22 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 51 - "promo/services.py"
Cohesion: 0.12
Nodes (25): UncertainSend, Campaign, Meta, Contact, Meta, Recipient, Meta, Template (+17 more)

### Community 52 - "core/services.py"
Cohesion: 0.12
Nodes (8): uid(), save_secrets(), bank(), opensign(), outlook(), insert_transactions(), transaction_values(), _json()

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 56 - "api.py"
Cohesion: 0.29
Nodes (6): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), safe_error()

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

## Knowledge Gaps
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `PDF Writer` to `queue.py`?**
  _High betweenness centrality (0.338) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05087572977481234 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `PDF Writer` to `Frontend Auth Context`?**
  _High betweenness centrality (0.336) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07462686567164178 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.056535504296698326 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05520614954577219 - nodes in this community are weakly interconnected._
- **Should `URL Routing and Migrations` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._