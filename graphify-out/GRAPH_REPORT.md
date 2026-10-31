# Graph Report - backoffice  (2026-10-31)

## Corpus Check
- 158 files · ~85,948 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: .css 6, (none) 3, .example 1)

## Summary
- 1406 nodes · 4457 edges · 90 communities (53 shown, 37 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 334 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41bf67a1`
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
- settings
- Promo Mailing
- Chat and Access Helpers
- api
- graph.py
- format.ts
- Odoo Integration
- finance/views.py
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
- urls.py
- feedback/views.py
- drive.py
- Moonshine Backoffice: werkafspraken voor Claude
- Moonshine Backoffice — UX-review, 11 oktober 2026
- Moonshine: OpenSign en promomailer
- Functionele en beveiligingsreview
- pwa.tsx
- core/services.py
- HttpError
- import_track_feedback.py
- meetings/views.py
- LegacyScryptHasher
- audit
- Artist
- test_api.py
- test_feedback.py
- Feedback.tsx
- Release
- Asset
- feedback/services.py
- Event
- upload

## God Nodes (most connected - your core abstractions)
1. `require()` - 119 edges
2. `api()` - 94 edges
3. `Icon()` - 82 edges
4. `audit()` - 81 edges
5. `body()` - 67 edges
6. `HttpError` - 64 edges
7. `actor()` - 62 edges
8. `post()` - 61 edges
9. `useToast()` - 50 edges
10. `settings()` - 48 edges

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

## Communities (90 total, 37 thin omitted)

### Community 0 - "production/services.py"
Cohesion: 0.19
Nodes (25): Booking, Meta, act_dict(), advancing(), artist_dict(), artist_get(), artist_list(), asset_delete() (+17 more)

### Community 1 - "Frontend Auth Context"
Cohesion: 0.06
Nodes (49): Options, setCsrf(), Auth, AuthContext, AuthProvider(), useAuth(), User, ROLE (+41 more)

### Community 2 - "queue.py"
Cohesion: 0.10
Nodes (15): Stack, deadlines(), safe_error(), sync_todo(), Command, Job, Meta, Schedule (+7 more)

### Community 3 - "PDF Writer"
Cohesion: 0.05
Nodes (43): Afspraken, API (alle onder /api), Backend-apps, Frontend (frontend/src), Projectkaart Moonshine Backoffice, parse_date(), _Canvas, _char_width() (+35 more)

### Community 4 - "require"
Cohesion: 0.12
Nodes (29): require(), labelgrid_pull(), LabelStatement, Meta, ReleaseStep, Meta, advancing_pdf(), artist() (+21 more)

### Community 5 - "Label.tsx"
Cohesion: 0.09
Nodes (58): fullDate(), stamp(), today(), ErrorBox(), formValues(), Loading(), PageTitle(), useAction() (+50 more)

### Community 6 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (45): dependencies, react@^19.3.1, react-dom@^19.3.1, react-router@^7.18.5, @tanstack/react-query@^5.105.0, thinking-orbs@^0.3.2, three@^0.180.0, devDependencies (+37 more)

### Community 7 - "core/models.py"
Cohesion: 0.07
Nodes (18): Migration, Migration, Migration, Migration, Migration, Migration, Migration, Migration (+10 more)

### Community 8 - "Artist Pages and Riders"
Cohesion: 0.12
Nodes (46): download(), euroInput(), size(), BackLink(), useToast(), Artist, ArtistPage(), Rider() (+38 more)

### Community 9 - "Docker Compose Setup"
Cohesion: 0.05
Nodes (45): build, container_name, depends_on, environment, ports, restart, user, volumes (+37 more)

### Community 10 - "core/views.py"
Cohesion: 0.15
Nodes (18): AuditLog, Meta, Task, Meta, audit_log(), connections(), create_task(), dashboard() (+10 more)

### Community 11 - "Work.tsx"
Cohesion: 0.10
Nodes (49): saveBlob(), can, eur(), Icon(), PATHS, Badge(), Empty(), Orb() (+41 more)

### Community 12 - "Accounting and Invoice Models"
Cohesion: 0.09
Nodes (29): cents(), suggest_matches(), validate_invoice(), vat_report(), Document, Meta, ProcessedMessage, Transaction (+21 more)

### Community 13 - "Notifications and API Tests"
Cohesion: 0.13
Nodes (9): AiProviderTests, ApiTests, ChatProfileTests, KeyTestTests, MeetingTests, ReleaseTests, VoyageTests, NotifyTests (+1 more)

### Community 14 - "settings"
Cohesion: 0.18
Nodes (12): secret_values(), settings(), get_settings(), test_connection(), NoCredentialRedirect, odoo_catalog(), labelgrid_http(), opensign_create() (+4 more)

### Community 15 - "Promo Mailing"
Cohesion: 0.13
Nodes (17): Contact, Meta, campaign(), _campaign(), campaigns(), contacts(), delete_campaign(), delete_contact() (+9 more)

### Community 16 - "Chat and Access Helpers"
Cohesion: 0.11
Nodes (13): avatar(), delete_avatar(), messages(), _msg(), overview(), profile_dict(), send(), _thread() (+5 more)

### Community 17 - "api"
Cohesion: 0.13
Nodes (24): api(), ApiError, ResetPassword(), submit(), test(), KeysPage(), save(), test() (+16 more)

### Community 18 - "graph.py"
Cohesion: 0.14
Nodes (18): save_secrets(), copy_item(), download_item(), download_path(), _drive_base(), drive_children(), drive_item(), _drive_token() (+10 more)

### Community 19 - "format.ts"
Cohesion: 0.39
Nodes (10): asDate(), dayNumber(), longDate(), monthShort(), shortDate(), locale(), StatusBadge(), EventRow (+2 more)

### Community 21 - "finance/views.py"
Cohesion: 0.14
Nodes (15): classify(), _doc(), document_file(), documents(), export(), import_transactions(), match(), odoo_overview() (+7 more)

### Community 22 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowJs, checkJs, isolatedModules, jsx, lib, module, moduleResolution (+8 more)

### Community 23 - "Django App Configs"
Cohesion: 0.09
Nodes (7): CoreConfig, FeedbackConfig, FinanceConfig, JobsConfig, MeetingsConfig, ProductionConfig, PromoConfig

### Community 24 - "voyages.py"
Cohesion: 0.17
Nodes (12): Voyage, Meta, VoyageNote, Meta, add_log(), _apply(), create(), delete() (+4 more)

### Community 25 - "body"
Cohesion: 0.19
Nodes (26): actor(), body(), test_connection(), post(), add_act(), add_booking(), add_check(), add_link() (+18 more)

### Community 26 - "import_legacy.py"
Cohesion: 0.14
Nodes (11): Command, stamp(), js(), when(), Contract, Meta, EventNote, Meta (+3 more)

### Community 28 - "Frontend Translations"
Cohesion: 0.29
Nodes (9): ATTRS, current, D, lang, P, setLang(), start(), t() (+1 more)

### Community 29 - "claude.py"
Cohesion: 0.26
Nodes (8): _call(), complete(), complete_json(), config(), extract(), models(), _text_to_dict(), secure_url()

### Community 51 - "promo/services.py"
Cohesion: 0.14
Nodes (22): Campaign, Meta, Recipient, Meta, Template, Meta, campaign_create(), campaign_dict() (+14 more)

### Community 52 - "meetings/services.py"
Cohesion: 0.10
Nodes (13): Command, Meeting, Meta, action_dict(), create(), extract(), heuristic(), meeting_dict() (+5 more)

### Community 54 - "Moonshine Backoffice"
Cohesion: 0.15
Nodes (12): Claude, Connection setup, Features that work without external accounts, ING and SumUp, Installable app (PWA), Moonshine Backoffice, Odoo, Outlook, OneDrive and Microsoft To Do (+4 more)

### Community 55 - "notify.py"
Cohesion: 0.17
Nodes (9): Notification, Meta, assigned(), done(), involved(), mark_read(), notifications(), notify() (+1 more)

### Community 56 - "api.py"
Cohesion: 0.33
Nodes (5): auth_error(), http_error(), runtime_error(), unexpected(), value_error()

### Community 59 - "feedback/views.py"
Cohesion: 0.12
Nodes (10): comment(), create(), delete(), detail(), review(), stream(), _track(), tracks() (+2 more)

### Community 60 - "drive.py"
Cohesion: 0.26
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

### Community 66 - "core/services.py"
Cohesion: 0.33
Nodes (3): Setting, uid(), set_setting()

### Community 67 - "HttpError"
Cohesion: 0.09
Nodes (17): update_profile(), upload_avatar(), PasswordReset, digest(), forgot(), reset(), change_password(), check_origin() (+9 more)

### Community 68 - "import_track_feedback.py"
Cohesion: 0.16
Nodes (9): Command, num(), who(), Review, Meta, Track, Meta, TrackLog (+1 more)

### Community 69 - "meetings/views.py"
Cohesion: 0.17
Nodes (14): Action, Meta, add_action(), board(), create(), delete_action(), detail(), _err() (+6 more)

### Community 71 - "audit"
Cohesion: 0.15
Nodes (15): audit(), send_mail(), UncertainSend, Act, ChecklistItem, Meta, act_create(), act_delete() (+7 more)

### Community 72 - "Artist"
Cohesion: 0.18
Nodes (12): Artist, Meta, archive_sent(), artist_create(), artist_update(), asset_content(), asset_drive_path(), add_assets() (+4 more)

### Community 74 - "test_api.py"
Cohesion: 0.20
Nodes (3): MicrosoftTokenTests, ResetTests, MissingTests

### Community 75 - "test_feedback.py"
Cohesion: 0.22
Nodes (6): docx(), fake(), FeedbackTests, options(), sheet(), docx_text()

### Community 79 - "Feedback.tsx"
Cohesion: 0.26
Nodes (12): avg(), DECISION, FeedbackList(), FeedbackTrack(), upload(), grade(), mark(), Player() (+4 more)

### Community 80 - "Release"
Cohesion: 0.24
Nodes (9): next_catalog(), Release, Meta, label_artists(), release_dict(), release_save(), seed_steps(), step_dict() (+1 more)

### Community 81 - "Asset"
Cohesion: 0.22
Nodes (8): Asset, Meta, artist_delete(), asset_add_file(), asset_add_link(), event_remove(), _owner_exists(), queue_pending_syncs()

### Community 82 - "feedback/services.py"
Cohesion: 0.43
Nodes (7): apply(), average(), display(), review_dict(), save_review(), score(), track_dict()

### Community 83 - "Event"
Cohesion: 0.36
Nodes (7): queue(), Event, Meta, booking_add(), event_create(), event_update(), seed_checklist()

## Knowledge Gaps
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Projectkaart Moonshine Backoffice` connect `PDF Writer` to `queue.py`?**
  _High betweenness centrality (0.312) - this node is a cross-community bridge._
- **Should `Frontend Auth Context` be split into smaller, more focused modules?**
  _Cohesion score 0.061175666438824335 - nodes in this community are weakly interconnected._
- **Why does `LegacyRedirect()` connect `PDF Writer` to `Frontend Auth Context`?**
  _High betweenness centrality (0.304) - this node is a cross-community bridge._
- **Should `queue.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `PDF Writer` be split into smaller, more focused modules?**
  _Cohesion score 0.05300207039337474 - nodes in this community are weakly interconnected._
- **Should `require` be split into smaller, more focused modules?**
  _Cohesion score 0.12312312312312312 - nodes in this community are weakly interconnected._
- **Should `Label.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08904428904428904 - nodes in this community are weakly interconnected._