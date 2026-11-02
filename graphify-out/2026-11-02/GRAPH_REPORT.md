# Graph Report - backoffice  (2026-11-02)

## Corpus Check
- 208 files · ~118,390 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1855 nodes · 6148 edges · 100 communities (61 shown, 39 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 489 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `081c0d1c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- audit
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Loading
- Frontend Dependencies
- core/migrations/0001_initial.py
- useToast
- Docker Compose Setup
- production/models.py
- Work.tsx
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
- django_db_models_deletion
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
- tidy_event_folders.py
- production/models.py
- odoo.py
- Icon
- core/models.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- finance/views.py
- planning/services.py
- claude.py
- api
- promo/views.py
- Feedback.tsx
- Event
- urls.py
- core/models.py
- import_track_feedback.py
- devDependencies
- core/services.py
- Release
- @tanstack/react-query
- Showday.tsx
- json
- LegacyScryptHasher
- 0011_venue_contacts.py
- scripts
- django_db
- restore.sh
- MissingTests
- pwa.tsx

## God Nodes (most connected - your core abstractions)
1. `require()` - 165 edges
2. `api()` - 131 edges
3. `Icon()` - 113 edges
4. `audit()` - 111 edges
5. `HttpError` - 91 edges
6. `actor()` - 90 edges
7. `body()` - 89 edges
8. `post()` - 78 edges
9. `Loading()` - 68 edges
10. `useToast()` - 64 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `focus()`  [INFERRED]
  ARCHITECTURE.md → backend/core/work.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py

## Import Cycles
- None detected.

## Communities (100 total, 39 thin omitted)

### Community 0 - "audit"
Cohesion: 0.19
Nodes (17): audit(), queue(), act_update(), ChecklistItem, Meta, Event, Meta, artist_delete() (+9 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.05
Nodes (64): name, private, type, version, Options, setCsrf(), Auth, AuthContext (+56 more)

### Community 2 - "queue.py"
Cohesion: 0.07
Nodes (26): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, Stack, auth_error(), http_error() (+18 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.10
Nodes (35): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contracts() (+27 more)

### Community 5 - "Loading"
Cohesion: 0.10
Nodes (46): saveBlob(), stamp(), Badge(), ErrorBox(), Loading(), PageTitle(), Stat(), ActivityPage() (+38 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.10
Nodes (24): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2 (+16 more)

### Community 7 - "core/migrations/0001_initial.py"
Cohesion: 0.14
Nodes (5): Migration, Migration, Migration, Migration, Migration

### Community 8 - "useToast"
Cohesion: 0.11
Nodes (45): euroInput(), size(), BackLink(), formValues(), useToast(), Artist, ArtistPage(), save() (+37 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.13
Nodes (17): act_create(), act_dict(), act_remove(), act_state(), _artist(), _book(), _contact_ok(), crew_from_lineup() (+9 more)

### Community 11 - "Work.tsx"
Cohesion: 0.07
Nodes (67): asDate(), dayNumber(), eur(), fullDate(), longDate(), monthShort(), shortDate(), today() (+59 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (28): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+20 more)

### Community 13 - "ApiTests"
Cohesion: 0.12
Nodes (3): PlanningTests, LineupTests, EventChecklistTests

### Community 14 - "core/views.py"
Cohesion: 0.14
Nodes (20): LoginAttempt, audit_log(), change_password(), check_origin(), create_task(), create_user(), do_login(), do_logout() (+12 more)

### Community 15 - "graph.py"
Cohesion: 0.10
Nodes (24): copy_item(), create_folder(), download_item(), download_path(), _drive_base(), drive_children(), drive_item(), _drive_token() (+16 more)

### Community 16 - "chat.py"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "people.py"
Cohesion: 0.11
Nodes (23): enqueue(), Guest, Meta, VenueContact, Meta, contact_dict(), contact_save(), copy_crew() (+15 more)

### Community 18 - "requests.py"
Cohesion: 0.14
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.21
Nodes (10): _apply(), calendar(), content(), content_dict(), create_content(), delete_content(), outlook_create(), outlook_remove() (+2 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.12
Nodes (10): comment(), create(), delete(), detail(), review(), stream(), _track(), tracks() (+2 more)

### Community 21 - "production/services.py"
Cohesion: 0.10
Nodes (42): Backend-apps, Act, Artist, Meta, Asset, Meta, act_create(), act_delete() (+34 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.20
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "django_db_models_deletion"
Cohesion: 0.09
Nodes (10): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+2 more)

### Community 26 - "User"
Cohesion: 0.10
Nodes (11): AuditLog, Meta, User, deadlines(), done(), involved(), mark_read(), notifications() (+3 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "body"
Cohesion: 0.12
Nodes (41): actor(), body(), post(), add_act(), add_booking(), add_check(), add_lineup_act(), add_link() (+33 more)

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "promo/services.py"
Cohesion: 0.14
Nodes (21): Campaign, Meta, Recipient, Meta, Template, Meta, campaign_create(), campaign_dict() (+13 more)

### Community 52 - "HttpError"
Cohesion: 0.12
Nodes (19): HttpError, add_action(), board(), create(), delete_action(), detail(), _err(), extract() (+11 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 56 - "production/models.py"
Cohesion: 0.14
Nodes (11): Command, stamp(), js(), when(), EventNote, Meta, LabelStatement, Meta (+3 more)

### Community 57 - "odoo.py"
Cohesion: 0.25
Nodes (4): uid(), Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "Icon"
Cohesion: 0.09
Nodes (58): download(), Icon(), Empty(), MoreMenu(), useAction(), MeetingPage(), MiniAction(), DriveButton() (+50 more)

### Community 59 - "core/models.py"
Cohesion: 0.11
Nodes (21): Notification, Meta, set_setting(), AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests (+13 more)

### Community 60 - "drive.py"
Cohesion: 0.10
Nodes (21): archive_past(), asset_section(), conf(), enabled(), event_base(), event_files(), event_folder_name(), _parent_path() (+13 more)

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

### Community 65 - "finance/views.py"
Cohesion: 0.14
Nodes (15): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+7 more)

### Community 66 - "planning/services.py"
Cohesion: 0.16
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "claude.py"
Cohesion: 0.11
Nodes (8): _call(), complete(), complete_json(), extract(), _text_to_dict(), send_mail(), secure_url(), UncertainSend

### Community 68 - "api"
Cohesion: 0.08
Nodes (36): api(), ApiError, EventRoles(), test(), save(), Task, useUsers(), TaskDialog() (+28 more)

### Community 69 - "promo/views.py"
Cohesion: 0.12
Nodes (19): Contact, Meta, add_contact(), campaign(), _campaign(), campaigns(), contacts(), create_campaign() (+11 more)

### Community 70 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 71 - "Event"
Cohesion: 0.10
Nodes (23): Task, Meta, assigned(), focus(), items_for(), my_work(), make_task(), is_upcoming() (+15 more)

### Community 74 - "core/models.py"
Cohesion: 0.08
Nodes (23): MyWorkTests, Command, Action, Meta, Meeting, Meta, action_dict(), create() (+15 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.08
Nodes (22): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+14 more)

### Community 79 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @types/react@^19.3.0, @types/react-dom@^19.3.0, @types/three@^0.180.0, typescript@5.9, vite@^7.3.7, @vitejs/plugin-react@^5.2.0, @types/react (+5 more)

### Community 80 - "core/services.py"
Cohesion: 0.12
Nodes (20): Setting, save_secrets(), secret_values(), settings(), connections(), test_connection(), config(), models() (+12 more)

### Community 81 - "Release"
Cohesion: 0.19
Nodes (11): next_catalog(), Release, Meta, ReleaseStep, Meta, label_artists(), release_dict(), release_save() (+3 more)

### Community 82 - "@tanstack/react-query"
Cohesion: 0.19
Nodes (13): AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS (+5 more)

### Community 83 - "Showday.tsx"
Cohesion: 0.39
Nodes (7): useOverview(), Guest, isShowNight(), night(), nowMinutes(), People, ShowdayPage()

### Community 84 - "json"
Cohesion: 0.14
Nodes (9): PasswordReset, digest(), forgot(), reset(), bank(), opensign(), outlook(), Contract (+1 more)

### Community 92 - "0011_venue_contacts.py"
Cohesion: 0.28
Nodes (4): Migration, move_contacts(), Migration, solo_acts()

### Community 95 - "scripts"
Cohesion: 0.50
Nodes (4): scripts, build, dev, typecheck

### Community 96 - "django_db"
Cohesion: 0.07
Nodes (12): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+4 more)

### Community 100 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

## Knowledge Gaps
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `queue.py` to `production/services.py`?**
  _High betweenness centrality (0.343) - this node is a cross-community bridge._
- **Are the 82 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 82 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.049555867227676485 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `queue.py` to `Frontend Auth Context`?**
  _High betweenness centrality (0.337) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06755260243632337 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06428988895382817 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.09663120567375887 - nodes in this community are weakly interconnected._