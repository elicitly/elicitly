#!/usr/bin/env node
import { createRequire } from "node:module"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { buildServer } from "./server.js"

const require = createRequire(import.meta.url)
const { version } = require("../package.json") as { version: string }

const { server, instrumentTransport } = buildServer(version)
const transport = new StdioServerTransport()
instrumentTransport(transport)
await server.connect(transport)
