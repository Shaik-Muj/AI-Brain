import re

def split_into_subtasks(prompt: str) -> list[str]:
    # Very simple splitter based on sentences and keywords
    parts = re.split(r'[.?!]', prompt)
    subtasks = [p.strip() for p in parts if p.strip()]
    return subtasks