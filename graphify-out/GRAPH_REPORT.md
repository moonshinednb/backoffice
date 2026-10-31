# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 182 files · ~100,758 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1618 nodes · 5262 edges · 93 communities (54 shown, 39 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 411 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8fed0dd9`
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
- core/models.py
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Work.tsx
- Accounting and Invoice Models
- ApiTests
- core/services.py
- promo/views.py
- User
- Calendar.tsx
- HttpError
- format.ts
- drive_tidy.py
- planning/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- finance/views.py
- useAction
- connect.sh
- Frontend Translations
- devDependencies
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- User
- ssh.sh
- Moonshine Backoffice
- Admin.tsx
- Projectkaart Moonshine Backoffice
- settings
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
- meetings/services.py
- LegacyScryptHasher
- Event
- urls.py
- MissingTests
- test_feedback.py
- Feedback.tsx
- Release
- Send
- scripts
- Notification
- test_planning.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 141 edges
2. `api()` - 110 edges
3. `audit()` - 94 edges
4. `Icon()` - 94 edges
5. `HttpError` - 77 edges
6. `body()` - 75 edges
7. `actor()` - 71 edges
8. `post()` - 68 edges
9. `Loading()` - 57 edges
10. `useToast()` - 57 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py
- `Backend-apps` --references--> `send_mail()`  [INFERRED]
  ARCHITECTURE.md → backend/integrations/graph.py
- `Backend-apps` --references--> `event_base()`  [INFERRED]
  ARCHITECTURE.md → backend/production/drive.py
- `Backend-apps` --references--> `archive_past()`  [INFERRED]
  ARCHITECTURE.md → backend/production/drive.py

## Import Cycles
- None detected.

