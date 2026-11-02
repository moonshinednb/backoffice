# Graph Report - backoffice  (2026-11-02)

## Corpus Check
- 208 files · ~119,331 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1863 nodes · 6184 edges · 103 communities (61 shown, 42 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 494 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db9bba6a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- api
- Frontend Auth Context
- queue.py
- rules.py
- require
- EventChecklist.tsx
- Frontend Dependencies
- core/migrations/0001_initial.py
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
- re
- Event
- odoo.py
- Event.tsx
- core/models.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pdf.py
- planning/services.py
- feedback/services.py
- Icon
- promo/views.py
- Feedback.tsx
- Event
- api.py
- core/models.py
- import_track_feedback.py
- _Canvas
- settings
- Release
- @tanstack/react-query
- Projectkaart Moonshine Backoffice
- json
- LegacyScryptHasher
- 0011_venue_contacts.py
- labelgrid_pull
- django_db
- restore.sh
- MissingTests
- pwa.tsx
- production/migrations/0001_initial.py
- 0003_seed_release_steps.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 166 edges
2. `api()` - 132 edges
3. `Icon()` - 113 edges
4. `audit()` - 112 edges
5. `HttpError` - 92 edges
6. `actor()` - 91 edges
7. `body()` - 89 edges
8. `post()` - 79 edges
9. `Loading()` - 68 edges
10. `useToast()` - 66 edges

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

## Communities (103 total, 42 thin omitted)

### Community 0 - "api"
Cohesion: 0.08
Nodes (32): api(), ApiError, size(), Orb(), ResetPassword(), submit(), test(), save() (+24 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (51): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+43 more)

### Community 2 - "queue.py"
Cohesion: 0.14
Nodes (11): Stack, Command, Job, Meta, Schedule, claim_next(), handlers(), periodic() (+3 more)

### Community 3 - "rules.py"
Cohesion: 0.11
Nodes (16): advancing_pdf(), contact(), bios_pdf(), contact_via(), _json(), _leg_complete(), _minutes(), missing_items() (+8 more)

### Community 4 - "require"
Cohesion: 0.08
Nodes (37): require(), classify(), _doc(), document_file(), documents(), export(), import_transactions(), match() (+29 more)

### Community 5 - "EventChecklist.tsx"
Cohesion: 0.17
Nodes (15): CONTENT_STATUS, done(), KIND, Row(), Work, WorkItem, AUTO_LABEL, autoFolder() (+7 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (49): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2 (+41 more)

### Community 8 - "useToast"
Cohesion: 0.09
Nodes (61): download(), euroInput(), BackLink(), formValues(), useAction(), useToast(), EventRoles(), SettingsPage() (+53 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.14
Nodes (16): queue(), act_create(), act_dict(), act_remove(), act_state(), act_update(), _artist(), _book() (+8 more)

### Community 11 - "Loading"
Cohesion: 0.07
Nodes (76): saveBlob(), can, eur(), shortDate(), stamp(), locale(), Badge(), ErrorBox() (+68 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (28): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+20 more)

### Community 13 - "ApiTests"
Cohesion: 0.08
Nodes (11): set_setting(), fake(), LineupTests, PeopleTests, sample_xlsx(), VenueContactTests, ReleaseTests, RosterTests (+3 more)

### Community 14 - "core/views.py"
Cohesion: 0.08
Nodes (29): profile_dict(), send(), update_profile(), upload_avatar(), LoginAttempt, audit_log(), change_password(), check_origin() (+21 more)

### Community 15 - "graph.py"
Cohesion: 0.10
Nodes (18): copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload(), ensure_path() (+10 more)

### Community 16 - "chat.py"
Cohesion: 0.17
Nodes (10): avatar(), delete_avatar(), messages(), _msg(), overview(), _thread(), ChatMessage, Meta (+2 more)

### Community 17 - "people.py"
Cohesion: 0.09
Nodes (28): download_item(), enqueue(), crew_from_lineup(), CrewMember, Meta, Guest, Meta, VenueContact (+20 more)

### Community 18 - "requests.py"
Cohesion: 0.20
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.17
Nodes (12): ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content(), delete_content() (+4 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.12
Nodes (10): comment(), create(), delete(), detail(), review(), stream(), _track(), tracks() (+2 more)

### Community 21 - "production/services.py"
Cohesion: 0.08
Nodes (55): audit(), Act, Artist, Meta, Asset, Meta, ChecklistItem, Meta (+47 more)

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
Cohesion: 0.07
Nodes (13): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+5 more)

### Community 26 - "User"
Cohesion: 0.09
Nodes (12): AuditLog, Meta, User, assigned(), done(), involved(), mark_read(), notifications() (+4 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "body"
Cohesion: 0.11
Nodes (49): actor(), body(), add_act(), add_booking(), add_check(), add_lineup_act(), add_lineup_member(), add_link() (+41 more)

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "promo/services.py"
Cohesion: 0.14
Nodes (23): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+15 more)

### Community 52 - "HttpError"
Cohesion: 0.15
Nodes (14): add_action(), board(), create(), delete_action(), detail(), _err(), extract(), _meeting() (+6 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "re"
Cohesion: 0.20
Nodes (11): parse_date(), _artist_payload(), _date(), _datetime(), _email(), money(), _recipients(), _structured() (+3 more)

### Community 56 - "Event"
Cohesion: 0.09
Nodes (16): Command, stamp(), js(), when(), Setting, Command, Contract, Meta (+8 more)

### Community 57 - "odoo.py"
Cohesion: 0.29
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "Event.tsx"
Cohesion: 0.10
Nodes (38): asDate(), dayNumber(), longDate(), monthShort(), today(), MoreMenu(), Tabs(), FinanceLayout() (+30 more)

### Community 59 - "core/models.py"
Cohesion: 0.12
Nodes (15): Notification, Meta, AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests (+7 more)

### Community 60 - "drive.py"
Cohesion: 0.09
Nodes (27): Backend-apps, drive_item(), archive_past(), asset_section(), conf(), enabled(), event_base(), event_files() (+19 more)

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

### Community 65 - "pdf.py"
Cohesion: 0.29
Nodes (9): _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row(), text_width() (+1 more)

### Community 66 - "planning/services.py"
Cohesion: 0.18
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "feedback/services.py"
Cohesion: 0.23
Nodes (9): TrackLog, Meta, apply(), average(), display(), review_dict(), save_review(), score() (+1 more)

### Community 68 - "Icon"
Cohesion: 0.09
Nodes (43): fullDate(), Icon(), PATHS, Empty(), Action, Meeting, MeetingsPage(), NAMES (+35 more)

### Community 69 - "promo/views.py"
Cohesion: 0.12
Nodes (21): post(), sync_asset(), add_contact(), campaign(), _campaign(), campaigns(), contacts(), create_campaign() (+13 more)

### Community 70 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 71 - "Event"
Cohesion: 0.09
Nodes (26): Task, Meta, deadlines(), MyWorkTests, focus(), items_for(), my_work(), Action (+18 more)

### Community 72 - "api.py"
Cohesion: 0.13
Nodes (7): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), spa(), safe_error()

### Community 74 - "core/models.py"
Cohesion: 0.09
Nodes (17): Command, Meeting, Meta, action_dict(), create(), extract(), heuristic(), meeting_dict() (+9 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.13
Nodes (12): Command, num(), who(), Review, Meta, Track, Meta, docx() (+4 more)

### Community 80 - "settings"
Cohesion: 0.09
Nodes (29): secret_values(), settings(), connections(), test_connection(), _call(), complete(), complete_json(), config() (+21 more)

### Community 81 - "Release"
Cohesion: 0.22
Nodes (8): next_catalog(), ReleaseStep, Meta, release_dict(), release_save(), seed_steps(), step_dict(), step_save()

### Community 82 - "@tanstack/react-query"
Cohesion: 0.19
Nodes (13): AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS, ContentDialog(), iso(), Item, KINDS (+5 more)

### Community 83 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.29
Nodes (6): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, LegacyRedirect()

### Community 84 - "json"
Cohesion: 0.11
Nodes (9): PasswordReset, uid(), digest(), forgot(), reset(), save_secrets(), bank(), opensign() (+1 more)

### Community 92 - "0011_venue_contacts.py"
Cohesion: 0.28
Nodes (4): Migration, move_contacts(), Migration, solo_acts()

### Community 95 - "labelgrid_pull"
Cohesion: 0.40
Nodes (4): labelgrid_pull(), LabelStatement, Meta, label_pull()

### Community 96 - "django_db"
Cohesion: 0.08
Nodes (11): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+3 more)

### Community 100 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

## Knowledge Gaps
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend (frontend/src)` connect `Projectkaart Moonshine Backoffice` to `production/services.py`?**
  _High betweenness centrality (0.339) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Should `api` be split into smaller, more focused modules?**
  _Cohesion score 0.08108108108108109 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.338) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.06151742993848257 - nodes in this community are weakly interconnected._
- **Why does `advancing()` connect `production/services.py` to `Event`, `production/models.py`, `Projectkaart Moonshine Backoffice`, `drive.py`?**
  _High betweenness centrality (0.318) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1422924901185771 - nodes in this community are weakly interconnected._