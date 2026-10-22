/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Test: Branding & Dynamic App Settings Service Unit Test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { brandingService, BERSEKA_DEFAULT_BRANDING } from "./brandingService.js";
import { prisma } from "../lib/prisma.js";
import { redisService } from "./redisService.js";

vi.mock("../lib/prisma.js", () => {
  return {
    prisma: {
      systemConfig: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      auditTrail: {
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("./redisService.js", () => {
  return {
    redisService: {
      getConfigCache: vi.fn(),
      setConfigCache: vi.fn(),
      invalidateConfigCache: vi.fn(),
    },
  };
});

describe("BrandingService - Dynamic App Settings & Rollback Stack", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default branding when cache and DB are empty", async () => {
    vi.mocked(redisService.getConfigCache).mockResolvedValue(null);
    vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);

    const result = await brandingService.getBranding();

    expect(result.config.appName).toBe(BERSEKA_DEFAULT_BRANDING.appName);
    expect(result.config.appTagline).toBe(BERSEKA_DEFAULT_BRANDING.appTagline);
    expect(result.historyCount).toBe(0);
    expect(result.hasPrevious).toBe(false);
  });

  it("should return cached branding from Redis when available", async () => {
    const mockCustomConfig = {
      ...BERSEKA_DEFAULT_BRANDING,
      appName: "BERSEKA CUSTOM",
      appTagline: "Tagline Kustom",
    };

    vi.mocked(redisService.getConfigCache).mockResolvedValue(JSON.stringify(mockCustomConfig));
    vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue(null);

    const result = await brandingService.getBranding();

    expect(result.config.appName).toBe("BERSEKA CUSTOM");
    expect(result.config.appTagline).toBe("Tagline Kustom");
  });

  it("should update branding, push old state to history, invalidate Redis, and log audit trail", async () => {
    // Current state
    vi.mocked(redisService.getConfigCache).mockResolvedValue(null);
    vi.mocked(prisma.systemConfig.findUnique).mockImplementation(async ({ where }: any) => {
      if (where.key === "app_branding_config") {
        return {
          key: "app_branding_config",
          value: JSON.stringify(BERSEKA_DEFAULT_BRANDING),
        } as any;
      }
      if (where.key === "app_branding_history") {
        return { key: "app_branding_history", value: "[]" } as any;
      }
      return null;
    });

    const updated = await brandingService.updateBranding(
      {
        appName: "BERSEKA V2",
        appTagline: "Slogan Baru",
      },
      "Test Developer",
      "dev-user-uuid-1",
      "127.0.0.1"
    );

    expect(updated.appName).toBe("BERSEKA V2");
    expect(updated.appTagline).toBe("Slogan Baru");
    expect(prisma.systemConfig.upsert).toHaveBeenCalled();
    expect(redisService.invalidateConfigCache).toHaveBeenCalledWith("app_branding_config");
    expect(prisma.auditTrail.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "UPDATE_APP_BRANDING",
          roleName: "DEVELOPER",
        }),
      })
    );
  });

  it("should restore previous configuration snapshot when requested", async () => {
    const previousSnapshot = {
      ...BERSEKA_DEFAULT_BRANDING,
      appName: "SNAPSHOT LAMA",
      appTagline: "Slogan Snapshot",
    };

    vi.mocked(prisma.systemConfig.findUnique).mockImplementation(async ({ where }: any) => {
      if (where.key === "app_branding_history") {
        return {
          key: "app_branding_history",
          value: JSON.stringify([previousSnapshot]),
        } as any;
      }
      if (where.key === "app_branding_config") {
        return {
          key: "app_branding_config",
          value: JSON.stringify({ ...BERSEKA_DEFAULT_BRANDING, appName: "VERSI SAAT INI" }),
        } as any;
      }
      return null;
    });

    const restored = await brandingService.restorePrevious(
      "Test Developer",
      "dev-user-uuid-1",
      "127.0.0.1"
    );

    expect(restored.appName).toBe("SNAPSHOT LAMA");
    expect(restored.appTagline).toBe("Slogan Snapshot");
    expect(prisma.systemConfig.update).toHaveBeenCalled();
  });

  it("should reset branding to factory defaults", async () => {
    vi.mocked(redisService.getConfigCache).mockResolvedValue(null);
    vi.mocked(prisma.systemConfig.findUnique).mockResolvedValue({
      key: "app_branding_config",
      value: JSON.stringify({ ...BERSEKA_DEFAULT_BRANDING, appName: "VERSI NON-DEFAULT" }),
    } as any);

    const resetResult = await brandingService.resetFactory(
      "Test Developer",
      "dev-user-uuid-1",
      "127.0.0.1"
    );

    expect(resetResult.appName).toBe(BERSEKA_DEFAULT_BRANDING.appName);
    expect(resetResult.developerName).toBe(BERSEKA_DEFAULT_BRANDING.developerName);
    expect(prisma.systemConfig.upsert).toHaveBeenCalled();
    expect(prisma.auditTrail.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "RESET_FACTORY_APP_BRANDING",
        }),
      })
    );
  });
});
