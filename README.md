# Sangam: Real-Time Collaborative Whiteboard

Sangam is an upcoming high-performance, real-time collaborative workspace designed to allow remote teams to brainstorm, design, and plan together on an infinite canvas with zero-latency synchronization.

---

##  Problem Statement
**The Problem:** Remote teams, developers, and students often struggle to brainstorm visually in real-time without downloading heavy, expensive, or overly complex design software. Standard video calls lack tactile, visual collaboration. 
**The Impact:** This friction leads to miscommunication in technical planning, slower peer-to-peer tutoring, and a disconnect in remote team alignment. 

##  Target User Personas
1. **The Remote Developer / Tech Student:** Needs a frictionless way to sketch out an architecture diagram or algorithmic flow with a peer without a steep learning curve or paid sign-ups.
2. **The Online Educator / Tutor:** Needs a lightweight, zero-latency digital blackboard to explain concepts to students dynamically.

##  Proposed Solution Approach
Sangam will solve this by offering a web-based, zero-latency collaborative whiteboard. By leveraging WebSockets (Socket.io) for instant state synchronization and Clerk for frictionless authentication, users will be able to instantly create a secure room and start mapping out ideas visually with their peers in milliseconds.

---

##  Planned Features & Roadmap
We are currently architecting and building Sangam with the following core capabilities:
* **Zero-Latency Sync:** WebSockets will ensure every brush stroke appears on teammates' screens the exact millisecond it is drawn.
* **Multiplayer Cursors:** Real-time, name-tagged remote cursors to see exactly where collaborators are pointing.
* **Advanced Canvas Engine:** Utilizing Fabric.js to treat every stroke as a manipulatable object, allowing for robust Undo/Redo functionality.
* **Friends List Integration:** Add and manage friends directly within the whiteboard dashboard for quick collaboration invites.
* **Advanced Shapes & Flowcharts:** Implementation of pre-defined shapes to easily construct complex flowcharts and ER diagrams.
* **Public vs. Private Boards:** * *Public Boards:* Visible on the user's dashboard and accessible to friends.
  * *Private Boards:* Encrypted and visible only to the creator.
* **Future Scope (AI Integration):** Integrating AI to auto-organize messy diagrams, suggest flowchart connections, and generate boilerplate code from UI sketches.

---

##  Proposed Tech Stack
**Frontend:**
* React.js (Vite)
* Tailwind CSS (Styling)
* Fabric.js (Canvas Engine)
* Clerk (Authentication)

**Backend:**
* Node.js & Express
* Socket.io (WebSocket Communication)
* TypeScript

**Deployment Strategy:**
* Vercel (Frontend Hosting)
* Render (Backend WebSocket Server)

---

##  Architecture & Design (Drafts)
We have mapped out the initial system design. Check out our technical documentation drafts:
* [System Architecture Overview](./system-architecture.md)
* [Real-Time Socket.io Flow](./real-time-flow.md)
* [Database Schema & ER Diagram](./database-design.md)

---

##  Initial Proof of Concept (Local Setup)

We are currently developing our initial Proof of Concept (PoC). To run the early prototype locally:

**1. Clone the repository**
 ⁠bash
git clone [https://github.com/shubhanshu2103/collaborative-whiteboard.git](https://github.com/shubhanshu2103/collaborative-whiteboard.git)
cd collaborative-whiteboard



⁠ **2. Set up the Backend (WebSockets)**

 ⁠bash
cd backend
npm install
npm start



⁠ *The local WebSocket server will run on http://localhost:4000.*

**3. Set up the Frontend (React)**
Open a new terminal window and navigate to the frontend directory:

 ⁠bash
cd whiteboard
npm install



Create a `.env` file in the `whiteboard` directory and add your Clerk Publishable Key:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
VITE_BACKEND_URL=http://localhost:4000

```
⁠

Start the React development server:

```bash
npm run dev

```
