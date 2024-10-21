import { Controller, Get } from "@overnightjs/core";
import type { Request, Response } from "express";

@Controller("health")
export class Health {
  @Get()
  public async healthCheck(req: Request, res: Response) {
    try {
      return res.status(200).json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }
}
