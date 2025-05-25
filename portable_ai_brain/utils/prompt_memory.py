# A temporary memory store (can later be replaced with Redis, DB, etc.)
PROMPT_HISTORY = []

def save_prompt(prompt: str):
    PROMPT_HISTORY.append(prompt)
    if len(PROMPT_HISTORY) > 5:
        PROMPT_HISTORY.pop(0)  # Keep only last 5

def get_history():
    return PROMPT_HISTORY