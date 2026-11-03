# Graph Report - backoffice  (2026-11-03)

## Corpus Check
- 210 files · ~121,199 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1894 nodes · 6244 edges · 110 communities (69 shown, 41 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 505 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0150c6fc`
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
- Showday.tsx
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
- body
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
- Backend-apps
- ApiTests
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- core/models.py
- planning/services.py
- Meeting
- FormDialog
- promo/views.py
- api
- Event
- pdf.py
- meetings/services.py
- import_track_feedback.py
- Feedback.tsx
- settings
- test_design.py
- drive_tidy.py
- feedback/services.py
- secret_values
- LegacyScryptHasher
- Calendar.tsx
- api.py
- django_db
- reset.py
- restore.sh
- MissingTests
- django_conf
- Ontwerpregels Moonshine Backoffice
- Notification
- 0011_venue_contacts.py
- missing_items
- _Canvas
- nice_date
- heuristic
- production/migrations/0001_initial.py
- 0003_seed_release_steps.py

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
- `Structuur` --references--> `PageTitle()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Iconen en beweging` --references--> `Orb()`  [INFERRED]
  DESIGN.md → frontend/src/lib/ui.tsx
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `focus()`  [INFERRED]
  ARCHITECTURE.md → backend/core/work.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py

## Import Cycles
- None detected.

## Communities (110 total, 41 thin omitted)

### Community 0 - "re"
Cohesion: 0.31
Nodes (5): _call(), complete(), complete_json(), extract(), _text_to_dict()

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (55): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+47 more)

### Community 2 - "promo/services.py"
Cohesion: 0.05
Nodes (42): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, Stack, safe_error(), connections() (+34 more)

### Community 3 - "rules.py"
Cohesion: 0.13
Nodes (15): parse_date(), _artist_payload(), _date(), _datetime(), _email(), _json(), _minutes(), money() (+7 more)

### Community 4 - "require"
Cohesion: 0.09
Nodes (41): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contact_delete() (+33 more)

### Community 5 - "Event.tsx"
Cohesion: 0.07
Nodes (74): download(), saveBlob(), stamp(), Icon(), Empty(), ErrorBox(), Loading(), MoreMenu() (+66 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (47): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, three@^0.180.0 (+39 more)

### Community 7 - "Showday.tsx"
Cohesion: 0.36
Nodes (8): longDate(), useOverview(), Guest, isShowNight(), night(), nowMinutes(), People, ShowdayPage()

### Community 8 - "useToast"
Cohesion: 0.11
Nodes (53): euroInput(), BackLink(), Badge(), formValues(), PageTitle(), useToast(), UsersPage(), MeetingPage() (+45 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.12
Nodes (27): audit(), queue(), act_create(), act_dict(), act_remove(), act_state(), act_update(), _artist() (+19 more)

### Community 11 - "Loading"
Cohesion: 0.06
Nodes (78): asDate(), dayNumber(), eur(), fullDate(), monthShort(), shortDate(), today(), locale() (+70 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.10
Nodes (25): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+17 more)

### Community 13 - "ApiTests"
Cohesion: 0.13
Nodes (7): AttentionTests, LineupTests, ReleaseTests, RosterTests, VoyageDeliverableTests, VoyageTests, EventChecklistTests

### Community 14 - "core/views.py"
Cohesion: 0.11
Nodes (20): profile_dict(), update_profile(), upload_avatar(), LoginAttempt, audit_log(), change_password(), check_origin(), create_user() (+12 more)

### Community 15 - "graph.py"
Cohesion: 0.09
Nodes (24): copy_item(), create_folder(), download_item(), download_path(), _drive_base(), drive_children(), drive_item(), _drive_token() (+16 more)

### Community 16 - "chat.py"
Cohesion: 0.21
Nodes (8): avatar(), delete_avatar(), messages(), _msg(), overview(), _thread(), ChatRead, Meta

### Community 17 - "people.py"
Cohesion: 0.10
Nodes (26): crew_from_lineup(), CrewMember, Meta, Guest, Meta, VenueContact, Meta, contact_dict() (+18 more)

### Community 18 - "requests.py"
Cohesion: 0.18
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.18
Nodes (11): ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content(), delete_content() (+3 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.12
Nodes (11): TrackLog, Meta, comment(), delete(), detail(), review(), stream(), _track() (+3 more)

### Community 21 - "production/services.py"
Cohesion: 0.09
Nodes (48): lineup(), Act, Artist, Meta, Asset, Meta, Booking, Meta (+40 more)

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
Cohesion: 0.32
Nodes (3): PeopleTests, sample_xlsx(), VenueContactTests

### Community 26 - "django_db_models_deletion"
Cohesion: 0.12
Nodes (8): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "body"
Cohesion: 0.10
Nodes (50): actor(), body(), send(), mark_read(), create_task(), save_settings(), test_connection(), create() (+42 more)

### Community 31 - "Asset Upload"
Cohesion: 0.29
Nodes (3): artist_photo(), event_file_upload(), upload_asset()

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 52 - "HttpError"
Cohesion: 0.14
Nodes (17): HttpError, Action, Meta, add_action(), board(), create(), delete_action(), detail() (+9 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "finance/views.py"
Cohesion: 0.18
Nodes (11): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+3 more)

### Community 56 - "production/models.py"
Cohesion: 0.08
Nodes (19): Command, stamp(), js(), when(), Setting, next_catalog(), Command, Contract (+11 more)

### Community 57 - "odoo.py"
Cohesion: 0.29
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "Backend-apps"
Cohesion: 0.18
Nodes (13): Backend-apps, AuditLog, Meta, assigned(), deadlines(), done(), involved(), notify() (+5 more)

### Community 59 - "ApiTests"
Cohesion: 0.11
Nodes (10): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests, TaskAssigneesTests, NextMeetingTests (+2 more)

### Community 60 - "drive.py"
Cohesion: 0.10
Nodes (21): set_setting(), archive_past(), asset_section(), conf(), enabled(), event_base(), event_files(), event_folder_name() (+13 more)

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

### Community 65 - "core/models.py"
Cohesion: 0.13
Nodes (6): Migration, Migration, ChatMessage, Meta, Migration, Migration

### Community 66 - "planning/services.py"
Cohesion: 0.20
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "Meeting"
Cohesion: 0.16
Nodes (5): MyWorkTests, Command, Meeting, Meta, MeetingTests

### Community 68 - "FormDialog"
Cohesion: 0.12
Nodes (17): size(), Orb(), FormDialog(), ActDialog(), Check, LineupOption, Pack(), Preview (+9 more)

### Community 69 - "promo/views.py"
Cohesion: 0.12
Nodes (21): Contact, Meta, Template, Meta, campaign(), _campaign(), campaigns(), contacts() (+13 more)

### Community 70 - "api"
Cohesion: 0.07
Nodes (39): api(), ApiError, ResetPassword(), submit(), AdminLayout(), ConfigDialog(), EventRoles(), IntegrationsPage() (+31 more)

### Community 71 - "Event"
Cohesion: 0.07
Nodes (28): Task, Meta, User, dashboard(), attention(), focus(), items_for(), my_work() (+20 more)

### Community 72 - "pdf.py"
Cohesion: 0.29
Nodes (9): _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row(), text_width() (+1 more)

### Community 74 - "meetings/services.py"
Cohesion: 0.17
Nodes (10): action_dict(), create(), extract(), make_task(), meeting_dict(), next_meeting(), owner_of(), root() (+2 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.10
Nodes (14): Command, num(), who(), Review, Meta, Track, Meta, docx() (+6 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.23
Nodes (12): avg(), DECISION, FeedbackList(), grade(), mark(), Review, Ring(), Slider() (+4 more)

### Community 80 - "settings"
Cohesion: 0.21
Nodes (10): settings(), test_connection(), config(), models(), labelgrid_http(), labelgrid_pull(), opensign_create(), opensign_http() (+2 more)

### Community 81 - "test_design.py"
Cohesion: 0.35
Nodes (3): DesignRulesTests, files(), hits()

### Community 82 - "drive_tidy.py"
Cohesion: 0.20
Nodes (7): classify(), folder_date(), _free(), normal_name(), plan(), tidy_event(), undo()

### Community 83 - "feedback/services.py"
Cohesion: 0.31
Nodes (7): apply(), average(), display(), review_dict(), save_review(), score(), track_dict()

### Community 84 - "secret_values"
Cohesion: 0.17
Nodes (9): save_secrets(), secret_values(), bank(), opensign(), outlook(), import_csv(), insert_transactions(), transaction_values() (+1 more)

### Community 92 - "Calendar.tsx"
Cohesion: 0.19
Nodes (13): AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS (+5 more)

### Community 95 - "api.py"
Cohesion: 0.14
Nodes (6): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), spa()

### Community 96 - "django_db"
Cohesion: 0.10
Nodes (9): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+1 more)

### Community 97 - "reset.py"
Cohesion: 0.20
Nodes (5): PasswordReset, digest(), forgot(), reset(), send_email()

### Community 100 - "django_conf"
Cohesion: 0.22
Nodes (4): Migration, Migration, Migration, Migration

### Community 101 - "Ontwerpregels Moonshine Backoffice"
Cohesion: 0.22
Nodes (8): Componenten (v1.6, `system.css` onderaan), Iconen en beweging, Kleur, Mobiel, Ontwerpregels Moonshine Backoffice, Structuur, Tekst, Typografie

### Community 102 - "Notification"
Cohesion: 0.16
Nodes (6): Notification, Meta, notifications(), FeatureRequestTests, NotifyTests, PromoTests

### Community 103 - "0011_venue_contacts.py"
Cohesion: 0.28
Nodes (4): Migration, move_contacts(), Migration, solo_acts()

### Community 104 - "missing_items"
Cohesion: 0.25
Nodes (7): advancing_pdf(), contact(), contact_via(), _leg_complete(), missing_items(), needs_id(), nice_datetime()

### Community 106 - "nice_date"
Cohesion: 0.33
Nodes (5): bios_pdf(), nice_date(), _rider_blocks(), flush(), rider_pdf()

## Knowledge Gaps
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend (frontend/src)` connect `promo/services.py` to `Loading`, `production/services.py`?**
  _High betweenness centrality (0.342) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.05671466353217749 - nodes in this community are weakly interconnected._
- **Why does `advancing()` connect `production/services.py` to `production/models.py`, `production/models.py`, `Backend-apps`, `promo/services.py`?**
  _High betweenness centrality (0.323) - this node is a cross-community bridge._
- **Should `promo/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.053939714436805924 - nodes in this community are weakly interconnected._
- **Why does `WorkRow()` connect `Loading` to `promo/services.py`, `Event.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Should `rules.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12923076923076923 - nodes in this community are weakly interconnected._