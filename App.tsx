import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/Store';
import { ClientApp } from './pages/ClientApp';
import { AdminApp } from './pages/AdminApp';
import { Auth } from './pages/Auth';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then((response) => {
      const session = response?.data?.session;
      setSession(session);
      setLoading(false);
    }).catch(err => {
      console.error("Error getting session:", err);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      if (data?.subscription) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  if (loading) return null;
  if (isSupabaseConfigured() && !session) return <Auth />;

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