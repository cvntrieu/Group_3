import os
from dotenv import load_dotenv
from datetime import datetime

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, RunContext
from livekit.plugins import noise_cancellation, silero, azure, google
from livekit.agents.llm import function_tool

load_dotenv(".env")

class Assistant(Agent):
    """A voice AI assistant agent."""
    
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor.""",
        )
    
    @function_tool
    async def get_current_date_and_time(self, ctx: RunContext) -> str:
        """Get the current date and time."""
        return datetime.now().strftime("Current date and time: %Y-%m-%d %H:%M:%S")
    


async def entrypoint(ctx: agents.JobContext):
    """Entry point for the agent session."""

    session = AgentSession(
        stt=azure.STT(
            speech_key=os.environ.get("AZURE_SPEECH_KEY"),
            speech_region=os.environ.get("AZURE_SPEECH_REGION"),
        ),
        llm=google.realtime.RealtimeModel(
            api_key=os.environ.get("GOOGLE_API_KEY"),
            model= os.environ.get("GEMINI_MODEL"),
        ),
        tts=azure.TTS(
            speech_key=os.environ.get("AZURE_SPEECH_KEY"),
            speech_region=os.environ.get("AZURE_SPEECH_REGION"),
        ),
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            video_enabled=True,
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))