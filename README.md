# Web Spatial Viewer

A 3D web viewer that allows you to display and interact with web pages in a three-dimensional space. An experimental project aimed at emulating spatial web browsing features, inspired by Apple Vision Pro's immersive browser and [webspatial.dev](https://webspatial.dev/) technology.

While the current version demonstrates basic 3D web page placement, our goal is to explore and implement advanced spatial browsing features, creating an accessible platform for experiencing the future of web navigation.

## 🌟 Features

- **3D Visualization**: Display web pages in an interactive 3D environment
- **Smooth Navigation**: Intuitive camera controls with interaction management
- **Smart Proxy**: Secure loading of external web pages
- **Clean UI**: Simple and efficient search bar
- **Injectable Library**: Seamless communication between viewer and loaded pages

## 🛠️ Technologies

- **React** + **TypeScript** + **Vite**: Modern and performant stack
- **React Three Fiber**: React integration for Three.js
- **@react-three/drei**: Utility components for R3F
- **Express**: Proxy server for page loading and library injection

## Controls

- **Camera Rotation**: Left click + drag
- **Zoom**: Mouse wheel
- **Pan**: Right click + drag

## 📐 Architecture

### Frontend (src/)

- `App.tsx`: Entry point and state management
- `components/`
  - `Scene3D.tsx`: 3D scene configuration
  - `WebFrame.tsx`: Web pages display in 3D space
  - `SearchBar.tsx`: Search interface
  - `SkyBox.tsx`: 3D environment
  - `lib/`: Injectable library for iframe communication

### Backend (server/)

- `server.ts`: Express proxy server
- Subdomain configuration and library injection

## Development Setup

The project requires three processes running simultaneously:

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Environment**

   You'll need to run these commands in separate terminals:

   ```bash
   # Terminal 1: Main application (Vite dev server)
   npm run dev

   # Terminal 2: Proxy server (Express)
   npm run server:watch

   # Terminal 3: Library build (watch mode)
   npm run lib:watch
   ```

3. **Access the Application**

   Open [https://localhost:5173](https://localhost:5173) in your browser

### Port Configuration

- Main app: 5173 (configurable in `vite.config.ts`)
- Proxy server: 3000 (configurable in `server/.env`)

### Hot Reloading

- Main app: Full HMR support
- Proxy server: tsx watch mode
- Library: Auto rebuild on changes

## Iframe-Viewer Communication

Communication between loaded web pages and the viewer uses postMessage:

```typescript
// In the viewer
sendToFrame("INIT", { hello: "viewer" });

// In the loaded page (via injected library)
window.parent.postMessage({ type: "INIT_RESPONSE" }, "*");
```

## 🤝 Contributing

Web Spatial Viewer is a side project open to contributions! Whether you're fixing bugs, improving documentation, or adding new features, your help is welcome.

### Ways to Contribute

- Report issues
- Suggest new features
- Submit pull requests
- Improve documentation
- Share ideas and feedback

This is an experimental project meant to explore and demonstrate the possibilities of spatial web browsing. Join us in shaping the future of web navigation!
