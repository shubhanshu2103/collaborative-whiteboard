# Real-Time Collaboration Flow

This sequence diagram illustrates the WebSocket event lifecycle when multiple users are interacting with the same whiteboard simultaneously. 

```mermaid
sequenceDiagram
    actor User A (React)
    participant Socket as Socket.io Server
    actor User B (React)
    participant DB as Database

    User A->>Socket: Emit 'join_room' (room_id)
    User B->>Socket: Emit 'join_room' (room_id)
    
    Note over User A, Socket: Drawing Action Begins
    User A->>Socket: Emit 'draw_event' (x, y, color)
    Socket->>User B: Broadcast 'draw_event' (x, y, color)
    User B-->>User B: Render new line on Canvas
    
    Note over Socket, DB: State Persistence
    Socket->>DB: Save canvas state (Debounced)
    DB-->>Socket: Confirm save
