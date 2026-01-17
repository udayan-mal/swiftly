# Swiftly

Swiftly is a high-performance, real-time file transfer and sharing application designed to provide a premium, hassle-free experience similar to AirDrop, but cross-platform (Mobile <-> Desktop).

## Architecture

The project follows a monorepo structure:

- **apps**: User-facing applications.
  - `web`: React (Vite) application for desktop/web users.
  - `mobile`: React Native application for iOS/Android.
- **services**: Backend microservices.
  - `api`: General REST API for history and metadata.
  - `realtime`: WebSocket/WebRTC signaling server.
  - `relay`: Fallback relay server for NAT traversal.
  - `auth`: Authentication service.
- **packages**: Shared libraries.
  - `protocol`: Shared schemas and constants.
  - `ui`: Shared UI components (optional).
  - `utils`: Shared utility functions.
- **infra**: Infrastructure configuration.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn

### Installation

1. Install dependencies in the root (if using workspaces):
   ```bash
   npm install
   ```

2. Start the web app:
   ```bash
   cd apps/web
   npm run dev
   ```

3. Start the signaling server:
   ```bash
   cd services/realtime
   node index.js
   ```
