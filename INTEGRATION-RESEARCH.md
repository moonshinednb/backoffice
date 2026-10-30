# Moonshine: OpenSign en promomailer

Onderzocht op 7 oktober 2026. Dit is een uitvoerbaar integratievoorstel; deze twee modules zijn nog niet geïmplementeerd of gekoppeld. Er zijn geen mails, contracten of contactlijsten naar een dienst verstuurd.

## Promomailer: goed te integreren

De bestaande app staat in `C:/Users/Pepij/Documents/_CLAUDE CODE/Outlook Mailer`. De onderzochte versie is **Moonshine Mailer v3.1**, een Python/CustomTkinter-app die Outlook Classic via `win32com` aanspreekt. Het is geen VBA-project. De oudere LEESMIJ beschrijft minder functies dan de huidige broncode.

| Bestaande functie | Bron in mailer_app.py | Migratie naar backoffice |
|---|---|---|
| Excel-import van promo-, playlist- en Instagramcontacten; samenvoegen op e-mail/handle | `import_promo_excel`, `merge_into_db` | Upload/import met voorvertoning; aparte contacten- en groeps-tabellen |
| Template per groep, contacttemplate en individuele afwijking | `resolve_for`, `TemplateManager`, `ContactEditor` | Dezelfde volgorde behouden: persoonlijk → contacttemplate → groep → standaard |
| Meerdere releases, artiesten, links, artwork, promotekst en afzender | `campaign_mapping`, `releases_list` | Campagnes met opgeslagen inhoud en ontvangerssnapshot |
| Persoonlijke velden, HTML-links, inline logo en bijlagen | `render`, `text_to_html`, `_worker` | Gecontroleerde HTML; Graph inline `contentId` en bestandsbijlagen |
| Ontvangersselectie, zoekfilter, voorbeeld, concepten en verzendpauze | `_send_all`, `_preview`, `_worker` | Voorbeeld per ontvanger, conceptmodus en duurzame verzendwachtrij |
| Instagram DM-tekst kopiëren en profiel openen | `DmListWindow`, `dm_text` | Kopieerbare DM-lijst met veilige links; blijft een handmatige actie |
| Activiteit en verzendlog | `_log_to_file`, `_worker` | Status per ontvanger en audit met beperkte inzage |

Outlook COM is een Windows-desktopafhankelijkheid en kan niet rechtstreeks in de Ubuntu-dienst draaien. Voor de server gebruiken we Microsoft Graph. Graph ondersteunt mail verzenden en bijlagen; `202 Accepted` betekent dat het verzoek is aangenomen, niet dat de ontvanger de mail heeft ontvangen. Toon daarom **aangenomen door Outlook**, en verwerk latere fouten afzonderlijk. [Microsoft Graph sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)

