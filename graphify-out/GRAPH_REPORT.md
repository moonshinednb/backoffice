# Graph Report - backoffice  (2026-11-03)

## Corpus Check
- 210 files · ~120,969 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1892 nodes · 6244 edges · 103 communities (65 shown, 38 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 504 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f823595e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- re
- Frontend Auth Context
- queue.py
- rules.py
- require
- Event.tsx
- Frontend Dependencies
- api
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
- Event
- User
- connect.sh
- Frontend Translations
- body
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- versions-lib.sh
- promo/services.py
- HttpError
- ssh.sh
- Moonshine Backoffice
- finance/views.py
- Event
- odoo.py
- Release
- core/services.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- providers.py
- planning/services.py
- Task
- Loading
- promo/views.py
- Admin.tsx
- Event
- audit
- core/models.py
- import_track_feedback.py
- Feedback.tsx
- settings
- test_design.py
- EventFiles.tsx
- Projectkaart Moonshine Backoffice
- secret_values
- LegacyScryptHasher
- Calendar.tsx
- urls.py
- core/models.py
- api.py
- restore.sh
- MissingTests
- auto_check
- Ontwerpregels Moonshine Backoffice
- Notification

## God Nodes (most connected - your core abstractions)
1. `require()` - 166 edges
2. `api()` - 133 edges
3. `audit()` - 112 edges
4. `Icon()` - 108 edges
5. `HttpError` - 92 edges
6. `actor()` - 91 edges
7. `body()` - 89 edges
8. `post()` - 79 edges
9. `Loading()` - 68 edges
10. `useCanEdit()` - 66 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Structuur` --references--> `PageTitle()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Iconen en beweging` --references--> `Orb()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Frontend (frontend/src)` --references--> `LegacyRedirect()`  [INFERRED]
  ARCHITECTURE.md → frontend/src/main.tsx
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py

## Import Cycles
- None detected.

## Communities (103 total, 38 thin omitted)

### Community 0 - "re"
Cohesion: 0.25
Nodes (5): complete(), complete_json(), extract(), _text_to_dict(), classify()

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (56): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+48 more)

### Community 2 - "queue.py"
Cohesion: 0.11
Nodes (14): Stack, safe_error(), sync_todo(), Command, Job, Meta, Schedule, claim_next() (+6 more)

### Community 3 - "rules.py"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.09
Nodes (40): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contact_delete() (+32 more)

### Community 5 - "Event.tsx"
Cohesion: 0.08
Nodes (44): download(), MoreMenu(), useAction(), STATUS, ActDialog(), Booking, Check, CHECK_STATES (+36 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (47): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, three@^0.180.0 (+39 more)

### Community 7 - "api"
Cohesion: 0.09
Nodes (29): api(), ApiError, ResetPassword(), submit(), save(), toggle(), uploadPhoto(), saveLink() (+21 more)

### Community 8 - "useToast"
Cohesion: 0.14
Nodes (37): euroInput(), BackLink(), Orb(), MeetingPage(), MiniAction(), Artist, ArtistPage(), save() (+29 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.16
Nodes (15): queue(), act_create(), act_dict(), act_remove(), act_state(), act_update(), _artist(), _book() (+7 more)

### Community 11 - "Loading"
Cohesion: 0.06
Nodes (73): Frontend (frontend/src), saveBlob(), asDate(), dayNumber(), eur(), fullDate(), longDate(), monthShort() (+65 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (25): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+17 more)

### Community 13 - "ApiTests"
Cohesion: 0.08
Nodes (17): AiProviderTests, ApiTests, ChatProfileTests, TaskAssigneesTests, AttentionTests, NextMeetingTests, LineupTests, PeopleTests (+9 more)

### Community 14 - "core/views.py"
Cohesion: 0.16
Nodes (14): LoginAttempt, audit_log(), connections(), create_task(), dashboard(), do_logout(), get_settings(), list_connections() (+6 more)

### Community 15 - "graph.py"
Cohesion: 0.09
Nodes (27): _call(), copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload() (+19 more)

### Community 16 - "chat.py"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "people.py"
Cohesion: 0.10
Nodes (26): download_item(), crew_from_lineup(), CrewMember, Meta, Guest, Meta, VenueContact, Meta (+18 more)

### Community 18 - "requests.py"
Cohesion: 0.22
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.21
Nodes (10): ContentItem, Meta, calendar(), content(), content_dict(), create_content(), delete_content(), outlook_remove() (+2 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.14
Nodes (9): comment(), delete(), detail(), review(), stream(), _track(), tracks(), update() (+1 more)

### Community 21 - "production/services.py"
Cohesion: 0.09
Nodes (39): lineup(), Asset, Meta, EventNote, Meta, act_dict(), advancing(), archive_sent() (+31 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.20
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "Event"
Cohesion: 0.14
Nodes (10): set_setting(), Command, Booking, Meta, Event, Meta, event_remove(), DriveTreeTests (+2 more)

### Community 26 - "User"
Cohesion: 0.13
Nodes (6): User, assigned(), deadlines(), involved(), notify(), make_task()

### Community 28 - "Frontend Translations"
Cohesion: 0.20
Nodes (12): ATTRS, current, D, lang, P, setLang(), start(), t() (+4 more)

### Community 29 - "body"
Cohesion: 0.10
Nodes (53): actor(), body(), mark_read(), change_password(), create_user(), do_login(), save_settings(), test_connection() (+45 more)

### Community 31 - "Asset Upload"
Cohesion: 0.29
Nodes (3): artist_photo(), event_file_upload(), upload_asset()

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "promo/services.py"
Cohesion: 0.12
Nodes (25): enqueue(), Campaign, Meta, Contact, Meta, Recipient, Meta, Template (+17 more)

### Community 52 - "HttpError"
Cohesion: 0.13
Nodes (19): check_origin(), HttpError, Action, Meta, add_action(), board(), create(), delete_action() (+11 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "finance/views.py"
Cohesion: 0.16
Nodes (12): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+4 more)

### Community 56 - "Event"
Cohesion: 0.15
Nodes (8): Command, stamp(), js(), when(), Setting, labelgrid_pull(), LabelStatement, Meta

### Community 58 - "Release"
Cohesion: 0.13
Nodes (14): Backend-apps, done(), _apply(), next_catalog(), Release, Meta, ReleaseStep, Meta (+6 more)

### Community 59 - "core/services.py"
Cohesion: 0.07
Nodes (10): AuditLog, Meta, uid(), save_secrets(), KeyTestTests, MicrosoftTokenTests, ResetTests, MeetingTests (+2 more)

### Community 60 - "drive.py"
Cohesion: 0.14
Nodes (19): drive_item(), archive_past(), asset_section(), conf(), enabled(), event_base(), event_folder_name(), is_upcoming() (+11 more)

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

### Community 65 - "providers.py"
Cohesion: 0.13
Nodes (7): NoCredentialRedirect, UncertainSend, opensign_create(), opensign_http(), opensign_refresh(), Contract, Meta

### Community 66 - "planning/services.py"
Cohesion: 0.19
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "Task"
Cohesion: 0.33
Nodes (3): Task, Meta, MyWorkTests

### Community 68 - "Loading"
Cohesion: 0.10
Nodes (59): Badge(), Empty(), ErrorBox(), formValues(), Loading(), PageTitle(), Stat(), useToast() (+51 more)

### Community 69 - "promo/views.py"
Cohesion: 0.14
Nodes (15): campaign(), _campaign(), campaigns(), contacts(), delete_campaign(), delete_contact(), delete_template(), edit_contact() (+7 more)

### Community 70 - "Admin.tsx"
Cohesion: 0.12
Nodes (15): AdminLayout(), IntegrationsPage(), test(), KEY_PROVIDER, KEYS, Kind, Provider, PROVIDERS (+7 more)

### Community 71 - "Event"
Cohesion: 0.12
Nodes (20): attention(), focus(), items_for(), my_work(), team_work(), EventStep, Meta, _active() (+12 more)

### Community 72 - "audit"
Cohesion: 0.16
Nodes (19): audit(), Act, Artist, Meta, ChecklistItem, Meta, act_create(), act_delete() (+11 more)

### Community 74 - "core/models.py"
Cohesion: 0.10
Nodes (16): Command, Meeting, Meta, action_dict(), create(), extract(), heuristic(), meeting_dict() (+8 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.08
Nodes (22): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+14 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.19
Nodes (16): stamp(), avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark() (+8 more)

### Community 80 - "settings"
Cohesion: 0.20
Nodes (9): settings(), test_connection(), config(), models(), odoo_catalog(), odoo_overview(), labelgrid_http(), check() (+1 more)

### Community 81 - "test_design.py"
Cohesion: 0.35
Nodes (3): DesignRulesTests, files(), hits()

### Community 82 - "EventFiles.tsx"
Cohesion: 0.33
Nodes (6): Files, HINT, Item, Row(), Section, size()

### Community 83 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.40
Nodes (4): Afspraken, API (alle onder /api), Ontwerp (frontend), Projectkaart Moonshine Backoffice

### Community 84 - "secret_values"
Cohesion: 0.27
Nodes (7): secret_values(), bank(), opensign(), outlook(), import_csv(), insert_transactions(), transaction_values()

### Community 92 - "Calendar.tsx"
Cohesion: 0.19
Nodes (13): CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS, PLATFORMS (+5 more)

### Community 96 - "core/models.py"
Cohesion: 0.04
Nodes (31): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+23 more)

### Community 97 - "api.py"
Cohesion: 0.13
Nodes (9): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), PasswordReset, digest(), forgot() (+1 more)

### Community 100 - "auto_check"
Cohesion: 0.22
Nodes (5): event_files(), Send, Meta, auto_check(), _mark()

### Community 101 - "Ontwerpregels Moonshine Backoffice"
Cohesion: 0.22
Nodes (8): Componenten (v1.6, `system.css` onderaan), Iconen en beweging, Kleur, Mobiel, Ontwerpregels Moonshine Backoffice, Structuur, Tekst, Typografie

### Community 102 - "Notification"
Cohesion: 0.29
Nodes (4): Notification, Meta, notifications(), FeatureRequestTests

## Knowledge Gaps
- **38 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend (frontend/src)` connect `Loading` to `Frontend Auth Context`, `Projectkaart Moonshine Backoffice`, `production/services.py`?**
  _High betweenness centrality (0.345) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.061122538936232734 - nodes in this community are weakly interconnected._
- **Why does `advancing()` connect `production/services.py` to `auto_check`, `audit`, `production/models.py`, `Loading`, `Event`, `Release`?**
  _High betweenness centrality (0.324) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Why does `WorkRow()` connect `Loading` to `Frontend Auth Context`, `Event.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Should `rules.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06327683615819209 - nodes in this community are weakly interconnected._