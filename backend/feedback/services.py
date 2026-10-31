from decimal import Decimal, InvalidOperation
from core.models import User
from .models import DECISIONS, STATUSES, Review, Track, TrackLog

STATUS = dict(STATUSES)
REVIEWERS = ('peppy', 'bram', 'shoroy')


def display(username):
    u = User.objects.filter(username=username).first()
    return u.display_name if u else username


def score(value):
    if value in (None, ''):
        return None
    try:
        v = Decimal(str(value).replace(',', '.')).quantize(Decimal('0.1'))
    except InvalidOperation:
        raise ValueError('Cijfer: een getal van 1 tot 10.')
    if not Decimal('0') <= v <= Decimal('10'):
        raise ValueError('Cijfer: een getal van 1 tot 10.')
    return v


def review_dict(r):
    return {'reviewer': r.reviewer, 'name': display(r.reviewer), 'production': float(r.production) if r.production is not None else None,
            'composition': float(r.composition) if r.composition is not None else None, 'decision': r.decision, 'release_types': r.release_types,
            'production_feedback': r.production_feedback, 'composition_feedback': r.composition_feedback, 'dealbreaker': r.dealbreaker,
            'updated': r.updated.timestamp()}


def average(reviews):
    marks = [float(x) for r in reviews for x in (r.production, r.composition) if x is not None]
    return round(sum(marks) / len(marks), 1) if marks else None


def track_dict(t, full=False):
    reviews = list(t.reviews.all())
    out = {'id': t.id, 'number': t.number, 'artist': t.artist, 'title': t.title, 'link': t.link, 'file_url': t.file_url, 'file_name': t.file_name,
           'has_file': bool(t.file_id), 'scouted_by': t.scouted_by, 'status': t.status, 'release_id': t.release_id,
           'release': f'{t.release.catalog} {t.release.title}'.strip() if t.release else '', 'options': t.options, 'contact': t.contact,
           'average': average(reviews), 'reviews': {r.reviewer: review_dict(r) for r in reviews}, 'updated': t.updated.timestamp()}
    if full:
        out['notes'] = t.notes
        out['log'] = [{'id': l.id, 'kind': l.kind, 'body': l.body, 'author': display(l.author), 'created': l.created.timestamp()} for l in t.log.all()[:200]]
    return out


def apply(t, d, actor):
    from production.models import Release
    from production import rules as R
    before = t.status
    for key, limit in (('artist', 300), ('title', 300), ('scouted_by', 150), ('notes', 8000), ('contact', 300)):
        if key in d:
            setattr(t, key, R._text(d[key], limit))
    if 'link' in d:
        t.link = R._url(d['link'], 'Link') if d['link'] else ''
    if 'status' in d:
        if d['status'] not in STATUS:
            raise ValueError('Onbekende status.')
        t.status = d['status']
    if 'release_id' in d:
        t.release = Release.objects.filter(id=d['release_id']).first() if d['release_id'] else None
    if 'options' in d:
        opts = d['options'] if isinstance(d['options'], list) else []
        t.options = [str(o)[:100] for o in opts if str(o).strip()][:10]
    if not t.artist.strip() or not t.title.strip():
        raise ValueError('Vul artiest en titel in.')
    t.save()
    if t.status != before and before:
        TrackLog.objects.create(track=t, kind='status', body=f'{STATUS.get(before, before)} → {STATUS[t.status]}', author=actor)
    return t


def save_review(t, reviewer, d):
    r, _ = Review.objects.get_or_create(track=t, reviewer=reviewer)
    if 'production' in d:
        r.production = score(d['production'])
    if 'composition' in d:
        r.composition = score(d['composition'])
    if 'decision' in d:
        if d['decision'] not in dict(DECISIONS):
            raise ValueError('Onbekend oordeel.')
        r.decision = d['decision']
    for key, limit in (('release_types', 100), ('production_feedback', 8000), ('composition_feedback', 8000), ('dealbreaker', 300)):
        if key in d:
            setattr(r, key, str(d[key] or '')[:limit])
    r.save()
    if t.status in ('new',):
        t.status = 'in_review'
        t.save(update_fields=['status', 'updated'])
    return r
