# Graph Report - backoffice  (2026-10-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1105 nodes · 3494 edges · 50 communities (28 shown, 22 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 243 edges (avg confidence: 0.93)
- Token cost: 43,017 input · 673 output

## Graph Freshness
- Built from commit: `004a5dc3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Legacy Data Import
- Frontend Auth Context
- API Errors and Notifications
- PDF Writer
- Role-Based Actions
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
- Invoice Mail Ingestion
- TypeScript Config
- Django App Configs
- Date Formatting Utilities
- Admin Settings Page
- Provider Errors and Uploads
- Frontend Translations
- Legacy Password Hasher
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations

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
- `Command` --uses--> `AuditLog`  [INFERRED]
  backend/core/management/commands/import_legacy.py → backend/core/models.py
- `Command` --uses--> `Task`  [INFERRED]
  backend/core/management/commands/import_legacy.py → backend/core/models.py
- `Command` --uses--> `User`  [INFERRED]
  backend/core/management/commands/import_legacy.py → backend/core/models.py
- `Command` --uses--> `Document`  [INFERRED]
  backend/core/management/commands/import_legacy.py → backend/finance/models.py
- `Command` --uses--> `ProcessedMessage`  [INFERRED]
  backend/core/management/commands/import_legacy.py → backend/finance/models.py

## Import Cycles
- None detected.

## Communities (50 total, 22 thin omitted)

### Community 0 - "Legacy Data Import"
Cohesion: 0.05
Nodes (89): Command, stamp(), js(), when(), Setting, done(), audit(), Act (+81 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.07
Nodes (41): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+33 more)

### Community 2 - "API Errors and Notifications"
Cohesion: 0.06
Nodes (37): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), deadlines(), involved(), notifications() (+29 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "Role-Based Actions"
Cohesion: 0.12
Nodes (51): actor(), body(), require(), mark_read(), import_transactions(), match(), post(), settle() (+43 more)

### Community 5 - "Shared UI Components"
Cohesion: 0.12
Nodes (51): saveBlob(), Icon(), Badge(), Empty(), ErrorBox(), Loading(), PageTitle(), Stat() (+43 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "URL Routing and Migrations"
Cohesion: 0.06
Nodes (15): spa(), Migration, Migration, Migration, Migration, Migration, Migration, Migration (+7 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.13
Nodes (44): download(), euroInput(), BackLink(), formValues(), useToast(), Artist, ArtistPage(), save() (+36 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "User and Task Models"
Cohesion: 0.09
Nodes (29): AuditLog, Meta, LoginAttempt, Task, Meta, User, assigned(), set_setting() (+21 more)

### Community 11 - "Finance and Integrations Pages"
Cohesion: 0.11
Nodes (39): can, eur(), Orb(), IntegrationsPage(), BOXES, CATEGORY, DocumentsPage(), FILTERS (+31 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.11
Nodes (25): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+17 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.10
Nodes (9): Notification, Meta, ApiTests, ChatProfileTests, ResetTests, MissingTests, ReleaseTests, NotifyTests (+1 more)

### Community 14 - "Settings and Integration Checks"
Cohesion: 0.16
Nodes (15): secret_values(), settings(), test_connection(), extract(), models(), http(), NoCredentialRedirect, secure_url() (+7 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.11
Nodes (24): Contact, Meta, Recipient, Meta, Template, Meta, set_recipients(), add_contact() (+16 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.11
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "API Client and Tasks"
Cohesion: 0.11
Nodes (22): api(), ApiError, size(), ResetPassword(), submit(), test(), save(), TaskRow() (+14 more)

### Community 18 - "Password Reset and Webhooks"
Cohesion: 0.15
Nodes (8): PasswordReset, digest(), forgot(), reset(), bank(), opensign(), outlook(), insert_transactions()

### Community 19 - "Microsoft Graph Integration"
Cohesion: 0.15
Nodes (12): save_secrets(), _drive_base(), _drive_token(), drive_upload(), _ensure_folder(), graph(), graph_pages(), graph_token() (+4 more)

### Community 20 - "Odoo Integration"
Cohesion: 0.25
Nodes (4): uid(), Odoo, odoo_catalog(), odoo_overview()

### Community 21 - "Invoice Mail Ingestion"
Cohesion: 0.16
Nodes (11): ingest(), poll_mail(), _doc(), document_file(), documents(), export(), odoo_overview(), retry() (+3 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.12
Nodes (5): CoreConfig, FinanceConfig, JobsConfig, ProductionConfig, PromoConfig

### Community 24 - "Date Formatting Utilities"
Cohesion: 0.30
Nodes (14): asDate(), dayNumber(), fullDate(), longDate(), monthShort(), shortDate(), stamp(), today() (+6 more)

### Community 25 - "Admin Settings Page"
Cohesion: 0.14
Nodes (10): AdminHome(), KEYS, Kind, Provider, PROVIDERS, ROLES, Settings, Spec (+2 more)

### Community 26 - "Provider Errors and Uploads"
Cohesion: 0.18
Nodes (6): classify(), review(), upload(), HttpError, import_contacts(), save_template()

### Community 28 - "Frontend Translations"
Cohesion: 0.31
Nodes (8): ATTRS, current, D, Lang, P, start(), t(), translateNode()

## Knowledge Gaps
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `audit()` connect `Legacy Data Import` to `API Errors and Notifications`, `User and Task Models`, `Accounting and Invoice Models`, `Settings and Integration Checks`, `Promo Mailing`, `Chat and Access Helpers`, `Password Reset and Webhooks`, `Invoice Mail Ingestion`, `Provider Errors and Uploads`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `Legacy Data Import` be split into smaller, more focused modules?**
  _Cohesion score 0.05028665028665029 - nodes in this community are weakly interconnected._
- **Why does `require()` connect `Role-Based Actions` to `User and Task Models`, `Promo Mailing`, `Chat and Access Helpers`, `Invoice Mail Ingestion`, `Provider Errors and Uploads`, `Asset Upload`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07403846153846154 - nodes in this community are weakly interconnected._
- **Why does `User` connect `User and Task Models` to `Legacy Data Import`, `API Errors and Notifications`, `URL Routing and Migrations`, `Notifications and API Tests`, `Chat and Access Helpers`, `Password Reset and Webhooks`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `API Errors and Notifications` be split into smaller, more focused modules?**
  _Cohesion score 0.055299539170506916 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.0633879781420765 - nodes in this community are weakly interconnected._