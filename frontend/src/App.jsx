import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function HelloBox() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

function App() {
  return (
    <main style={{ width: '100%', height: '100vh', margin: 0 }}>
      <h1 style={{ textAlign: 'center' }}>Hello from React + Three.js!</h1>
      <Canvas style={{ height: '60vh' }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />
        <HelloBox />
        <OrbitControls />
      </Canvas>
    </main>
  );
}

export default App;
