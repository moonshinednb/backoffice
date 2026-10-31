# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 186 files · ~104,393 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1681 nodes · 5522 edges · 94 communities (52 shown, 42 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 425 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `edb0b3b4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Icon
- Frontend Dependencies
- django_db
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Work.tsx
- Accounting and Invoice Models
- ApiTests
- core/services.py
- graph.py
- User
- people.py
- body
- useToast
- feedback/views.py
- planning/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- finance/views.py
- EventChecklist.tsx
- connect.sh
- Frontend Translations
- core/migrations/0001_initial.py
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- HttpError
- ssh.sh
- Moonshine Backoffice
- promo/views.py
- production/models.py
- settings
- Odoo
- audit
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- planning/services.py
- api
- settings
- feedback/services.py
- Event
- urls.py
- test_api.py
- import_track_feedback.py
- Feedback.tsx
- datetime
- MissingTests
- User
- test_meetings.py
- test_promo.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 151 edges
2. `api()` - 114 edges
3. `audit()` - 100 edges
4. `Icon()` - 98 edges
5. `body()` - 80 edges
6. `HttpError` - 80 edges
7. `actor()` - 79 edges
8. `post()` - 72 edges
9. `Loading()` - 60 edges
10. `useToast()` - 59 edges

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

## Communities (94 total, 42 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.09
Nodes (48): Act, Artist, Meta, Asset, Meta, Booking, Meta, act_create() (+40 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (50): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+42 more)

### Community 2 - "queue.py"
Cohesion: 0.12
Nodes (14): Stack, safe_error(), Command, Job, Meta, Schedule, claim_next(), handlers() (+6 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (42): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, _Canvas, _char_width(), _clean() (+34 more)

### Community 4 - "require"
Cohesion: 0.10
Nodes (35): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contracts() (+27 more)

### Community 5 - "Icon"
Cohesion: 0.09
Nodes (85): download(), fullDate(), stamp(), today(), Icon(), Badge(), Empty(), ErrorBox() (+77 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "django_db"
Cohesion: 0.06
Nodes (19): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+11 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.12
Nodes (39): euroInput(), BackLink(), formValues(), Artist, ArtistPage(), save(), uploadPhoto(), Rider() (+31 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.14
Nodes (17): AuditLog, Meta, LoginAttempt, Setting, audit_log(), check_origin(), connections(), dashboard() (+9 more)

### Community 11 - "Work.tsx"
Cohesion: 0.09
Nodes (53): saveBlob(), can, asDate(), dayNumber(), eur(), longDate(), monthShort(), shortDate() (+45 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.10
Nodes (26): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+18 more)

### Community 13 - "ApiTests"
Cohesion: 0.13
Nodes (10): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, ReleaseTests, RosterTests, VoyageDeliverableTests, VoyageTests (+2 more)

### Community 14 - "core/services.py"
Cohesion: 0.20
Nodes (11): uid(), save_secrets(), secret_values(), save_settings(), bank(), opensign(), outlook(), import_csv() (+3 more)

### Community 15 - "graph.py"
Cohesion: 0.11
Nodes (21): create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload(), _ensure_folder(), ensure_path() (+13 more)

### Community 16 - "User"
Cohesion: 0.13
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "people.py"
Cohesion: 0.13
Nodes (22): CrewMember, Meta, Guest, Meta, copy_crew(), crew_dict(), crew_save(), _event() (+14 more)

### Community 18 - "body"
Cohesion: 0.12
Nodes (39): actor(), body(), PasswordReset, mark_read(), digest(), forgot(), reset(), test_connection() (+31 more)

### Community 19 - "useToast"
Cohesion: 0.11
Nodes (20): Tabs(), useToast(), AdminLayout(), ConfigDialog(), EventRoles(), KEY_PROVIDER, KEYS, KeysPage() (+12 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.08
Nodes (15): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), comment(), create(), delete() (+7 more)

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
Cohesion: 0.14
Nodes (15): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+7 more)

### Community 26 - "EventChecklist.tsx"
Cohesion: 0.29
Nodes (9): AUTO_LABEL, autoFolder(), EventChecklist(), Mine, MyEventSteps(), Owner(), relative(), Step (+1 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "core/migrations/0001_initial.py"
Cohesion: 0.17
Nodes (4): Migration, Migration, Migration, Migration

### Community 51 - "promo/services.py"
Cohesion: 0.13
Nodes (24): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+16 more)

### Community 52 - "HttpError"
Cohesion: 0.11
Nodes (22): change_password(), create_task(), create_user(), _task_fields(), update_task(), update_user(), HttpError, Action (+14 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "promo/views.py"
Cohesion: 0.11
Nodes (19): add_contact(), campaign(), _campaign(), campaigns(), contacts(), create_campaign(), delete_campaign(), delete_contact() (+11 more)

### Community 56 - "production/models.py"
Cohesion: 0.14
Nodes (12): Command, stamp(), js(), when(), Contract, Meta, EventNote, Meta (+4 more)

### Community 57 - "settings"
Cohesion: 0.09
Nodes (16): test_connection(), config(), models(), graph(), graph_pages(), graph_token(), send_mail(), NoCredentialRedirect (+8 more)

### Community 58 - "Odoo"
Cohesion: 0.29
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 59 - "audit"
Cohesion: 0.22
Nodes (15): audit(), queue(), ChecklistItem, Meta, Event, Meta, add_note(), booking_add() (+7 more)

### Community 60 - "drive.py"
Cohesion: 0.10
Nodes (22): drive_item(), archive_past(), asset_section(), conf(), enabled(), event_base(), event_files(), event_folder_name() (+14 more)

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
Cohesion: 0.08
Nodes (19): LegacyScryptHasher, Command, Meeting, Meta, OutlookLink, Meta, _box(), check() (+11 more)

### Community 68 - "api"
Cohesion: 0.10
Nodes (25): api(), ApiError, size(), ResetPassword(), submit(), test(), toggle(), AssetRow() (+17 more)

### Community 69 - "settings"
Cohesion: 0.10
Nodes (20): settings(), _call(), complete(), complete_json(), extract(), _text_to_dict(), copy_item(), download_item() (+12 more)

### Community 70 - "feedback/services.py"
Cohesion: 0.26
Nodes (9): TrackLog, Meta, apply(), average(), display(), review_dict(), save_review(), score() (+1 more)

### Community 71 - "Event"
Cohesion: 0.13
Nodes (20): Task, Meta, is_upcoming(), EventStep, Meta, _active(), auto_check(), due() (+12 more)

### Community 74 - "test_api.py"
Cohesion: 0.15
Nodes (7): set_setting(), MicrosoftTokenTests, ResetTests, PlanningTests, PeopleTests, sample_xlsx(), EventFilesTests

### Community 75 - "import_track_feedback.py"
Cohesion: 0.13
Nodes (13): Command, num(), who(), Review, Meta, Track, Meta, docx() (+5 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 83 - "User"
Cohesion: 0.09
Nodes (17): Notification, Meta, User, assigned(), deadlines(), done(), involved(), notifications() (+9 more)

## Knowledge Gaps
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `PDF Writer` to `queue.py`?**
  _High betweenness centrality (0.344) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09155844155844156 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `PDF Writer` to `Frontend Auth Context`?**
  _High betweenness centrality (0.343) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.06220095693779904 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.05547785547785548 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.10434782608695652 - nodes in this community are weakly interconnected._