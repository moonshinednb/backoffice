# Graph Report - backoffice  (2026-11-02)

## Corpus Check
- 210 files · ~120,316 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1886 nodes · 6223 edges · 103 communities (66 shown, 37 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 502 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9cf3c249`
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
- main.tsx
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
- django_conf
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
- format.ts
- core/models.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- webhooks.py
- planning/services.py
- Meeting
- Icon
- promo/views.py
- Feedback.tsx
- Event
- api.py
- core/models.py
- import_track_feedback.py
- advancing
- settings
- test_design.py
- useToast
- Projectkaart Moonshine Backoffice
- settings
- LegacyScryptHasher
- 0011_venue_contacts.py
- Event
- django_db
- urls.py
- restore.sh
- MissingTests
- pwa.tsx
- Ontwerpregels Moonshine Backoffice
- sync_asset

## God Nodes (most connected - your core abstractions)
1. `require()` - 166 edges
2. `api()` - 132 edges
3. `audit()` - 112 edges
4. `Icon()` - 108 edges
5. `HttpError` - 92 edges
6. `actor()` - 91 edges
7. `body()` - 89 edges
8. `post()` - 79 edges
9. `Loading()` - 67 edges
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
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py

## Import Cycles
- None detected.

## Communities (103 total, 37 thin omitted)

### Community 0 - "api"
Cohesion: 0.16
Nodes (15): api(), ApiError, ResetPassword(), submit(), toggle(), uploadPhoto(), upload(), AssetRow() (+7 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.07
Nodes (45): Options, setCsrf(), Auth, AuthContext, AuthProvider(), User, ROLE, setLang() (+37 more)

### Community 2 - "queue.py"
Cohesion: 0.15
Nodes (11): Stack, Command, Job, Meta, Schedule, claim_next(), handlers(), periodic() (+3 more)

### Community 3 - "rules.py"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.11
Nodes (36): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contact_delete() (+28 more)

### Community 5 - "EventChecklist.tsx"
Cohesion: 0.17
Nodes (16): fullDate(), MoreMenu(), CONTENT_STATUS, done(), KIND, Work, WorkItem, AUTO_LABEL (+8 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (47): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, three@^0.180.0 (+39 more)

### Community 7 - "main.tsx"
Cohesion: 0.07
Nodes (29): stamp(), PageTitle(), Area(), LEGACY, NoAccess(), queryClient, router, ActivityPage() (+21 more)

### Community 8 - "useToast"
Cohesion: 0.09
Nodes (50): euroInput(), BackLink(), formValues(), Orb(), Artist, ArtistPage(), save(), Rider() (+42 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "production/models.py"
Cohesion: 0.15
Nodes (17): queue(), act_create(), act_dict(), act_remove(), act_state(), act_update(), _artist(), _book() (+9 more)

### Community 11 - "Loading"
Cohesion: 0.08
Nodes (57): saveBlob(), can, useAuth(), eur(), shortDate(), size(), locale(), Badge() (+49 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (26): done(), cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage (+18 more)

### Community 13 - "ApiTests"
Cohesion: 0.11
Nodes (5): AttentionTests, LineupTests, PeopleTests, sample_xlsx(), EventChecklistTests

### Community 14 - "core/views.py"
Cohesion: 0.14
Nodes (18): delete_avatar(), profile_dict(), AuditLog, Meta, LoginAttempt, audit_log(), check_origin(), connections() (+10 more)

### Community 15 - "graph.py"
Cohesion: 0.09
Nodes (22): copy_item(), create_folder(), download_item(), download_path(), _drive_base(), drive_children(), drive_item(), _drive_token() (+14 more)

### Community 16 - "chat.py"
Cohesion: 0.13
Nodes (12): avatar(), messages(), _msg(), overview(), send(), _thread(), update_profile(), upload_avatar() (+4 more)

### Community 17 - "people.py"
Cohesion: 0.10
Nodes (26): enqueue(), crew_from_lineup(), CrewMember, Meta, Guest, Meta, VenueContact, Meta (+18 more)

### Community 18 - "requests.py"
Cohesion: 0.18
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.19
Nodes (10): _apply(), calendar(), content(), content_dict(), create_content(), delete_content(), outlook_create(), outlook_remove() (+2 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.07
Nodes (19): change_password(), create_user(), comment(), create(), delete(), detail(), review(), stream() (+11 more)

### Community 21 - "production/services.py"
Cohesion: 0.09
Nodes (42): audit(), send_mail(), UncertainSend, Act, Artist, Meta, ChecklistItem, Meta (+34 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.20
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "django_conf"
Cohesion: 0.14
Nodes (5): Migration, Migration, Migration, Migration, Migration

### Community 26 - "User"
Cohesion: 0.12
Nodes (7): User, assigned(), deadlines(), involved(), notifications(), notify(), make_task()

### Community 28 - "Frontend Translations"
Cohesion: 0.31
Nodes (8): ATTRS, current, D, lang, P, start(), t(), translateNode()

### Community 29 - "body"
Cohesion: 0.11
Nodes (43): actor(), body(), mark_read(), create_task(), _task_fields(), test_connection(), update_task(), update_user() (+35 more)

### Community 31 - "Asset Upload"
Cohesion: 0.29
Nodes (3): artist_photo(), event_file_upload(), upload_asset()

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "promo/services.py"
Cohesion: 0.13
Nodes (24): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+16 more)

### Community 52 - "HttpError"
Cohesion: 0.15
Nodes (14): add_action(), board(), create(), delete_action(), detail(), _err(), extract(), _meeting() (+6 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "finance/views.py"
Cohesion: 0.14
Nodes (15): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+7 more)

### Community 56 - "Event"
Cohesion: 0.11
Nodes (14): Command, stamp(), js(), when(), Setting, Asset, Meta, EventNote (+6 more)

### Community 57 - "odoo.py"
Cohesion: 0.25
Nodes (4): uid(), Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "format.ts"
Cohesion: 0.14
Nodes (26): asDate(), dayNumber(), longDate(), monthShort(), today(), Tabs(), Action, ActionBoard() (+18 more)

### Community 59 - "core/models.py"
Cohesion: 0.08
Nodes (22): Notification, Meta, set_setting(), AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests (+14 more)

### Community 60 - "drive.py"
Cohesion: 0.10
Nodes (24): Backend-apps, archive_past(), asset_section(), conf(), enabled(), event_base(), event_files(), event_folder_name() (+16 more)

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

### Community 65 - "webhooks.py"
Cohesion: 0.15
Nodes (8): bank(), opensign(), outlook(), import_csv(), insert_transactions(), transaction_values(), Contract, Meta

### Community 66 - "planning/services.py"
Cohesion: 0.18
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "Meeting"
Cohesion: 0.14
Nodes (10): MyWorkTests, Command, Action, Meta, Meeting, Meta, MeetingTests, NextMeetingTests (+2 more)

### Community 68 - "Icon"
Cohesion: 0.09
Nodes (64): download(), Icon(), Empty(), ErrorBox(), Loading(), useAction(), MeetingPage(), MiniAction() (+56 more)

### Community 69 - "promo/views.py"
Cohesion: 0.13
Nodes (18): add_contact(), campaign(), _campaign(), campaigns(), contacts(), create_campaign(), delete_campaign(), delete_contact() (+10 more)

### Community 70 - "Feedback.tsx"
Cohesion: 0.23
Nodes (12): avg(), DECISION, FeedbackList(), grade(), mark(), Review, Ring(), Slider() (+4 more)

### Community 71 - "Event"
Cohesion: 0.10
Nodes (23): Task, Meta, attention(), focus(), items_for(), my_work(), is_upcoming(), EventStep (+15 more)

### Community 72 - "api.py"
Cohesion: 0.29
Nodes (6): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), safe_error()

### Community 74 - "core/models.py"
Cohesion: 0.13
Nodes (14): action_dict(), create(), extract(), heuristic(), meeting_dict(), next_meeting(), owner_of(), parse_date() (+6 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.08
Nodes (22): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+14 more)

### Community 79 - "advancing"
Cohesion: 0.18
Nodes (16): act_dict(), advancing(), archive_sent(), artist_dict(), artist_get(), asset_index(), booking_detail(), booking_dict() (+8 more)

### Community 80 - "settings"
Cohesion: 0.12
Nodes (22): secret_values(), save_settings(), test_connection(), _call(), complete(), complete_json(), config(), extract() (+14 more)

### Community 81 - "test_design.py"
Cohesion: 0.35
Nodes (3): DesignRulesTests, files(), hits()

### Community 82 - "useToast"
Cohesion: 0.09
Nodes (31): useToast(), ConfigDialog(), EventRoles(), SettingsPage(), AppointmentDialog(), CalendarPage(), Content, CONTENT_STATUS (+23 more)

### Community 83 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.29
Nodes (6): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, LegacyRedirect()

### Community 84 - "settings"
Cohesion: 0.16
Nodes (9): PasswordReset, digest(), forgot(), reset(), save_secrets(), settings(), graph_token(), _token_request() (+1 more)

### Community 92 - "0011_venue_contacts.py"
Cohesion: 0.28
Nodes (4): Migration, move_contacts(), Migration, solo_acts()

### Community 95 - "Event"
Cohesion: 0.22
Nodes (5): Command, Event, Meta, event_create(), seed_checklist()

### Community 96 - "django_db"
Cohesion: 0.05
Nodes (22): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+14 more)

### Community 100 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

### Community 101 - "Ontwerpregels Moonshine Backoffice"
Cohesion: 0.25
Nodes (7): Iconen en beweging, Kleur, Mobiel, Ontwerpregels Moonshine Backoffice, Structuur, Tekst, Typografie

### Community 102 - "sync_asset"
Cohesion: 0.50
Nodes (3): asset_content(), add_assets(), sync_asset()

## Knowledge Gaps
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Frontend (frontend/src)` connect `Projectkaart Moonshine Backoffice` to `Loading`, `advancing`?**
  _High betweenness centrality (0.342) - this node is a cross-community bridge._
- **Are the 83 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 83 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.06810035842293907 - nodes in this community are weakly interconnected._
- **Why does `advancing()` connect `advancing` to `production/models.py`, `Projectkaart Moonshine Backoffice`, `production/services.py`, `Event`, `drive.py`, `Event`?**
  _High betweenness centrality (0.327) - this node is a cross-community bridge._
- **Should `rules.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06428988895382817 - nodes in this community are weakly interconnected._
- **Why does `WorkRow()` connect `Loading` to `Projectkaart Moonshine Backoffice`, `Icon`, `EventChecklist.tsx`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.10821256038647344 - nodes in this community are weakly interconnected._