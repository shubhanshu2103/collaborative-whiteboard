# Database Design (Entity-Relationship)

This ER diagram maps out the data structure. Note that user authentication and sensitive credentials are offloaded to Clerk; our local database only stores a reference to the Clerk User ID.

```mermaid
erDiagram
    USER ||--o{ WHITEBOARD : "owns"
    USER ||--o{ COLLABORATOR : "joins as"
    WHITEBOARD ||--o{ COLLABORATOR : "has"
    WHITEBOARD ||--o{ DRAWING_ELEMENT : "contains"

    USER {
        string id PK "Clerk User ID"
        string email
        string name
    }
    
    WHITEBOARD {
        string id PK
        string title
        datetime created_at
        string owner_id FK
    }
    
    COLLABORATOR {
        string user_id FK
        string whiteboard_id FK
        string role "e.g., 'editor', 'viewer'"
    }
    
    DRAWING_ELEMENT {
        string id PK
        string whiteboard_id FK
        string type "e.g., 'pencil', 'rect', 'text'"
        json properties "coordinates, color, stroke_width"
    }
