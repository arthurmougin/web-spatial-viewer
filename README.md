# Web Spatial Viewer

A 3D web viewer that allows you to display and interact with web pages in a three-dimensional space. An experimental project aimed at emulating spatial web browsing features, inspired by Apple Vision Pro's immersive browser and [webspatial.dev](https://webspatial.dev/) technology.

While the current version demonstrates basic 3D web page placement, our goal is to explore and implement advanced spatial browsing features, creating an accessible platform for experiencing the future of web navigation.

## 🌟 Features

- **3D Visualization**: Display web pages in an interactive 3D environment
- **Smooth Navigation**: Intuitive camera controls with interaction management
- **Smart Proxy**: Secure loading of external web pages
- **Clean UI**: Simple and efficient search bar
- **Injectable Library**: Seamless communication between viewer and loaded pages

## � Démarrage

1. Cloner le dépôt :

   ```bash
   git clone [url-du-repo]
   cd web-spatial-viewer
   ```

2. Installer les dépendances :

   ```bash
   npm install
   ```

3. Lancer le serveur de développement :

   ```bash
   npm run dev
   ```

4. Ouvrir [http://localhost:5173](http://localhost:5173)

## �🛠️ Technologies

- **React** + **TypeScript** + **Vite** : Stack moderne et performante
- **React Three Fiber** : Intégration React de Three.js
- **@react-three/drei** : Composants utilitaires pour R3F
- **Express** : Serveur proxy pour le chargement des pages

## 🎮 Controls

- **Camera Rotation**: Left click + drag
- **Zoom**: Mouse wheel
- **Pan**: Right click + drag

## 📐 Project Structure

### Main Components

- `App.tsx`: Entry point and state management
- `components/Scene3D.tsx`: Main 3D scene
- `components/WebFrame.tsx`: Web display component
- `components/SearchBar.tsx`: Search interface
- `components/SkyBox.tsx`: 3D environment

### Server Configuration

- `server.ts`: Express proxy setup and library injection

## 🔒 Security

- Proxy to avoid CORS issues
- Incoming URL validation
- Domain allowlist
- Secure library injection

## 🚀 Démarrage

1. **Installation**

   ```bash
   npm install
   ```

2. **Lancement du développement**

   ```bash
   # Terminal 1 : Application principale
   npm run dev

   # Terminal 2 : Serveur proxy
   npm run server
   ```

3. **Ouvrir** [http://localhost:5173](http://localhost:5173)

## 🏗️ Architecture

### Frontend (src/)

- `App.tsx` : Point d'entrée et gestion des états
- `components/`
  - `Scene3D.tsx` : Configuration de la scène 3D
  - `WebFrame.tsx` : Affichage des pages web dans l'espace 3D
  - `SearchBar.tsx` : Interface de recherche
  - `SkyBox.tsx` : Environnement 3D

### Backend (server/)

- `server.ts` : Serveur proxy Express
- Configuration des sous-domaines et injection de la librairie

## 🔄 Iframe-Viewer Communication

Communication between loaded web pages and the viewer uses postMessage:

```typescript
// In the viewer
sendToFrame("INIT", { hello: "viewer" });

// In the loaded page (via injected library)
window.parent.postMessage({ type: "INIT_RESPONSE" }, "*");
```

## 🎯 Project Vision

This project aims to create an emulator for spatial web browsing, inspired by the immersive features of Apple Vision Pro and the capabilities provided by the WebSpatial SDK. While the current version simply places a basic website in 3D space, our roadmap includes:

- Immersive website layouts
- Spatial UI components
- Gesture-based interactions
- Multi-window management
- 3D content integration
- Spatial audio support

## 🤝 Contributing

Web Spatial Viewer is a side project open to contributions! Whether you're fixing bugs, improving documentation, or adding new features, your help is welcome.

### Ways to Contribute

- Report issues
- Suggest new features
- Submit pull requests
- Improve documentation
- Share ideas and feedback

This is an experimental project meant to explore and demonstrate the possibilities of spatial web browsing. Join us in shaping the future of web navigation!

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
