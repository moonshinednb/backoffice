# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 192 files · ~108,809 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1732 nodes · 5715 edges · 96 communities (54 shown, 42 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 445 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a20f0473`
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
- django_db_models_deletion
- Artist Pages and Riders
- Docker Compose Setup
- Admin.tsx
- Work.tsx
- Accounting and Invoice Models
- ApiTests
- core/views.py
- graph.py
- User
- people.py
- requests.py
- Promo.tsx
- feedback/views.py
- planning/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- core/migrations/0001_initial.py
- Release
- connect.sh
- Frontend Translations
- HttpError
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
- EventChecklist.tsx
- Event
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- planning/services.py
- reset.py
- api
- settings
- feedback/services.py
- Event
- urls.py
- test_people.py
- import_track_feedback.py
- Feedback.tsx
- graph.py
- Projectkaart Moonshine Backoffice
- MissingTests
- User
- EventChecklistTests
- LegacyScryptHasher
- django_db

## God Nodes (most connected - your core abstractions)
1. `require()` - 157 edges
2. `api()` - 120 edges
3. `audit()` - 104 edges
4. `Icon()` - 103 edges
5. `HttpError` - 86 edges
6. `body()` - 84 edges
7. `actor()` - 82 edges
8. `post()` - 74 edges
9. `Loading()` - 62 edges
10. `useToast()` - 61 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `send_mail()`  [INFERRED]
  ARCHITECTURE.md → backend/integrations/graph.py
- `Stack` --references--> `Job`  [INFERRED]
  ARCHITECTURE.md → backend/jobs/models.py

## Import Cycles
- None detected.

## Communities (96 total, 42 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.10
Nodes (46): Act, Artist, Meta, Asset, Meta, Booking, Meta, act_create() (+38 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (56): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+48 more)

