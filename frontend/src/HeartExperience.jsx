import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useFBX } from '@react-three/drei';
import { Box3, Color, SRGBColorSpace, Vector3 } from 'three';

import ChatSidebar from './components/ChatSidebar.jsx';
import CanvasLoader from './components/CanvasLoader.jsx';
import CameraController from './components/CameraController.jsx';
import useAgentProcessTrace from './hooks/useAgentProcessTrace.js';
import { HEART_REGIONS, resolveHeartRegionName } from './heartRegions.js';

const initialPrompts = [
  'Highlight the pathway of blood through the right side of the heart.',
  'Rotate the model to show the posterior view of the heart.',
  'Explain how the left ventricle powers systemic circulation.'
];

const initialControllerState = {
  view: { azimuth: 20, elevation: 18, distance: 3.1 },
  highlightRegion: null,
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
        }
      };
    }
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

function HeartModel({ highlightRegion }) {
  const heart = useFBX(
    '/segmented-adult-heart/source/human-heart-3d-animated.fbx',
    (loader) => {
      loader.setPath('/segmented-adult-heart/source/');
      loader.setResourcePath('/segmented-adult-heart/textures/');
      loader.setCrossOrigin('anonymous');
    }
  );

  const materialMapRef = useRef(new Map());
  const originalColorsRef = useRef(new Map());

  useEffect(() => {
    if (!heart) return;

    // Set rotation to make heart upright and facing forward
    heart.rotation.set(0, 0, 0);
    heart.position.set(0, 0, 0);

    const boundingBox = new Box3().setFromObject(heart);
    const size = new Vector3();
    boundingBox.getSize(size);

    const desiredHeight = 2.6;
    const scale = size.y > 0 ? desiredHeight / size.y : 1;
    heart.scale.setScalar(scale);

    // Recalculate bounding box after scaling
    const scaledBox = new Box3().setFromObject(heart);
    const scaledCenter = new Vector3();
    scaledBox.getCenter(scaledCenter);

    // Center the heart at world origin (0, 0, 0)
    heart.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);

    // Build material map and store original colors
    heart.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (!material) return;

          // Store original color if not already stored
          if (material.color && !originalColorsRef.current.has(material.uuid)) {
            originalColorsRef.current.set(material.uuid, material.color.clone());
          }

          // Map material name to material reference
          if (material.name) {
            materialMapRef.current.set(material.name.toLowerCase(), material);
            console.log('Heart material found:', material.name);
          }

          // Set up textures
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

    console.log('Available heart materials:', Array.from(materialMapRef.current.keys()));
  }, [heart]);

  // Handle highlighting by changing material colors
  useEffect(() => {
    if (!heart) return;

    // Reset all materials to original colors first
    originalColorsRef.current.forEach((originalColor, uuid) => {
      heart.traverse((child) => {
        if (child.isMesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => {
            if (material && material.uuid === uuid) {
              material.color.copy(originalColor);
              material.emissive?.set(0x000000);
              material.emissiveIntensity = 0;
              material.needsUpdate = true;
            }
          });
        }
      });
    });

    // Apply highlight if region is selected
    if (highlightRegion?.key) {
      const regionConfig = HEART_REGIONS[highlightRegion.key];
      const highlightColor = new Color(highlightRegion.color || regionConfig?.color || '#00ff00');

      const materialKeys = Array.from(materialMapRef.current.keys());
      let matchedMaterial = null;

      // Try to match using material patterns from config
      if (regionConfig?.materialPatterns) {
        for (const pattern of regionConfig.materialPatterns) {
          const normalizedPattern = pattern.toLowerCase();
          for (const materialKey of materialKeys) {
            const normalizedMaterialKey = materialKey.toLowerCase().replace(/[\s_-]/g, '');
            const normalizedPatternClean = normalizedPattern.replace(/[\s_-]/g, '');

            if (normalizedMaterialKey.includes(normalizedPatternClean) ||
              normalizedPatternClean.includes(normalizedMaterialKey)) {
              matchedMaterial = materialMapRef.current.get(materialKey);
              console.log(`Matched region "${highlightRegion.key}" to material "${materialKey}" using pattern "${pattern}"`);
              break;
            }
          }
          if (matchedMaterial) break;
        }
      }

      // Fallback: try fuzzy matching on region key
      if (!matchedMaterial) {
        const regionKey = highlightRegion.key.toLowerCase().replace(/[\s_-]/g, '');
        for (const materialKey of materialKeys) {
          const normalizedMaterialKey = materialKey.toLowerCase().replace(/[\s_-]/g, '');
          if (normalizedMaterialKey.includes(regionKey) || regionKey.includes(normalizedMaterialKey)) {
            matchedMaterial = materialMapRef.current.get(materialKey);
            console.log(`Matched region "${highlightRegion.key}" to material "${materialKey}" using fuzzy match`);
            break;
          }
        }
      }

      if (matchedMaterial) {
        // Apply highlight color with emissive effect
        matchedMaterial.color.copy(highlightColor);
        matchedMaterial.emissive = highlightColor.clone();
        matchedMaterial.emissiveIntensity = 0.6;
        matchedMaterial.needsUpdate = true;
        console.log(`Applied highlight color ${highlightColor.getHexString()} to region "${highlightRegion.key}"`);
      } else {
        console.warn(`No material found for region: ${highlightRegion.key}`);
        console.log('Available materials:', materialKeys);
      }
    }
  }, [heart, highlightRegion]);

  return heart ? <primitive object={heart} /> : null;
}

