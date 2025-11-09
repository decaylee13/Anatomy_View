import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Home from './Home.jsx';
import HeartExperience from './HeartExperience.jsx';
import BrainExperience from './BrainExperience.jsx';
import SkeletonExperience from './SkeletonExperience.jsx';
import MedverseIntro from './components/MedverseIntro.jsx';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {showIntro && <MedverseIntro />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/heart" element={<HeartExperience />} />
        <Route path="/brain" element={<BrainExperience />} />
        <Route path="/skeleton" element={<SkeletonExperience />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
