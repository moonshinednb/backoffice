# Moonshine Backoffice

Private backoffice for Ubuntu and Tailscale. Python 3.10+; no runtime package installation. Motion 14.0.0 and Three.js 0.180.0 are vendored locally. The login scene extrudes the supplied Moonshine SVG into actual WebGL geometry with PBR metal, gradient studio reflections, procedural concrete, shadows and pointer parallax. A local postprocessing pipeline adds depth of field, restrained highlight bloom and ACES tone mapping. Rendering happens on demand. Reduced motion disables parallax; unavailable WebGL falls back to the original SVG.

## Run and test

```sh
python3 server.py init-admin --username peppy
MOONSHINE_SECURE_COOKIE=0 python3 server.py
python3 -m unittest discover -s tests
```

For frontend geometry changes, run `node tests/logo-geometry.mjs` on a development machine with Node.js. This checks the supplied SVG's six components, two openings, triangle winding and silhouette area. Node.js is not needed to run the Ubuntu application.

Local address: `http://127.0.0.1:8765`. SQLite, original uploads and server-only secrets live in `data/`, or `MOONSHINE_DATA`. Demo data exists only in a read-only example view; real records start empty.

## Ubuntu installation

Copy this directory to `/opt/moonshine-backoffice` (exclude `data`, `.env`, caches and test output). Run `bash deploy/install.sh`, initialize the administrator as printed by the installer, then start the service. Never put the administrator password in source, scripts or command-line arguments.

```sh
systemctl enable --now moonshine-backoffice moonshine-backup.timer
tailscale serve --bg --https=443 http://127.0.0.1:8765
systemctl status moonshine-backoffice
```

Tailscale Serve is tailnet-only; do not enable Funnel. HTTPS must be enabled in the tailnet. The service listens on loopback, runs as `moonshine`, uses `/var/lib/moonshine`, and restarts on failure. Daily consistent SQLite/file/secret backups run at 05:00 Europe/Amsterdam into `/var/backups/moonshine`. Backups are retained; monitor disk usage. For disaster recovery, also copy backups to another machine through an approved secure channel.

To update, back up first, copy only application files, and restart `moonshine-backoffice`. Preserve `/var/lib/moonshine` and `.env`.

## Features that work without external accounts

- Peppy administrator; additional admin, finance and viewer users; password changes and account deactivation.
- Secure sessions, CSRF checks, login throttling, permission checks and audit history.
- PDF/JPEG/PNG/WebP upload up to 15 MB, original download and exact-file deduplication.
- Invoice review and editing, multiple tax lines, IBAN checksum and total checks.
- Shared tasks and assignments with editable titles, descriptions, deadlines and priorities.
- Bank CSV import, source-ID deduplication, transaction classification and match suggestions.
- Provisional quarterly VAT worksheet, invoice CSV export and document archive.

## Connection setup

Use Koppelingen while signed in as administrator. Secrets are stored server-side in a mode-600 file; API responses expose only whether a secret exists. A saved configuration must be tested before it shows Geverifieerd. External flows are not active until configured.

### Odoo

Configure the URL, database, login, API key, purchase journal, expense account, ING journal and ING account. Enter actual tax IDs for `9`, `21`, `0`, `exempt`, `reverse_eu`, `reverse_non_eu` as needed. The connection test returns available journals, accounts and taxes. The adapter uses Odoo's authenticated JSON-RPC `execute_kw`; it requires a compatible Odoo version and external API access. This adapter calls the Odoo API directly; it is not itself an MCP server.

Posting searches or creates the supplier, stores a valid IBAN, checks supplier/invoice duplicates, creates `account.move`, attaches the original through `ir.attachment`, verifies EUR and totals, and calls `action_post`. The local state becomes posted only after success. Repeated posting uses the same document marker and draft ID. Correct any linked draft directly in Odoo if a tax mapping error occurs.

Vendor-payment matching uses one payable line, exact outstanding EUR amount and configured bank account/journal. Choose the ING input mode explicitly. In existing-feed mode, the worker imports unmatched `account.bank.statement.line` records from the configured Odoo journal every minute. Matching verifies statement ID, journal, date and amount, posts a balancing entry between the existing suspense account and vendor payable, and reconciles both pairs. It does not debit or credit the bank account a second time. The existing suspense account must allow reconciliation. In exclusive-import mode, it creates the bank journal entry itself; do not use that mode alongside an independent Odoo bank feed. CSV/provider records can include `odoo_statement_id` to map an existing bank rule. Partial payments, credits, foreign currencies and split payment terms require separate handling. Leave automatic matching off until the actual ledger setup is integration-tested.

### Claude

