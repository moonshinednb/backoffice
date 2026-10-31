# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 172 files · ~92,254 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1498 nodes · 4815 edges · 95 communities (54 shown, 41 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 368 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f94d76c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- production/services.py
- Frontend Auth Context
- queue.py
- PDF Writer
- require
- Label.tsx
- Frontend Dependencies
- core/models.py
- Artist Pages and Riders
- Docker Compose Setup
- core/views.py
- Work.tsx
- Accounting and Invoice Models
- Notifications and API Tests
- providers.py
- Promo Mailing
- Chat and Access Helpers
- Voyages.tsx
- graph.py
- Admin.tsx
- Odoo Integration
- planning/views.py
- TypeScript Config
- Django App Configs
- voyages.py
- body
- import_legacy.py
- connect.sh
- Frontend Translations
- claude.py
- Security Headers Middleware
- Asset Upload
- Docker Backup Script
- JS Type Declarations
- deploy.sh
- promo/services.py
- meetings/services.py
- ssh.sh
- Moonshine Backoffice
- notify.py
- api.py
- core/services.py
- urls.py
- feedback/views.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- planning/services.py
- settings
- dialogs.tsx
- meetings/views.py
- LegacyScryptHasher
- audit
- User
- MissingTests
- test_feedback.py
- Feedback.tsx
- Release
- Asset
- feedback/services.py
- Event
- send_batch
- Projectkaart Moonshine Backoffice
- test_planning.py
- 0005_staff_data.py
- .test_import_and_review

