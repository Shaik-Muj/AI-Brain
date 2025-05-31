import json

class Memory:
    def __init__(self):
        self.store = {}

    def get_context(self, user_id):
        """Retrieve context for a given user."""
        return self.store.get(user_id, {})

    def update_context(self, user_id, context):
        """Update context for a given user."""
        self.store[user_id] = context

class LongTermMemory:
    def __init__(self):
        self.history_store: dict[str, list[tuple[str, str]]] = {}

    def get_interactions(self, user_id: str) -> list[tuple[str, str]]:
        """Retrieve all interactions for a given user."""
        return self.history_store.get(user_id, [])

    def add_interaction(self, user_id: str, question: str, answer: str) -> None:
        """Add a new interaction to the user\'s history."""
        if user_id not in self.history_store:
            self.history_store[user_id] = []
        self.history_store[user_id].append((question, answer))
