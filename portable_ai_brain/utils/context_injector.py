from utils.prompt_memory import get_history

def inject_context(prompt: str, context: dict) -> str:
    memory = get_history()
    memory_text = "\n".join(f"- {p}" for p in memory)

    return (
        f"User Context:\n"
        f"- Name: {context.get('name')}\n"
        f"- Writing Style: {context.get('writing_style')}\n"
        f"- Goals: {context.get('goals')}\n"
        f"- Preferred Tone: {context.get('tone')}\n\n"
        f"Conversation History:\n{memory_text or 'None'}\n\n"
        f"User Prompt: {prompt}"
    )
