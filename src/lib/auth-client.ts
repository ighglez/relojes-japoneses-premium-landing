"use client"
import { createAuthClient } from "better-auth/react"
import { useEffect, useState } from "react"

export const authClient = createAuthClient({
   baseURL: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
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
          if(authToken){
            // Store the complete token without splitting
            localStorage.setItem("bearer_token", authToken);
          }
      },
      onError: (ctx) => {
          // Clear invalid tokens
          if (ctx.response.status === 401) {
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
   }, []);

   return { data: session, isPending, error, refetch };
}