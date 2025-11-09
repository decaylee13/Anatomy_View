import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Home from './Home.jsx';
import HeartExperience from './HeartExperience.jsx';
import BrainExperience from './BrainExperience.jsx';
import SkeletonExperience from './SkeletonExperience.jsx';
import MedverseIntro from './components/MedverseIntro.jsx';
import MedverseNavbar from './components/MedverseNavbar.jsx';

function App() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(() => location.pathname === '/');

  useEffect(() => {
    if (location.pathname !== '/') {
      setShowIntro(false);
      return undefined;
    }

    setShowIntro(true);

    if (typeof window === 'undefined') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const showNavbar = location.pathname === '/';

  return (
    <>
      {showIntro && <MedverseIntro />}
      {showNavbar && <MedverseNavbar />}
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
