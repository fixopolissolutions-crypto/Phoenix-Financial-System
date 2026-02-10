import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Intentar autenticación OAuth primero
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Si falla OAuth, intentar sesión local
    const localSession = opts.req.cookies?.local_session;
    if (localSession) {
      try {
        const sessionData = JSON.parse(localSession);
        // Crear un objeto User compatible con la sesión local
        user = {
          id: 0, // ID temporal para sesiones locales
          openId: sessionData.username,
          name: sessionData.username,
          email: null,
          loginMethod: 'local',
          role: sessionData.role as 'admin' | 'user',
          tienda: sessionData.tienda as 'admin' | 'sucursal',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as any;
      } catch (e) {
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
