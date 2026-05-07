import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../config/db.conn";

const SessionContext = createContext();

const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get existing session on refresh
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.log(error.message);
      }

      setSession(data.session);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession,
        loading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );

};

export default SessionProvider ;

  export const useSession = () => {
  return useContext(SessionContext);
};

