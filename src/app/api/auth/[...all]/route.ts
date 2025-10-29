import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// CRÍTICO: Runtime debe ser Node.js (no Edge) para better-auth
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { POST, GET } = toNextJsHandler(auth);