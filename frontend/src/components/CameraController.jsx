import { useEffect } from 'react';
import { MathUtils } from 'three';
import { useThree } from '@react-three/fiber';

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

    if (controlsRef?.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [view, camera, controlsRef]);

  return null;
}

export default CameraController;
