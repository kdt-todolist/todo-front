import React from 'react';
import { TaskProvider } from './contexts/TaskContext';
import { AuthProvider } from './contexts/AuthContext';

import Modal from './components/Common/Modal';
import LoginForm from './components/Auth/LoginForm';
import TaskPage from './pages/TaskPage';
import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <TaskPage />
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
