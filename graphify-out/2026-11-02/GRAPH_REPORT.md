# Graph Report - backoffice  (2026-11-02)

## Corpus Check
- 199 files · ~111,364 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1777 nodes · 5833 edges · 99 communities (58 shown, 41 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 454 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c8aef87`
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
- useToast
- Work.tsx
- Accounting and Invoice Models
- ApiTests
- core/views.py
- graph.py
- User
- people.py
- requests.py
- planning/views.py
- feedback/views.py
- Event
- TypeScript Config
- Django App Configs
- voyages.py
- django_db_models_deletion
- Release
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
- Backend-apps
- production/models.py
- odoo.py
- Meetings.tsx
- test_api.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- finance/views.py
- planning/services.py
- claude.py
- api
- settings
- feedback/services.py
- Event
- urls.py
- Meeting
- import_track_feedback.py
- Feedback.tsx
- core/services.py
- Projectkaart Moonshine Backoffice
- sync_asset
- Notification
- production/migrations/0001_initial.py
- 0011_venue_contacts.py
- LegacyScryptHasher
- django_db
- make_task
- restore.sh

## God Nodes (most connected - your core abstractions)
1. `require()` - 160 edges
2. `api()` - 123 edges
3. `Icon()` - 106 edges
4. `audit()` - 105 edges
5. `body()` - 86 edges
6. `HttpError` - 86 edges
7. `actor()` - 85 edges
8. `post()` - 75 edges
9. `Loading()` - 62 edges
10. `useCanEdit()` - 62 edges

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

## Communities (99 total, 41 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.11
Nodes (49): audit(), Act, Artist, Meta, Asset, Meta, Booking, Meta (+41 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (54): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, PATHS (+46 more)

### Community 2 - "queue.py"
Cohesion: 0.09
Nodes (18): Stack, auth_error(), http_error(), runtime_error(), unexpected(), value_error(), safe_error(), sync_todo() (+10 more)

### Community 3 - "PDF Writer"
Cohesion: 0.07
Nodes (32): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+24 more)

### Community 4 - "require"
Cohesion: 0.07
Nodes (40): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contracts() (+32 more)

### Community 5 - "Icon"
Cohesion: 0.11
Nodes (55): saveBlob(), Icon(), Badge(), Empty(), ErrorBox(), Loading(), PageTitle(), Stat() (+47 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (49): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2 (+41 more)

### Community 7 - "core/models.py"
Cohesion: 0.10
Nodes (7): Migration, Migration, Migration, Migration, Migration, Migration, Migration

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.14
Nodes (41): euroInput(), BackLink(), formValues(), Artist, ArtistPage(), save(), Rider(), Row (+33 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "useToast"
Cohesion: 0.21
Nodes (13): useToast(), AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item (+5 more)

### Community 11 - "Work.tsx"
Cohesion: 0.06
Nodes (67): can, asDate(), dayNumber(), eur(), longDate(), monthShort(), ROLE, shortDate() (+59 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (28): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+20 more)

### Community 13 - "ApiTests"
Cohesion: 0.11
Nodes (13): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, ResetTests, TaskAssigneesTests, VenueContactTests, ReleaseTests (+5 more)

### Community 14 - "core/views.py"
Cohesion: 0.15
Nodes (20): LoginAttempt, assigned(), audit_log(), change_password(), check_origin(), create_task(), create_user(), dashboard() (+12 more)

### Community 15 - "graph.py"
Cohesion: 0.12
Nodes (18): copy_item(), create_folder(), _drive_base(), drive_children(), _drive_token(), drive_upload(), _ensure_folder(), ensure_path() (+10 more)

### Community 16 - "User"
Cohesion: 0.06
Nodes (22): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+14 more)

### Community 17 - "people.py"
Cohesion: 0.09
Nodes (29): download_item(), download_path(), CrewMember, Meta, Guest, Meta, VenueContact, Meta (+21 more)

### Community 18 - "requests.py"
Cohesion: 0.19
Nodes (11): FeatureRequest, Meta, notify(), add_screenshot(), create_request(), list_requests(), _names(), request_dict() (+3 more)

### Community 19 - "planning/views.py"
Cohesion: 0.20
Nodes (12): done(), ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content() (+4 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.11
Nodes (13): comment(), create(), delete(), detail(), review(), stream(), _track(), tracks() (+5 more)

### Community 21 - "Event"
Cohesion: 0.18
Nodes (9): enqueue(), queue(), Event, Meta, archive_sent(), event_create(), event_update(), queue_pending_syncs() (+1 more)

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
Cohesion: 0.13
Nodes (8): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration

### Community 26 - "Release"
Cohesion: 0.19
Nodes (11): next_catalog(), Release, Meta, ReleaseStep, Meta, label_artists(), release_dict(), release_save() (+3 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "body"
Cohesion: 0.10
Nodes (57): actor(), body(), mark_read(), save_settings(), test_connection(), import_transactions(), match(), post() (+49 more)

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "promo/services.py"
Cohesion: 0.13
Nodes (24): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+16 more)

### Community 52 - "HttpError"
Cohesion: 0.15
Nodes (16): Action, Meta, add_action(), board(), create(), delete_action(), detail(), _err() (+8 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "Backend-apps"
Cohesion: 0.20
Nodes (8): Backend-apps, event_files(), contact_via(), _leg_complete(), missing_items(), needs_id(), auto_check(), _mark()

### Community 56 - "production/models.py"
Cohesion: 0.14
Nodes (11): Command, stamp(), js(), when(), EventNote, Meta, LabelStatement, Meta (+3 more)

### Community 57 - "odoo.py"
Cohesion: 0.29
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "Meetings.tsx"
Cohesion: 0.16
Nodes (23): fullDate(), today(), useAction(), Action, Meeting, MeetingPage(), MeetingsPage(), MiniAction() (+15 more)

### Community 59 - "test_api.py"
Cohesion: 0.11
Nodes (7): set_setting(), MicrosoftTokenTests, PlanningTests, PeopleTests, sample_xlsx(), EventFilesTests, MissingTests

### Community 60 - "drive.py"
Cohesion: 0.11
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

### Community 65 - "finance/views.py"
Cohesion: 0.17
Nodes (12): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+4 more)

### Community 66 - "planning/services.py"
Cohesion: 0.14
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "claude.py"
Cohesion: 0.31
Nodes (6): _call(), complete(), complete_json(), extract(), _text_to_dict(), secure_url()

### Community 68 - "api"
Cohesion: 0.06
Nodes (53): api(), ApiError, download(), size(), stamp(), ResetPassword(), submit(), test() (+45 more)

### Community 69 - "settings"
Cohesion: 0.08
Nodes (22): move_item(), action_dict(), create(), extract(), heuristic(), meeting_dict(), next_meeting(), owner_of() (+14 more)

### Community 70 - "feedback/services.py"
Cohesion: 0.26
Nodes (9): TrackLog, Meta, apply(), average(), display(), review_dict(), save_review(), score() (+1 more)

### Community 71 - "Event"
Cohesion: 0.12
Nodes (18): Task, Meta, deadlines(), EventStep, Meta, _active(), due(), event_steps() (+10 more)

### Community 74 - "Meeting"
Cohesion: 0.16
Nodes (6): Command, Meeting, Meta, MeetingTests, NextMeetingTests, TableTests

### Community 75 - "import_track_feedback.py"
Cohesion: 0.13
Nodes (13): Command, num(), who(), Review, Meta, Track, Meta, docx() (+5 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 80 - "core/services.py"
Cohesion: 0.09
Nodes (21): Setting, uid(), save_secrets(), secret_values(), settings(), bank(), opensign(), outlook() (+13 more)

### Community 81 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.22
Nodes (7): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, connections(), LegacyRedirect()

### Community 82 - "sync_asset"
Cohesion: 0.50
Nodes (3): asset_content(), add_assets(), sync_asset()

### Community 83 - "Notification"
Cohesion: 0.20
Nodes (5): Notification, Meta, notifications(), FeatureRequestTests, NotifyTests

### Community 96 - "django_db"
Cohesion: 0.09
Nodes (10): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+2 more)

## Knowledge Gaps
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `Backend-apps`?**
  _High betweenness centrality (0.340) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1069182389937107 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.338) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.058416139716952725 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.07058001397624039 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.07197763801537387 - nodes in this community are weakly interconnected._