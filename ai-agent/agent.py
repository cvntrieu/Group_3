import os
from storage import ConversationCache
from dotenv import load_dotenv
from datetime import datetime
from logger import logger
from const import PAIRS_TO_FLUSH

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, RunContext
from livekit.plugins import noise_cancellation, silero, azure, google, openai
from livekit.agents.llm import function_tool
from livekit.agents import ConversationItemAddedEvent
from livekit.agents.llm import ImageContent, AudioContent

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
        self.context_pairs = []


    def update_context(self, username: str):
        """Always keep the latest 5 context pairs."""
        self.cache = ConversationCache(username=username, pairs_to_flush=int(PAIRS_TO_FLUSH))
        
        new_pairs = self.cache.get_last_n_pairs(5)
        self.context_pairs = new_pairs
    
    # async def on_transcription(self, ctx: RunContext, transcription: str):
    #     logger.info(f"[USER] {transcription}")
    #     try:
    #         cache.add_user_message(transcription)
    #     except Exception as e:
    #         logger.error(f"Failed to add user message to cache: {e}")

    # async def on_response_sent(self, ctx: RunContext, response_text: str):
    #     logger.info(f"[AGENT] {response_text}")
    #     try:
    #         cache.add_agent_message(response_text)
    #     except Exception as e:
    #         logger.error(f"Failed to add agent message to cache or flush: {e}")
    
    @function_tool
    async def get_current_date_and_time(self, ctx: RunContext) -> str:
        """Get the current date and time."""
        return datetime.now().strftime("Current date and time: %Y-%m-%d %H:%M:%S")
    
    @function_tool
    async def process_text_request(self, ctx: RunContext, user_input: str) -> str:
        """Process user text or voice request using the process_user_input function."""
        try:
            assistant = ctx.agent
            context_pairs = assistant.context_pairs
            result = process_user_input(user_input, context=context_pairs)
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

    assistant = Assistant()

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
    
    @session.on("conversation_item_added")
    def on_conversation_item_added(event: ConversationItemAddedEvent):
        role = event.item.role
        text_contents = event.item.text_content
        print(f"Conversation item added from {role}: {text_contents}. interrupted: {event.item.interrupted}")
        # to iterate over all types of content:
        for content in event.item.content:
            if isinstance(content, str):
                if role == "user":
                    # USER input text
                    logger.info(f"[USER] {content}")
                    assistant.cache.add_user_message(content)
                elif role == "assistant":
                    # AGENT response text
                    logger.info(f"[AGENT] {content}")
                    assistant.cache.add_agent_message(content)
            elif isinstance(content, ImageContent):
                # image is either a rtc.VideoFrame or URL to the image
                print(f" - image: {content.image}")
            elif isinstance(content, AudioContent):
                # frame is a list[rtc.AudioFrame]
                print(f" - audio: {content.frame}, transcript: {content.transcript}")
        assistant.update_context(ctx.room.local_participant.identity)
        print("Updated context pairs:", assistant.context_pairs)
    
    @session.on("close")
    def on_session_close():
        logger.info("Session is closing.")
        assistant.cache.flush()

    await session.start(
        room=ctx.room,
        agent=assistant,
        room_input_options=RoomInputOptions(
            video_enabled=True,
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    username = ctx.room.local_participant.identity
    assistant.update_context(username=username)


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))