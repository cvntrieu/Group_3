import os
from dotenv import load_dotenv
from datetime import datetime
from logger import logger

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, RunContext
from livekit.plugins import noise_cancellation, silero, azure, google
from livekit.agents.llm import function_tool

from functions import process_user_input

load_dotenv(".env")

class Assistant(Agent):
    """A voice AI assistant agent."""
    
    def __init__(self) -> None:
        super().__init__(
            # instructions="""You are a helpful voice AI assistant.
            # You eagerly assist users with their questions by providing information from your extensive knowledge.
            # Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            # You are curious, friendly, and have a sense of humor.""",
            instructions="""
                You are a helpful voice AI assistant.
                If the user requests any operation involving access to a local file,
                you must call the function process_text_request() and pass the user’s request to it.
                For all other requests, respond normally.
            """
        )
    
    async def on_transcription(self, ctx: RunContext, transcription: str):
        logger.info(f"[USER] {transcription}")

    async def on_response_sent(self, ctx: RunContext, response_text: str):
        logger.info(f"[AGENT] {response_text}")
    
    @function_tool
    async def get_current_date_and_time(self, ctx: RunContext) -> str:
        """Get the current date and time."""
        return datetime.now().strftime("Current date and time: %Y-%m-%d %H:%M:%S")
    
    @function_tool
    async def process_text_request(self, ctx: RunContext, user_input: str) -> str:
        """Process user text or voice request using the process_user_input function."""
        try:
            result = process_user_input(user_input)
            if result.intent == "read raw text":
                print(result.raw_text)
                return f"I will read the file you requested: {result.raw_text}"
            elif result.intent == "read file and summary":
                print(result.summary.summary)
                return f"Summary of the file you requested: {result.summary.summary}"
            else:
                return "Sorry, I could not understand your request."
        except Exception as e:
            return f"Error while processing: {e}"
    


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
        vad=silero.VAD.load(min_silence_duration=2.0),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            video_enabled=True,
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))