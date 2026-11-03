# Graph Report - backoffice  (2026-11-03)

## Corpus Check
- 210 files · ~122,732 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1916 nodes · 6337 edges · 99 communities (60 shown, 39 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 515 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0c1cda3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- re
- Frontend Auth Context
- promo/services.py
- rules.py
- require
- Event.tsx
- Frontend Dependencies
- format.ts
- useToast
- Docker Compose Setup
- production/models.py
- Loading
- Accounting and Invoice Models
- ApiTests
- core/views.py
- graph.py
- chat.py
- people.py
- requests.py
- planning/views.py
- feedback/views.py
- production/services.py
- TypeScript Config
- Django App Configs
- voyages.py
- test_people.py
- django_db_models_deletion
- connect.sh
- Frontend Translations
- core/services.py
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- versions-lib.sh
- uid
- HttpError
- ssh.sh
- Moonshine Backoffice
- finance/views.py
- production/models.py
- odoo.py
- User
- core/models.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- Schedule
- planning/services.py
- pwa.tsx
- api
- promo/views.py
- Admin.tsx
- steps.py
- meetings/services.py
- import_track_feedback.py
- Loading
- test_design.py
- drive_tidy.py
- settings
- Calendar.tsx
- api.py
- django_db
- restore.sh
- MissingTests
- django_conf
- Ontwerpregels Moonshine Backoffice
- 0011_venue_contacts.py
- production/migrations/0001_initial.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 167 edges
2. `api()` - 134 edges
3. `audit()` - 115 edges
4. `Icon()` - 109 edges
5. `HttpError` - 93 edges
6. `actor()` - 92 edges
7. `body()` - 89 edges
8. `post()` - 79 edges
9. `Loading()` - 69 edges
10. `useCanEdit()` - 66 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Structuur` --references--> `PageTitle()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Iconen en beweging` --references--> `Orb()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `focus()`  [INFERRED]
  ARCHITECTURE.md → backend/core/work.py

## Import Cycles
- None detected.

## Communities (99 total, 39 thin omitted)

### Community 0 - "re"
Cohesion: 0.29
Nodes (5): _call(), complete(), complete_json(), extract(), _text_to_dict()

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (55): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+47 more)

### Community 2 - "promo/services.py"
Cohesion: 0.07
Nodes (34): safe_error(), test_connection(), send_mail(), UncertainSend, Command, Job, Meta, claim_next() (+26 more)

### Community 3 - "rules.py"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.07
Nodes (83): actor(), body(), require(), post(), unlink(), opensign_create(), add_act(), add_booking() (+75 more)