### Community 2 - "queue.py"
Cohesion: 0.08
Nodes (27): deadlines(), notify(), audit(), safe_error(), process_document(), Command, Job, Meta (+19 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.08
Nodes (68): actor(), body(), require(), classify(), review(), add_act(), add_booking(), add_check() (+60 more)

### Community 5 - "Icon"
Cohesion: 0.11
Nodes (60): fullDate(), Icon(), Empty(), ErrorBox(), formValues(), Loading(), PageTitle(), Stat() (+52 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "django_db_models_deletion"
Cohesion: 0.09
Nodes (10): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+2 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.11
Nodes (57): download(), euroInput(), longDate(), BackLink(), Badge(), useAction(), Artist, ArtistPage() (+49 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "Admin.tsx"
Cohesion: 0.10
Nodes (17): AdminLayout(), KEY_PROVIDER, KEYS, KeysPage(), save(), test(), testAll(), Kind (+9 more)

### Community 11 - "Work.tsx"
Cohesion: 0.09
Nodes (49): saveBlob(), asDate(), dayNumber(), eur(), monthShort(), ROLE, shortDate(), stamp() (+41 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.07
Nodes (32): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, Transaction, Meta (+24 more)

### Community 13 - "ApiTests"
Cohesion: 0.11
Nodes (11): ApiTests, ChatProfileTests, KeyTestTests, ResetTests, TaskAssigneesTests, ReleaseTests, RosterTests, VoyageDeliverableTests (+3 more)

### Community 14 - "core/views.py"
Cohesion: 0.08
Nodes (26): AuditLog, Meta, LoginAttempt, Setting, uid(), save_secrets(), secret_values(), set_setting() (+18 more)

### Community 15 - "graph.py"
Cohesion: 0.11
Nodes (20): copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload(), _ensure_folder() (+12 more)

### Community 16 - "User"
Cohesion: 0.09
Nodes (19): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), avatar(), delete_avatar(), messages() (+11 more)

### Community 17 - "people.py"
Cohesion: 0.12
Nodes (22): section(), CrewMember, Meta, Guest, Meta, copy_crew(), crew_dict(), crew_save() (+14 more)

### Community 18 - "requests.py"
Cohesion: 0.22
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "Promo.tsx"
Cohesion: 0.13
Nodes (14): size(), Orb(), Check, Pack(), Preview, SendDialog(), submit(), Campaign (+6 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.11
Nodes (12): TrackLog, Meta, comment(), create(), delete(), detail(), review(), stream() (+4 more)

### Community 21 - "planning/views.py"
Cohesion: 0.21
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

### Community 25 - "core/migrations/0001_initial.py"
Cohesion: 0.14
Nodes (5): Migration, Migration, Migration, Migration, Migration

### Community 26 - "Release"
Cohesion: 0.08
Nodes (21): Backend-apps, Notification, Meta, done(), involved(), mark_read(), notifications(), post_document() (+13 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "HttpError"
Cohesion: 0.12
Nodes (15): change_password(), check_origin(), create_task(), create_user(), do_login(), _task_fields(), update_task(), update_user() (+7 more)

### Community 51 - "promo/services.py"
Cohesion: 0.14
Nodes (22): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+14 more)

### Community 52 - "HttpError"
Cohesion: 0.10
Nodes (21): Command, Action, Meta, Meeting, Meta, MeetingTests, NextMeetingTests, TableTests (+13 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "promo/views.py"
Cohesion: 0.10
Nodes (24): import_transactions(), match(), post(), settle(), unlink(), add_contact(), campaign(), _campaign() (+16 more)

### Community 56 - "production/models.py"
Cohesion: 0.13
Nodes (11): Command, stamp(), js(), when(), ProcessedMessage, EventNote, Meta, LabelStatement (+3 more)

### Community 57 - "settings"
Cohesion: 0.14
Nodes (13): settings(), AiProviderTests, archive_onedrive(), poll_mail(), test_connection(), config(), models(), odoo_catalog() (+5 more)

### Community 58 - "EventChecklist.tsx"
Cohesion: 0.29
Nodes (9): AUTO_LABEL, autoFolder(), EventChecklist(), Mine, MyEventSteps(), Owner(), relative(), Step (+1 more)

### Community 59 - "Event"
Cohesion: 0.16
Nodes (9): queue(), Event, Meta, booking_add(), event_create(), event_update(), seed_checklist(), DriveTreeTests (+1 more)

### Community 60 - "drive.py"
Cohesion: 0.13
Nodes (15): drive_item(), archive_past(), conf(), enabled(), event_base(), event_files(), event_folder_name(), _parent_path() (+7 more)

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
Nodes (16): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+8 more)

### Community 67 - "reset.py"
Cohesion: 0.27
Nodes (5): PasswordReset, digest(), forgot(), reset(), send_email()

### Community 68 - "api"
Cohesion: 0.10
Nodes (32): api(), ApiError, useToast(), ResetPassword(), submit(), EventRoles(), test(), AppointmentDialog() (+24 more)

### Community 69 - "settings"
Cohesion: 0.10
Nodes (20): _call(), complete(), complete_json(), extract(), _text_to_dict(), download_item(), secure_url(), action_dict() (+12 more)

### Community 70 - "feedback/services.py"
Cohesion: 0.43
Nodes (7): apply(), average(), display(), review_dict(), save_review(), score(), track_dict()

### Community 71 - "Event"
Cohesion: 0.11
Nodes (22): Task, Meta, assigned(), make_task(), is_upcoming(), EventStep, Meta, _active() (+14 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.13
Nodes (13): Command, num(), who(), Review, Meta, Track, Meta, docx() (+5 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 80 - "graph.py"
Cohesion: 0.10
Nodes (12): MicrosoftTokenTests, graph(), graph_pages(), graph_token(), send_mail(), _token_request(), _upload_chunks(), NoCredentialRedirect (+4 more)

### Community 81 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.29
Nodes (6): Afspraken, API (alle onder /api), Frontend (frontend/src), Projectkaart Moonshine Backoffice, Stack, LegacyRedirect()

### Community 96 - "django_db"
Cohesion: 0.08
Nodes (11): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+3 more)

## Knowledge Gaps
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `Release`?**
  _High betweenness centrality (0.355) - this node is a cross-community bridge._
- **Are the 77 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 77 INFERRED edges - model-reasoned connections that need verification._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09643605870020965 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.354) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.0576592082616179 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08194905869324474 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06428988895382817 - nodes in this community are weakly interconnected._