import logging
import asyncio
import json
from dotenv import load_dotenv
from livekit.agents import (
    JobContext,
    JobProcess,
    Agent,
    AgentSession,
    inference,
    AgentServer,
    cli,
)
from livekit.plugins import silero
from livekit import rtc
from datetime import datetime

load_dotenv()

logger = logging.getLogger("livekit-agent")
logger.setLevel(logging.INFO)


class STTMetricsAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
                You are a helpful agent that helps users describe their application ideas.
                Listen carefully and help them articulate their thoughts clearly.
            """
        )

    async def on_enter(self):
        """Called when agent enters the session"""
        # Send initial greeting
        await self.session.say(
            "Hello! I'm ready to help you describe your idea. Please go ahead."
        )

    async def on_user_speech_committed(self, msg: str):
        """Called when user speech is finalized by STT"""
        logger.info(f"User said: {msg}")

        # Send the final transcription to the room via data channel
        if self.session and self.session.room:
            data = json.dumps(
                {
                    "type": "transcription",
                    "text": msg,
                    "is_final": True,
                    "timestamp": datetime.now().isoformat(),
                }
            ).encode("utf-8")

            await self.session.room.local_participant.publish_data(data, reliable=True)
            logger.info(f"Sent final transcription to frontend")

        # Let the agent generate a response
        await self.session.generate_reply()


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session()
async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    logger.info(f"Agent starting for room: {ctx.room.name}")

    # Create the agent session with STT, LLM, and TTS
    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3-general"),
        llm=inference.LLM(model="openai/gpt-4o-mini"),
        tts=inference.TTS(
            model="cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
        ),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=False,  # Don't generate replies before user finishes speaking
    )

    # Create agent instance
    agent = STTMetricsAgent()

    # Start the session
    await session.start(agent=agent, room=ctx.room)

    # Connect to the room
    await ctx.connect()

    logger.info("Agent connected and ready")


if __name__ == "__main__":
    cli.run_app(server)
