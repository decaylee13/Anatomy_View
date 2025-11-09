import { Navigate, Route, Routes } from 'react-router-dom';

import Home from './Home.jsx';
import HeartExperience from './HeartExperience.jsx';
import BrainExperience from './BrainExperience.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/heart" element={<HeartExperience />} />
      <Route path="/brain" element={<BrainExperience />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
