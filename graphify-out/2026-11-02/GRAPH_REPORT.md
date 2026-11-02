# Graph Report - backoffice  (2026-11-02)

## Corpus Check
- 202 files · ~112,781 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 7, (none) 3, .example 1)

## Summary
- 1797 nodes · 5916 edges · 102 communities (60 shown, 42 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 462 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0ce7ca43`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Loading
- Frontend Dependencies
- core/migrations/0001_initial.py
- Artist Pages and Riders
- Docker Compose Setup
- api.py
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
- Booking
- TypeScript Config
- Django App Configs
- voyages.py
- django_db_models_deletion
- notify.py
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
- drive_tidy.py
- production/models.py
- odoo.py
- Meetings.tsx
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
- settings
- User
- Event
- urls.py
- Meeting
- import_track_feedback.py
- Admin.tsx
- core/services.py
- Projectkaart Moonshine Backoffice
- Promo.tsx
- notifications
- json
- Artist
- 0011_venue_contacts.py
- dialogs.tsx
- django_db
- run_worker.py
- restore.sh
- MissingTests
- pwa.tsx
- 0003_seed_release_steps.py

## God Nodes (most connected - your core abstractions)
1. `require()` - 160 edges
2. `api()` - 126 edges
3. `Icon()` - 108 edges
4. `audit()` - 105 edges
5. `body()` - 86 edges
6. `HttpError` - 86 edges
7. `actor()` - 85 edges
8. `post()` - 75 edges
9. `Loading()` - 64 edges
10. `useCanEdit()` - 62 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py
- `Backend-apps` --references--> `send_mail()`  [INFERRED]
  ARCHITECTURE.md → backend/integrations/graph.py

## Import Cycles
- None detected.

## Communities (102 total, 42 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.11
Nodes (35): audit(), queue(), Act, Asset, Meta, ChecklistItem, Meta, Event (+27 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (53): Options, setCsrf(), Auth, AuthContext, AuthProvider(), can, useAuth(), User (+45 more)

### Community 2 - "queue.py"
Cohesion: 0.16
Nodes (12): Stack, safe_error(), Job, Meta, Schedule, claim_next(), handlers(), periodic() (+4 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.10
Nodes (38): require(), advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file(), booking(), contact_delete() (+30 more)

### Community 5 - "Loading"
Cohesion: 0.10
Nodes (53): saveBlob(), Badge(), Empty(), ErrorBox(), Loading(), PageTitle(), Stat(), useToast() (+45 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (49): dependencies, @fontsource/ibm-plex-sans@^5.3.0, @fontsource/ibm-plex-sans-condensed@^5.3.0, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2 (+41 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.10
Nodes (69): download(), euroInput(), Icon(), BackLink(), formValues(), useAction(), NextMeeting(), Artist (+61 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "api.py"
Cohesion: 0.14
Nodes (9): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), PasswordReset, digest(), forgot() (+1 more)

### Community 11 - "Work.tsx"
Cohesion: 0.09
Nodes (48): asDate(), dayNumber(), eur(), longDate(), monthShort(), ROLE, shortDate(), size() (+40 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (29): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+21 more)

### Community 13 - "ApiTests"
Cohesion: 0.13
Nodes (3): PeopleTests, sample_xlsx(), EventChecklistTests

### Community 14 - "core/views.py"
Cohesion: 0.15
Nodes (15): AuditLog, Meta, LoginAttempt, audit_log(), connections(), create_task(), dashboard(), do_logout() (+7 more)

### Community 15 - "graph.py"
Cohesion: 0.12
Nodes (19): save_secrets(), copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload() (+11 more)

### Community 16 - "chat.py"
Cohesion: 0.13
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "people.py"
Cohesion: 0.11
Nodes (25): CrewMember, Meta, Guest, Meta, VenueContact, Meta, contact_dict(), contact_save() (+17 more)

### Community 18 - "requests.py"
Cohesion: 0.22
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "planning/views.py"
Cohesion: 0.23
Nodes (9): _apply(), calendar(), content(), content_dict(), create_content(), delete_content(), outlook_remove(), outlook_update() (+1 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.14
Nodes (9): comment(), delete(), detail(), review(), stream(), _track(), tracks(), update() (+1 more)

### Community 21 - "Booking"
Cohesion: 0.13
Nodes (26): Backend-apps, Booking, Meta, act_dict(), advancing(), archive_sent(), artist_dict(), artist_get() (+18 more)

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
Cohesion: 0.08
Nodes (12): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+4 more)

### Community 26 - "notify.py"
Cohesion: 0.16
Nodes (11): assigned(), deadlines(), done(), involved(), notify(), make_task(), ReleaseStep, Meta (+3 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "body"
Cohesion: 0.10
Nodes (49): actor(), body(), mark_read(), create_user(), save_settings(), test_connection(), create(), import_transactions() (+41 more)

### Community 50 - "versions-lib.sh"
Cohesion: 0.31
Nodes (7): deploy.sh script, rollback.sh script, fetch_versions(), label(), resolve(), versions-lib.sh script, versions.sh script

### Community 51 - "promo/services.py"
Cohesion: 0.09
Nodes (35): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+27 more)

### Community 52 - "HttpError"
Cohesion: 0.09
Nodes (23): change_password(), check_origin(), do_login(), update_user(), user_dict(), HttpError, add_action(), board() (+15 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "drive_tidy.py"
Cohesion: 0.12
Nodes (8): classify(), folder_date(), _free(), normal_name(), plan(), tidy_event(), undo(), Command

### Community 56 - "production/models.py"
Cohesion: 0.13
Nodes (13): Command, stamp(), js(), when(), EventNote, Meta, LabelStatement, Meta (+5 more)

### Community 57 - "odoo.py"
Cohesion: 0.28
Nodes (4): uid(), Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "Meetings.tsx"
Cohesion: 0.11
Nodes (26): fullDate(), Orb(), Action, Meeting, MeetingPage(), MiniAction(), NAMES, Next (+18 more)

### Community 59 - "core/models.py"
Cohesion: 0.08
Nodes (22): Notification, Meta, Setting, set_setting(), AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests (+14 more)

### Community 60 - "drive.py"
Cohesion: 0.15
Nodes (16): download_item(), drive_item(), archive_past(), conf(), enabled(), event_base(), event_files(), event_folder_name() (+8 more)

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
Cohesion: 0.18
Nodes (11): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+3 more)

### Community 66 - "planning/services.py"
Cohesion: 0.10
Nodes (18): LegacyScryptHasher, ContentItem, Meta, OutlookLink, Meta, _box(), check(), _day() (+10 more)

### Community 67 - "claude.py"
Cohesion: 0.27
Nodes (5): _call(), complete_json(), extract(), _text_to_dict(), next_catalog()

### Community 68 - "api"
Cohesion: 0.08
Nodes (46): api(), ApiError, ResetPassword(), submit(), EventRoles(), test(), save(), useTasks() (+38 more)

### Community 69 - "settings"
Cohesion: 0.13
Nodes (13): action_dict(), create(), extract(), heuristic(), meeting_dict(), next_meeting(), owner_of(), parse_date() (+5 more)

### Community 70 - "User"
Cohesion: 0.15
Nodes (8): User, apply(), average(), display(), review_dict(), save_review(), score(), track_dict()

### Community 71 - "Event"
Cohesion: 0.10
Nodes (23): Task, Meta, focus(), items_for(), my_work(), is_upcoming(), EventStep, Meta (+15 more)

### Community 74 - "Meeting"
Cohesion: 0.15
Nodes (9): MyWorkTests, Command, Action, Meta, Meeting, Meta, MeetingTests, NextMeetingTests (+1 more)

### Community 75 - "import_track_feedback.py"
Cohesion: 0.10
Nodes (15): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+7 more)

### Community 79 - "Admin.tsx"
Cohesion: 0.12
Nodes (13): Tabs(), AdminLayout(), KEY_PROVIDER, KEYS, Kind, Provider, PROVIDERS, ROLES (+5 more)

### Community 80 - "core/services.py"
Cohesion: 0.12
Nodes (19): secret_values(), settings(), get_settings(), test_connection(), complete(), config(), models(), graph() (+11 more)

### Community 81 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.29
Nodes (6): Afspraken, API (alle onder /api), Frontend (frontend/src), Ontwerp (frontend), Projectkaart Moonshine Backoffice, LegacyRedirect()

### Community 82 - "Promo.tsx"
Cohesion: 0.12
Nodes (14): Files, HINT, Item, Row(), Section, size(), Campaign, CampaignRow (+6 more)

### Community 84 - "json"
Cohesion: 0.21
Nodes (5): bank(), opensign(), outlook(), Contract, Meta

### Community 91 - "Artist"
Cohesion: 0.24
Nodes (8): asset_section(), Artist, Meta, artist_create(), artist_update(), asset_drive_path(), _name_taken(), roster()

### Community 95 - "dialogs.tsx"
Cohesion: 0.33
Nodes (5): Check, Pack(), Preview, SendDialog(), submit()

### Community 96 - "django_db"
Cohesion: 0.08
Nodes (12): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+4 more)

### Community 100 - "pwa.tsx"
Cohesion: 0.83
Nodes (3): installSteps(), platform(), standalone()

## Knowledge Gaps
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `Booking`?**
  _High betweenness centrality (0.350) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11074197120708748 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.348) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.05925925925925926 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06174863387978142 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.10106382978723404 - nodes in this community are weakly interconnected._
- **Should `Loading` be split into smaller, more focused modules?**
  _Cohesion score 0.10227936879018118 - nodes in this community are weakly interconnected._