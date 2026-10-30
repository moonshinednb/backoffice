from django.apps import AppConfig


class ProductionConfig(AppConfig):
    name = 'production'
    default_auto_field = 'django.db.models.BigAutoField'
