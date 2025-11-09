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
  const [introClosing, setIntroClosing] = useState(false);

  useEffect(() => {
    if (location.pathname !== '/') {
      setShowIntro(false);
      setIntroClosing(false);
      return undefined;
    }

    setShowIntro(true);
    setIntroClosing(false);

    if (typeof window === 'undefined') {
      return undefined;
    }

    const introDuration = 2200;
    const fadeDuration = 450;

    const fadeTimer = window.setTimeout(() => {
      setIntroClosing(true);
    }, introDuration);

    const hideTimer = window.setTimeout(() => {
      setShowIntro(false);
      setIntroClosing(false);
    }, introDuration + fadeDuration);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  const showNavbar = location.pathname === '/';

  return (
    <>
      {showIntro && <MedverseIntro closing={introClosing} />}
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
