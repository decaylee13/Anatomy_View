import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, OrbitControls, useFBX } from '@react-three/drei';
import { Box3, MathUtils, Vector3 } from 'three';
import { HEART_REGIONS, resolveHeartRegionName } from './heartRegions';

const initialPrompts = [
  'Highlight the pathway of blood through the right side of the heart.',
  'Rotate the model to show the posterior view of the heart.',
  'Explain how the left ventricle powers systemic circulation.'
];

const initialControllerState = {
  view: { azimuth: 15, elevation: 20, distance: 3.2 },
  highlightRegion: null,
  autoRotate: true,
  annotation: null
};

function controllerReducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW': {
      const nextDistance = Number.isFinite(action.payload?.distance)
        ? action.payload.distance
        : state.view.distance;
      return {
        ...state,
        view: {
          azimuth: action.payload.azimuth ?? state.view.azimuth,
          elevation: action.payload.elevation ?? state.view.elevation,
          distance: nextDistance
        },
        autoRotate: false
      };
    }
    case 'SET_AUTO_ROTATE':
      return { ...state, autoRotate: Boolean(action.payload) };
    case 'SET_HIGHLIGHT':
      return { ...state, highlightRegion: action.payload };
    case 'CLEAR_HIGHLIGHT':
      return { ...state, highlightRegion: null };
    case 'SET_ANNOTATION':
      return { ...state, annotation: action.payload };
    default:
      return state;
  }
}

function CanvasLoader() {
  return (
    <Html center>
      <div className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white/80 shadow-lg backdrop-blur">
        Loading heart model…
      </div>
    </Html>
  );
}

function RegionHighlight({ regionKey, detail }) {
  if (!regionKey) return null;
  const config = HEART_REGIONS[regionKey];
  if (!config) return null;

  return (
    <group position={config.position}>
      <mesh>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={1.4}
          transparent
          opacity={0.85}
        />
      </mesh>
      <Html center distanceFactor={8}>
        <div className="max-w-[14rem] rounded-2xl border border-white/20 bg-slate-900/85 px-4 py-3 text-xs text-slate-100 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold text-white">{config.label}</p>
          {detail ? <p className="mt-1 leading-snug text-slate-200/80">{detail}</p> : null}
        </div>
      </Html>
    </group>
  );
}

function HeartModel({ highlightRegion, autoRotate }) {
  const heart = useFBX('/segmented-adult-heart/source/human-heart-3d-animated.fbx');
  const groupRef = useRef();

  useEffect(() => {
    if (!heart) return;

    heart.rotation.set(-Math.PI / 2, Math.PI, 0);

    const boundingBox = new Box3().setFromObject(heart);
    const size = new Vector3();
    boundingBox.getSize(size);

    const desiredHeight = 2.8;
    const scale = size.y > 0 ? desiredHeight / size.y : 1;
    heart.scale.setScalar(scale);

    const scaledBox = new Box3().setFromObject(heart);
    const scaledCenter = new Vector3();
    scaledBox.getCenter(scaledCenter);
    heart.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);

    heart.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [heart]);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.z += delta * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      {heart ? <primitive object={heart} /> : null}
      <RegionHighlight regionKey={highlightRegion?.key} detail={highlightRegion?.detail} />
    </group>
  );
}

function CameraController({ view, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!view) return;
    const azimuth = MathUtils.degToRad(view.azimuth ?? 0);
    const elevation = MathUtils.degToRad(view.elevation ?? 15);
    const radius = view.distance ?? 3.2;

    const x = radius * Math.cos(elevation) * Math.sin(azimuth);
    const y = radius * Math.sin(elevation);
    const z = radius * Math.cos(elevation) * Math.cos(azimuth);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [view, camera, controlsRef]);

  return null;
}

