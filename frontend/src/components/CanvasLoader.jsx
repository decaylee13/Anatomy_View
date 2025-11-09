import { Html } from '@react-three/drei';

function CanvasLoader({ label = 'Loading model…' }) {
  return (
    <Html center>
      <div className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white/80 shadow-lg backdrop-blur">
        {label}
      </div>
    </Html>
  );
}

export default CanvasLoader;
