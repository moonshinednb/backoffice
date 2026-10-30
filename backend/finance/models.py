"""Invoices, bank lines and what came in by mail. Amounts are euro cents."""
from django.db import models
from core.models import uid


class Document(models.Model):
    STATUSES = [('awaiting_ai', 'Wacht op AI'), ('processing', 'Wordt verwerkt'), ('review', 'Controle nodig'), ('posted', 'Geboekt')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    name = models.CharField(max_length=200)
    mime = models.CharField(max_length=100)
    sha = models.CharField(max_length=64, unique=True)
    size = models.IntegerField()
    source = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUSES, default='awaiting_ai', db_index=True)
    details = models.JSONField(default=dict)
    odoo_id = models.IntegerField(null=True, blank=True)
    error = models.TextField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True, db_index=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created']


class Transaction(models.Model):
    CATEGORIES = [('sales', 'Omzet'), ('settlement', 'Uitbetaling'), ('fee', 'Kosten'), ('unknown', 'Onbekend')]
    id = models.CharField(primary_key=True, max_length=24, default=uid, editable=False)
    external_id = models.CharField(max_length=300, unique=True)
    source = models.CharField(max_length=20)
    date = models.DateField(db_index=True)
    description = models.TextField()
    amount = models.IntegerField()
    fee = models.IntegerField(default=0)
    vat_rate = models.IntegerField(null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='unknown')
    status = models.CharField(max_length=20, default='open', db_index=True)
    document = models.ForeignKey(Document, null=True, blank=True, on_delete=models.SET_NULL)
    odoo_id = models.IntegerField(null=True, blank=True)
    payout_id = models.CharField(max_length=200, blank=True, default='', db_index=True)
    statement_id = models.IntegerField(null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created']


class ProcessedMessage(models.Model):
    """Mail message ids already ingested, so a poll never imports twice."""
    external_id = models.CharField(primary_key=True, max_length=500)
    created = models.DateTimeField(auto_now_add=True)
