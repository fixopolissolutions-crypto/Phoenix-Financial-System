import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context sin autenticación (public procedures)
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.loginLocal", () => {
  it("returns success false for invalid credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.loginLocal({
      username: "invalid",
      password: "wrong",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Credenciales inválidas");
  });

  it("returns success true for valid admin credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.loginLocal({
      username: "admin",
      password: "1234",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user?.username).toBe("admin");
      expect(result.user?.tienda).toBe("admin");
    }
  });

  it("returns success true for valid sucursal credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.loginLocal({
      username: "sucursal",
      password: "1234",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user?.username).toBe("sucursal");
      expect(result.user?.tienda).toBe("sucursal");
    }
  });
});

describe("transactions", () => {
  let createdTransactionId: number | null = null;

  it("can list transactions", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("can create an income transaction", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.create({
      tipo: "ingreso",
      monto: "100.50",
      metodo: "efectivo",
      descripcion: "Test income",
      tienda: "admin",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.tipo).toBe("ingreso");
    expect(result.monto).toBe("100.50");
    
    createdTransactionId = result.id;
  });

  it("can update a transaction", async () => {
    if (!createdTransactionId) {
      throw new Error("No transaction created to update");
    }

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.update({
      id: createdTransactionId,
      monto: "150.75",
      descripcion: "Updated test income",
    });

    expect(result).toBeDefined();
    expect(result?.monto).toBe("150.75");
  });

  it("can delete a transaction", async () => {
    if (!createdTransactionId) {
      throw new Error("No transaction created to delete");
    }

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.transactions.delete({
      id: createdTransactionId,
    });

    expect(result.success).toBe(true);
  });
});

describe("providers", () => {
  let createdProviderId: number | null = null;

  it("can list providers", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.providers.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("can create a provider", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.providers.create({
      nombre: "Test Provider",
      telefono: "123456789",
      email: "test@provider.com",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.nombre).toBe("Test Provider");
    
    createdProviderId = result.id;
  });

  it("can delete a provider", async () => {
    if (!createdProviderId) {
      throw new Error("No provider created to delete");
    }

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.providers.delete({
      id: createdProviderId,
    });

    expect(result.success).toBe(true);
  });
});

describe("config", () => {
  it("can set and get config values", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Set a config value
    await caller.config.set({
      key: "testKey",
      value: "testValue",
    });

    // Get the config value
    const result = await caller.config.get({
      key: "testKey",
    });

    expect(result).toBe("testValue");
  });

  it("can get all config values", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.config.getAll();

    expect(typeof result).toBe("object");
  });
});
