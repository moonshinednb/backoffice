# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 144 files · ~82,169 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1321 nodes · 4164 edges · 79 communities (45 shown, 34 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 309 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20e838f9`
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
- core/models.py
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Work.tsx
- Accounting and Invoice Models
- Notifications and API Tests
- http
- Promo Mailing
- Chat and Access Helpers
- api
- graph.py
- Admin.tsx
- Odoo Integration
- finance/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- body
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
- json
- ssh.sh
- Moonshine Backoffice
- notify.py
- api.py
- urls.py
- feedback/views.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- settings
- reset.py
- Release
- User
- LegacyScryptHasher
- Projectkaart Moonshine Backoffice
- import_contacts
- MissingTests
- test_feedback.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 108 edges
2. `api()` - 89 edges
3. `Icon()` - 79 edges
4. `audit()` - 76 edges
5. `body()` - 63 edges
6. `actor()` - 58 edges
7. `post()` - 56 edges
8. `HttpError` - 56 edges
9. `useToast()` - 47 edges
10. `settings()` - 44 edges

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

## Communities (79 total, 34 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.06
Nodes (79): audit(), handlers(), next_catalog(), queue(), Act, Artist, Meta, Asset (+71 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.10
Nodes (35): Options, Auth, AuthContext, useAuth(), User, ROLE, size(), Icon() (+27 more)

### Community 2 - "queue.py"
Cohesion: 0.11
Nodes (14): Stack, deadlines(), safe_error(), Command, Job, Meta, Schedule, claim_next() (+6 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (37): Backend-apps, _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table() (+29 more)

### Community 4 - "require"
Cohesion: 0.17
Nodes (23): require(), advancing_pdf(), artist(), artists(), asset_file(), booking(), contracts(), delete_act() (+15 more)

### Community 5 - "Label.tsx"
Cohesion: 0.10
Nodes (33): Badge(), useAction(), avg(), DECISION, FeedbackList(), FeedbackTrack(), grade(), mark() (+25 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "core/models.py"
Cohesion: 0.07
Nodes (17): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+9 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.11
Nodes (56): download(), euroInput(), stamp(), BackLink(), formValues(), useToast(), Artist, ArtistPage() (+48 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.13
Nodes (22): AuditLog, Meta, LoginAttempt, Task, Meta, assigned(), audit_log(), check_origin() (+14 more)

### Community 11 - "Work.tsx"
Cohesion: 0.09
Nodes (51): can, asDate(), dayNumber(), eur(), fullDate(), longDate(), monthShort(), shortDate() (+43 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.14
Nodes (22): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, Transaction, Meta (+14 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.14
Nodes (11): set_setting(), AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests, ReleaseTests (+3 more)

### Community 14 - "http"
Cohesion: 0.20
Nodes (13): test_connection(), _ensure_folder(), graph(), graph_pages(), http(), NoCredentialRedirect, labelgrid_http(), labelgrid_pull() (+5 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.12
Nodes (20): Contact, Meta, add_contact(), campaign(), _campaign(), campaigns(), contacts(), create_campaign() (+12 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "api"
Cohesion: 0.15
Nodes (18): api(), ApiError, ResetPassword(), submit(), test(), KeysPage(), save(), test() (+10 more)

### Community 18 - "graph.py"
Cohesion: 0.20
Nodes (8): download_path(), _drive_base(), drive_item(), _drive_token(), drive_upload(), ensure_path(), rename_item(), _upload_chunks()

### Community 19 - "Admin.tsx"
Cohesion: 0.08
Nodes (47): saveBlob(), today(), Empty(), ErrorBox(), Loading(), PageTitle(), Stat(), ToastProvider() (+39 more)

### Community 21 - "finance/views.py"
Cohesion: 0.15
Nodes (14): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+6 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.11
Nodes (6): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.16
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "body"
Cohesion: 0.11
Nodes (35): actor(), body(), mark_read(), change_password(), create_user(), save_settings(), test_connection(), comment() (+27 more)

### Community 26 - "import_legacy.py"
Cohesion: 0.11
Nodes (9): Command, stamp(), js(), when(), Setting, ProcessedMessage, Migration, LabelStatement (+1 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.23
Nodes (11): setCsrf(), AuthProvider(), ATTRS, current, D, lang, P, setLang() (+3 more)

### Community 29 - "claude.py"
Cohesion: 0.20
Nodes (7): poll_mail(), _call(), config(), extract(), models(), _text_to_dict(), secure_url()

### Community 51 - "promo/services.py"
Cohesion: 0.12
Nodes (24): send_mail(), UncertainSend, Campaign, Meta, Recipient, Meta, Template, Meta (+16 more)

### Community 52 - "json"
Cohesion: 0.31
Nodes (9): secret_values(), bank(), opensign(), outlook(), import_csv(), insert_transactions(), transaction_values(), Contract (+1 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "notify.py"
Cohesion: 0.21
Nodes (6): Notification, Meta, done(), involved(), notifications(), notify()

### Community 56 - "api.py"
Cohesion: 0.33
Nodes (5): auth_error(), http_error(), runtime_error(), unexpected(), value_error()

### Community 59 - "feedback/views.py"
Cohesion: 0.14
Nodes (10): Track, Meta, TrackLog, Meta, delete(), detail(), stream(), _track() (+2 more)

### Community 60 - "drive.py"
Cohesion: 0.28
Nodes (10): conf(), enabled(), event_folder_name(), _place(), release_folder_name(), sync_booking(), sync_event(), sync_release() (+2 more)

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

### Community 66 - "settings"
Cohesion: 0.16
Nodes (8): save_secrets(), settings(), get_settings(), graph_token(), _token_request(), odoo_catalog(), odoo_overview(), send_email()

### Community 67 - "reset.py"
Cohesion: 0.18
Nodes (5): PasswordReset, digest(), forgot(), reset(), ingest()

### Community 68 - "Release"
Cohesion: 0.13
Nodes (15): Command, docx_text(), num(), who(), Review, Meta, apply(), average() (+7 more)

### Community 71 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.33
Nodes (5): Afspraken, API (alle onder /api), Frontend (frontend/src), Projectkaart Moonshine Backoffice, LegacyRedirect()

### Community 75 - "test_feedback.py"
Cohesion: 0.20
Nodes (5): docx(), fake(), FeedbackTests, options(), sheet()

## Knowledge Gaps
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `PDF Writer`?**
  _High betweenness centrality (0.312) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06235069278547539 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Admin.tsx`?**
  _High betweenness centrality (0.310) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.09713487071977638 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1103448275862069 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06448087431693988 - nodes in this community are weakly interconnected._
- **Should `Label.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10121457489878542 - nodes in this community are weakly interconnected._