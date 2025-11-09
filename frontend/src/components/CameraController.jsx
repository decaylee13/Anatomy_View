import { useEffect, useRef } from 'react';
import { MathUtils } from 'three';
import { useThree } from '@react-three/fiber';

function CameraController({ view, controlsRef }) {
  const { camera } = useThree();
  const previousView = useRef(null);

  useEffect(() => {
    if (!view) return;

    // Check if view values actually changed (not just object reference)
    if (previousView.current) {
      const viewChanged = 
        previousView.current.azimuth !== view.azimuth ||
        previousView.current.elevation !== view.elevation ||
        previousView.current.distance !== view.distance;
      
      if (!viewChanged) {
        return; // Skip if values haven't changed
      }
    } else {
      // First mount - just store the view, don't move camera
      previousView.current = { ...view };
      return;
    }

    // Store current view for next comparison
    previousView.current = { ...view };

    const azimuth = MathUtils.degToRad(view.azimuth ?? 0);
    const elevation = MathUtils.degToRad(view.elevation ?? 15);
    const radius = view.distance ?? 5;

    // Use the same target as OrbitControls
    const targetY = 0.4;

    const x = radius * Math.cos(elevation) * Math.sin(azimuth);
    const y = radius * Math.sin(elevation) + targetY;
    const z = radius * Math.cos(elevation) * Math.cos(azimuth);

    camera.position.set(x, y, z);
    camera.lookAt(0, targetY, 0);

    if (controlsRef?.current) {
      controlsRef.current.target.set(0, targetY, 0);
      controlsRef.current.update();
    }
  }, [view, camera, controlsRef]);

  return null;
}

export default CameraController;