function HeartExperience() {
  const { steps: agentProcessSteps, startTrace, updateFromServer, markFinalStatus } = useAgentProcessTrace();
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
            const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
            const colorInput = typeof args.color === 'string' ? args.color.trim() : '';
            const highlightColor = hexColorRegex.test(colorInput) ? colorInput : resolved.data.color;
            const rawComment =
              typeof args.comment === 'string'
                ? args.comment
                : typeof args.detail === 'string'
                  ? args.detail
                  : '';
            const highlightComment = rawComment.trim();
            dispatch({
              type: 'SET_HIGHLIGHT',
              payload: {
                key: resolved.key,
                color: highlightColor,
                label: resolved.data.label,
                comment: highlightComment
              }
            });
            results.push({
              name,
              status: 'success',
              message: `Highlighted ${resolved.data.label}.`,
              response: {
                status: 'success',
                detail: {
                  regionKey: resolved.key,
                  regionLabel: resolved.data.label,
                  color: highlightColor,
                  ...(highlightComment ? { comment: highlightComment } : {})
                }
              }
            });
            break;
          }
          case 'clear_highlighted_region': {
            dispatch({ type: 'CLEAR_HIGHLIGHT' });
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

      startTrace();
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
        if (Array.isArray(payload.agentSteps) && payload.agentSteps.length) {
          updateFromServer(payload.agentSteps);
        }

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
              const highlightSummaries = executionResults
                .filter(
                  (result) =>
                    result.name === 'highlight_heart_region' &&
                    result.status === 'success' &&
                    result.response?.detail?.color
                )
                .map((result) => ({
                  color: result.response.detail.color,
                  regionLabel: result.response.detail.regionLabel ?? result.response.detail.region ?? 'Highlighted region',
                  comment: result.response.detail.comment ?? ''
                }));
              const otherToolResults = executionResults.filter(
                (result) => result.name !== 'highlight_heart_region'
              );
              updated[assistantIndex] = {
                ...updated[assistantIndex],
                toolResults: otherToolResults,
                highlightSummaries
              };
            }
            return updated;
          });
        }

        markFinalStatus('complete', {
          toolCallCount: toolCalls.length,
          replyLength: (payload.reply || '').length
        });
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
        markFinalStatus('error', {
          message: error instanceof Error ? error.message : 'Assistant connection failed.'
        });
        setStatusMessage(error instanceof Error ? error.message : 'Assistant connection failed.');
      } finally {
        setIsSending(false);
      }
    },
    [applyToolCalls, apiBaseUrl, isSending, markFinalStatus, messages, startTrace, updateFromServer]
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
          <Suspense fallback={<CanvasLoader label="Loading heart model…" />}>
            <HeartModel highlightRegion={controllerState.highlightRegion} />
            <Environment preset="sunset" />
          </Suspense>
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

        <div className="pointer-events-none absolute left-8 top-8 max-w-md text-white/80 space-y-3">
          <Link
            to="/"
            className="pointer-events-auto inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Return Home
          </Link>
          <div className="pointer-events-auto">
            <h1 className="text-3xl font-semibold text-white">Heart Anatomy View</h1>
            <p className="mt-2 text-sm text-white/70">
              Inspect the adult heart in 3D. Use your mouse or touchpad to orbit and zoom around the model.
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
        title="Heart Assistant"
        subtitle="Dedalus Labs link to Gemini for guided exploration."
        placeholder="Ask the assistant about the heart…"
        processTrace={agentProcessSteps}
      />
    </div>
  );
}

export default HeartExperience;
