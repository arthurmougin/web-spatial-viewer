# Guide de test — web-spatial-viewer

## Vue d'ensemble

Le projet utilise **Vitest** comme framework de test avec **happy-dom** comme environnement DOM léger. Les tests couvrent la logique métier pure (utils, store, classes) mais **excluent les composants R3F/uikit** car ils nécessitent un contexte WebGL/GPU réel.

---

## Commandes disponibles

```bash
# Lancer les tests en mode watch (relance automatique sur modification)
npm test

# Lancer l'interface graphique des tests (navigateur)
npm run test:ui

# Générer un rapport de couverture
npm run test:coverage
```

---

## Structure des tests

```
src/
  __tests__/
    utils/
      proxy.utils.test.ts       # 19 tests — proxyFyUrl/UnProxyFyUrl
      pwa.utils.test.ts          # 15 tests — FetchManifest/checkWebManifest/isUrlInScope/getLoadingIcon
    store/
      pages.store.test.ts        # 10 tests — recordNavigation/removePage
```

**Total : 44 tests répartis sur 3 fichiers**

---

## Périmètre de couverture

### ✅ Inclus (testable via happy-dom)

- **`src/utils/**`\*\* — Transformation d'URLs, parsing de manifestes PWA
- **`src/store/**`\*\* — Gestion de l'historique de navigation (Zustand)
- **`src/classes/**`\*\* — PageListener/ProgressListener (avec mocks pour I/O)

### ❌ Exclus (nécessite GPU/WebGL)

- **`src/components/**`\*\* — Composants R3F/uikit (NavBar3D, WebFrame, Scene3D)
- **`src/lib/**`\*\* — Bridge script (injecté dans l'iframe, pas de logique DOM testable)

**Raison de l'exclusion :** Les composants React Three Fiber et @react-three/uikit nécessitent un contexte Canvas WebGL avec GPU. happy-dom/jsdom fournissent les APIs DOM (window, URL, fetch) mais **pas WebGL**. Pour tester ces composants, il faudrait utiliser Playwright ou Cypress avec un vrai navigateur.

---

## Stratégies de mocking

### 1. Mocking de `fetch` (pwa.utils.test.ts)

```typescript
vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        /* mock manifest */
      }),
  }),
);
```

### 2. Mocking de `window.location` (proxy.utils.test.ts)

```typescript
vi.stubGlobal("location", {
  protocol: "https:",
  hostname: "lofi.cafe",
});
```

### 3. Mocking de classes avec effets de bord (pages.store.test.ts)

```typescript
vi.mock("../../classes/page-listener", () => ({
  PageListener: vi.fn().mockImplementation(() => ({
    dispose: vi.fn(),
    postMessage: vi.fn(),
  })),
}));
```

**Principe :** Isoler la logique métier des dépendances externes (réseau, DOM, SSE) pour tester uniquement la transformation de données et la gestion d'état.

---

## Résultats actuels

```
Test Files  3 passed (3)
     Tests  44 passed (44)
  Duration  ~12s
```

Tous les tests passent. Les messages stderr visibles dans la sortie console (ex : "Attention : Il manque des icônes requises") sont normaux — ce sont les `console.warn()` des fonctions testées, capturés par Vitest.

---

## Limitations connues

### proxy.utils.test.ts — Domaines de base avec tirets

```typescript
// LIMITATION CONNUE : les domaines contenant des tirets ne peuvent pas faire un roundtrip correct
proxyFyUrl("https://my-app.com") → "my-app-com.localhost:47891"
UnProxyFyUrl("my-app-com.localhost:47891") → "https://my.app.com" // ❌ incorrect
```

**Cause :** Le pattern de proxy utilise les tirets à la fois comme :

- Séparateur de sous-domaines (`www--google-com`)
- Remplacement des points dans les noms de domaine (`google-com`)

Les domaines de base contenant des tirets sont ambigus lors du décodage. Cette limitation est documentée dans les tests.

---

## Ajout de nouveaux tests

### Pour tester un nouveau fichier `src/utils/exemple.ts` :

1. **Créer** `src/__tests__/utils/exemple.test.ts`
2. **Importer** les fonctions à tester :
   ```typescript
   import { maFonction } from "../../utils/exemple";
   ```
3. **Structurer** avec `describe` et `it` :
   ```typescript
   describe("maFonction", () => {
     it("retourne le résultat attendu", () => {
       expect(maFonction("entrée")).toBe("sortie");
     });
   });
   ```
4. **Mocker** les dépendances externes si nécessaire (voir exemples ci-dessus)
5. **Lancer** `npm test` — Vitest détectera automatiquement le nouveau fichier

### Pour tester un store Zustand :

```typescript
import { useMonStore } from "../../store/mon-store";

// Initialiser l'état manuellement (bypass constructeurs)
useMonStore.setState({
  items: [{ id: 1, name: "test" }],
});

// Appeler les actions du store
useMonStore.getState().ajouterItem({ id: 2, name: "test2" });

// Vérifier l'état résultant
expect(useMonStore.getState().items).toHaveLength(2);
```

---

## Tests d'intégration (futur)

Pour tester les composants R3F/uikit et les interactions utilisateur :

- **Option 1 :** Playwright (contrôle un vrai navigateur Chrome/Firefox)
- **Option 2 :** Cypress (tests E2E avec DOM réel)
- **Option 3 :** Storybook + Chromatic (tests visuels de composants)

Ces outils nécessitent une infrastructure supplémentaire (serveur de développement, navigateurs headless).

---

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [happy-dom Features](https://github.com/capricorn86/happy-dom)
- [Mocking with Vitest](https://vitest.dev/guide/mocking.html)
