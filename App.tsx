import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/Store';
import { ClientApp } from './pages/ClientApp';
import { AdminApp } from './pages/AdminApp';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<ClientApp />} />
          <Route path="/admin" element={<AdminApp />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;