## Communities (93 total, 39 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.08
Nodes (61): audit(), queue(), Act, Artist, Meta, Asset, Meta, Booking (+53 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.07
Nodes (45): name, private, type, version, Options, setCsrf(), Auth, AuthContext (+37 more)

### Community 2 - "queue.py"
Cohesion: 0.10
Nodes (17): Stack, safe_error(), Command, Job, Meta, Schedule, claim_next(), enqueue() (+9 more)

### Community 3 - "PDF Writer"
Cohesion: 0.05
Nodes (43): apply(), average(), display(), review_dict(), save_review(), score(), track_dict(), _Canvas (+35 more)

### Community 4 - "require"
Cohesion: 0.11
Nodes (33): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contracts() (+25 more)

### Community 5 - "Icon"
Cohesion: 0.08
Nodes (68): Icon(), Badge(), Empty(), ErrorBox(), formValues(), Loading(), Stat(), ConfigDialog() (+60 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.11
Nodes (22): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, contour() (+14 more)

### Community 7 - "core/models.py"
Cohesion: 0.05
Nodes (24): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+16 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.14
Nodes (40): download(), euroInput(), BackLink(), useToast(), Artist, ArtistPage(), Rider(), Row (+32 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.19
Nodes (13): audit_log(), check_origin(), connections(), dashboard(), do_login(), do_logout(), get_settings(), list_connections() (+5 more)

### Community 11 - "Work.tsx"
Cohesion: 0.10
Nodes (45): saveBlob(), eur(), Orb(), PageTitle(), IntegrationsPage(), BOXES, CATEGORY, DocumentsPage() (+37 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.07
Nodes (34): Command, stamp(), js(), when(), AuditLog, Meta, Setting, cents() (+26 more)

### Community 13 - "ApiTests"
Cohesion: 0.11
Nodes (11): ApiTests, ChatProfileTests, KeyTestTests, ResetTests, MeetingTests, ReleaseTests, RosterTests, VoyageDeliverableTests (+3 more)

### Community 14 - "core/services.py"
Cohesion: 0.10
Nodes (14): uid(), save_secrets(), set_setting(), AiProviderTests, MicrosoftTokenTests, save_settings(), test_connection(), bank() (+6 more)

### Community 15 - "promo/views.py"
Cohesion: 0.13
Nodes (17): Contact, Meta, campaign(), _campaign(), campaigns(), contacts(), delete_campaign(), delete_contact() (+9 more)

### Community 16 - "User"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "Calendar.tsx"
Cohesion: 0.19
Nodes (13): AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS (+5 more)

### Community 18 - "HttpError"
Cohesion: 0.10
Nodes (42): actor(), body(), mark_read(), change_password(), create_task(), create_user(), _task_fields(), update_task() (+34 more)

### Community 19 - "format.ts"
Cohesion: 0.34
Nodes (12): asDate(), dayNumber(), longDate(), monthShort(), shortDate(), today(), locale(), Tabs() (+4 more)

### Community 20 - "drive_tidy.py"
Cohesion: 0.12
Nodes (9): create_folder(), classify(), folder_date(), _free(), normal_name(), plan(), tidy_event(), undo() (+1 more)

### Community 21 - "planning/views.py"
Cohesion: 0.11
Nodes (15): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), _apply(), calendar(), content() (+7 more)

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
Cohesion: 0.15
Nodes (14): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+6 more)

### Community 26 - "useAction"
Cohesion: 0.16
Nodes (19): fullDate(), useAction(), Action, Meeting, MeetingPage(), MeetingsPage(), MiniAction(), NAMES (+11 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/three@^0.180.0, typescript@5.9, vite@^7.3.7, @vitejs/plugin-react@^5.2.0, @types/react (+5 more)

### Community 51 - "promo/services.py"
Cohesion: 0.14
Nodes (22): Campaign, Meta, Recipient, Meta, Template, Meta, campaign_create(), campaign_dict() (+14 more)

### Community 52 - "User"
Cohesion: 0.12
Nodes (11): Backend-apps, User, assigned(), deadlines(), done(), involved(), notify(), make_task() (+3 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "Admin.tsx"
Cohesion: 0.11
Nodes (17): stamp(), ActivityPage(), AdminHome(), KEY_PROVIDER, KEYS, KeysPage(), save(), test() (+9 more)

### Community 56 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.33
Nodes (5): Afspraken, API (alle onder /api), Frontend (frontend/src), Projectkaart Moonshine Backoffice, LegacyRedirect()

### Community 57 - "settings"
Cohesion: 0.08
Nodes (31): secret_values(), settings(), poll_mail(), test_connection(), _call(), complete(), complete_json(), config() (+23 more)

### Community 58 - "Odoo"
Cohesion: 0.29
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 59 - "feedback/views.py"
Cohesion: 0.11
Nodes (14): Track, Meta, TrackLog, Meta, comment(), create(), delete(), detail() (+6 more)

### Community 60 - "drive.py"
Cohesion: 0.08
Nodes (29): copy_item(), _drive_base(), drive_children(), drive_item(), _drive_token(), ensure_path(), item_children(), move_item() (+21 more)

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
Nodes (17): ContentItem, Meta, OutlookLink, Meta, _box(), check(), _day(), enabled() (+9 more)

### Community 67 - "settings"
Cohesion: 0.23
Nodes (5): PasswordReset, digest(), forgot(), reset(), ingest()

### Community 68 - "api"
Cohesion: 0.11
Nodes (20): api(), ApiError, size(), ResetPassword(), submit(), test(), toggle(), uploadPhoto() (+12 more)

### Community 69 - "meetings/services.py"
Cohesion: 0.08
Nodes (25): Command, Action, Meta, Meeting, Meta, action_dict(), create(), extract() (+17 more)

### Community 71 - "Event"
Cohesion: 0.14
Nodes (20): Task, Meta, is_upcoming(), Event, Meta, EventStep, Meta, _active() (+12 more)

### Community 75 - "test_feedback.py"
Cohesion: 0.10
Nodes (12): Command, num(), who(), Review, Meta, docx(), fake(), FeedbackTests (+4 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 80 - "Release"
Cohesion: 0.29
Nodes (7): next_catalog(), Release, Meta, release_dict(), release_save(), seed_steps(), step_dict()

### Community 81 - "Send"
Cohesion: 0.40
Nodes (3): Send, Meta, archive_sent()

### Community 82 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 83 - "Notification"
Cohesion: 0.25
Nodes (4): Notification, Meta, notifications(), NotifyTests

## Knowledge Gaps
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `User`?**
  _High betweenness centrality (0.367) - this node is a cross-community bridge._
- **Are the 68 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 68 INFERRED edges - model-reasoned connections that need verification._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.362) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.06564364876385337 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.0962566844919786 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.05487269534679543 - nodes in this community are weakly interconnected._