import { useState } from 'react';
import App from './App';
import WindowPage from './components/WindowPage';

/**
 * Root component with view switcher
 * Toggle between the 3D Heart Viewer and Figma Design Preview
 */
export default function Root() {
  const [view, setView] = useState('figma'); // 'heart' or 'figma' - default to figma

  return (
    <div className="relative h-screen w-screen">
      {view === 'heart' ? <App /> : <WindowPage />}
      
      {/* View Switcher - Fixed position button */}
      <div className="pointer-events-auto fixed bottom-6 left-6 z-50 flex gap-2 rounded-2xl border border-white/10 bg-slate-900/90 p-2 shadow-xl backdrop-blur">
        <button
          onClick={() => setView('heart')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === 'heart'
              ? 'bg-sky-500 text-white shadow-lg'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          3D Heart Viewer
        </button>
        <button
          onClick={() => setView('figma')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            view === 'figma'
              ? 'bg-sky-500 text-white shadow-lg'
              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          Figma Design Preview
        </button>
      </div>
    </div>
  );
}
