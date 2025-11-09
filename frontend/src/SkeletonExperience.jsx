import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useLoader } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { Box3, SRGBColorSpace, Vector3 } from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import ChatSidebar from './components/ChatSidebar.jsx';
import CanvasLoader from './components/CanvasLoader.jsx';
import CameraController from './components/CameraController.jsx';

const initialPrompts = [
  'Highlight the major bones that form the axial skeleton.',
  'Rotate the model to focus on the rib cage and sternum.',
  'Explain the functional difference between axial and appendicular skeletons.'
];

const initialControllerState = {
  view: { azimuth: 25, elevation: 15, distance: 4 },
  annotation: null
};

const SKELETON_SUBTOOLS = [
  'SubTool-0-12960644',
  'SubTool-1-5430089',
  'SubTool-2-5430089',
  'SubTool-3-2401016',
  'SubTool-4-3028232',
  'SubTool-5-2408458',
  'SubTool-6-2408458',
  'SubTool-7-5430089',
  'SubTool-8-5430089',
  'SubTool-9-5430089',
  'SubTool-10-2493069',
  'SubTool-11-2493069',
  'SubTool-12-7838689',
  'SubTool-13-7838689',
  'SubTool-14-7838689',
  'SubTool-15-7838689',
  'SubTool-16-5430089',
  'SubTool-17-5430089'
];

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
        }
      };
    }
    case 'SET_ANNOTATION':
      return { ...state, annotation: action.payload };
    default:
      return state;
  }
}

function parseToolArguments(args) {
  if (!args) return {};
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('Failed to parse tool arguments:', args, error);
      return {};
    }
  }
  return args;
}

function SkeletonModel() {
  const groupRef = useRef();

  const materialCreators = useLoader(
    MTLLoader,
    SKELETON_SUBTOOLS.map((name) => `/human-skeleton-study/source/archive/${name}.mtl`),
    (loader) => {
      loader.setResourcePath('/human-skeleton-study/source/archive/');
      loader.setPath('/human-skeleton-study/source/archive/');
      loader.setMaterialOptions({ invertTrProperty: true });
    }
  );

  const parts = useLoader(
    OBJLoader,
    SKELETON_SUBTOOLS.map((name) => `/human-skeleton-study/source/archive/${name}.OBJ`),
    (loader) => {
      loader.setPath('/human-skeleton-study/source/archive/');
      loader.setResourcePath('/human-skeleton-study/source/archive/');
    }
  );

  useEffect(() => {
    if (!Array.isArray(parts) || parts.length === 0) return;
    parts.forEach((part, index) => {
      if (!part) return;
      const materialCreator = materialCreators?.[index];
      if (materialCreator) {
        materialCreator.preload();
      }
      part.traverse((child) => {
        if (!child.isMesh) return;
        if (materialCreator && child.material?.name) {
          const replacement = materialCreator.create(child.material.name);
          if (replacement) {
            child.material = replacement;
          }
        }
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
      });
    });
  }, [materialCreators, parts]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group || !Array.isArray(parts) || parts.length === 0) return;

    group.rotation.set(0, 0, 0);
    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1);

    const boundingBox = new Box3().setFromObject(group);
    const size = new Vector3();
    boundingBox.getSize(size);

    const desiredHeight = 3.6;
    const scale = size.y > 0 ? desiredHeight / size.y : 1;
    group.scale.setScalar(scale);

    const scaledBox = new Box3().setFromObject(group);
    const center = new Vector3();
    scaledBox.getCenter(center);
    group.position.set(-center.x, -center.y, -center.z);
  }, [parts]);

  return (
    <group ref={groupRef}>
      {Array.isArray(parts)
        ? parts.map((part, index) => <primitive key={SKELETON_SUBTOOLS[index]} object={part} />)
        : null}
    </group>
  );
}

function SkeletonExperience() {
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
        const { name, arguments: rawArguments = {} } = tool;
        const args = parseToolArguments(rawArguments);
        switch (name) {
          case 'set_skeleton_view':
          case 'set_brain_view':
          case 'set_heart_view': {
            const azimuth = Number.isFinite(args.azimuth) ? args.azimuth : null;
            const elevation = Number.isFinite(args.elevation) ? args.elevation : null;
            const distance = Number.isFinite(args.distance) ? args.distance : undefined;

            if (azimuth === null || elevation === null) {
              const detail = 'Missing azimuth or elevation for camera control.';
              results.push({
                name,
                status: 'error',
                message: detail,
                response: { status: 'error', detail }
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
          case 'annotate_skeleton_focus':
          case 'annotate_heart_focus': {
            if (!args.title || !args.description) {
              const detail = 'Both title and description are required.';
              results.push({
                name,
                status: 'error',
                message: detail,
                response: { status: 'error', detail }
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
                detail: { title: args.title, description: args.description }
              }
            });
            break;
          }
          case 'clear_highlighted_region': {
            dispatch({ type: 'SET_ANNOTATION', payload: null });
            results.push({
              name,
              status: 'success',
              message: 'Cleared any active annotations for the skeleton.',
              response: { status: 'success', detail: 'Annotations cleared.' }
            });
            break;
          }
          case 'highlight_heart_region':
          case 'highlight_skeleton_region': {
            const detail = 'Region highlighting is not available for the skeleton model yet.';
            setStatusMessage(detail);
            results.push({
              name,
              status: 'error',
              message: detail,
              response: { status: 'error', detail }
            });
            break;
          }
          case 'toggle_auto_rotation': {
            results.push({
              name,
              status: 'success',
              message: 'Auto-rotation is disabled for precise manual inspection.',
              response: { status: 'success', detail: { enabled: false } }
            });
            break;
          }
          default: {
            const detail = 'Tool not recognised by the renderer.';
            results.push({
              name,
              status: 'error',
              message: detail,
              response: { status: 'error', detail }
            });
          }
        }
      });

      return results;
    },
    [dispatch]
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
              updated[assistantIndex] = {
                ...updated[assistantIndex],
                toolResults: executionResults,
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
        <Canvas shadows camera={{ position: [2.8, 1.8, 4.2], fov: 45 }}>
          <color attach="background" args={[0.02, 0.03, 0.05]} />
          <ambientLight intensity={0.5} />
          <spotLight
            castShadow
            position={[6, 10, 6]}
            angle={0.35}
            penumbra={0.4}
            intensity={1.6}
            shadow-mapSize={1024}
          />
          <Suspense fallback={<CanvasLoader label="Loading skeleton model…" />}>
            <SkeletonModel />
            <Environment preset="sunset" />
          </Suspense>
          <ContactShadows position={[0, -1.4, 0]} scale={12} blur={2.4} opacity={0.45} far={5} />
          <OrbitControls ref={controlsRef} enablePan={false} maxDistance={7} minDistance={2.2} target={[0, 0.4, 0]} />
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
            <h1 className="text-3xl font-semibold text-white">Skeleton Anatomy View</h1>
            <p className="mt-2 text-sm text-white/70">
              Examine a full-body skeleton and collaborate with the assistant for contextual explanations.
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
        title="Skeleton Assistant"
        subtitle="Dedalus Labs link to Gemini for guided exploration."
        placeholder="Ask the assistant about the skeleton…"
      />
    </div>
  );
}

export default SkeletonExperience;
