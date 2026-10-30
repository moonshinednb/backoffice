"""Verifies passwords from the first backoffice version.

Those were stored as `<salt hex>:<scrypt hex>` (n=16384, r=8, p=1, 64 bytes).
Imported users get `legacy_scrypt$<salt>:<hash>`; Django re-hashes with the
current default the first time they log in.
"""
import hashlib
import secrets
from django.contrib.auth.hashers import BasePasswordHasher


class LegacyScryptHasher(BasePasswordHasher):
    algorithm = 'legacy_scrypt'

    def encode(self, password, salt):
        raw = bytes.fromhex(salt) if len(salt) == 32 else secrets.token_bytes(16)
        digest = hashlib.scrypt(password.encode(), salt=raw, n=16384, r=8, p=1).hex()
        return f'{self.algorithm}${raw.hex()}:{digest}'

    def verify(self, password, encoded):
        try:
            salt, digest = encoded.split('$', 1)[1].split(':')
            actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
        except (ValueError, IndexError):
            return False
        return secrets.compare_digest(actual, digest)

    def safe_summary(self, encoded):
        return {'algorithm': self.algorithm}

    def must_update(self, encoded):
        return True

    def harden_runtime(self, password, encoded):
        pass
