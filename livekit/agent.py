import logging
import os
import asyncio
from dotenv import load_dotenv

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice import Agent as VoiceAgent
from livekit.plugins import groq

load_dotenv()

logger = logging.getLogger("groq-refiner")

# 1. Define the System Prompt - RAW MODE (no refining)
SYSTEM_PROMPT = (
    "You are a simple transcription passthrough. "
    "Repeat exactly what the user says without any changes, refinements, or additions. "
    "Just echo back their exact words."
)

# REFINING MODE (uncomment to enable text refinement):
# SYSTEM_PROMPT = (
#     "You are a text refinement engine. Your goal is to take the user's spoken input "
#     "and rewrite it to be professional, concise, and effective. "
#     "Do not reply with conversation (like 'Here is the text'). "
#     "Just output the refined text directly."
# )

def prewarm(proc: JobProcess):
    proc.userdata["stt"] = groq.STT(model="whisper-large-v3")
    proc.userdata["llm"] = groq.LLM(model="llama-3.3-70b-versatile")

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 2. Connect to the Room's Chat
    chat = llm.ChatContext().append(
        role="system",
        text=SYSTEM_PROMPT,
    )

    # 3. Define a callback to hijack the text before it is spoken
    # This sends the refined text to the frontend as a Chat Message
    async def _send_text_to_chat(agent: VoiceAgent, text: str | asyncio.Future):
        # Resolve text if it's a future/async generator
        if asyncio.iscoroutine(text) or isinstance(text, asyncio.Future):
            content = await text
        else:
            content = text
        
        # Send the text back to the room as a chat message
        if content:
            logger.info(f"Transcribed Text: {content}")
            await ctx.room.local_participant.publish_data(
                payload=str(content).encode('utf-8'),
                topic="lk-chat-topic"  # Standard topic for chat widgets
            )
            
            # Also send as a formal chat message object if using standard UI
            # (This ensures it pops up in LiveKit's prebuilt chat components)
            from livekit.rtc import ChatMessage
            await ctx.room.local_participant.send_chat_message(content)

        return content

    # 4. Initialize the Agent
    participant = await ctx.wait_for_participant()
    
    # RAW MODE: No LLM processing, direct STT passthrough (saves tokens)
    agent = VoiceAgent(
        vad=ctx.proc.userdata.get("vad"),
        stt=ctx.proc.userdata["stt"],
        llm=None,  # Set to ctx.proc.userdata["llm"] to enable refining
        tts=groq.TTS(),
        chat_ctx=chat,
        before_tts_cb=_send_text_to_chat
    )
    
    # REFINING MODE (uncomment to enable):
    # agent = VoiceAgent(
    #     vad=ctx.proc.userdata.get("vad"),
    #     stt=ctx.proc.userdata["stt"],
    #     llm=ctx.proc.userdata["llm"],
    #     tts=groq.TTS(),
    #     chat_ctx=chat,
    #     before_tts_cb=_send_text_to_chat
    # )

    agent.start(ctx.room, participant)
    
    # Optional: Greet the user via Chat so they know it's ready
    await ctx.room.local_participant.send_chat_message("I am ready. Speak, and I will transcribe your text.")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        ),
    )