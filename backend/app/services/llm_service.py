import logging
from typing import List, Dict, Optional
from anthropic import Anthropic
from app.core.config import ANTHROPIC_API_KEY, LLM_MODEL, MAX_TOKENS

logger = logging.getLogger(__name__)

client = None
if ANTHROPIC_API_KEY:
    client = Anthropic(api_key=ANTHROPIC_API_KEY)


def chat_completion(
    messages: List[Dict[str, str]],
    system_prompt: str,
    max_tokens: int = MAX_TOKENS
) -> str:
    """Get completion from Claude API."""
    if not client:
        raise ValueError("ANTHROPIC_API_KEY not configured")

    try:
        response = client.messages.create(
            model=LLM_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise


def stream_completion(
    messages: List[Dict[str, str]],
    system_prompt: str,
    max_tokens: int = MAX_TOKENS
):
    """Stream completion from Claude API."""
    if not client:
        raise ValueError("ANTHROPIC_API_KEY not configured")

    try:
        with client.messages.stream(
            model=LLM_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages
        ) as stream:
            for text in stream.text_stream:
                yield text
    except Exception as e:
        logger.error(f"LLM streaming error: {e}")
        raise
