from typing import Optional, Literal
from pydantic import BaseModel, Field


class RequestType(BaseModel):
    """Router LLM call: Dertermine if user wants to summarize or read raw text."""
    
    request_type: Literal["summarize", "read raw text", "unsupported", "read file and summary"] = Field(
        description="Type of request being made"
    ),
    confidence_score: float = Field(description="Confidence score between 0 and 1"),
    description: str = Field(description="Cleaned description of the request")
    file_name: Optional[str] = Field(description="Name of the file if applicable")
    nth_file: Optional[int] = Field(description="Nth file if applicable")

class Summarize(BaseModel):
    """Response model for text summarization."""
    
    raw_text: str = Field(description="Original text to be summarized")
    summary: str = Field(description="Summarized text")

class TTS(BaseModel):
    """Response model for text-to-speech."""
    
    raw_text: str = Field(description="Original text to be converted to speech")
    audio_content: bytes = Field(description="Audio content in bytes")
    audio_direction: Optional[str] = Field(description="Path to the saved audio file")

class FileContent(BaseModel):
    """Response model for file content reading."""
    
    file_name: str = Field(description="Name of the file intent reading")
    content: str = Field(description="Content of the file")
    summary: Optional[Summarize] = Field(description="Summary of the file content if applicable")

class AgentResponse(BaseModel):
    """Response from the agent: either completed or needs more info."""

    status: Literal["need_input", "done", "unsupported"] = Field(
        description="Status of the agent's response"
    )
    message: str = Field(
        description="Message from the agent"
    )
    audio: Optional[TTS] = Field(
        default=None,
        description="Path to the audio file if text-to-speech was performed"
    )
    raw_text: Optional[str] = Field(
        default=None,
        description="Raw text if read file was performed"
    )
    summary: Optional[Summarize] = Field(
        default=None,
        description="Summary text if summarization was performed"
    )
    intent: Literal["summarize", "read raw text", "read file and summary", "unsupported"] = Field(
        description="The intent understood by the agent"
    )