# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 187 files · ~105,592 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1696 nodes · 5570 edges · 97 communities (57 shown, 40 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 431 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6d46b7ca`
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
- Loading
- feedback/views.py
- planning/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- finance/views.py
- production/models.py
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
- Odoo
- audit
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
- test_api.py
- re
- Feedback.tsx
- claude.py
- Calendar.tsx
- MissingTests
- User
- Task
- test_feedback.py
- odoo.py
- LegacyScryptHasher
- 0005_staff_data.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 153 edges
2. `api()` - 115 edges
3. `audit()` - 101 edges
4. `Icon()` - 99 edges
5. `body()` - 81 edges
6. `HttpError` - 81 edges
7. `actor()` - 80 edges
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

## Communities (97 total, 40 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.10
Nodes (47): Act, Artist, Meta, Asset, Meta, Booking, Meta, act_create() (+39 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.08
Nodes (37): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+29 more)

### Community 2 - "queue.py"
Cohesion: 0.10
Nodes (17): Stack, safe_error(), Command, Job, Meta, Schedule, claim_next(), enqueue() (+9 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (42): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, _Canvas, _char_width(), _clean() (+34 more)

### Community 4 - "require"
Cohesion: 0.10
Nodes (38): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contracts() (+30 more)

### Community 5 - "Icon"
Cohesion: 0.10
Nodes (58): download(), fullDate(), today(), Icon(), Empty(), useAction(), Action, Meeting (+50 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "django_db"
Cohesion: 0.05
Nodes (24): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+16 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.11
Nodes (38): euroInput(), size(), BackLink(), Artist, ArtistPage(), save(), Rider(), Row (+30 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.21
Nodes (9): audit_log(), connections(), dashboard(), do_logout(), get_settings(), list_connections(), list_tasks(), list_users() (+1 more)

### Community 11 - "Work.tsx"
Cohesion: 0.06
Nodes (66): can, asDate(), dayNumber(), eur(), longDate(), monthShort(), shortDate(), stamp() (+58 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.11
Nodes (26): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, Transaction, Meta (+18 more)

### Community 13 - "ApiTests"
Cohesion: 0.13
Nodes (10): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, NextMeetingTests, ReleaseTests, RosterTests, VoyageDeliverableTests (+2 more)

### Community 14 - "core/services.py"
Cohesion: 0.19
Nodes (10): uid(), save_secrets(), secret_values(), save_settings(), bank(), opensign(), outlook(), send_email() (+2 more)

### Community 15 - "graph.py"
Cohesion: 0.11
Nodes (21): copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload(), _ensure_folder() (+13 more)

### Community 16 - "User"
Cohesion: 0.09
Nodes (19): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), avatar(), delete_avatar(), messages() (+11 more)

### Community 17 - "people.py"
Cohesion: 0.14
Nodes (20): CrewMember, Meta, Guest, Meta, copy_crew(), crew_dict(), crew_save(), _event() (+12 more)

### Community 18 - "body"
Cohesion: 0.14
Nodes (39): actor(), body(), test_connection(), import_transactions(), match(), post(), settle(), unlink() (+31 more)

### Community 19 - "Loading"
Cohesion: 0.11
Nodes (50): saveBlob(), Badge(), ErrorBox(), formValues(), Loading(), PageTitle(), useToast(), ActivityPage() (+42 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.13
Nodes (12): Track, Meta, comment(), create(), delete(), detail(), review(), stream() (+4 more)

### Community 21 - "planning/views.py"
Cohesion: 0.23
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
Cohesion: 0.18
Nodes (11): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+3 more)

### Community 26 - "production/models.py"
Cohesion: 0.14
Nodes (13): done(), next_catalog(), EventNote, Meta, Release, Meta, ReleaseStep, Meta (+5 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "HttpError"
Cohesion: 0.18
Nodes (12): change_password(), check_origin(), create_task(), create_user(), do_login(), task_dict(), _task_fields(), update_task() (+4 more)

### Community 51 - "promo/services.py"
Cohesion: 0.12
Nodes (25): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+17 more)

### Community 52 - "HttpError"
Cohesion: 0.15
Nodes (16): Action, Meta, add_action(), board(), create(), delete_action(), detail(), _err() (+8 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "promo/views.py"
Cohesion: 0.14
Nodes (14): campaign(), _campaign(), delete_campaign(), delete_contact(), delete_template(), dm_done(), edit_contact(), import_contacts() (+6 more)

### Community 56 - "production/models.py"
Cohesion: 0.13
Nodes (10): Command, stamp(), js(), when(), AuditLog, Meta, Setting, ProcessedMessage (+2 more)

### Community 57 - "settings"
Cohesion: 0.18
Nodes (14): settings(), test_connection(), config(), models(), graph(), graph_pages(), NoCredentialRedirect, labelgrid_http() (+6 more)

### Community 59 - "audit"
Cohesion: 0.17
Nodes (16): audit(), queue(), Command, ChecklistItem, Meta, Event, Meta, add_note() (+8 more)

### Community 60 - "drive.py"
Cohesion: 0.12
Nodes (19): drive_item(), archive_past(), asset_section(), conf(), enabled(), event_base(), event_files(), event_folder_name() (+11 more)

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
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "reset.py"
Cohesion: 0.19
Nodes (5): PasswordReset, digest(), forgot(), reset(), Migration

### Community 68 - "api"
Cohesion: 0.12
Nodes (22): api(), ApiError, ResetPassword(), submit(), test(), save(), useUsers(), TaskDialog() (+14 more)

### Community 69 - "settings"
Cohesion: 0.11
Nodes (16): download_item(), Command, Meeting, Meta, action_dict(), create(), extract(), heuristic() (+8 more)

### Community 70 - "feedback/services.py"
Cohesion: 0.18
Nodes (12): Command, Review, Meta, TrackLog, Meta, apply(), average(), display() (+4 more)

### Community 71 - "Event"
Cohesion: 0.13
Nodes (20): is_upcoming(), EventStep, Meta, Send, Meta, _active(), auto_check(), due() (+12 more)

### Community 74 - "test_api.py"
Cohesion: 0.14
Nodes (7): set_setting(), MicrosoftTokenTests, ResetTests, PlanningTests, PeopleTests, sample_xlsx(), EventFilesTests

### Community 75 - "re"
Cohesion: 0.16
Nodes (4): num(), who(), docx_text(), parse_date()

### Community 79 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 80 - "claude.py"
Cohesion: 0.11
Nodes (8): _call(), complete(), complete_json(), extract(), _text_to_dict(), send_mail(), secure_url(), UncertainSend

### Community 81 - "Calendar.tsx"
Cohesion: 0.20
Nodes (12): CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS, PLATFORMS (+4 more)

### Community 83 - "User"
Cohesion: 0.10
Nodes (12): Notification, Meta, User, assigned(), deadlines(), involved(), mark_read(), notifications() (+4 more)

### Community 84 - "Task"
Cohesion: 0.15
Nodes (4): Task, Meta, MeetingTests, TableTests

### Community 91 - "test_feedback.py"
Cohesion: 0.15
Nodes (7): docx(), fake(), FeedbackTests, options(), sheet(), NotifyTests, PromoTests

### Community 92 - "odoo.py"
Cohesion: 0.20
Nodes (4): graph_token(), _token_request(), odoo_catalog(), odoo_overview()

## Knowledge Gaps
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `PDF Writer` to `queue.py`?**
  _High betweenness centrality (0.346) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0957372466806429 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `PDF Writer` to `Frontend Auth Context`?**
  _High betweenness centrality (0.345) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07704918032786885 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10037878787878787 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.05547785547785548 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.0977891156462585 - nodes in this community are weakly interconnected._