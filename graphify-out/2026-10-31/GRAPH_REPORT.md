# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 178 files · ~96,310 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1557 nodes · 4991 edges · 95 communities (53 shown, 42 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 375 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8af47193`
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
- api.py
- promo/views.py
- User
- Calendar.tsx
- graph.py
- format.ts
- drive_tidy.py
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
- Admin.tsx
- Promo.tsx
- providers.py
- Odoo
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
- urls.py
- MissingTests
- test_feedback.py
- Feedback.tsx
- Release
- Asset
- poll_mail
- Notification
- .login
- 0005_staff_data.py
- Meeting

## God Nodes (most connected - your core abstractions)
1. `require()` - 133 edges
2. `api()` - 106 edges
3. `Icon()` - 92 edges
4. `audit()` - 89 edges
5. `HttpError` - 75 edges
6. `body()` - 73 edges
7. `actor()` - 67 edges
8. `post()` - 65 edges
9. `useToast()` - 56 edges
10. `Loading()` - 55 edges

## Surprising Connections (you probably didn't know these)
- `Backend-apps` --references--> `done()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py

## Import Cycles
- None detected.

## Communities (95 total, 42 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.13
Nodes (38): Act, Artist, Meta, Booking, Meta, act_create(), act_delete(), act_dict() (+30 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.11
Nodes (33): Options, Auth, AuthContext, useAuth(), User, ROLE, Icon(), PATHS (+25 more)

### Community 2 - "queue.py"
Cohesion: 0.09
Nodes (18): Stack, AuditLog, Meta, uid(), safe_error(), dashboard(), Command, Job (+10 more)

### Community 3 - "PDF Writer"
Cohesion: 0.05
Nodes (43): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, connections(), _Canvas, _char_width() (+35 more)

### Community 4 - "require"
Cohesion: 0.10
Nodes (53): actor(), body(), require(), mark_read(), test_connection(), opensign_create(), add_act(), add_booking() (+45 more)

### Community 5 - "Label.tsx"
Cohesion: 0.10
Nodes (48): saveBlob(), fullDate(), Empty(), ErrorBox(), Loading(), PageTitle(), Area(), LEGACY (+40 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "core/models.py"
Cohesion: 0.06
Nodes (20): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+12 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.11
Nodes (58): download(), euroInput(), BackLink(), formValues(), useAction(), useToast(), Artist, ArtistPage() (+50 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.15
Nodes (19): LoginAttempt, audit_log(), change_password(), check_origin(), create_task(), create_user(), do_login(), get_settings() (+11 more)

### Community 11 - "Work.tsx"
Cohesion: 0.10
Nodes (46): can, eur(), size(), Badge(), Orb(), Stat(), BOXES, CATEGORY (+38 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.13
Nodes (23): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, Transaction, Meta (+15 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.12
Nodes (15): save_secrets(), set_setting(), AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests (+7 more)

### Community 14 - "api.py"
Cohesion: 0.16
Nodes (10): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), bank(), opensign(), outlook() (+2 more)

### Community 15 - "promo/views.py"
Cohesion: 0.11
Nodes (23): Campaign, Meta, Contact, Meta, Template, Meta, campaign(), _campaign() (+15 more)

### Community 16 - "User"
Cohesion: 0.09
Nodes (15): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+7 more)

### Community 17 - "Calendar.tsx"
Cohesion: 0.12
Nodes (19): AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS (+11 more)

### Community 18 - "graph.py"
Cohesion: 0.15
Nodes (16): copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload(), _ensure_folder() (+8 more)

### Community 19 - "format.ts"
Cohesion: 0.34
Nodes (12): asDate(), dayNumber(), longDate(), monthShort(), shortDate(), stamp(), today(), locale() (+4 more)

### Community 20 - "drive_tidy.py"
Cohesion: 0.13
Nodes (8): classify(), folder_date(), _free(), normal_name(), plan(), tidy_event(), undo(), Command

### Community 21 - "planning/views.py"
Cohesion: 0.17
Nodes (12): ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content(), delete_content() (+4 more)

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
Cohesion: 0.13
Nodes (18): do_logout(), classify(), _doc(), document_file(), documents(), export(), import_transactions(), match() (+10 more)

### Community 26 - "import_legacy.py"
Cohesion: 0.12
Nodes (9): Command, stamp(), js(), when(), Setting, ProcessedMessage, Migration, LabelStatement (+1 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.23
Nodes (11): setCsrf(), AuthProvider(), ATTRS, current, D, lang, P, setLang() (+3 more)

### Community 29 - "claude.py"
Cohesion: 0.22
Nodes (8): _call(), complete(), complete_json(), extract(), _text_to_dict(), download_item(), secure_url(), parse_date()

### Community 51 - "promo/services.py"
Cohesion: 0.12
Nodes (23): notify(), send_mail(), UncertainSend, enqueue(), send(), Recipient, Meta, campaign_create() (+15 more)

### Community 52 - "settings"
Cohesion: 0.10
Nodes (17): Task, Meta, assigned(), deadlines(), done(), involved(), action_dict(), create() (+9 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "Admin.tsx"
Cohesion: 0.12
Nodes (12): Tabs(), AdminLayout(), KEY_PROVIDER, KEYS, Kind, Provider, PROVIDERS, ROLES (+4 more)

### Community 56 - "Promo.tsx"
Cohesion: 0.17
Nodes (10): Campaign, CampaignRow, Contact, GROUP, KIND, PromoCampaign(), save(), Recipient (+2 more)

### Community 57 - "providers.py"
Cohesion: 0.11
Nodes (14): secret_values(), test_connection(), config(), models(), graph(), graph_pages(), NoCredentialRedirect, odoo_catalog() (+6 more)

### Community 59 - "feedback/views.py"
Cohesion: 0.12
Nodes (10): comment(), create(), delete(), detail(), review(), stream(), _track(), tracks() (+2 more)

### Community 60 - "drive.py"
Cohesion: 0.13
Nodes (17): drive_item(), archive_past(), conf(), enabled(), event_files(), event_folder_name(), is_upcoming(), _parent_path() (+9 more)

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
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "settings"
Cohesion: 0.18
Nodes (8): PasswordReset, digest(), forgot(), reset(), settings(), archive_onedrive(), poll_odoo_bank(), send_email()

### Community 68 - "api"
Cohesion: 0.11
Nodes (23): api(), ApiError, ResetPassword(), submit(), test(), KeysPage(), save(), test() (+15 more)

### Community 69 - "meetings/views.py"
Cohesion: 0.17
Nodes (14): Action, Meta, add_action(), board(), create(), delete_action(), detail(), _err() (+6 more)

### Community 71 - "audit"
Cohesion: 0.18
Nodes (18): audit(), queue(), ChecklistItem, Meta, Event, Meta, artist_delete(), asset_add_file() (+10 more)

### Community 75 - "test_feedback.py"
Cohesion: 0.09
Nodes (21): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+13 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 80 - "Release"
Cohesion: 0.11
Nodes (16): next_catalog(), EventNote, Meta, Release, Meta, ReleaseStep, Meta, Send (+8 more)

### Community 81 - "Asset"
Cohesion: 0.28
Nodes (7): Asset, Meta, asset_content(), asset_delete(), asset_get(), add_assets(), sync_asset()

### Community 83 - "Notification"
Cohesion: 0.40
Nodes (3): Notification, Meta, notifications()

### Community 95 - "Meeting"
Cohesion: 0.16
Nodes (5): Command, Meeting, Meta, MeetingTests, TableTests

## Knowledge Gaps
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `PDF Writer` to `queue.py`?**
  _High betweenness centrality (0.330) - this node is a cross-community bridge._
- **Are the 66 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 66 INFERRED edges - model-reasoned connections that need verification._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12513842746400886 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `PDF Writer` to `Label.tsx`?**
  _High betweenness centrality (0.329) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.10530612244897959 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09411764705882353 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.052429667519181586 - nodes in this community are weakly interconnected._