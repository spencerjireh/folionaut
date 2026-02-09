---
title: Introduction
description: Overview of the Folionaut project
---

# Introduction

Folionaut is a TypeScript/Express API designed to power personal portfolio websites. It provides:

- **Content Management System (CMS)** for portfolio content with versioning
- **AI-powered chat** for visitor engagement with privacy protection
- **MCP server** for AI tooling integration (Claude Desktop, etc.)

## Why This Project?

This project demonstrates proficiency in modern backend patterns while being production-ready:

| Goal | Implementation |
|------|----------------|
| Showcase Backend Skills | Clean architecture, proper patterns |
| Production-Ready | Observability, security, resilience |
| Maintainable | TypeScript, clear separation of concerns |
| Extensible | Easy to add features without refactoring |

## Key Features

### Content Management

- Store projects, experience, education, skills, about, and contact info
- Content versioning with history tracking
- Soft deletes with restore capability
- Content bundles for efficient frontend loading

### AI Chat

- LLM-powered responses about portfolio content
- Token bucket rate limiting per IP
- Circuit breaker for LLM provider failures
- PII detection and sanitization in LLM responses

### MCP Integration

- Query portfolio via Model Context Protocol
- Tools for listing, searching, and managing content
- Resources for reading portfolio data
- Works with Claude Desktop and other MCP clients

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js / Bun |
| Framework | Express.js |
| Language | TypeScript |
| Database | Turso (libSQL) |
| ORM | Drizzle |
| Cache | Redis (optional, memory fallback) |
| Validation | Zod |
| Metrics | Prometheus |
| Tracing | OpenTelemetry |

## Next Steps

- [Quick Start](/guide/quick-start) - Get the project running locally
- [Configuration](/guide/configuration) - Environment variables and settings
- [Architecture](/architecture/) - Understand the system design
