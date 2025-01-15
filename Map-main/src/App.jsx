import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login'; // Ensure these paths and names match your files
import SignUp from './components/NewUser';
import IntroductionPage from './components/IntroductionPage';
import Enter from './components/Enter';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ent" element={<Enter />} />
        <Route path="/main" element={<IntroductionPage />} />
      </Routes>
    </Router>
  );
};

export default App;
