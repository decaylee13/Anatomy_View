import asyncio
import json
import logging
import os
import threading
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Dict, Iterable, List, Optional

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

try:
    from dedalus_labs import AsyncDedalus, DedalusRunner
except ImportError:  # pragma: no cover - optional dependency
    AsyncDedalus = None  # type: ignore[assignment]
    DedalusRunner = None  # type: ignore[assignment]

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'models/gemini-1.5-flash-latest')
GEMINI_API_URL = f'https://generativelanguage.googleapis.com/v1beta/{GEMINI_MODEL}:generateContent'

DEDALUS_ENABLED = os.getenv('DEDALUS_ENABLED', 'true').lower() not in {'0', 'false', 'off', 'no'}
DEDALUS_MODEL = os.getenv('DEDALUS_MODEL', 'openai/gpt-5')

AGENT_STEP_LABELS = {
    'reading_prompt': 'Reading user prompt',
    'augmenting_context': 'Augmenting context',
    'dispatching_to_gemini': 'Dispatching to Gemini',
    'receiving_gemini_response': 'Receiving response from Gemini',
    'extracting_tool_calls': 'Extracting tool calls',
    'dispatching_to_dedalus': 'Dispatching to Dedalus Labs',
    'receiving_dedalus_response': 'Receiving response from Dedalus Labs',
    'rendering_reply': 'Rendering final reply'
}

SYSTEM_PROMPT = """You are the Dedalus Labs anatomy guide coordinating with Three.js 3D anatomical models.
Always speak to the learner in plain English, providing educational insights and explanations
about the anatomy they are viewing. When adjustments to the 3D model are helpful, call a tool 
so the Dedalus Labs renderer can execute it. Never invent tools – only call the ones you have 
been given.

CRITICAL RESPONSE RULES:
1. ALWAYS provide a substantive text response with educational content - never respond with only tool calls
2. When highlighting a region, explain its anatomical significance, function, or relevant details in your text response
3. Do NOT mention that you're calling tools or making adjustments - just provide the educational content
4. Only mention tool/system interactions if there's an error or limitation preventing the highlight; just apologize for the inconvenience (do not explain the technical details of what went wrong)

Available anatomical models and their structures:
- HEART: left atrium, right atrium, left ventricle, right ventricle, aorta, pulmonary trunk, veins, arteries
- BRAIN: left hemisphere, right hemisphere, brain stem, cerebellum, olfactory nerve, stria medullaris
- SKELETON: skull, spine, rib cage, scapula, clavicle, pelvis, left/right humerus, left/right hand, 
  left/right femur, left/right patella, left/right tibia, left/right fibula, left/right foot

Use the appropriate highlight tool for the model being viewed:
- Use highlight_heart_region for heart structures
- Use highlight_brain_region for brain structures
- Use highlight_skeleton_region for skeleton bones
- change the viewer orientation when the learner asks to look from a different angle;
- enable or disable the model's ambient rotation when needed;
- add short annotations that summarise key facts about the current focus area.

When you need to adjust the scene, describe the intended outcome rather than the
name of the tool you are using. Let the tool call itself communicate the action
to the renderer. If a requested structure is unknown, explain that and suggest
nearby structures that are available.

If the learner asks a question that is unrelated to anatomy or to the available
3D models, still provide a helpful answer using general knowledge as long as the
request is safe. Only refuse if the content would violate standard safety
guidelines.

For color selection when highlighting:
- Use distinct, non-anatomical colors like magenta (#ff00ff), cyan (#00ffff), lime (#00ff00), 
  or purple (#8b5cf6) to make highlights clearly visible
- Avoid red, orange, yellow, and blue unless the user specifically requests a color
- If the user specifies a color preference, honor it exactly
"""

