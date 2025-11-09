import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Box3, Color, Vector3 } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import CanvasLoader from './CanvasLoader.jsx';

function SkullModel() {
    const skull = useLoader(OBJLoader, '/skull/skull.obj');
    const scene = useMemo(() => skull.clone(true), [skull]);
    const modelRef = useRef(scene);

    useEffect(() => {
        const model = modelRef.current;
        if (!model) return;

        const boundingBox = new Box3().setFromObject(model);
        const size = new Vector3();
        boundingBox.getSize(size);
        const center = new Vector3();
        boundingBox.getCenter(center);

        // Normalize the skull so it stays centered and scaled inside the preview frame.
        const desiredHeight = 1.6;
        const scale = size.y > 0 ? desiredHeight / size.y : 1;
        model.scale.setScalar(scale);

        const normalizedBox = new Box3().setFromObject(model);
        const normalizedCenter = new Vector3();
        normalizedBox.getCenter(normalizedCenter);
        model.position.set(-normalizedCenter.x, -normalizedCenter.y, -normalizedCenter.z);

        model.rotation.y = Math.PI * 0.12;
    }, [scene]);

    useEffect(() => {
        const model = modelRef.current;
        if (!model) return;

        model.traverse((child) => {
            if (!child.isMesh || !child.material) return;

            child.castShadow = true;
            child.receiveShadow = true;

            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
                if (!material) return;
                material.color = new Color('#e8dcc8'); // Warm bone color
                if ('roughness' in material) material.roughness = 0.7; // More natural, less shiny
                if ('metalness' in material) material.metalness = 0.1; // Slight metallic sheen
                if ('envMapIntensity' in material) material.envMapIntensity = 0.5; // Moderate environment reflection
            });
        });
    }, [scene]);

    useFrame((_, delta) => {
        const model = modelRef.current;
        if (!model) return;
        model.rotation.y += delta * 0.25;
    });

    return <primitive ref={modelRef} object={scene} />;
}

function SkullPreviewCanvas() {
    return (
        <Canvas shadows camera={{ position: [1.9, 1.2, 1.9], fov: 40 }} className="rounded-3xl">
            <ambientLight intensity={0.4} />
            <directionalLight 
                castShadow
                position={[5, 8, 5]} 
                intensity={1.2} 
                shadow-mapSize={2048}
            />
            <directionalLight 
                position={[-5, 5, -5]} 
                intensity={0.6}
            />
            <spotLight
                castShadow
                position={[0, 10, 0]}
                angle={0.5}
                penumbra={0.5}
                intensity={0.8}
                shadow-mapSize={1024}
            />
            <Suspense fallback={<CanvasLoader label="Loading skull" />}>
                <SkullModel />
                <Environment preset="sunset" />
            </Suspense>
            <OrbitControls enablePan={false} maxDistance={3} minDistance={1.1} />
        </Canvas>
    );
}

function SkullPreview() {
    return (
        <div className="relative mt-6 lg:mt-12">
            <div className="h-96 w-full overflow-hidden rounded-3xl bg-white/4">
                <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-white/80">Preparing viewer…</div>}>
                    <SkullPreviewCanvas />
                </Suspense>
            </div>
        </div>
    );
}

export default SkullPreview;
