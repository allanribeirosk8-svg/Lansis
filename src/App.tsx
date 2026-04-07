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

  console.log('[ProtectedRoute] 🛡️ Renderizando. Loading:', loading, '| Tem Sessão?', !!session);

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

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[ProtectedRoute] 🔄 Evento Supabase:', _event, '| Sessão existe?', !!session);
        console.log('[App] 🔄 Evento de Auth disparado:', _event, 'Sessão existe?', !!session);
        setSession(session);
        if (_event === 'SIGNED_OUT') setSession(null);
        setLoading(false); // <- ESTA É A LINHA CRÍTICA A SER ADICIONADA
      }
    );

    return () => {
      if (data?.subscription) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  console.log('[App] 🖥️ Renderizando App. Loading:', loading, 'Sessão:', !!session);

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
          <Route 
            path="/login" 
            element={
              <ProtectedRoute>
                <AdminApp />
              </ProtectedRoute>
            } 
          />
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