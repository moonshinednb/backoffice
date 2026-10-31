# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 126 files · ~73,357 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1177 nodes · 3610 edges · 67 communities (39 shown, 28 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 260 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1c99594c`
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
- URL Routing and Migrations
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
- HttpError
- connect.sh
- Frontend Translations
- odoo.py
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- core/services.py
- ssh.sh
- Moonshine Backoffice
- notify.py
- api.py
- urls.py
- User
- Projectkaart Moonshine Backoffice
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
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
9. `settings()` - 41 edges
10. `useToast()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py
- `Backend-apps` --references--> `send_mail()`  [INFERRED]
  ARCHITECTURE.md → backend/integrations/graph.py
- `Backend-apps` --references--> `missing_items()`  [INFERRED]
  ARCHITECTURE.md → backend/production/rules.py
- `Backend-apps` --references--> `contact_via()`  [INFERRED]
  ARCHITECTURE.md → backend/production/rules.py

## Import Cycles
- None detected.

## Communities (67 total, 28 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.06
Nodes (85): Command, stamp(), js(), when(), audit(), Act, Artist, Meta (+77 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.08
Nodes (36): Options, Auth, AuthContext, useAuth(), User, ROLE, PATHS, Avatar() (+28 more)

### Community 2 - "queue.py"
Cohesion: 0.14
Nodes (10): Stack, Command, Job, Meta, Schedule, claim_next(), periodic(), run_job() (+2 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.17
Nodes (24): require(), advancing_pdf(), artist(), artists(), asset_file(), booking(), contracts(), delete_act() (+16 more)

### Community 5 - "formValues"
Cohesion: 0.12
Nodes (17): formValues(), save(), save(), save(), saveLink(), Campaign, CampaignRow, Contact (+9 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "URL Routing and Migrations"
Cohesion: 0.08
Nodes (14): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+6 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.12
Nodes (52): download(), euroInput(), size(), Icon(), BackLink(), Stat(), useAction(), useToast() (+44 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.16
Nodes (15): Task, Meta, audit_log(), check_origin(), connections(), dashboard(), do_login(), do_logout() (+7 more)

### Community 11 - "Work.tsx"
Cohesion: 0.11
Nodes (39): saveBlob(), can, eur(), Badge(), Orb(), BOXES, CATEGORY, DocumentsPage() (+31 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.10
Nodes (29): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+21 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.08
Nodes (14): Notification, Meta, notifications(), AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests (+6 more)

### Community 14 - "Settings and Integration Checks"
Cohesion: 0.15
Nodes (17): settings(), test_connection(), config(), models(), graph(), graph_pages(), _token_request(), http() (+9 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.10
Nodes (25): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+17 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "api"
Cohesion: 0.11
Nodes (30): api(), ApiError, Tabs(), ResetPassword(), submit(), test(), save(), useTasks() (+22 more)

### Community 18 - "graph.py"
Cohesion: 0.19
Nodes (7): _drive_base(), _drive_token(), drive_upload(), _ensure_folder(), send_mail(), _upload_chunks(), UncertainSend

### Community 19 - "Admin.tsx"
Cohesion: 0.14
Nodes (33): stamp(), Empty(), ErrorBox(), Loading(), PageTitle(), ActivityPage(), AdminHome(), ConfigDialog() (+25 more)

### Community 21 - "finance/views.py"
Cohesion: 0.19
Nodes (8): _doc(), document_file(), documents(), export(), odoo_overview(), retry(), transactions(), vat()

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
Cohesion: 0.15
Nodes (33): actor(), body(), mark_read(), change_password(), create_task(), create_user(), test_connection(), import_transactions() (+25 more)

### Community 26 - "HttpError"
Cohesion: 0.16
Nodes (8): _task_fields(), update_task(), update_user(), classify(), review(), upload(), HttpError, import_contacts()

### Community 28 - "Frontend Translations"
Cohesion: 0.23
Nodes (11): setCsrf(), AuthProvider(), ATTRS, current, D, lang, P, setLang() (+3 more)

### Community 29 - "odoo.py"
Cohesion: 0.26
Nodes (6): _call(), extract(), _text_to_dict(), secure_url(), odoo_catalog(), odoo_overview()

### Community 51 - "promo/services.py"
Cohesion: 0.08
Nodes (19): LegacyScryptHasher, PasswordReset, digest(), forgot(), reset(), campaign_create(), campaign_dict(), campaign_update() (+11 more)

### Community 52 - "core/services.py"
Cohesion: 0.17
Nodes (12): Setting, uid(), save_secrets(), secret_values(), set_setting(), save_settings(), bank(), opensign() (+4 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "notify.py"
Cohesion: 0.29
Nodes (8): Backend-apps, AuditLog, Meta, assigned(), deadlines(), done(), involved(), notify()

### Community 56 - "api.py"
Cohesion: 0.29
Nodes (6): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), safe_error()

### Community 60 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.33
Nodes (5): Afspraken, API (alle onder /api), Frontend (frontend/src), Projectkaart Moonshine Backoffice, LegacyRedirect()

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
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `notify.py`?**
  _High betweenness centrality (0.335) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.055078416728902166 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.333) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.08123904149620105 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1422924901185771 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06271186440677966 - nodes in this community are weakly interconnected._
- **Should `formValues` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._