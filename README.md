#  Dentrite: Real-Time Collaborative Whiteboard

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Dentrite** is a high-performance, real-time collaborative workspace. It allows remote teams to brainstorm, design, and plan together on an infinite canvas with zero-latency synchronization. 

## ✨ Key Features

* **Zero-Latency Sync:** Powered by WebSockets, every brush stroke appears on your teammates' screens the exact millisecond you draw it.
* **Multiplayer Cursors:** See exactly where your collaborators are pointing with real-time, name-tagged remote cursors.
* **Secure Authentication:** Enterprise-grade user login and session management handled via Clerk.
* **Advanced Canvas Engine:** Built on Fabric.js to treat every stroke as a manipulatable object, allowing for robust Undo/Redo functionality.
* **Export Options:** Instantly export your team's whiteboard sessions as high-quality PNGs or PDFs.
* **Premium UI/UX:** A sleek, glassmorphic interface built entirely with Tailwind CSS.

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* Tailwind CSS (Styling)
* Fabric.js (Canvas Engine)
* Clerk (Authentication)

**Backend:**
* Node.js & Express
* Socket.io (WebSocket Communication)
* TypeScript

**Deployment:**
* Vercel (Frontend Hosting)
* Render (Backend WebSocket Server)

## 💻 Running Locally

Want to run Dentrite on your own machine? Follow these steps:

### 1. Clone the repository
```bash
git clone [https://github.com/shubhanshu2103/collaborative-whiteboard.git](https://github.com/shubhanshu2103/collaborative-whiteboard.git)
cd collaborative-whiteboard

```

### 2. Set up the Backend (WebSockets)

```bash
cd backend
npm install
npm start

```

*The WebSocket server will start running on `http://localhost:4000`.*

### 3. Set up the Frontend (React)

Open a new terminal window and navigate to the frontend directory:

```bash
cd whiteboard
npm install

```

Create a `.env` file in the `whiteboard` directory and add your Clerk Publishable Key:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
VITE_BACKEND_URL=http://localhost:4000

```

Start the React development server:

```bash
npm run dev

```

