#!/usr/bin/env node
import { startMcp } from "./mcp.js";
startMcp().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
