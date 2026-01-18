import logging
import asyncio
import json
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    AgentServer,
    JobContext,
    JobProcess,
    cli,
    stt,
)
from livekit.plugins import silero, assemblyai

logger = logging.getLogger("agent")

load_dotenv(".env.local")

server = AgentServer()

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

server.setup_fnc = prewarm

@server.rtc_session()
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }
    
    logger.info("Agent started")

    # Initialize STT
    # Using AssemblyAI as requested/configured
    stt_provider = assemblyai.STT()

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.TrackPublication, participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info(f"Subscribed to audio track from {participant.identity}")
            asyncio.create_task(handle_audio(track, stt_provider, ctx.room))

    await ctx.connect()
    
    # Keep the agent alive
    await ctx.wait_for_termination()


async def handle_audio(track: rtc.AudioTrack, stt_provider: stt.STT, room: rtc.Room):
    stream = stt_provider.stream()
    audio_stream = rtc.AudioStream(track)

    async def read_audio():
        async for frame in audio_stream:
            stream.push_frame(frame)
        stream.end_input()

    async def read_stt():
        async for event in stream:
            if event.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
                text = event.alternatives[0].text
                if text:
                    logger.info(f"Transcription: {text}")
                    # Publish data to the room
                    await room.local_participant.publish_data(
                        payload=text.encode("utf-8"),
                        topic="transcription",
                        reliable=True
                    )

    try:
        await asyncio.gather(read_audio(), read_stt())
    except Exception as e:
        logger.error(f"Error in handle_audio: {e}")
    finally:
        await stream.aclose()


if __name__ == "__main__":
    cli.run_app(server)