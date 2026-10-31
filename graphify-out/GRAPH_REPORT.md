# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 194 files · ~110,153 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1754 nodes · 5789 edges · 98 communities (56 shown, 42 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 448 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f9247722`
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
- Promo.tsx
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
- deploy.sh
- promo/services.py
- HttpError
- ssh.sh
- Moonshine Backoffice
- promo/views.py
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
- reset.py
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
- MissingTests
- Notification
- send_mail
- 0011_venue_contacts.py
- LegacyScryptHasher
- django_db
- asset_drive_path

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

## Communities (98 total, 42 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.11
Nodes (44): audit(), Act, Artist, Meta, Asset, Meta, Booking, Meta (+36 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.05
Nodes (67): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+59 more)

### Community 2 - "queue.py"
Cohesion: 0.08
Nodes (21): Stack, safe_error(), post_document(), process_document(), Command, Job, Meta, Schedule (+13 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (36): _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize(), _table(), draw_row() (+28 more)

### Community 4 - "require"
Cohesion: 0.09
Nodes (46): require(), VenueContact, Meta, advancing_pdf(), artist(), artist_photo_file(), artists(), asset_file() (+38 more)

### Community 5 - "Icon"
Cohesion: 0.10
Nodes (63): download(), saveBlob(), stamp(), Icon(), Badge(), Empty(), ErrorBox(), Loading() (+55 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "core/models.py"
Cohesion: 0.11
Nodes (7): Migration, Migration, Migration, Migration, Migration, Migration, Migration

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.15
Nodes (37): euroInput(), BackLink(), formValues(), Artist, ArtistPage(), save(), Rider(), Row (+29 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "useToast"
Cohesion: 0.12
Nodes (28): PageTitle(), useToast(), ConfigDialog(), EventRoles(), KeysPage(), save(), test(), testAll() (+20 more)

### Community 11 - "Work.tsx"
Cohesion: 0.10
Nodes (48): can, asDate(), dayNumber(), eur(), longDate(), monthShort(), shortDate(), locale() (+40 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.11
Nodes (25): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, Transaction, Meta (+17 more)

### Community 13 - "ApiTests"
Cohesion: 0.10
Nodes (13): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MeetingTests, NextMeetingTests, VenueContactTests, ReleaseTests (+5 more)

### Community 14 - "core/views.py"
Cohesion: 0.11
Nodes (23): delete_avatar(), profile_dict(), upload_avatar(), LoginAttempt, audit_log(), change_password(), check_origin(), connections() (+15 more)

### Community 15 - "graph.py"
Cohesion: 0.09
Nodes (26): test_connection(), copy_item(), create_folder(), download_path(), _drive_base(), drive_children(), _drive_token(), drive_upload() (+18 more)

### Community 16 - "User"
Cohesion: 0.10
Nodes (16): auth_error(), http_error(), runtime_error(), unexpected(), value_error(), avatar(), messages(), _msg() (+8 more)

### Community 17 - "people.py"
Cohesion: 0.11
Nodes (23): CrewMember, Meta, Guest, Meta, contact_dict(), contact_save(), copy_crew(), crew_dict() (+15 more)

### Community 18 - "requests.py"
Cohesion: 0.22
Nodes (10): FeatureRequest, Meta, add_screenshot(), create_request(), list_requests(), _names(), request_dict(), screenshot() (+2 more)

### Community 19 - "Promo.tsx"
Cohesion: 0.17
Nodes (10): Campaign, CampaignRow, Contact, GROUP, KIND, PromoCampaign(), save(), Recipient (+2 more)

### Community 20 - "feedback/views.py"
Cohesion: 0.14
Nodes (9): comment(), delete(), detail(), review(), stream(), _track(), tracks(), update() (+1 more)

### Community 21 - "Event"
Cohesion: 0.16
Nodes (16): ChecklistItem, Meta, Event, Meta, advancing(), archive_sent(), asset_content(), build_pack() (+8 more)

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
Cohesion: 0.12
Nodes (8): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration

### Community 26 - "Release"
Cohesion: 0.21
Nodes (10): next_catalog(), Release, Meta, ReleaseStep, Meta, release_dict(), release_save(), seed_steps() (+2 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.31
Nodes (8): ATTRS, current, D, lang, P, start(), t(), translateNode()

### Community 29 - "body"
Cohesion: 0.11
Nodes (42): actor(), body(), mark_read(), save_settings(), test_connection(), create(), import_transactions(), match() (+34 more)

### Community 51 - "promo/services.py"
Cohesion: 0.15
Nodes (20): Campaign, Meta, Recipient, Meta, Template, Meta, campaign_create(), campaign_dict() (+12 more)

### Community 52 - "HttpError"
Cohesion: 0.13
Nodes (19): HttpError, Action, Meta, add_action(), board(), create(), delete_action(), detail() (+11 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "promo/views.py"
Cohesion: 0.13
Nodes (17): Contact, Meta, campaign(), _campaign(), campaigns(), contacts(), delete_campaign(), delete_contact() (+9 more)

### Community 56 - "production/models.py"
Cohesion: 0.11
Nodes (14): Command, stamp(), js(), when(), AuditLog, Meta, Setting, ProcessedMessage (+6 more)

### Community 57 - "odoo.py"
Cohesion: 0.29
Nodes (3): Odoo, odoo_catalog(), odoo_overview()

### Community 58 - "Meetings.tsx"
Cohesion: 0.14
Nodes (20): fullDate(), today(), Action, Meeting, MeetingPage(), MeetingsPage(), MiniAction(), NAMES (+12 more)

### Community 59 - "test_api.py"
Cohesion: 0.12
Nodes (8): set_setting(), MicrosoftTokenTests, ResetTests, PlanningTests, PeopleTests, sample_xlsx(), DriveTreeTests, EventFilesTests

### Community 60 - "drive.py"
Cohesion: 0.11
Nodes (17): drive_item(), archive_past(), conf(), enabled(), event_base(), event_files(), event_folder_name(), _parent_path() (+9 more)

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

### Community 65 - "finance/views.py"
Cohesion: 0.22
Nodes (10): classify(), _doc(), document_file(), documents(), export(), odoo_overview(), retry(), review() (+2 more)

### Community 66 - "planning/services.py"
Cohesion: 0.11
Nodes (25): ContentItem, Meta, OutlookLink, Meta, _box(), check(), _day(), enabled() (+17 more)

### Community 67 - "reset.py"
Cohesion: 0.29
Nodes (4): PasswordReset, digest(), forgot(), reset()

### Community 68 - "api"
Cohesion: 0.09
Nodes (30): api(), ApiError, size(), ResetPassword(), submit(), test(), useUsers(), TaskDialog() (+22 more)

### Community 69 - "settings"
Cohesion: 0.10
Nodes (23): settings(), _call(), complete(), complete_json(), config(), extract(), models(), _text_to_dict() (+15 more)

### Community 70 - "feedback/services.py"
Cohesion: 0.26
Nodes (9): TrackLog, Meta, apply(), average(), display(), review_dict(), save_review(), score() (+1 more)

### Community 71 - "Event"
Cohesion: 0.07
Nodes (29): Backend-apps, Task, Meta, User, assigned(), deadlines(), done(), involved() (+21 more)

### Community 74 - "Meeting"
Cohesion: 0.21
Nodes (4): Command, Meeting, Meta, TableTests

### Community 75 - "import_track_feedback.py"
Cohesion: 0.13
Nodes (13): Command, num(), who(), Review, Meta, Track, Meta, docx() (+5 more)

### Community 79 - "Feedback.tsx"
Cohesion: 0.20
Nodes (15): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+7 more)

### Community 80 - "core/services.py"
Cohesion: 0.09
Nodes (17): uid(), save_secrets(), secret_values(), bank(), opensign(), outlook(), graph(), graph_pages() (+9 more)

### Community 81 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.33
Nodes (5): Afspraken, API (alle onder /api), Frontend (frontend/src), Projectkaart Moonshine Backoffice, LegacyRedirect()

### Community 83 - "Notification"
Cohesion: 0.16
Nodes (6): Notification, Meta, notifications(), TaskAssigneesTests, FeatureRequestTests, NotifyTests

### Community 96 - "django_db"
Cohesion: 0.09
Nodes (10): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+2 more)

## Knowledge Gaps
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `Event`?**
  _High betweenness centrality (0.368) - this node is a cross-community bridge._
- **Should `production/services.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1130952380952381 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.360) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.04733852303808121 - nodes in this community are weakly interconnected._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07948717948717948 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06428988895382817 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.08590441621294616 - nodes in this community are weakly interconnected._