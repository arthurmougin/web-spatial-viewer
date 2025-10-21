import type { WebManifest } from "../types/spatial";
import { logger } from "./logger";

interface ValidationError {
  field: string;
  message: string;
}

export function validateManifest(manifest: WebManifest): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validation des champs obligatoires
  if (!manifest.name) {
    errors.push({ field: "name", message: "Le nom est requis" });
  }

  if (!manifest.start_url) {
    errors.push({
      field: "start_url",
      message: "L'URL de démarrage est requise",
    });
  }

  // Validation de xr_main_scene
  if (!manifest.xr_main_scene) {
    errors.push({
      field: "xr_main_scene",
      message: "La scène XR principale est requise",
    });
  } else {
    const { default_size } = manifest.xr_main_scene;
    if (!default_size || !default_size.width || !default_size.height) {
      errors.push({
        field: "xr_main_scene.default_size",
        message: "Les dimensions par défaut de la scène sont requises",
      });
    }
  }

  // Validation des icônes
  if (!manifest.icons || manifest.icons.length === 0) {
    errors.push({ field: "icons", message: "Au moins une icône est requise" });
  } else {
    manifest.icons.forEach((icon, index) => {
      if (!icon.src) {
        errors.push({
          field: `icons[${index}].src`,
          message: "L'URL de l'icône est requise",
        });
      }
      if (!icon.sizes) {
        errors.push({
          field: `icons[${index}].sizes`,
          message: "Les dimensions de l'icône sont requises",
        });
      }
      if (!icon.type) {
        errors.push({
          field: `icons[${index}].type`,
          message: "Le type MIME de l'icône est requis",
        });
      }
    });
  }

  // Si des erreurs sont trouvées, les logger
  if (errors.length > 0) {
    logger.warn("Erreurs de validation du manifest:", { errors });
  }

  return errors;
}