TOOLS: List[Dict[str, Any]] = [
    {
        'function_declarations': [
            {
                'name': 'set_heart_view',
                'description': 'Adjust the camera position around the heart using spherical coordinates.',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'azimuth': {
                            'type': 'number',
                            'description': 'Horizontal rotation in degrees around the heart (0° is front, positive rotates toward the right ventricle).'
                        },
                        'elevation': {
                            'type': 'number',
                            'description': 'Vertical angle in degrees. 0° is level with the heart, positive looks from above.'
                        },
                        'distance': {
                            'type': 'number',
                            'description': 'Optional distance from the centre of the heart in scene units (default keeps the current zoom).'
                        }
                    },
                    'required': ['azimuth', 'elevation']
                }
            },
            {
                'name': 'highlight_heart_region',
                'description': 'Highlight a major heart structure by changing its color.',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'region': {
                            'type': 'string',
                            'description': 'Name of the heart structure to highlight (e.g. "left atrium", "right ventricle").'
                        },
                        'color': {
                            'type': 'string',
                            'description': 'Hex color code for the highlight (e.g. "#ff00ff" for magenta). Use bright, non-anatomical colors like magenta, cyan, lime, or purple unless user specifies otherwise. Avoid red, orange, yellow, and blue.'
                        },
                        'detail': {
                            'type': 'string',
                            'description': 'Optional brief note about this specific highlight (keep very short, main explanation goes in your primary response text).'
                        }
                    },
                    'required': ['region']
                }
            },
            {
                'name': 'highlight_brain_region',
                'description': 'Highlight a major brain structure by changing its color.',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'region': {
                            'type': 'string',
                            'description': 'Name of the brain structure to highlight (e.g. "left hemisphere", "cerebellum", "brain stem").'
                        },
                        'color': {
                            'type': 'string',
                            'description': 'Hex color code for the highlight (e.g. "#ff00ff" for magenta). Use bright, non-anatomical colors like magenta, cyan, lime, or purple unless user specifies otherwise. Avoid red, orange, yellow, and blue.'
                        },
                        'detail': {
                            'type': 'string',
                            'description': 'Optional brief note about this specific highlight (keep very short, main explanation goes in your primary response text).'
                        }
                    },
                    'required': ['region']
                }
            },
            {
                'name': 'highlight_skeleton_region',
                'description': 'Highlight a bone or skeletal structure by changing its color.',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'region': {
                            'type': 'string',
                            'description': 'Name of the skeletal structure to highlight (e.g. "skull", "spine", "femur", "left hand", "rib cage").'
                        },
                        'color': {
                            'type': 'string',
                            'description': 'Hex color code for the highlight (e.g. "#ff00ff" for magenta). Use bright, non-anatomical colors like magenta, cyan, lime, or purple unless user specifies otherwise. Avoid red, orange, yellow, and blue.'
                        },
                        'detail': {
                            'type': 'string',
                            'description': 'Optional brief note about this specific highlight (keep very short, main explanation goes in your primary response text).'
                        }
                    },
                    'required': ['region']
                }
            },
            {
                'name': 'clear_highlighted_region',
                'description': 'Remove any currently highlighted cardiac region.',
                'parameters': {'type': 'object', 'properties': {}}
            },
            {
                'name': 'toggle_auto_rotation',
                'description': 'Enable or disable the gentle automatic rotation of the heart.',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'enabled': {
                            'type': 'boolean',
                            'description': 'Set to true to enable auto-rotation or false to pause it.'
                        }
                    },
                    'required': ['enabled']
                }
            },
            {
                'name': 'annotate_heart_focus',
                'description': 'Display a short textual annotation about the current focus area.',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'title': {
                            'type': 'string',
                            'description': 'Short title for the annotation badge.'
                        },
                        'description': {
                            'type': 'string',
                            'description': 'One or two sentences describing the key teaching point.'
                        }
                    },
                    'required': ['title', 'description']
                }
            }
        ]
    }
]


