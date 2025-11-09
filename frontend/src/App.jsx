import { Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Html, OrbitControls, useFBX } from '@react-three/drei';
import { Box3, Vector3 } from 'three';

const initialPrompts = [
  'How does blood flow through the chambers of the heart?',
  'Can you highlight the left atrium?',
  'Explain the difference between arteries and veins near the heart.'
];

function HeartModel() {
  const heart = useFBX('/segmented-adult-heart/source/human-heart-3d-animated.fbx');

  useEffect(() => {
    if (!heart) return;

    heart.rotation.set(-Math.PI / 2, Math.PI, 0);

    const boundingBox = new Box3().setFromObject(heart);
    const size = new Vector3();
    boundingBox.getSize(size);

    const desiredHeight = 2.8;
    const scale = size.y > 0 ? desiredHeight / size.y : 1;
    heart.scale.setScalar(scale);

    const scaledBox = new Box3().setFromObject(heart);
    const scaledCenter = new Vector3();
    scaledBox.getCenter(scaledCenter);
    heart.position.set(-scaledCenter.x, -scaledCenter.y, -scaledCenter.z);
    heart.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [heart]);

  useFrame((_, delta) => {
    if (heart) {
      heart.rotation.z += delta * 0.1;
    }
  });

  return <primitive object={heart} />;
}

function CanvasLoader() {
  return (
    <Html center>
      <div className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white/80 shadow-lg backdrop-blur">
        Loading heart model…
      </div>
    </Html>
  );
}

function ChatSidebar({ isOpen, onClose, messages, onSubmit }) {
  const [pendingMessage, setPendingMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = pendingMessage.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setPendingMessage('');
  };

  return (
    <aside
      className={`relative flex h-full flex-col overflow-hidden bg-slate-900/95 text-slate-100 shadow-2xl transition-[transform,width] duration-300 ease-in-out ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      style={{ width: isOpen ? '24rem' : '0rem', transform: `translateX(${isOpen ? '0%' : '100%'})` }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 rounded-l-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
      >
        {isOpen ? 'Hide Chat' : 'Open Chat'}
      </button>

      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Heart Assistant</h2>
          <p className="text-xs text-white/60">Ask questions about the anatomy you are viewing.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/70 transition hover:bg-white/20"
        >
          Hide
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="space-y-3 text-sm text-white/70">
            <p>Start the conversation by trying one of these prompts:</p>
            <ul className="list-disc space-y-1 pl-5">
              {initialPrompts.map((prompt) => (
                <li key={prompt} className="cursor-pointer text-white/80" onClick={() => onSubmit(prompt)}>
                  {prompt}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg ${
                message.role === 'user'
                  ? 'ml-auto bg-sky-500/30 text-sky-50'
                  : 'mr-auto bg-emerald-500/30 text-emerald-50'
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <p>{message.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-white/10 px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={pendingMessage}
            onChange={(event) => setPendingMessage(event.target.value)}
            placeholder="Ask the assistant about the heart…"
            className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          />
          <button
            type="submit"
            className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-400"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const handleSendMessage = (text) => {
    setMessages((previous) => [
      ...previous,
      { role: 'user', text },
      {
        role: 'assistant',
        text: "I'm analyzing the heart model. More detailed responses will arrive in a future update."
      }
    ]);
  };

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
          <Suspense fallback={<CanvasLoader />}>
            <HeartModel />
            <Environment preset="sunset" />
          </Suspense>
          <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2.5} far={10} />
          <OrbitControls enablePan={false} maxDistance={6} minDistance={1.5} target={[0, 0, 0]} />
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

        <div className="pointer-events-none absolute left-8 top-8 max-w-md text-white/80">
          <h1 className="pointer-events-auto text-3xl font-semibold text-white">Anatomy View</h1>
          <p className="pointer-events-auto mt-2 text-sm text-white/70">
            Inspect the adult heart in 3D. Use your mouse or touchpad to orbit and zoom around the model.
          </p>
        </div>
      </div>

      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen((previous) => !previous)}
        messages={messages}
        onSubmit={handleSendMessage}
      />
    </div>
  );
}

export default App;
