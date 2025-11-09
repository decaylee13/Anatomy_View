import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useFBX } from '@react-three/drei';
import { Box3, Color, SRGBColorSpace, Vector3 } from 'three';

import ChatSidebar from './components/ChatSidebar.jsx';
import CanvasLoader from './components/CanvasLoader.jsx';
import CameraController from './components/CameraController.jsx';
import useAgentProcessTrace from './hooks/useAgentProcessTrace.js';
import { BRAIN_REGIONS, resolveBrainRegionName } from './brainRegions.js';

const initialPrompts = [
  'Describe the functional regions visible on the lateral surface of the brain.',
  'Rotate the brain to reveal the cerebellum and brain stem.',
  'Explain how the frontal lobe supports executive functions.'
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

function BrainModel({ highlightRegion }) {
  const brain = useFBX(
    '/adult-brain/source/Brain_brain_stem.fbx',
    (loader) => {
      loader.setPath('/adult-brain/source/');
      loader.setResourcePath('/adult-brain/textures/');
      loader.setCrossOrigin('anonymous');
    }
  );

  const groupMapRef = useRef(new Map());
  const originalColorsRef = useRef(new Map());
  const meshMapRef = useRef(new Map());

  useEffect(() => {
    if (!brain) return;

    brain.rotation.set(0, 0, 0);

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

    // Build maps for groups, meshes, and store original colors
    brain.traverse((child) => {
      // Log all object types and names for debugging
      if (child.name) {
        console.log(`Brain object found - Type: ${child.type}, Name: "${child.name}"`);
      }

      // Map groups by name
      if (child.type === 'Group' && child.name) {
        groupMapRef.current.set(child.name.toLowerCase(), child);
        console.log('Brain group found:', child.name);
      }

      // Map meshes by name
      if (child.isMesh && child.name) {
        meshMapRef.current.set(child.name.toLowerCase(), child);
        console.log('Brain mesh found:', child.name);
      }

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

    console.log('Available brain groups:', Array.from(groupMapRef.current.keys()));
    console.log('Available brain meshes:', Array.from(meshMapRef.current.keys()));
  }, [brain]);

  // Handle highlighting by changing colors of meshes in matched groups or meshes
  useEffect(() => {
    if (!brain) return;

    // Reset all materials to original colors first
    originalColorsRef.current.forEach((originalColor, uuid) => {
      brain.traverse((child) => {
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
      const regionConfig = BRAIN_REGIONS[highlightRegion.key];
      const highlightColor = new Color(highlightRegion.color || regionConfig?.color || '#00ff00');

      const groupKeys = Array.from(groupMapRef.current.keys());
      const meshKeys = Array.from(meshMapRef.current.keys());
      let matchedGroup = null;
      let matchedMeshes = [];

      // Try to match using group patterns from config
      if (regionConfig?.groupPatterns) {
        for (const pattern of regionConfig.groupPatterns) {
          const normalizedPattern = pattern.toLowerCase();

          // Try matching groups
          for (const groupKey of groupKeys) {
            const normalizedGroupKey = groupKey.toLowerCase().replace(/[\s_-]/g, '');
            const normalizedPatternClean = normalizedPattern.replace(/[\s_-]/g, '');

            if (normalizedGroupKey.includes(normalizedPatternClean) ||
              normalizedPatternClean.includes(normalizedGroupKey)) {
              matchedGroup = groupMapRef.current.get(groupKey);
              console.log(`Matched region "${highlightRegion.key}" to group "${groupKey}" using pattern "${pattern}"`);
              break;
            }
          }

          // Try matching meshes by name
          for (const meshKey of meshKeys) {
            const normalizedMeshKey = meshKey.toLowerCase().replace(/[\s_-]/g, '');
            const normalizedPatternClean = normalizedPattern.replace(/[\s_-]/g, '');

            if (normalizedMeshKey.includes(normalizedPatternClean) ||
              normalizedPatternClean.includes(normalizedMeshKey)) {
              const mesh = meshMapRef.current.get(meshKey);
              matchedMeshes.push(mesh);
              console.log(`Matched region "${highlightRegion.key}" to mesh "${meshKey}" using pattern "${pattern}"`);
            }
          }

          if (matchedGroup || matchedMeshes.length > 0) break;
        }
      }

      // Fallback: try fuzzy matching on region key
      if (!matchedGroup && matchedMeshes.length === 0) {
        const regionKey = highlightRegion.key.toLowerCase().replace(/[\s_-]/g, '');

        // Try groups
        for (const groupKey of groupKeys) {
          const normalizedGroupKey = groupKey.toLowerCase().replace(/[\s_-]/g, '');
          if (normalizedGroupKey.includes(regionKey) || regionKey.includes(normalizedGroupKey)) {
            matchedGroup = groupMapRef.current.get(groupKey);
            console.log(`Matched region "${highlightRegion.key}" to group "${groupKey}" using fuzzy match`);
            break;
          }
        }

        // Try meshes
        for (const meshKey of meshKeys) {
          const normalizedMeshKey = meshKey.toLowerCase().replace(/[\s_-]/g, '');
          if (normalizedMeshKey.includes(regionKey) || regionKey.includes(normalizedMeshKey)) {
            const mesh = meshMapRef.current.get(meshKey);
            matchedMeshes.push(mesh);
            console.log(`Matched region "${highlightRegion.key}" to mesh "${meshKey}" using fuzzy match`);
          }
        }
      }

      // Apply highlight to matched group
      if (matchedGroup) {
        matchedGroup.traverse((child) => {
          if (child.isMesh) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
              if (material) {
                material.color.copy(highlightColor);
                material.emissive = highlightColor.clone();
                material.emissiveIntensity = 0.6;
                material.needsUpdate = true;
              }
            });
          }
        });
        console.log(`Applied highlight color ${highlightColor.getHexString()} to group for region "${highlightRegion.key}"`);
      }

      // Apply highlight to matched meshes
      if (matchedMeshes.length > 0) {
        matchedMeshes.forEach((mesh) => {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            if (material) {
              material.color.copy(highlightColor);
              material.emissive = highlightColor.clone();
              material.emissiveIntensity = 0.6;
              material.needsUpdate = true;
            }
          });
        });
        console.log(`Applied highlight color ${highlightColor.getHexString()} to ${matchedMeshes.length} meshes for region "${highlightRegion.key}"`);
      }

      if (!matchedGroup && matchedMeshes.length === 0) {
        console.warn(`No group or mesh found for region: ${highlightRegion.key}`);
        console.log('Available groups:', groupKeys);
        console.log('Available meshes:', meshKeys);
      }
    }
  }, [brain, highlightRegion]);

  return brain ? <primitive object={brain} /> : null;
}

function BrainExperience() {
  const { steps: agentProcessSteps, startTrace, updateFromServer, markFinalStatus } = useAgentProcessTrace();
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
          case 'highlight_brain_region': {
            const resolved = resolveBrainRegionName(args.region);
            if (!resolved) {
              const warning = `Unknown brain region: ${args.region ?? 'unspecified'}.`;
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
            const detail = 'Heart highlighting is not available in the brain viewer.';
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
          case 'annotate_heart_focus':
          case 'annotate_brain_focus': {
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
                replySource: payload.replySource || 'gemini',
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
                    result.name === 'highlight_brain_region' &&
                    result.status === 'success' &&
                    result.response?.detail?.color
                )
                .map((result) => ({
                  color: result.response.detail.color,
                  regionLabel: result.response.detail.regionLabel ?? result.response.detail.region ?? 'Highlighted region',
                  comment: result.response.detail.comment ?? ''
                }));
              const otherToolResults = executionResults.filter(
                (result) => result.name !== 'highlight_brain_region'
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
            <BrainModel highlightRegion={controllerState.highlightRegion} />
            <Environment preset="sunset" />
          </Suspense>
          <OrbitControls ref={controlsRef} enablePan={false} maxDistance={6} minDistance={1.8} target={[0, 0, 0]} />
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
            <h1 className="text-3xl font-semibold text-white">Brain Anatomy View</h1>
            <p className="mt-2 text-sm text-white/70">
              Explore the adult brain model in 3D and discuss structures with the assistant.
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
        title="Brain Assistant"
        subtitle="Dedalus Labs link to Gemini for guided exploration."
        placeholder="Ask the assistant about the brain…"
        processTrace={agentProcessSteps}
        annotation={controllerState.annotation}
      />
    </div>
  );
}

export default BrainExperience;
