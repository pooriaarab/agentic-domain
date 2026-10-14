#!/usr/bin/env node
import {
  startMcp
} from "./chunk-PFQLA246.js";
import "./chunk-4QE7E5UQ.js";
import "./chunk-5ZAOQRRZ.js";

// src/mcp-bin.ts
startMcp().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
