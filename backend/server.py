import json
import logging
import os
from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Dict, List

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'models/gemini-1.5-flash-latest')
GEMINI_API_URL = f'https://generativelanguage.googleapis.com/v1beta/{GEMINI_MODEL}:generateContent'

AGENT_STEP_LABELS = {
    'reading_prompt': 'Reading user prompt',
    'augmenting_context': 'Augmenting context',
    'dispatching_to_gemini': 'Dispatching to Gemini',
    'receiving_gemini_response': 'Receiving response from Gemini',
    'extracting_tool_calls': 'Extracting tool calls',
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
        'toolCallCount': len(tool_calls)
    })

    return jsonify({
        'reply': reply_text,
        'toolCalls': tool_calls,
        'raw': {
            'finishReason': top_candidate.get('finishReason'),
            'safetyRatings': top_candidate.get('safetyRatings')
        },
        'agentSteps': steps
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
