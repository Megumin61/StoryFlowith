import React from 'react';
import './App.css';
import './styles/customScrollbar.css';
import StoryboardTest from './components/StoryboardTest';
import PersonaGenerationTest from './components/PersonaGenerationTest';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '20px', background: '#f5f5f5' }}>
          <Link to="/" style={{ marginRight: '20px' }}>故事板</Link>
          <Link to="/persona-test">用户画像测试</Link>
        </nav>
        
        <Routes>
          <Route path="/" element={<StoryboardTest />} />
          <Route path="/persona-test" element={<PersonaGenerationTest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
