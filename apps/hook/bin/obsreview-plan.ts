#!/usr/bin/env bun
/**
 * Obsidian Note Reviewer - Plan Mode CLI Entry Point
 *
 * CLI command: obsreview-plan
 * Purpose: Entry point for Plan Mode hook integration
 *
 * This script:
 * - Imports handlePlanModeHook from ../server/planModeHook.ts
 * - Executes the hook handler with stdin input
 * - Handles graceful shutdown on SIGTERM (cleanup, close server)
 * - Logs startup to stderr for debugging
 */

// Import the hook handler
// Note: This imports the main module which reads from stdin and runs the server
import "../server/planModeHook.js";

// Log startup for debugging
console.error("[PlanModeHook] Starting obsreview-plan command...");

// Handle graceful shutdown on SIGTERM
process.on("SIGTERM", () => {
  console.error("[PlanModeHook] Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", () => {
  console.error("[PlanModeHook] Received SIGINT, shutting down gracefully...");
  process.exit(0);
});
