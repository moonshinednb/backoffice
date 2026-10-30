from datetime import date, timedelta
from django.db import migrations

STEPS = [('Master en artwork binnen', -42), ('Aanleveren bij distributie', -28), ('Pitch en pre-save naar DSP’s', -21),
         ('Promo-assets klaar (visuals, teaser)', -14), ('Aankondiging op socials', -7), ('Release day', 0), ('Promo-push en playlist-follow-up', 7)]


def seed(apps, schema_editor):
    Release, Step = apps.get_model('production', 'Release'), apps.get_model('production', 'ReleaseStep')
    for r in Release.objects.all():
        if Step.objects.filter(release=r).exists():
            continue
        try:
            base = date.fromisoformat(r.release_date) if r.release_date else None
        except ValueError:
            base = None
        done = r.status == 'released'
        for i, (label, d) in enumerate(STEPS):
            Step.objects.create(id=f'{r.id[:18]}s{i:05d}', release=r, label=label, sort=i, done=done,
                                due=(base + timedelta(days=d)).isoformat() if base else '')


class Migration(migrations.Migration):
    dependencies = [('production', '0002_artist_contact_via_artist_on_label_and_more')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
