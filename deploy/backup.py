#!/usr/bin/env python3
"""Consistent SQLite and original-file backup. Never modifies live data."""
import sqlite3, tarfile, tempfile, os
from pathlib import Path
from datetime import datetime, timezone
data=Path('/var/lib/moonshine');target=Path('/var/backups/moonshine')
target.mkdir(mode=0o700,parents=True,exist_ok=True)
stamp=datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
with tempfile.TemporaryDirectory() as temp:
    snap=Path(temp)/'moonshine.sqlite3'
    with sqlite3.connect(data/'moonshine.sqlite3') as src,sqlite3.connect(snap) as dst:src.backup(dst)
    archive=target/('moonshine-'+stamp+'.tar.gz')
    with tarfile.open(archive,'w:gz') as tar:
        tar.add(snap,arcname='moonshine.sqlite3')
        tar.add(data/'files',arcname='files')
        if (data/'secrets.json').exists():tar.add(data/'secrets.json',arcname='secrets.json')
    archive.chmod(0o600)
print('Backup gereed:',archive)
