# Webhook Gateway

![Status: Production-ready](https://img.shields.io/badge/status-production--ready-brightgreen)
![Language: TypeScript](https://img.shields.io/badge/language-Typescript-blue)
![Runtime: Bun](https://img.shields.io/badge/runtime-Bun-00A4EF)

Secure, production-oriented webhook ingestion gateway built with Bun, Elysia and Prisma. Designed to receive, validate, persist, and asynchronously process webhooks from third-party providers while providing strict idempotency, concise acknowledgements, and robust failure handling.

---

## Table of Contents

- [Why this project](#why-this-project)
- [Highlights](#highlights)
- [Architecture](#architecture)
- [Event model & guarantees](#event-model--guarantees)
- [Security](#security)
- [Local Development](#local-development)
- [Running the server](#running-the-server)
- [Testing](#testing)
- [Files of interest](#files-of-interest)

---

## Why this project

This repository implements a focused webhook gateway: a simple, auditable boundary that accepts incoming webhook deliveries, verifies authenticity, stores the raw event, and hands off processing asynchronously. **Note:** Provider integration requires explicit secret configuration (currently only `test` provider is configured by default).

## Highlights

- Raw-body preservation: signature verification is always performed against the exact raw request bytes.
- HMAC-SHA256 signature validation with timing-safe comparison.
- Persistent, idempotent ingestion using Prisma and SQLite for local development.
- Short HTTP acknowledgements; event processing occurs asynchronously.
- Explicit event lifecycle: `pending`, `processed`, `failed`.
- Structured logging and deterministic failure diagnostics for reprocessing.
- **Payload format requirement:** Expects webhook JSON with `id` (string) and `type` (string) fields.

## Architecture

Layered architecture separates responsibilities clearly:

- HTTP / Controllers: request <-> response only (see `src/webhooks/webhook.controller.ts`).
- Services: business rules, validation orchestration, and persistence (see `src/webhooks/webhook.service.ts` and `src/events/event.service.ts`).
- Domain: typed event models, statuses and invariants.
- Infrastructure: database, crypto utilities, background processors (see `src/infra/prisma.ts` and `src/infra/event-processor.ts`).
- Utilities: structured logging and helpers (`src/utils/logger.ts`).

Design rules:

- Controllers do not contain business logic.
- Services do not depend on HTTP objects.
- Idempotency enforced at the persistence layer via unique constraints.

## Event model & guarantees

Every ingested event includes:

- Provider identifier
- Provider event identifier (extracted from `payload.id`)
- Event type (extracted from `payload.type`)
- Raw payload (never mutated)
- Processing status: `pending` | `processed` | `failed`
- Attempts counter and last error message (if failed)

**Payload requirements:** Webhook payloads must be valid JSON containing `id` (string) and `type` (string) fields at the root level.

Guarantees:

- Provider + eventId is unique — duplicates are detected and ignored.
- Signature validated prior to parsing or persistence.
- Processing is asynchronous: HTTP responses are fast and not blocked by business work.

## Security

- Signature algorithm: HMAC-SHA256. Keys are provided via environment variables.
- Timing-safe comparison used to defend against signature-leakage attacks.
- Structured logs deliberately avoid logging secrets or raw signatures.
- **Note:** Exception stack traces and error messages may contain sensitive payload data; review error handling and log aggregation policies in production.
- **Provider configuration:** Add new providers by extending `getWebhookSecret()` in `src/webhooks/validators/signature.validator.ts` and providing corresponding `{PROVIDER}_WEBHOOK_SECRET` environment variables.

See: `src/webhooks/validators/signature.validator.ts` for implementation details.

## Local Development

Prerequisites:

- Bun (includes `bunx` for running CLIs)

Install dependencies:

```bash
bun install
```

Prepare environment variables (create a `.env` from `.env.example` and fill real values before running):

```bash

DATABASE_URL="file:./dev.db"
TEST_WEBHOOK_SECRET="change-me"
TEST_SILENCE_LOGS="false"
```

Apply Prisma migrations (development):

```bash
bunx prisma migrate dev --name init
```

## Running the server

Start the application:

```bash
bun run dev
```

Entry point: `src/server.ts`.

## Testing

Unit and integration tests live under `tests/`. Example run command:

```bash
bun test
```

Key tests:

- `tests/events/event.processor.test.ts`
- `tests/webhooks/webhook.service.test.ts`

## Files of interest

- `src/server.ts` — application entrypoint
- `src/webhooks/webhook.controller.ts` — HTTP controller
- `src/webhooks/validators/signature.validator.ts` — HMAC validation
- `src/events/event.service.ts` — event orchestration
- `src/infra/prisma.ts` — Prisma client
- `prisma/schema.prisma` — database schema


This project was created using `bun init` in bun v1.3.8. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.