### Community 5 - "Event.tsx"
Cohesion: 0.10
Nodes (48): download(), saveBlob(), Icon(), PATHS, Badge(), Empty(), MoreMenu(), Stat() (+40 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (47): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, three@^0.180.0 (+39 more)

### Community 7 - "format.ts"
Cohesion: 0.11
Nodes (35): asDate(), dayNumber(), fullDate(), longDate(), monthShort(), today(), Action, ActionBoard() (+27 more)

### Community 8 - "useToast"
Cohesion: 0.15
Nodes (34): euroInput(), size(), BackLink(), Artist, ArtistPage(), save(), Rider(), Row (+26 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.11
Nodes (23): act_create(), act_dict(), act_remove(), act_state(), act_update(), _artist(), _book(), _contact_ok() (+15 more)

### Community 11 - "Loading"
Cohesion: 0.07
Nodes (55): eur(), shortDate(), locale(), Tabs(), BOXES, CATEGORY, DocumentsPage(), FILTERS (+47 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (28): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+20 more)

### Community 13 - "ApiTests"
Cohesion: 0.09
Nodes (6): AttentionTests, ReleaseTests, RosterTests, VoyageDeliverableTests, VoyageTests, EventChecklistTests

### Community 14 - "core/views.py"
Cohesion: 0.11
Nodes (24): LoginAttempt, also(), summary(), audit_log(), change_password(), check_origin(), connections(), create_task() (+16 more)

### Community 15 - "graph.py"
Cohesion: 0.14
Nodes (19): copy_item(), create_folder(), download_item(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload() (+11 more)

### Community 16 - "chat.py"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "people.py"
Cohesion: 0.14
Nodes (20): Guest, Meta, VenueContact, Meta, contact_dict(), contact_save(), copy_crew(), crew_dict() (+12 more)

### Community 18 - "requests.py"
Cohesion: 0.21
Nodes (11): FeatureRequest, Meta, notify(), add_screenshot(), create_request(), list_requests(), _names(), request_dict() (+3 more)

### Community 19 - "planning/views.py"
Cohesion: 0.15
Nodes (13): done(), ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content() (+5 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.11
Nodes (12): reset(), comment(), create(), delete(), detail(), review(), stream(), _track() (+4 more)

### Community 21 - "production/services.py"
Cohesion: 0.07
Nodes (62): audit(), next_catalog(), queue(), Act, Artist, Meta, Asset, Meta (+54 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.20
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "test_people.py"
Cohesion: 0.28
Nodes (5): parse_xlsx(), _plus(), PeopleTests, sample_xlsx(), VenueContactTests

### Community 26 - "django_db_models_deletion"
Cohesion: 0.11
Nodes (9): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+1 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "core/services.py"
Cohesion: 0.16
Nodes (6): Setting, set_setting(), set_next(), DriveTreeTests, EventFilesTests, EventUploadTests

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 52 - "HttpError"
Cohesion: 0.15
Nodes (13): add_action(), board(), create(), delete_action(), detail(), _err(), extract(), _meeting() (+5 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "finance/views.py"
Cohesion: 0.15
Nodes (14): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+6 more)

### Community 56 - "production/models.py"
Cohesion: 0.11
Nodes (14): Command, stamp(), js(), when(), Contract, Meta, LabelStatement, Meta (+6 more)

### Community 58 - "User"
Cohesion: 0.08
Nodes (18): AuditLog, Meta, User, involved(), mark_read(), notifications(), worked_by(), attention() (+10 more)

### Community 59 - "core/models.py"
Cohesion: 0.09
Nodes (21): Migration, Notification, Meta, Task, Meta, AiProviderTests, ApiTests, ChatProfileTests (+13 more)

### Community 60 - "drive.py"
Cohesion: 0.12
Nodes (19): drive_item(), archive_past(), asset_section(), conf(), enabled(), event_base(), event_cover(), event_files() (+11 more)

### Community 61 - "Moonshine Backoffice: werkafspraken voor Claude"
Cohesion: 0.25
Nodes (7): Code, graphify, Moonshine Backoffice: werkafspraken voor Claude, Productie, Verbinden vanuit een cloud-sessie, Versies en terugrollen, Werkwijze bij wijzigingen

### Community 62 - "Moonshine Backoffice — UX-review, 11 oktober 2026"
Cohesion: 0.29
Nodes (6): Hersteld, Moonshine Backoffice — UX-review, 11 oktober 2026, Referenties en ontwerpkeuze, Verificatie, Vervolg: homepage volgens aangeleverde referentie, Vervolgpunten

### Community 63 - "Moonshine: OpenSign en promomailer"
Cohesion: 0.33
Nodes (5): Aanbevolen volgorde, Controles die we moeten toevoegen, Moonshine: OpenSign en promomailer, OpenSign: technisch passend, betaalde API nodig, Promomailer: goed te integreren

### Community 64 - "Functionele en beveiligingsreview"
Cohesion: 0.33
Nodes (5): Functionaliteit en grenzen, Functionele en beveiligingsreview, Operationele open punten, Verholpen, Verificatie

### Community 65 - "Schedule"
Cohesion: 0.20
Nodes (8): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, Stack, Schedule, LegacyRedirect()

### Community 66 - "planning/services.py"
Cohesion: 0.08
Nodes (19): LegacyScryptHasher, PasswordReset, digest(), forgot(), OutlookLink, Meta, _box(), check() (+11 more)

### Community 67 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

### Community 68 - "api"
Cohesion: 0.08
Nodes (31): api(), ApiError, Orb(), save(), toggle(), uploadPhoto(), saveLink(), upload() (+23 more)

### Community 69 - "promo/views.py"
Cohesion: 0.10
Nodes (26): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+18 more)

### Community 70 - "Admin.tsx"
Cohesion: 0.11
Nodes (16): AdminLayout(), IntegrationsPage(), test(), KEY_PROVIDER, KEYS, Kind, Provider, PROVIDERS (+8 more)

### Community 71 - "steps.py"
Cohesion: 0.14
Nodes (19): Backend-apps, deadlines(), is_upcoming(), EventStep, Meta, _active(), auto_check(), due() (+11 more)

### Community 74 - "meetings/services.py"
Cohesion: 0.09
Nodes (19): assigned(), Command, Action, Meta, Meeting, Meta, action_dict(), create() (+11 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.08
Nodes (22): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+14 more)

### Community 79 - "Loading"
Cohesion: 0.08
Nodes (63): stamp(), ErrorBox(), formValues(), Loading(), PageTitle(), useToast(), ActivityPage(), AdminHome() (+55 more)

### Community 81 - "test_design.py"
Cohesion: 0.35
Nodes (3): DesignRulesTests, files(), hits()

### Community 82 - "drive_tidy.py"
Cohesion: 0.11
Nodes (8): classify(), folder_date(), _free(), normal_name(), plan(), undo(), Command, Migration

### Community 84 - "settings"
Cohesion: 0.09
Nodes (22): save_secrets(), secret_values(), settings(), bank(), opensign(), outlook(), test_connection(), config() (+14 more)

### Community 92 - "Calendar.tsx"
Cohesion: 0.20
Nodes (12): CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS, PLATFORMS (+4 more)

### Community 95 - "api.py"
Cohesion: 0.14
Nodes (6): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), spa()

### Community 96 - "django_db"
Cohesion: 0.10
Nodes (9): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+1 more)

### Community 100 - "django_conf"
Cohesion: 0.14
Nodes (5): Migration, Migration, Migration, Migration, Migration

### Community 101 - "Ontwerpregels Moonshine Backoffice"
Cohesion: 0.22
Nodes (8): Componenten (v1.6, `system.css` onderaan), Iconen en beweging, Kleur, Mobiel, Ontwerpregels Moonshine Backoffice, Structuur, Tekst, Typografie

### Community 103 - "0011_venue_contacts.py"
Cohesion: 0.28
Nodes (4): Migration, move_contacts(), Migration, solo_acts()

## Knowledge Gaps
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend (frontend/src)` connect `Schedule` to `Loading`, `production/services.py`?**
  _High betweenness centrality (0.351) - this node is a cross-community bridge._
- **Are the 84 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 84 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.05871725383920506 - nodes in this community are weakly interconnected._
- **Why does `advancing()` connect `production/services.py` to `production/models.py`, `Schedule`, `production/models.py`, `steps.py`?**
  _High betweenness centrality (0.335) - this node is a cross-community bridge._
- **Should `promo/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06708595387840671 - nodes in this community are weakly interconnected._
- **Why does `WorkRow()` connect `Loading` to `Schedule`, `Event.tsx`, `format.ts`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Should `rules.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06271186440677966 - nodes in this community are weakly interconnected._