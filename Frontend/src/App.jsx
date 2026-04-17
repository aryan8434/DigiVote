import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { LanguageProvider } from './contexts/LanguageContext';
import Intro from './pages/Intro';
import VoterLogin from './pages/VoterLogin';
import Home from './pages/Home';
import VoteFlow from './pages/VoteFlow';
import VoterRegistration from './pages/VoterRegistration';
import CandidateRegistration from './pages/CandidateRegistration';
import HelpDesk from './pages/HelpDesk';
import AdminConfig from './pages/AdminConfig';
import AdminLogin from './pages/AdminLogin';
import ElectionResults from './pages/ElectionResults';

function App() {
  const isNative = Capacitor.isNativePlatform();

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/voter-login" element={<VoterLogin />} />
          <Route path="/home" element={<Home />} />
          <Route path="/vote" element={<VoteFlow />} />
          <Route path="/voter-registration" element={<VoterRegistration />} />
          <Route path="/results" element={<ElectionResults />} />

          {!isNative && (
            <>
              <Route path="/candidate-registration" element={<CandidateRegistration />} />
              <Route path="/help-desk" element={<HelpDesk />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminConfig />} />
            </>
          )}

          {isNative && <Route path="*" element={<Home />} />}
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