De bestaande finance-koppeling gebruikt `Mail.Read`. Verzenden vraagt apart `Mail.Send`; conceptbeheer vraagt aanvullende mail-schrijfrechten. Beperk application-rechten tot de bedoelde promo-mailboxen en controleer Send As/delegatie voor `label@` en `info@`. Nieuwe Outlook ondersteunt geen VBA/macros; een Graph-koppeling voorkomt die desktopafhankelijkheid. [VBA-alternatieven](https://learn.microsoft.com/en-us/microsoft-365-apps/outlook/get-started/vba-alternatives), [verzendrechten voor een andere gebruiker](https://learn.microsoft.com/en-us/graph/outlook-send-mail-from-other-user)

### Controles die we moeten toevoegen

De huidige mailer houdt zijn wachtrij alleen in geheugen. Hij heeft geen duurzame campagne/ontvanger-idempotentie, stop/hervat, automatische verwerking van `Retry-After`, afmeldblokkade of controle op bezorging. Een ontbrekende bijlage wordt gelogd, waarna de mail alsnog kan worden verstuurd. Dat moet bij verplichte promo-bestanden blokkeren. `save_data` negeert opslagfouten; in de webversie moet zo'n fout zichtbaar zijn.

Voor de nieuwe module: één unieke rij per campagne en ontvanger, preview/testmail, servercontrole van afzenderrechten, expliciete campagneverzending, stop/hervat, afmeldlijst, opslag van toestemming/bron waar nodig, limieten en een status **onzeker** bij een netwerkfout nadat verzending mogelijk al is aangenomen. Niet blind opnieuw versturen. Een account met finance- of viewerrechten krijgt niet automatisch promoverzendrechten.

Een pauze van enkele seconden garandeert geen goede aflevering of naleving van limieten. Exchange Online heeft mailbox- en tenantlimieten; Microsoft adviseert voor commerciële bulkmail een gespecialiseerde verzenddienst. Gebruik Graph voor beheersbare persoonlijke promo-outreach; kies een aparte bulkverzendadapter voor grotere campagnes. [Exchange Online-limieten](https://learn.microsoft.com/en-us/office365/servicedescriptions/exchange-online-service-description/exchange-online-limits)

Migratie leest later `database.xlsx` en `mailer_data.json` met een importvoorbeeld. Die bestanden zijn nu niet geïmporteerd. Bestaande verzendlogs worden historie, geen bewijs van bezorging. De oorspronkelijke desktopapp blijft bruikbaar.

## OpenSign: technisch passend, betaalde API nodig

Een module **Contracten** kan templates voor artiesten, agencies en leveranciers bewaren, concepten aanmaken, ondertekenstatus tonen en het voltooide PDF met certificaat in OneDrive archiveren. De officiële API biedt documenten, templates, contacten, status en webhooks. Sleutels horen uitsluitend op de server. [OpenSign API v1.2](https://docs.opensignlabs.com/docs/API-docs/v1.2/opensign-api-v-1-2/)

De gratis self-hosted versie ondersteunt volgens de huidige documentatie **geen API-token-generatie**. Voor deze geautomatiseerde koppeling is een betaald self-hosted plan nodig. API-creatie en bepaalde templateflows gebruiken premium credits; prijs en beschikbaarheid moeten voor aanschaf worden bevestigd. Gratis handmatig gebruik van OpenSign is daarom een andere workflow. [OpenSign API-token en credits](https://docs.opensignlabs.com/docs/help/Settings/APIToken/)

Voorkeursarchitectuur: de backoffice blijft privé in Tailscale. OpenSign krijgt een aparte dienst/database/opslag, of gebruikt de EU-cloudomgeving. Externe artiesten kunnen een uitsluitend privé-Tailscale-signlink niet bereiken zonder toegang tot die tailnet. Een publieke ondertekenomgeving moet dus apart bereikbaar zijn; de backoffice wordt daarvoor niet publiek gemaakt. [Self-hosting](https://docs.opensignlabs.com/docs/self-host/intro/)

Status komt via polling, of via een afzonderlijk bereikbare webhook-ingang. Verifieer de HMAC-SHA256-handtekening op de oorspronkelijke requestbytes in `x-webhook-signature`, dedupliceer events en bevestig voltooiing bij de provider. Download geen willekeurige URL uit een webhook: gebruik toegestane HTTPS-opslaghosts, bestandsgroottelimieten en controles op het document-ID. Bewaar signing-links niet in algemene auditlogs; zo'n link kan toegang tot een contract geven. [OpenSign-webhooks](https://docs.opensignlabs.com/docs/help/Settings/Webhook/)

Voor implementatie ontbreken: keuze betaald self-hosted of EU-cloud, contracttemplates, toegestane afzenders/ondertekenaars, mailboxrechten en de koppelsleutels. Installatie, aanschaf, publiek bereikbaar maken en echte verzending zijn niet uitgevoerd.

## Aanbevolen volgorde

1. Promomodule met contacten, templates, releases en concepten bouwen; de bestaande v3.1-functies vormen het uitgangspunt.
2. Microsoft-koppeling en mailboxrechten testen met een eigen testmail; wachtrij en dubbele-verzendpreventie verifiëren.
3. OpenSign-plan kiezen, geïsoleerde omgeving toevoegen en de contractflow testen met een niet-vertrouwelijk testdocument.
4. Pas na providerchecks automatische campagnes of contractaanvragen inschakelen.
