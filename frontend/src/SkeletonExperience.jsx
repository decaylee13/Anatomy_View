import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas, useLoader } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Box3, Color, SRGBColorSpace, Vector3 } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import ChatSidebar from './components/ChatSidebar.jsx';
import CanvasLoader from './components/CanvasLoader.jsx';
import CameraController from './components/CameraController.jsx';
import { SKELETON_REGIONS, findRegionByName } from './skeletonRegions.js';

const initialPrompts = [
  'Highlight the major bones that form the axial skeleton.',
  'Rotate the model to focus on the rib cage and sternum.',
  'Explain the functional difference between axial and appendicular skeletons.'
];

const initialControllerState = {
  view: { azimuth: 25, elevation: 15, distance: 4 },
  annotation: null,
  highlightRegion: null
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
        }
      };
    }
    case 'SET_ANNOTATION':
      return { ...state, annotation: action.payload };
    case 'HIGHLIGHT_REGION':
      return { ...state, highlightRegion: action.payload };
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

function SkeletonPart({ fileName, highlightColor }) {
  const obj = useLoader(OBJLoader, `/${fileName}.obj`);
  const originalColorsRef = useRef(new Map());

  useEffect(() => {
    if (!obj) return;

    obj.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) return;

        // Store original colors
        if (!originalColorsRef.current.has(child.uuid)) {
          originalColorsRef.current.set(child.uuid, {
            color: material.color ? material.color.clone() : new Color(0xcccccc),
            emissive: material.emissive ? material.emissive.clone() : new Color(0x000000)
          });
        }

        // Set default bone color if not already set
        if (!material.color) {
          material.color = new Color(0xcccccc);
        }

        ['map', 'emissiveMap'].forEach((mapKey) => {
          const texture = material[mapKey];
          if (texture && 'colorSpace' in texture) {
            texture.colorSpace = SRGBColorSpace;
          }
        });
        material.needsUpdate = true;
      });
    });
  }, [obj]);

  // Handle highlighting
  useEffect(() => {
    if (!obj) return;

    obj.traverse((child) => {
      if (!child.isMesh) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) return;

        const originalColors = originalColorsRef.current.get(child.uuid);
        if (!originalColors) return;

        if (highlightColor) {
          const targetColor = new Color(highlightColor);
          material.color.copy(targetColor);
          material.emissive.copy(targetColor);
        } else {
          material.color.copy(originalColors.color);
          material.emissive.copy(originalColors.emissive);
        }
        material.needsUpdate = true;
      });
    });
  }, [obj, highlightColor]);

  return obj ? <primitive object={obj} /> : null;
}

function SkeletonModel({ highlightRegion }) {
  const skeletonGroup = useRef();

  const { scale, position } = useMemo(() => {
    if (!skeletonGroup.current) {
      return { scale: 1, position: new Vector3(0, 0, 0) };
    }

    const boundingBox = new Box3().setFromObject(skeletonGroup.current);
    const size = new Vector3();
    boundingBox.getSize(size);

    const desiredHeight = 3.6;
    const computedScale = size.y > 0 ? desiredHeight / size.y : 1;

    const center = new Vector3();
    boundingBox.getCenter(center);
    center.multiplyScalar(-computedScale);

    return { scale: computedScale, position: center };
  }, [skeletonGroup.current]);

  return (
    <group ref={skeletonGroup} scale={scale} position={[position.x, position.y, position.z]}>
      {Object.entries(SKELETON_REGIONS).map(([key, region]) => (
        <SkeletonPart
          key={key}
          fileName={region.fileName}
          highlightColor={highlightRegion?.fileName === region.fileName ? highlightRegion.color : null}
        />
      ))}
    </group>
  );
}

function SkeletonExperience() {
  const [messages, setMessages] = useState([]);
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
              message: `Adjusted camera to azimuth ${azimuth.toFixed(1)}°, elevation ${elevation.toFixed(1)}°${distance ? `, distance ${distance.toFixed(2)}` : ''
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
            dispatch({ type: 'HIGHLIGHT_REGION', payload: null });
            results.push({
              name,
              status: 'success',
              message: 'Cleared any active annotations and highlights for the skeleton.',
              response: { status: 'success', detail: 'Annotations and highlights cleared.' }
            });
            break;
          }
          case 'highlight_skeleton_region': {
            if (!args.region) {
              const detail = 'Missing required parameter: region.';
              setStatusMessage(detail);
              results.push({
                name,
                status: 'error',
                message: detail,
                response: { status: 'error', detail }
              });
              return;
            }

            const regionConfig = findRegionByName(args.region);

            if (!regionConfig) {
              const detail = `Unknown skeleton region: "${args.region}".`;
              setStatusMessage(detail);
              results.push({
                name,
                status: 'error',
                message: detail,
                response: { status: 'error', detail }
              });
              return;
            }

            const highlightColor = args.color || regionConfig.color;
            dispatch({
              type: 'HIGHLIGHT_REGION',
              payload: {
                fileName: regionConfig.fileName,
                color: highlightColor
              }
            });

            results.push({
              name,
              status: 'success',
              message: `Highlighting ${regionConfig.label} in ${highlightColor}.`,
              response: {
                status: 'success',
                detail: { region: args.region, color: highlightColor }
              }
            });
            break;
          }
          case 'highlight_heart_region': {
            const detail = 'Heart highlighting is not available in skeleton view.';
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
              text: payload.reply || '',
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
            <SkeletonModel highlightRegion={controllerState.highlightRegion} />
            <Environment preset="sunset" />
          </Suspense>
          <OrbitControls ref={controlsRef} enablePan={false} maxDistance={7} minDistance={2.2} target={[0, 0.4, 0]} />
          <CameraController view={controllerState.view} controlsRef={controlsRef} />
        </Canvas>

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

        {statusMessage ? (
          <div className="pointer-events-auto absolute left-1/2 top-6 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-xs font-medium text-white/80 shadow-xl">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <ChatSidebar
        messages={messages}
        onSubmit={handleSendMessage}
        isBusy={isSending}
        initialPrompts={initialPrompts}
        title="Skeleton Assistant"
        subtitle="Dedalus Labs link to Gemini for guided exploration."
        placeholder="Ask the assistant about the skeleton…"
        annotation={controllerState.annotation}
      />
    </div>
  );
}

export default SkeletonExperience;