## God Nodes (most connected - your core abstractions)
1. `require()` - 131 edges
2. `api()` - 103 edges
3. `Icon()` - 88 edges
4. `audit()` - 86 edges
5. `HttpError` - 73 edges
6. `body()` - 72 edges
7. `actor()` - 66 edges
8. `post()` - 64 edges
9. `useToast()` - 54 edges
10. `Loading()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `Afspraken` --references--> `connections()`  [INFERRED]
  ARCHITECTURE.md → backend/core/views.py
- `Backend-apps` --references--> `done()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `assigned()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `deadlines()`  [INFERRED]
  ARCHITECTURE.md → backend/core/notify.py
- `Backend-apps` --references--> `post_document()`  [INFERRED]
  ARCHITECTURE.md → backend/finance/services.py

## Import Cycles
- None detected.

## Communities (95 total, 41 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.16
Nodes (25): act_dict(), advancing(), archive_sent(), artist_dict(), artist_get(), artist_list(), asset_dict(), asset_drive_path() (+17 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.07
Nodes (40): setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE, setLang() (+32 more)

### Community 2 - "queue.py"
Cohesion: 0.11
Nodes (14): Stack, deadlines(), safe_error(), Command, Job, Meta, Schedule, claim_next() (+6 more)

### Community 3 - "PDF Writer"
Cohesion: 0.06
Nodes (38): Backend-apps, parse_date(), _Canvas, _char_width(), _clean(), _pdf_string(), render(), _serialize() (+30 more)

### Community 4 - "require"
Cohesion: 0.13
Nodes (29): require(), labelgrid_pull(), LabelStatement, Meta, advancing_pdf(), artist(), artist_photo_file(), artists() (+21 more)

### Community 5 - "Label.tsx"
Cohesion: 0.10
Nodes (59): api(), fullDate(), ErrorBox(), formValues(), Loading(), PageTitle(), useToast(), ActivityPage() (+51 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "core/models.py"
Cohesion: 0.06
Nodes (20): Migration, Migration, Migration, Migration, Migration, Migration, Migration, LoginAttempt (+12 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.12
Nodes (49): download(), euroInput(), BackLink(), useAction(), Artist, ArtistPage(), save(), uploadPhoto() (+41 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.14
Nodes (17): AuditLog, Meta, Task, Meta, audit_log(), connections(), create_task(), dashboard() (+9 more)

### Community 11 - "Work.tsx"
Cohesion: 0.11
Nodes (51): saveBlob(), can, eur(), shortDate(), Icon(), Badge(), Empty(), Stat() (+43 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.10
Nodes (29): uid(), cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage (+21 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.14
Nodes (10): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MicrosoftTokenTests, ResetTests, ReleaseTests, RosterTests (+2 more)

### Community 14 - "providers.py"
Cohesion: 0.21
Nodes (9): secret_values(), bank(), opensign(), outlook(), opensign_create(), opensign_http(), opensign_refresh(), Contract (+1 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.10
Nodes (23): change_password(), check_origin(), create_user(), do_login(), save_settings(), update_user(), user_dict(), HttpError (+15 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.14
Nodes (14): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+6 more)

### Community 17 - "Voyages.tsx"
Cohesion: 0.10
Nodes (21): ApiError, Options, Content, CONTENT_STATUS, iso(), Item, KINDS, PLATFORMS (+13 more)

### Community 18 - "graph.py"
Cohesion: 0.09
Nodes (25): save_secrets(), test_connection(), copy_item(), download_item(), download_path(), _drive_base(), drive_children(), drive_item() (+17 more)

### Community 19 - "Admin.tsx"
Cohesion: 0.11
Nodes (24): asDate(), dayNumber(), longDate(), monthShort(), stamp(), today(), locale(), Tabs() (+16 more)

### Community 20 - "Odoo Integration"
Cohesion: 0.33
Nodes (3): poll_odoo_bank(), Odoo, odoo_overview()

### Community 21 - "planning/views.py"
Cohesion: 0.14
Nodes (12): ContentItem, Meta, _apply(), calendar(), content(), content_dict(), create_content(), delete_content() (+4 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.08
Nodes (8): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, PlanningConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.20
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "body"
Cohesion: 0.11
Nodes (39): actor(), body(), test_connection(), classify(), _doc(), document_file(), documents(), export() (+31 more)

### Community 26 - "import_legacy.py"
Cohesion: 0.12
Nodes (14): Command, stamp(), js(), when(), Act, Booking, Meta, EventNote (+6 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.31
Nodes (8): ATTRS, current, D, lang, P, start(), t(), translateNode()

### Community 29 - "claude.py"
Cohesion: 0.26
Nodes (8): _call(), complete(), complete_json(), config(), extract(), models(), _text_to_dict(), secure_url()

### Community 51 - "promo/services.py"
Cohesion: 0.11
Nodes (27): Campaign, Meta, Contact, Meta, Recipient, Meta, Template, Meta (+19 more)

### Community 52 - "meetings/services.py"
Cohesion: 0.10
Nodes (15): Command, Meeting, Meta, action_dict(), create(), extract(), heuristic(), meeting_dict() (+7 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "notify.py"
Cohesion: 0.15
Nodes (9): Notification, Meta, assigned(), done(), involved(), mark_read(), notifications(), notify() (+1 more)

### Community 56 - "api.py"
Cohesion: 0.29
Nodes (5): auth_error(), http_error(), runtime_error(), unexpected(), value_error()

### Community 59 - "feedback/views.py"
Cohesion: 0.11
Nodes (12): TrackLog, Meta, comment(), create(), delete(), detail(), review(), stream() (+4 more)

### Community 60 - "drive.py"
Cohesion: 0.28
Nodes (10): conf(), enabled(), event_folder_name(), _place(), release_folder_name(), sync_booking(), sync_event(), sync_release() (+2 more)

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
Cohesion: 0.20
Nodes (15): OutlookLink, Meta, _box(), check(), _day(), enabled(), _graph(), item() (+7 more)

### Community 67 - "settings"
Cohesion: 0.16
Nodes (7): PasswordReset, digest(), forgot(), reset(), settings(), check(), send_email()

### Community 68 - "dialogs.tsx"
Cohesion: 0.20
Nodes (10): size(), AssetRow(), remove(), sync(), Act, Check, Pack(), Preview (+2 more)

### Community 69 - "meetings/views.py"
Cohesion: 0.17
Nodes (14): Action, Meta, add_action(), board(), create(), delete_action(), detail(), _err() (+6 more)

### Community 71 - "audit"
Cohesion: 0.18
Nodes (17): audit(), Artist, Meta, ChecklistItem, Meta, act_create(), act_delete(), _act_payload() (+9 more)

### Community 75 - "test_feedback.py"
Cohesion: 0.18
Nodes (7): Command, num(), who(), docx(), options(), sheet(), docx_text()

### Community 79 - "Feedback.tsx"
Cohesion: 0.24
Nodes (13): Orb(), avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark() (+5 more)

### Community 80 - "Release"
Cohesion: 0.19
Nodes (11): next_catalog(), Release, Meta, ReleaseStep, Meta, label_artists(), release_dict(), release_save() (+3 more)

### Community 81 - "Asset"
Cohesion: 0.18
Nodes (11): Asset, Meta, asset_add_file(), asset_add_link(), asset_content(), asset_delete(), asset_get(), add_assets() (+3 more)

### Community 82 - "feedback/services.py"
Cohesion: 0.18
Nodes (12): Review, Meta, Track, Meta, apply(), average(), display(), review_dict() (+4 more)

### Community 83 - "Event"
Cohesion: 0.36
Nodes (7): queue(), Event, Meta, booking_add(), event_create(), event_update(), seed_checklist()

### Community 84 - "send_batch"
Cohesion: 0.29
Nodes (3): send_batch(), NotifyTests, PromoTests

### Community 89 - "Projectkaart Moonshine Backoffice"
Cohesion: 0.33
Nodes (5): Afspraken, API (alle onder /api), Frontend (frontend/src), Projectkaart Moonshine Backoffice, LegacyRedirect()

## Knowledge Gaps
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `Projectkaart Moonshine Backoffice` to `queue.py`, `PDF Writer`?**
  _High betweenness centrality (0.316) - this node is a cross-community bridge._
- **Are the 64 inferred relationships involving `HttpError` (e.g. with `body()` and `require()`) actually correct?**
  _`HttpError` has 64 INFERRED edges - model-reasoned connections that need verification._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07191961924907457 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `Projectkaart Moonshine Backoffice` to `Frontend Auth Context`?**
  _High betweenness centrality (0.315) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11330049261083744 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.06144393241167435 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.12762762762762764 - nodes in this community are weakly interconnected._