Configure an Anthropic API key and an available model ID; the test lists available models. The worker submits PDF/image content to the Messages API, requests invoice JSON, and validates totals, dates and IBANs. Files are processed from the durable queue. Without credentials they remain saved for manual review. The API model response is treated as untrusted extraction data. Confidence is the model's estimate, not an accuracy guarantee. Auto-post is off by default; when enabled it requires at least 98% reported confidence and no validation problems. Reverse-charge invoices always require explicit human confirmation.

### Outlook, OneDrive and Microsoft To Do

Register an Entra application and grant the permissions needed for the selected flows. Supply tenant/client ID and either a delegated refresh-token or application secret. The current interface accepts provisioned tokens; an interactive OAuth onboarding flow is not included. Delegated consent and `offline_access` are required for a renewable user connection. To Do requires delegated `Tasks.ReadWrite`; app-only tokens cannot use `/me/todo`.

Outlook needs access to `finance@moonshinednb.nl` and `Mail.Read` permissions appropriate to the mailbox. The worker checks the latest 50 attachment emails every minute, stores matching invoice attachments and remembers processed message IDs. No message is deleted or sent. For large inbox backfills or more than 50 new attachment messages per minute, use a Graph delta adapter. The notification endpoint handles Graph validation/clientState, but Graph cannot directly reach a private tailnet-only URL; use polling or a separately authorized relay. Graph subscription provisioning and renewal must be configured when adding that relay.

OneDrive needs file-write permissions, drive-ID and pre-existing folder/year folders. Posted documents are archived automatically; failed archive writes leave the local and Odoo copies intact and are audited/retried.

To Do requires list-ID. It pushes new local tasks and edited titles, descriptions, deadlines, priorities and completion states, then pulls remote tasks each minute. Recovery and imports follow Graph pagination. It synchronizes one list under the configured account. User assignment remains local metadata. Remote deletion is not propagated to local records.

### ING and SumUp

ING can reuse your bank feed in Odoo through the existing-feed mode above. CSV and authenticated normalized webhook ingestion are also implemented. No direct ING PSD2 provider or SumUp API credential has been connected. Bring the provider feed when linking accounts. The template uses:

```csv
external_id;date;description;amount;fee;category;vat_rate;payout_id
```

Amounts are euro values; costs are positive; bank withdrawals are negative. Dates use ISO `YYYY-MM-DD`. `external_id` must be a stable unique ID from the source. `category` is `sales`, `settlement`, `fee` or `unknown`. `vat_rate` is 0, 9 or 21 when known. Never classify an ING SumUp settlement as revenue.

The webhook accepts POST `/api/webhooks/bank`, `Authorization: Bearer <server-side key>`, with `{ "source": "ING" | "SumUp", "transactions": [{ "external_id": "...", "date": "...", "description": "...", "amount": "..." }] }`. Access remains restricted to the tailnet. Configure a strong key before use. Source adapters must verify provider signatures and normalize/categorize their feeds before forwarding.

For SumUp posting, set a sales journal, revenue account, fee account, reconcile-enabled receivable clearing account and sales-tax mapping. Sales and the one ING settlement must share `payout_id`. The flow checks gross minus fees equals the settlement exactly, creates sales invoices using the configured Odoo taxes, posts fees separately, creates the bank transfer against the clearing account, and reconciles the group. It supports positive EUR sales at 9% or 21%; refunds, split settlements and mixed-rate individual transactions require additional handling. Automatic settlement is off until configured and tested with the actual Odoo ledger.

## VAT boundaries

This is a provisional worksheet, not a filed tax return. It includes local posted invoices and classified sales, not the complete Odoo ledger. It omits unsupported tax rubrics and credits, and therefore cannot certify a ready-to-file return. Compare with Odoo's complete statutory report before filing. EU and non-EU reverse-charge services are split between 4b and 4a; only confirmed reverse charge is counted. A UK agency is not an EU supplier. The 9% performer rate depends on the actual artistic service, not the word DJ in a supplier name.

Official references:

- [Belastingdienst: uitvoerende kunstenaars](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/tarieven_en_vrijstellingen/diensten_9_btw/uitvoerende_kunstenaars)
- [Belastingdienst: buitenlandse verlegging](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/btw_berekenen_aan_uw_klanten/waarover_btw_berekenen/verleggingsregeling/wanneer_btw_verleggen/verlegging_bij_zakendoen_met_het_buitenland)
- [Odoo: external RPC API](https://www.odoo.com/documentation/19.0/developer/reference/external_rpc_api.html)
- [Claude: PDF input](https://platform.claude.com/docs/en/build-with-claude/pdf-support)
- [Motion: installation and animation](https://motion.dev/docs/quick-start)

The automated suite covers local permissions, sessions/CSRF, input validation, totals, tax classification, deduplication and matching boundaries. External posting and reconciliation must be integration-tested with your actual accounts and Odoo configuration before unattended operation.
