from django.db import migrations


def to_staff(apps, schema_editor):
    apps.get_model('core', 'User').objects.exclude(role='admin').update(role='staff')


class Migration(migrations.Migration):
    dependencies = [('core', '0004_staff_role')]
    operations = [migrations.RunPython(to_staff, migrations.RunPython.noop)]