class DedalusService:
    """Thin wrapper that manages a background Dedalus Labs runner."""

    _TEXT_KEY_TOKENS = ('text', 'message', 'content', 'response', 'paragraph')

    def __init__(self, enabled: bool, model: str) -> None:
        self.model = model
        self.enabled = bool(enabled and AsyncDedalus and DedalusRunner)
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._runner: Optional[DedalusRunner] = None
        self._loop_lock = threading.Lock()
        if enabled and not self.enabled:
            logger.warning(
                'Dedalus Labs SDK not available; semantic question handling is disabled.'
            )

    # ------------------------------------------------------------------
    # Life-cycle management
    # ------------------------------------------------------------------
    def _ensure_loop(self) -> None:
        if self._loop and self._loop.is_running():
            return

        with self._loop_lock:
            if self._loop and self._loop.is_running():
                return

            loop = asyncio.new_event_loop()

            def run_loop() -> None:
                asyncio.set_event_loop(loop)
                loop.run_forever()

            thread = threading.Thread(target=run_loop, name='DedalusLoop', daemon=True)
            thread.start()
            self._loop = loop
            self._thread = thread

    async def _ensure_runner(self) -> DedalusRunner:
        if self._runner is None:
            if not AsyncDedalus or not DedalusRunner:
                raise RuntimeError('Dedalus Labs SDK is not installed.')
            client = AsyncDedalus()
            self._runner = DedalusRunner(client)
        return self._runner

    # ------------------------------------------------------------------
    # High level helpers
    # ------------------------------------------------------------------
    def should_route(self, messages: List[Dict[str, Any]], tool_calls: Iterable[Any]) -> bool:
        if not self.enabled:
            return False

        if any(True for _ in tool_calls):
            return False

        latest_text = self._latest_user_text(messages)
        if not latest_text:
            return False

        lowered = latest_text.lower()

        excluded_keywords = {
            'highlight', 'rotate', 'rotation', 'view', 'angle', 'turn', 'zoom', 'orient',
            'orientation', 'camera', 'focus on', 'show me', 'display the model', 'spin',
            'auto-rotate', 'auto rotate', 'clear highlight', 'reset view', 'annotation',
            'annotate', 'color', 'colour'
        }

        if any(keyword in lowered for keyword in excluded_keywords):
            return False

        question_triggers = ('?', 'what ', 'how ', 'why ', 'explain ', 'describe ', 'tell me ', 'compare ')
        medical_markers = (
            'function', 'role', 'purpose', 'medical', 'clinical', 'symptom', 'disease',
            'pathology', 'treatment', 'diagnosis', 'anatomy', 'physiology', 'surgical',
            'injury', 'condition', 'blood', 'nerve', 'organ', 'system'
        )

        if any(lowered.startswith(trigger) for trigger in question_triggers):
            return True
        if '?' in lowered:
            return True
        if len(lowered.split()) >= 6 and any(marker in lowered for marker in medical_markers):
            return True

        return False

    def build_prompt(self, messages: List[Dict[str, Any]]) -> str:
        guidance = (
            "You are a medically trained tutor supporting the Dedalus Labs anatomy explorer. "
            "Answer the learner's latest question with clinically accurate, concise explanations. "
            "Use clear, student-friendly language and cite relevant anatomical functions when useful."
        )
        conversation_lines: List[str] = []
        for message in messages:
            role = message.get('role')
            text = (message.get('text') or '').strip()
            if not text or role not in {'user', 'assistant'}:
                continue
            prefix = 'Learner' if role == 'user' else 'Guide'
            conversation_lines.append(f"{prefix}: {text}")

        transcript = '\n'.join(conversation_lines)
        prompt = (
            f"{guidance}\n\n"
            f"Conversation so far:\n{transcript}\n\n"
            "Provide a focused response to the learner's most recent message."
        )
        return prompt

    def ask(self, prompt: str, timeout: float = 45.0) -> Optional[str]:
        if not self.enabled:
            return None

        self._ensure_loop()
        if not self._loop:
            return None

        async def run_query() -> str:
            runner = await self._ensure_runner()
            result = runner.run(input=prompt, model=self.model, stream=True)
            return await self._consume_result(result)

        future = asyncio.run_coroutine_threadsafe(run_query(), self._loop)
        try:
            return future.result(timeout=timeout)
        except Exception as error:  # pragma: no cover - network failure path
            logger.exception('Dedalus Labs request failed: %s', error)
            return None

    # ------------------------------------------------------------------
    # Stream handling helpers
    # ------------------------------------------------------------------
    async def _consume_result(self, result: Any) -> str:
        fragments: List[str] = []

        if hasattr(result, '__aiter__'):
            async for event in result:  # type: ignore[assignment]
                fragments.extend(self._extract_text_fragments(event))
        elif isinstance(result, Iterable):
            for event in result:
                fragments.extend(self._extract_text_fragments(event))
        else:
            text = self._coerce_to_text(result)
            return text

        text = ''.join(fragments).strip()
        if text:
            return text

        return self._coerce_to_text(result)

    def _coerce_to_text(self, payload: Any) -> str:
        if payload is None:
            return ''
        if isinstance(payload, str):
            return payload.strip()
        if isinstance(payload, dict):
            fragments = self._extract_text_fragments(payload)
            return ''.join(fragments).strip()
        for attribute in ('output_text', 'text', 'message', 'response', 'value'):
            if hasattr(payload, attribute):
                value = getattr(payload, attribute)
                extracted = self._extract_text_fragments(value)
                if extracted:
                    return ''.join(extracted).strip()
                if isinstance(value, str):
                    return value.strip()
        return ''

    def _extract_text_fragments(self, payload: Any, key_hint: Optional[str] = None) -> List[str]:
        if payload is None:
            return []

        if isinstance(payload, str):
            if key_hint is None:
                return [payload]
            if any(token in key_hint.lower() for token in self._TEXT_KEY_TOKENS):
                return [payload]
            return []

        if isinstance(payload, dict):
            fragments: List[str] = []

            inline_text = payload.get('text')
            if isinstance(inline_text, str):
                fragments.append(inline_text)

            ignore_keys = {
                'id',
                'model',
                'type',
                'role',
                'index',
                'finish_reason',
                'created',
                'usage',
                'provider'
            }

            for key, value in payload.items():
                if key in ignore_keys:
                    continue
                lowered = key.lower()
                next_hint = lowered if any(token in lowered for token in self._TEXT_KEY_TOKENS) else key_hint
                fragments.extend(self._extract_text_fragments(value, next_hint))
            return fragments

        if isinstance(payload, (list, tuple, set)):
            fragments: List[str] = []
            for item in payload:
                fragments.extend(self._extract_text_fragments(item, key_hint))
            return fragments

        if hasattr(payload, '__dict__'):
            return self._extract_text_fragments(vars(payload), key_hint)

        return []

    @staticmethod
    def _latest_user_text(messages: List[Dict[str, Any]]) -> str:
        for message in reversed(messages):
            if message.get('role') != 'user':
                continue
            text = (message.get('text') or '').strip()
            if text:
                return text
        return ''


