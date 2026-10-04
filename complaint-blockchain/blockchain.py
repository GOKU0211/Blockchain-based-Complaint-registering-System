import hashlib
import json
import os
import time

CHAIN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "chain.json")


class Block:
    def __init__(self, index, data, timestamp, previous_hash, hash=None):
        self.index = index
        self.data = data  # dict: text, wallet, onchain_id, tx_hash
        self.timestamp = timestamp
        self.previous_hash = previous_hash
        self.hash = hash or self.compute_hash()

    def compute_hash(self):
        payload = json.dumps(
            {
                "index": self.index,
                "data": self.data,
                "timestamp": self.timestamp,
                "previous_hash": self.previous_hash,
            },
            sort_keys=True,
        )
        return hashlib.sha256(payload.encode()).hexdigest()

    def to_dict(self):
        return {
            "index": self.index,
            "data": self.data,
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
        }


class Blockchain:
    def __init__(self, filepath=CHAIN_FILE):
        self.filepath = filepath
        self.chain = []
        self._load()
        if not self.chain:
            self._create_genesis()

    def _create_genesis(self):
        genesis = Block(0, {"text": "Genesis block"}, time.time(), "0")
        self.chain.append(genesis)
        self._save()

    def _load(self):
        if os.path.exists(self.filepath):
            try:
                with open(self.filepath, "r") as f:
                    raw = json.load(f)
                self.chain = [Block(**b) for b in raw]
            except (json.JSONDecodeError, TypeError):
                self.chain = []

    def _save(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w") as f:
            json.dump([b.to_dict() for b in self.chain], f, indent=2)

    def add_block(self, data):
        last = self.chain[-1]
        block = Block(len(self.chain), data, time.time(), last.hash)
        self.chain.append(block)
        self._save()
        return block

    def is_chain_valid(self):
        for i in range(1, len(self.chain)):
            cur, prev = self.chain[i], self.chain[i - 1]
            if cur.hash != cur.compute_hash():
                return False, i
            if cur.previous_hash != prev.hash:
                return False, i
        return True, None

    def to_list(self):
        return [b.to_dict() for b in self.chain]