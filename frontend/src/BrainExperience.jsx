import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useFBX } from '@react-three/drei';
import { Box3, SRGBColorSpace, Vector3 } from 'three';

import ChatSidebar from './components/ChatSidebar.jsx';
import CanvasLoader from './components/CanvasLoader.jsx';
import CameraController from './components/CameraController.jsx';

const initialPrompts = [
  'Describe the functional regions visible on the lateral surface of the brain.',
  'Rotate the brain to reveal the cerebellum and brain stem.',
  'Explain how the frontal lobe supports executive functions.'
];

const initialControllerState = {
  view: { azimuth: 20, elevation: 18, distance: 3.1 },
  annotation: null,
  autoRotate: false
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
    case 'SET_ANNOTATION':
      return { ...state, annotation: action.payload };
    default:
      return state;
  }
}

function BrainModel() {
  const brain = useFBX(
    '/adult-brain/source/Brain_brain_stem.fbx',
    (loader) => {
      loader.setPath('/adult-brain/source/');
      loader.setResourcePath('/adult-brain/textures/');
      loader.setCrossOrigin('anonymous');
    }
  );

  useEffect(() => {
    if (!brain) return;

    brain.rotation.set(-Math.PI / 2, Math.PI / 2, 0);

    const boundingBox = new Box3().setFromObject(brain);
    const size = new Vector3();
    boundingBox.getSize(size);

    const desiredHeight = 2.6;
    const scale = size.y > 0 ? desiredHeight / size.y : 1;
    brain.scale.setScalar(scale);

    const scaledBox = new Box3().setFromObject(brain);
    const scaledCenter = new Vector3();
    scaledBox.getCenter(scaledCenter);
    brain.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);

    brain.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (!material) return;
          ['map', 'emissiveMap'].forEach((mapKey) => {
            const texture = material[mapKey];
            if (texture && 'colorSpace' in texture) {
              texture.colorSpace = SRGBColorSpace;
            }
          });
          material.needsUpdate = true;
        });
      }
    });
  }, [brain]);

  return brain ? <primitive object={brain} /> : null;
}

function BrainExperience() {
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
          case 'set_heart_view':
          case 'set_brain_view': {
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
              message: 'Auto-rotation is disabled for manual exploration of the brain.',
              response: {
                status: 'success',
                detail: { enabled: false }
              }
            });
            break;
          }
          case 'highlight_heart_region': {
            const detail = 'Brain highlighting is not available in this viewer yet.';
            setStatusMessage(detail);
            results.push({
              name,
              status: 'error',
              message: detail,
              response: {
                status: 'error',
                detail
              }
            });
            break;
          }
          case 'clear_highlighted_region': {
            results.push({
              name,
              status: 'success',
              message: 'No highlight active for the brain model.',
              response: {
                status: 'success',
                detail: 'No highlight active for the brain model.'
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
              toolResults: [],
              highlightSummaries: []
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
              const otherToolResults = executionResults.filter(
                (result) => result.name !== 'highlight_heart_region'
              );
              updated[assistantIndex] = {
                ...updated[assistantIndex],
                toolResults: otherToolResults,
                highlightSummaries: []
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
        <Canvas shadows camera={{ position: [2.5, 1.6, 3.4], fov: 45 }}>
          <color attach="background" args={[0.02, 0.03, 0.05]} />
          <ambientLight intensity={0.5} />
          <spotLight
            castShadow
            position={[5, 8, 5]}
            angle={0.35}
            penumbra={0.4}
            intensity={1.4}
            shadow-mapSize={1024}
          />
          <Suspense fallback={<CanvasLoader label="Loading brain model…" />}>
            <BrainModel />
            <Environment preset="sunset" />
          </Suspense>
          <ContactShadows position={[0, -1.2, 0]} opacity={0.35} scale={10} blur={2.5} far={10} />
          <OrbitControls ref={controlsRef} enablePan={false} maxDistance={6} minDistance={1.8} target={[0, 0, 0]} />
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

        <div className="pointer-events-none absolute left-8 top-8 max-w-md text-white/80 space-y-3">
          <Link
            to="/"
            className="pointer-events-auto inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Return Home
          </Link>
          <div className="pointer-events-auto">
            <h1 className="text-3xl font-semibold text-white">Brain Anatomy View</h1>
            <p className="mt-2 text-sm text-white/70">
              Explore the adult brain model in 3D and discuss structures with the assistant.
            </p>
          </div>
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
        initialPrompts={initialPrompts}
        title="Brain Assistant"
        subtitle="Dedalus Labs link to Gemini for guided exploration."
        placeholder="Ask the assistant about the brain…"
      />
    </div>
  );
}

export default BrainExperience;
