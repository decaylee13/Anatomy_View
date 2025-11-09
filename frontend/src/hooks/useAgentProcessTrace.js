import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STEP_ORDER = [
    'reading_prompt',
    'augmenting_context',
    'dispatching_to_gemini',
    'receiving_gemini_response',
    'extracting_tool_calls',
    'rendering_reply'
];

const STEP_LABELS = {
    reading_prompt: 'Reading user prompt',
    augmenting_context: 'Augmenting context',
    dispatching_to_gemini: 'Dispatching to Gemini',
    receiving_gemini_response: 'Receiving response from Gemini',
    extracting_tool_calls: 'Extracting tool calls',
    rendering_reply: 'Rendering final reply'
};

const STATUS_PRIORITY = {
    error: 4,
    complete: 3,
    'in-progress': 2,
    pending: 1
};

const normaliseStatus = (status) => {
    if (!status) return 'complete';
    if (status === 'started') return 'in-progress';
    return status;
};

const normaliseDetail = (detail) => {
    if (detail === null || detail === undefined) return null;
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'number' || typeof detail === 'boolean') return detail;
    try {
        return JSON.parse(JSON.stringify(detail));
    } catch (_error) {
        return String(detail);
    }
};

const normaliseStep = (step, labelFor) => {
    const id = step.id;
    if (!id) {
        throw new Error('Agent trace step is missing an id.');
    }

    return {
        id,
        label: step.label || labelFor(id),
        status: normaliseStatus(step.status),
        detail: normaliseDetail(step.detail),
        timestamp: step.timestamp || new Date().toISOString()
    };
};

const sortSteps = (steps) => {
    const indexed = new Map(STEP_ORDER.map((key, index) => [key, index]));
    return [...steps].sort((a, b) => {
        const aIndex = indexed.has(a.id) ? indexed.get(a.id) : STEP_ORDER.length;
        const bIndex = indexed.has(b.id) ? indexed.get(b.id) : STEP_ORDER.length;
        if (aIndex === bIndex) {
            return a.label.localeCompare(b.label);
        }
        return aIndex - bIndex;
    });
};

export default function useAgentProcessTrace() {
    const [steps, setSteps] = useState([]);
    const animationQueueRef = useRef([]);
    const animationTimerRef = useRef(null);
    const isAnimatingRef = useRef(false);

    const labelFor = useCallback((id) => {
        if (STEP_LABELS[id]) return STEP_LABELS[id];
        return id
            .split('_')
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' ');
    }, []);

    const clearAnimationTimer = useCallback(() => {
        if (animationTimerRef.current) {
            clearTimeout(animationTimerRef.current);
            animationTimerRef.current = null;
        }
        isAnimatingRef.current = false;
    }, []);

    const applyNormalisedStep = useCallback((normalised) => {
        setSteps((previous) => {
            const merged = new Map(previous.map((step) => [step.id, step]));
            const existing = merged.get(normalised.id);

            if (!existing) {
                merged.set(normalised.id, normalised);
            } else {
                const incomingPriority = STATUS_PRIORITY[normalised.status] ?? 0;
                const currentPriority = STATUS_PRIORITY[existing.status] ?? 0;

                merged.set(normalised.id, {
                    ...existing,
                    detail: normalised.detail ?? existing.detail ?? null,
                    status: incomingPriority >= currentPriority ? normalised.status : existing.status,
                    timestamp: normalised.timestamp || existing.timestamp
                });
            }

            return sortSteps(Array.from(merged.values()));
        });
    }, []);

    const processQueue = useCallback(() => {
        if (isAnimatingRef.current) return;
        const nextStep = animationQueueRef.current.shift();
        if (!nextStep) {
            return;
        }

        isAnimatingRef.current = true;
        const delayMs = Math.random() * 300;
        animationTimerRef.current = window.setTimeout(() => {
            animationTimerRef.current = null;
            try {
                applyNormalisedStep(nextStep);
            } finally {
                isAnimatingRef.current = false;
                processQueue();
            }
        }, delayMs);
    }, [applyNormalisedStep]);

    const enqueueSteps = useCallback(
        (incomingSteps) => {
            if (!Array.isArray(incomingSteps) || incomingSteps.length === 0) {
                return;
            }

            const normalisedList = [];

            incomingSteps.forEach((incoming) => {
                try {
                    const normalised = normaliseStep(incoming, labelFor);
                    normalisedList.push(normalised);
                } catch (error) {
                    console.warn('Failed to queue agent process step:', error);
                }
            });

            if (!normalisedList.length) {
                return;
            }

            const ordered = sortSteps(normalisedList);
            ordered.forEach((step) => {
                animationQueueRef.current.push(step);
            });

            processQueue();
        },
        [labelFor, processQueue]
    );

    const startTrace = useCallback(() => {
        clearAnimationTimer();
        animationQueueRef.current = [];
        isAnimatingRef.current = false;
        setSteps([]);
        const now = new Date().toISOString();
        enqueueSteps([
            { id: 'reading_prompt', status: 'in-progress', timestamp: now },
            { id: 'augmenting_context', status: 'pending', timestamp: now },
            { id: 'dispatching_to_gemini', status: 'pending', timestamp: now }
        ]);
    }, [clearAnimationTimer, enqueueSteps]);

    const updateFromServer = useCallback(
        (serverSteps) => {
            enqueueSteps(serverSteps);
        },
        [enqueueSteps]
    );

    const markFinalStatus = useCallback(
        (status, detail) => {
            enqueueSteps([
                {
                    id: 'rendering_reply',
                    status,
                    detail,
                    timestamp: new Date().toISOString()
                }
            ]);
        },
        [enqueueSteps]
    );

    const clearTrace = useCallback(() => {
        clearAnimationTimer();
        animationQueueRef.current = [];
        isAnimatingRef.current = false;
        setSteps([]);
    }, [clearAnimationTimer]);

    useEffect(() => () => {
        clearAnimationTimer();
    }, [clearAnimationTimer]);

    return useMemo(
        () => ({
            steps,
            startTrace,
            updateFromServer,
            markFinalStatus,
            clearTrace
        }),
        [steps, startTrace, updateFromServer, markFinalStatus, clearTrace]
    );
}
