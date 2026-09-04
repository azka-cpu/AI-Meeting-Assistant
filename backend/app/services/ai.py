

import os
from typing import Optional, List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


class AIService:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = GROQ_MODEL

    async def chat(
        self,
        message: str,
        meeting_context: str = "",
    ) -> str:
        """
        Generate AI response based on user message and meeting context.
        """
        try:
            system_prompt = """You are an AI assistant for meeting management. 
You have access to meeting transcripts and context. 
Provide helpful, concise answers based on the meeting information provided.
Be specific and reference speakers and timestamps when relevant."""

            if meeting_context:
                user_message = f"""Meeting Context:
{meeting_context}

User Question: {message}"""
            else:
                user_message = message

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_message,
                    },
                ],
                max_tokens=500,
                temperature=0.7,
            )

            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Failed to get AI response: {str(e)}")

    async def generate_summary(self, transcript: str) -> dict:
        """
        Generate a comprehensive summary of a meeting transcript.
        Returns summary, key_topics, decisions, and action_items.
        """
        try:
            system_prompt = """You are an expert meeting analyst. 
Analyze the provided meeting transcript and extract:
1. A concise summary (2-3 sentences)
2. Key topics discussed (list of 3-5 topics)
3. Decisions made (list of decisions)
4. Action items (list of action items with owner if mentioned)

Respond in JSON format with keys: summary, key_topics, decisions, action_items"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": f"Meeting Transcript:\n\n{transcript}",
                    },
                ],
                max_tokens=1000,
                temperature=0.5,
            )

            import json

            response_text = response.choices[0].message.content

            # Try to parse JSON from response
            try:
                # Try to find JSON in the response
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    data = json.loads(json_str)
                else:
                    # Fallback structure if JSON parsing fails
                    data = {
                        "summary": response_text,
                        "key_topics": [],
                        "decisions": [],
                        "action_items": [],
                    }
            except json.JSONDecodeError:
                data = {
                    "summary": response_text,
                    "key_topics": [],
                    "decisions": [],
                    "action_items": [],
                }

            # Ensure all fields are present and are lists where needed
            return {
                "summary": str(data.get("summary", "")),
                "key_topics": data.get("key_topics", [])
                if isinstance(data.get("key_topics"), list)
                else [],
                "decisions": data.get("decisions", [])
                if isinstance(data.get("decisions"), list)
                else [],
                "action_items": data.get("action_items", [])
                if isinstance(data.get("action_items"), list)
                else [],
            }
        except Exception as e:
            raise Exception(f"Failed to generate summary: {str(e)}")

    async def speech_to_text(self, audio_data: bytes) -> str:
        """
        Convert speech to text using Groq's transcription API.
        """
        try:
            # Note: This would require implementing actual audio file handling
            # For now, this is a placeholder that would need integration with
            # a proper speech-to-text service
            raise NotImplementedError(
                "Speech-to-text requires audio file upload implementation"
            )
        except Exception as e:
            raise Exception(f"Failed to convert speech to text: {str(e)}")

    async def text_to_speech(self, text: str) -> str:
        """
        Convert text to speech and return audio URL.
        Note: Groq doesn't provide TTS, so this is a placeholder.
        """
        try:
            # This would require integrating with a TTS service like:
            # - Google Cloud Text-to-Speech
            # - Azure Speech Services
            # - ElevenLabs
            # For now, returning a placeholder
            raise NotImplementedError(
                "Text-to-speech requires integration with external TTS service"
            )
        except Exception as e:
            raise Exception(f"Failed to convert text to speech: {str(e)}")

    async def extract_action_items(self, transcript: str) -> List[str]:
        """
        Extract action items from meeting transcript.
        """
        try:
            system_prompt = """Extract all action items from this meeting transcript.
An action item is a task that needs to be completed by someone.
Return as a JSON array of strings.
Example: ["John to send report by Friday", "Team to review proposal"]"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": f"Meeting Transcript:\n\n{transcript}",
                    },
                ],
                max_tokens=500,
                temperature=0.5,
            )

            import json

            response_text = response.choices[0].message.content

            try:
                json_start = response_text.find("[")
                json_end = response_text.rfind("]") + 1
                if json_start != -1 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    items = json.loads(json_str)
                    return items if isinstance(items, list) else []
            except json.JSONDecodeError:
                return []

            return []
        except Exception as e:
            raise Exception(f"Failed to extract action items: {str(e)}")

    async def answer_question(
        self,
        question: str,
        context: str,
    ) -> str:
        """
        Answer a question based on meeting context.
        """
        try:
            system_prompt = """You are a helpful meeting assistant. 
Answer questions based on the provided meeting context.
Be concise and factual. If the answer is not in the context, say so."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": f"""Context:
{context}

Question: {question}""",
                    },
                ],
                max_tokens=300,
                temperature=0.7,
            )

            return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"Failed to answer question: {str(e)}")