function ChatSidebar({ isOpen, onClose, messages, onSubmit, isBusy }) {
  const [pendingMessage, setPendingMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isBusy) return;
    const trimmed = pendingMessage.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setPendingMessage('');
  };

  return (
    <aside
      className={`relative flex h-full flex-col overflow-hidden bg-slate-900/95 text-slate-100 shadow-2xl transition-[transform,width] duration-300 ease-in-out ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{ width: isOpen ? '26rem' : '0rem', transform: `translateX(${isOpen ? '0%' : '100%'})` }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 rounded-l-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {isOpen ? 'Hide Chat' : 'Open Chat'}
      </button>

      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Heart Assistant</h2>
          <p className="text-xs text-white/60">Dedalus Labs link to Gemini for guided exploration.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/70 transition hover:bg-white/20"
        >
          Hide
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="space-y-3 text-sm text-white/70">
            <p>Start the conversation by trying one of these prompts:</p>
            <ul className="list-disc space-y-1 pl-5">
              {initialPrompts.map((prompt) => (
                <li
                  key={prompt}
                  className={`cursor-pointer text-white/80 ${isBusy ? 'opacity-60' : ''}`}
                  onClick={() => {
                    if (!isBusy) onSubmit(prompt);
                  }}
                >
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
                message.role === 'user' ? 'ml-auto bg-sky-500/30 text-sky-50' : 'mr-auto bg-emerald-500/30 text-emerald-50'
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <p className="whitespace-pre-line">{message.text}</p>
              {message.status === 'loading' ? (
                <p className="mt-2 text-xs text-white/60">Connecting to Gemini…</p>
              ) : null}
              {message.toolCalls?.length ? (
                <div className="mt-3 space-y-2 rounded-xl border border-white/20 bg-white/10 p-3 text-xs text-white/80">
                  <p className="font-semibold uppercase tracking-wide text-white/60">Dedalus tool calls</p>
                  <ul className="space-y-2">
                    {message.toolCalls.map((tool, toolIndex) => (
                      <li key={`${tool.name}-${toolIndex}`} className="space-y-1">
                        <span className="font-semibold text-white">{tool.name}</span>
                        {tool.arguments ? (
                          <pre className="whitespace-pre-wrap break-words text-[11px] text-white/80">
                            {JSON.stringify(tool.arguments, null, 2)}
                          </pre>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {message.toolResults?.length ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-white/70">
                  <p className="mb-1 font-semibold uppercase tracking-wide text-white/60">Execution log</p>
                  <ul className="space-y-1">
                    {message.toolResults.map((result, resultIndex) => (
                      <li key={`${result.name}-${resultIndex}`}>
                        <span className="font-semibold text-white">{result.name}</span>{' '}
                        <span className="uppercase tracking-wide text-white/60">({result.status})</span>{' '}
                        {result.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={pendingMessage}
            onChange={(event) => setPendingMessage(event.target.value)}
            placeholder="Ask the assistant about the heart…"
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
            disabled={isBusy}
          />
          <button
            type="submit"
            className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={isBusy}
          >
            {isBusy ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </form>
    </aside>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [controllerState, dispatch] = useReducer(controllerReducer, initialControllerState);
  const controlsRef = useRef();

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timeout = setTimeout(() => setStatusMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [statusMessage]);

  const applyToolCalls = useCallback(
    (toolCalls = []) => {
      if (!toolCalls.length) return [];
      const results = [];

      toolCalls.forEach((tool) => {
        const { name, arguments: args = {} } = tool;
        switch (name) {
          case 'set_heart_view': {
            const azimuth = Number.isFinite(args.azimuth) ? args.azimuth : null;
            const elevation = Number.isFinite(args.elevation) ? args.elevation : null;
            const distance = Number.isFinite(args.distance) ? args.distance : undefined;

            if (azimuth === null || elevation === null) {
              results.push({
                name,
                status: 'error',
                message: 'Missing azimuth or elevation for camera control.',
                response: {
                  status: 'error',
                  detail: 'Missing azimuth or elevation for camera control.'
                }
              });
              return;
            }

            dispatch({ type: 'SET_VIEW', payload: { azimuth, elevation, distance } });
            results.push({
              name,
              status: 'success',
              message: `Adjusted camera to azimuth ${azimuth.toFixed(1)}°, elevation ${elevation.toFixed(1)}°${
                distance ? `, distance ${distance.toFixed(2)}` : ''
              }.`,
              response: {
                status: 'success',
                detail: {
                  azimuth,
                  elevation,
                  ...(distance ? { distance } : {})
                }
              }
            });
            break;
          }
          case 'toggle_auto_rotation': {
            if (typeof args.enabled !== 'boolean') {
              results.push({
                name,
                status: 'error',
                message: 'The enabled flag must be provided.',
                response: {
                  status: 'error',
                  detail: 'The enabled flag must be provided.'
                }
              });
              return;
            }
            dispatch({ type: 'SET_AUTO_ROTATE', payload: args.enabled });
            results.push({
              name,
              status: 'success',
              message: args.enabled ? 'Auto-rotation enabled.' : 'Auto-rotation paused.',
              response: {
                status: 'success',
                detail: { enabled: args.enabled }
              }
            });
            break;
          }
          case 'highlight_heart_region': {
            const resolved = resolveHeartRegionName(args.region);
            if (!resolved) {
              const warning = `Unknown heart region: ${args.region ?? 'unspecified'}.`;
              setStatusMessage(warning);
              results.push({
                name,
                status: 'error',
                message: warning,
                response: {
                  status: 'error',
                  detail: warning
                }
              });
              return;
            }
            dispatch({
              type: 'SET_HIGHLIGHT',
              payload: { key: resolved.key, detail: args.detail ?? '' }
            });
            results.push({
              name,
              status: 'success',
              message: `Highlighted ${resolved.data.label}.`,
              response: {
                status: 'success',
                detail: {
                  region: resolved.data.label,
                  ...(args.detail ? { note: args.detail } : {})
                }
              }
            });
            break;
          }
          case 'clear_highlighted_region': {
            dispatch({ type: 'CLEAR_HIGHLIGHT' });
            dispatch({ type: 'SET_ANNOTATION', payload: null });
            results.push({
              name,
              status: 'success',
              message: 'Cleared highlighted region.',
              response: {
                status: 'success',
                detail: 'Cleared highlighted region.'
              }
            });
            break;
          }
          case 'annotate_heart_focus': {
            if (!args.title || !args.description) {
              results.push({
                name,
                status: 'error',
                message: 'Both title and description are required.',
                response: {
                  status: 'error',
                  detail: 'Both title and description are required.'
                }
              });
              return;
            }
            dispatch({
              type: 'SET_ANNOTATION',
              payload: { title: args.title, description: args.description }
            });
            results.push({
              name,
              status: 'success',
              message: `Annotation set: ${args.title}.`,
              response: {
                status: 'success',
                detail: {
                  title: args.title,
                  description: args.description
                }
              }
            });
            break;
          }
          default: {
            const detail = 'Tool not recognised by the renderer.';
            results.push({
              name,
              status: 'error',
              message: detail,
              response: {
                status: 'error',
                detail
              }
            });
          }
        }
      });

      return results;
    },
    [dispatch, setStatusMessage]
  );

  useEffect(() => {
    if (controllerState.highlightRegion?.detail) {
      setStatusMessage(controllerState.highlightRegion.detail);
    }
  }, [controllerState.highlightRegion]);

  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || '', []);

  const handleSendMessage = useCallback(
    async (text) => {
      if (isSending) return;

      const conversation = [...messages, { role: 'user', text }];
      setMessages((previous) => [
        ...previous,
        { role: 'user', text },
        {
          role: 'assistant',
          text: 'Let me consult the Dedalus Labs model…',
          status: 'loading',
          toolCalls: [],
          toolResults: []
        }
      ]);
      setIsSending(true);

      try {
        const response = await fetch(`${apiBaseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: conversation })
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || payload.reply || 'Assistant request failed.');
        }

        const toolCalls = payload.toolCalls || [];

        setMessages((previous) => {
          const updated = [...previous];
          const assistantIndex = updated.findIndex((message) => message.status === 'loading');
          if (assistantIndex !== -1) {
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              text: payload.reply || 'Gemini did not provide a reply.',
              status: 'complete',
              toolCalls,
              toolResults: []
            };
          }
          return updated;
        });

        const executionResults = applyToolCalls(toolCalls);

        if (executionResults.length) {
          setMessages((previous) => {
            const updated = [...previous];
            let assistantIndex = -1;
            for (let index = updated.length - 1; index >= 0; index -= 1) {
              const candidate = updated[index];
              if (
                candidate.role === 'assistant' &&
                candidate.status === 'complete' &&
                (candidate.toolResults?.length ?? 0) === 0 &&
                candidate.toolCalls === toolCalls
              ) {
                assistantIndex = index;
                break;
              }
            }
            if (assistantIndex !== -1) {
              updated[assistantIndex] = {
                ...updated[assistantIndex],
                toolResults: executionResults
              };
            }
            return updated;
          });
        }
      } catch (error) {
        console.error(error);
        setMessages((previous) => {
          const updated = [...previous];
          const assistantIndex = updated.findIndex((message) => message.status === 'loading');
          if (assistantIndex !== -1) {
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              text: error instanceof Error ? error.message : 'The assistant encountered an unknown error.',
              status: 'error'
            };
          }
          return updated;
        });
        setStatusMessage(error instanceof Error ? error.message : 'Assistant connection failed.');
      } finally {
        setIsSending(false);
      }
    },
    [applyToolCalls, apiBaseUrl, isSending, messages]
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      <div className="relative flex flex-1 items-stretch">
        <Canvas shadows camera={{ position: [2.5, 1.5, 3.5], fov: 45 }}>
          <color attach="background" args={[0.02, 0.03, 0.05]} />
          <ambientLight intensity={0.5} />
          <spotLight
            castShadow
            position={[5, 8, 5]}
            angle={0.35}
            penumbra={0.4}
            intensity={1.5}
            shadow-mapSize={1024}
          />
          <Suspense fallback={<CanvasLoader />}>
            <HeartModel highlightRegion={controllerState.highlightRegion} autoRotate={controllerState.autoRotate} />
            <Environment preset="sunset" />
          </Suspense>
          <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2.5} far={10} />
          <OrbitControls ref={controlsRef} enablePan={false} maxDistance={6} minDistance={1.5} target={[0, 0, 0]} />
          <CameraController view={controllerState.view} controlsRef={controlsRef} />
        </Canvas>

        {!isChatOpen && (
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="pointer-events-auto absolute right-6 top-6 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-400"
          >
            Open Chat
          </button>
        )}

        <div className="pointer-events-none absolute left-8 top-8 max-w-md text-white/80">
          <h1 className="pointer-events-auto text-3xl font-semibold text-white">Anatomy View</h1>
          <p className="pointer-events-auto mt-2 text-sm text-white/70">
            Inspect the adult heart in 3D. Use your mouse or touchpad to orbit and zoom around the model.
          </p>
        </div>

        {controllerState.annotation ? (
          <div className="pointer-events-auto absolute left-8 bottom-8 max-w-sm rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-white/80 shadow-xl">
            <h3 className="text-sm font-semibold text-white">{controllerState.annotation.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-white/70">{controllerState.annotation.description}</p>
          </div>
        ) : null}

        {statusMessage ? (
          <div className="pointer-events-auto absolute left-1/2 top-6 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-medium text-white/80 shadow-xl">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen((previous) => !previous)}
        messages={messages}
        onSubmit={handleSendMessage}
        isBusy={isSending}
      />
    </div>
  );
}

export default App;
