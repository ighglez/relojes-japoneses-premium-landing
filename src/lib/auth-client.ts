"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

// Enhanced base URL detection that works in all environments
const getClientBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
  fetchOptions: {
    onRequest: (ctx) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : "";
      if (token) {
        ctx.headers.set("Authorization", `Bearer ${token}`);
      }
      return ctx;
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken && typeof window !== 'undefined') {
        localStorage.setItem("bearer_token", authToken);
      }
    },
    onError: (ctx) => {
      // Clear invalid tokens
      if (ctx.response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem("bearer_token");
      }
    }
  }
});

type SessionData = ReturnType<typeof authClient.useSession>

export function useSession(): SessionData {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);

  const refetch = async () => {
    setIsPending(true);
    setError(null);
    await fetchSession();
  };

  const fetchSession = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : "";
      const res = await authClient.getSession({
        fetchOptions: {
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : undefined,
        },
      });
      setSession(res.data);
      setError(null);
    } catch (err) {
      setSession(null);
      setError(err);
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem("bearer_token");
      }
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    fetchSession();
    
    // Listen for storage events (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bearer_token") {
        fetchSession();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  return { data: session, isPending, error, refetch };
}