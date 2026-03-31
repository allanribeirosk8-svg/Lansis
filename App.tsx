import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/Store';
import { ClientApp } from './pages/ClientApp';
import { AdminApp } from './pages/AdminApp';
import { Auth } from './pages/Auth';
import { supabase } from './lib/supabase';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (!session) return <Auth />;

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<ClientApp />} />
          <Route path="/login" element={<Auth />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;