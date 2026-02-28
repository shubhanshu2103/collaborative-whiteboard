# System Architecture

This diagram outlines the high-level architecture of the collaborative whiteboard application, detailing the interaction between the React client, Clerk authentication, the Express/Node.js backend, and the Socket.io server.

```mermaid
flowchart TD
    Client[React Frontend] -->|1. Authenticate| Clerk[Clerk Auth Service]
    Clerk -->|2. Return Token/Session| Client
    
    Client <-->|3. Real-time Events| Socket[Socket.io Server]
    Client -->|4. HTTP Requests| API[Node.js / Express API]
    
    Socket -->|5. Read/Write State| DB[(Database)]
    API -->|6. CRUD Operations| DB
