import signal
from django.core.management.base import BaseCommand
from jobs.queue import work_forever


class Command(BaseCommand):
    help = 'Runs background jobs and periodic syncs until stopped.'

    def handle(self, *args, **options):
        state = {'stop': False}
        signal.signal(signal.SIGTERM, lambda *_: state.update(stop=True))
        self.stdout.write('Moonshine worker gestart')
        work_forever(lambda: state['stop'])
