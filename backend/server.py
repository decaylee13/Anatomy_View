import logging
import os
from typing import Any, Dict, List

import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'models/gemini-1.5-flash-latest')
GEMINI_API_URL = f'https://generativelanguage.googleapis.com/v1beta/{GEMINI_MODEL}:generateContent'

SYSTEM_PROMPT = """You are the Dedalus Labs anatomy guide coordinating with a Three.js 3D heart.
Always speak to the learner in plain English, describing what you are changing or
highlighting. When adjustments to the 3D model are helpful, call a tool so the
Dedalus Labs renderer can execute it. Never invent tools – only call the ones you
have been given.

Use the tools to:
- change the viewer orientation when the learner asks to look from a different angle;
- highlight the requested cardiac structure to focus the learner's attention;
- enable or disable the model's ambient rotation when needed;
- add short annotations that summarise key facts about the current focus area.

Every response should contain both an explanation to the learner and any required
tool calls. If a requested structure is unknown, explain that and suggest nearby
structures that are available.
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
                'description': 'Highlight a major heart structure with a glowing marker.',
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'region': {
                            'type': 'string',
                            'description': 'Name of the heart structure to highlight (e.g. "left atrium", "right ventricle").'
                        },
                        'detail': {
                            'type': 'string',
                            'description': 'Optional explanation of why the region is highlighted.'
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
    return jsonify(status='ok', model=GEMINI_MODEL, llm_configured=bool(GEMINI_API_KEY))


@app.get('/api/hello')
def hello_world() -> Any:
    return jsonify(message='Hello from Flask!')


@app.post('/api/chat')
def chat() -> Any:
    payload = request.get_json(silent=True) or {}
    messages = payload.get('messages', [])

    if not GEMINI_API_KEY:
        logger.warning('Gemini API key not configured; returning fallback response.')
        return jsonify({
            'reply': (
                "The Dedalus Labs assistant is not yet connected to Gemini. "
                "Configure the GEMINI_API_KEY environment variable on the server to enable live responses."
            ),
            'toolCalls': []
        }), 503

    contents = _build_contents(messages)

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

    try:
        response = requests.post(
            GEMINI_API_URL,
            params={'key': GEMINI_API_KEY},
            json=request_body,
            timeout=30
        )
        response.raise_for_status()
    except requests.RequestException as error:
        logger.exception('Gemini request failed: %s', error)
        return jsonify({'error': 'Failed to reach Gemini LLM API.'}), 502

    data = response.json()
    candidates: List[Dict[str, Any]] = data.get('candidates', [])
    if not candidates:
        logger.error('Gemini response missing candidates: %s', data)
        return jsonify({'error': 'Gemini returned no candidates.'}), 502

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
            tool_calls.append({
                'name': function_call.get('name', ''),
                'arguments': function_call.get('args', {})
            })

    reply_text = '\n'.join(fragment.strip() for fragment in reply_text_fragments if fragment.strip())

    return jsonify({
        'reply': reply_text or 'I am ready to adjust the 3D heart as needed.',
        'toolCalls': tool_calls,
        'raw': {
            'finishReason': top_candidate.get('finishReason'),
            'safetyRatings': top_candidate.get('safetyRatings')
        }
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