dedalus_service = DedalusService(DEDALUS_ENABLED, DEDALUS_MODEL)


def _build_contents(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    contents: List[Dict[str, Any]] = []
    for message in messages:
        role = message.get('role')
        text = message.get('text', '')
        tool_calls = message.get('toolCalls') or []
        tool_results = message.get('toolResults') or []

        if role not in {'user', 'assistant'}:
            continue

        if role == 'user':
            parts: List[Dict[str, Any]] = []
            if text:
                parts.append({'text': text})
            for result in tool_results:
                # Allow clients to forward tool execution feedback.
                parts.append({'functionResponse': {
                    'name': result.get('name', 'unknown_tool'),
                    'response': result.get('response', {
                        'status': result.get('status', 'ok'),
                        'detail': result.get('message')
                    })
                }})
            contents.append({'role': 'user', 'parts': parts or [{'text': ''}]})
        else:
            parts = []
            if text:
                parts.append({'text': text})
            for call in tool_calls:
                parts.append({'functionCall': {
                    'name': call.get('name', ''),
                    'args': call.get('arguments', {})
                }})
            contents.append({'role': 'model', 'parts': parts or [{'text': ''}]})
            for result in tool_results:
                contents.append({
                    'role': 'user',
                    'parts': [{
                        'functionResponse': {
                            'name': result.get('name', 'unknown_tool'),
                            'response': result.get('response', {
                                'status': result.get('status', 'ok'),
                                'detail': result.get('message')
                            })
                        }
                    }]
                })
    return contents


@app.get('/api/health')
def health() -> Any:
    return jsonify(
        status='ok',
        model=GEMINI_MODEL,
        llm_configured=bool(GEMINI_API_KEY),
        dedalus_enabled=dedalus_service.enabled,
        dedalus_model=DEDALUS_MODEL if dedalus_service.enabled else None
    )


@app.get('/api/hello')
def hello_world() -> Any:
    return jsonify(message='Hello from Flask!')


@app.post('/api/chat')
def chat() -> Any:
    payload = request.get_json(silent=True) or {}
    messages = payload.get('messages', [])
    steps: List[Dict[str, Any]] = []

    def record_step(step_id: str, detail: Dict[str, Any] | None = None, status: str = 'complete') -> None:
        label = AGENT_STEP_LABELS.get(step_id, step_id.replace('_', ' ').title())
        steps.append({
            'id': step_id,
            'label': label,
            'status': status,
            'detail': detail,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })

    if not GEMINI_API_KEY:
        logger.warning('Gemini API key not configured; returning fallback response.')
        record_step('reading_prompt', {'messageCount': len(messages)}, status='error')
        record_step('rendering_reply', {'reason': 'missing_api_key'}, status='error')
        return jsonify({
            'reply': (
                "The Dedalus Labs assistant is not yet connected to Gemini. "
                "Configure the GEMINI_API_KEY environment variable on the server to enable live responses."
            ),
            'toolCalls': [],
            'agentSteps': steps
        }), 503

    contents = _build_contents(messages)
    record_step('reading_prompt', {'messageCount': len(messages)})
    record_step('augmenting_context', {'contentCount': len(contents)})

    request_body: Dict[str, Any] = {
        'system_instruction': {
            'parts': [{'text': SYSTEM_PROMPT}]
        },
        'contents': contents,
        'tools': TOOLS,
        'tool_config': {
            'function_calling_config': {
                'mode': 'ANY'
            }
        }
    }

    record_step('dispatching_to_gemini', {'model': GEMINI_MODEL}, status='started')
    dispatch_started = perf_counter()

    try:
        response = requests.post(
            GEMINI_API_URL,
            params={'key': GEMINI_API_KEY},
            json=request_body,
            timeout=30
        )
        response.raise_for_status()
        dispatch_duration_ms = round((perf_counter() - dispatch_started) * 1000, 2)
        record_step(
            'dispatching_to_gemini',
            {'model': GEMINI_MODEL, 'latencyMs': dispatch_duration_ms, 'statusCode': response.status_code},
            status='complete'
        )
        record_step(
            'receiving_gemini_response',
            {'statusCode': response.status_code},
            status='complete'
        )
    except requests.RequestException as error:
        logger.exception('Gemini request failed: %s', error)
        record_step(
            'dispatching_to_gemini',
            {'reason': 'request_exception', 'message': str(error)},
            status='error'
        )
        record_step('rendering_reply', {'reason': 'gemini_request_failed'}, status='error')
        return jsonify({'error': 'Failed to reach Gemini LLM API.', 'agentSteps': steps}), 502

    data = response.json()
    candidates: List[Dict[str, Any]] = data.get('candidates', [])
    if not candidates:
        logger.error('Gemini response missing candidates: %s', data)
        record_step('extracting_tool_calls', {'toolCallCount': 0}, status='error')
        record_step('rendering_reply', {'reason': 'no_candidates'}, status='error')
        return jsonify({'error': 'Gemini returned no candidates.', 'agentSteps': steps}), 502

    top_candidate = candidates[0]
    content = top_candidate.get('content', {})
    parts: List[Dict[str, Any]] = content.get('parts', [])

    reply_text_fragments: List[str] = []
    tool_calls: List[Dict[str, Any]] = []

    for part in parts:
        if 'text' in part:
            reply_text_fragments.append(part['text'])
        elif 'functionCall' in part:
            function_call = part['functionCall']
            raw_args = function_call.get('args', {})
            if isinstance(raw_args, str):
                try:
                    parsed_args = json.loads(raw_args) if raw_args.strip() else {}
                except json.JSONDecodeError:
                    logger.warning('Failed to parse tool arguments for %s: %s', function_call.get('name'), raw_args)
                    parsed_args = {}
            elif isinstance(raw_args, dict):
                parsed_args = raw_args
            else:
                parsed_args = {}

            tool_calls.append({
                'name': function_call.get('name', ''),
                'arguments': parsed_args
            })

    record_step('extracting_tool_calls', {'toolCallCount': len(tool_calls)})

    reply_text = '\n'.join(fragment.strip() for fragment in reply_text_fragments if fragment.strip())
    reply_source = 'gemini'
    study_info = ''

    if dedalus_service.enabled:
        heuristic_hint = dedalus_service.should_route(messages, tool_calls)
        record_step(
            'dispatching_to_dedalus',
            {
                'model': DEDALUS_MODEL,
                'heuristicSuggested': heuristic_hint
            },
            status='started'
        )
        dedalus_started = perf_counter()
        prompt = dedalus_service.build_prompt(messages)
        dedalus_reply = dedalus_service.ask(prompt)
        if dedalus_reply:
            latency_ms = round((perf_counter() - dedalus_started) * 1000, 2)
            record_step(
                'dispatching_to_dedalus',
                {
                    'model': DEDALUS_MODEL,
                    'latencyMs': latency_ms,
                    'heuristicSuggested': heuristic_hint
                },
                status='complete'
            )
            record_step('receiving_dedalus_response', {'latencyMs': latency_ms}, status='complete')
            study_info = dedalus_reply.strip() or 'Study information is currently unavailable.'
        else:
            record_step(
                'dispatching_to_dedalus',
                {'reason': 'dedalus_request_failed', 'model': DEDALUS_MODEL},
                status='error'
            )
            record_step(
                'receiving_dedalus_response',
                {'reason': 'dedalus_request_failed'},
                status='error'
            )
            study_info = 'Study information is currently unavailable.'
    else:
        record_step(
            'dispatching_to_dedalus',
            {'reason': 'dedalus_disabled'},
            status='error'
        )
        record_step(
            'receiving_dedalus_response',
            {'reason': 'dedalus_disabled'},
            status='error'
        )
        study_info = 'Study information is currently unavailable.'

    # Only provide fallback message if there's truly no text AND no tool calls
    if not reply_text:
        if tool_calls:
            # If tools were called but no text, don't show any message (tools speak for themselves)
            reply_text = ''
        else:
            # If neither text nor tools, something went wrong
            reply_text = 'I am processing your request.'

    record_step('rendering_reply', {
        'hasText': bool(reply_text),
        'toolCallCount': len(tool_calls),
        'replySource': reply_source,
        'studyInfoLength': len(study_info)
    })

    return jsonify({
        'reply': reply_text,
        'toolCalls': tool_calls,
        'replySource': reply_source,
        'studyInfo': study_info,
        'raw': {
            'finishReason': top_candidate.get('finishReason'),
            'safetyRatings': top_candidate.get('safetyRatings')
        },
        'agentSteps': steps
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
