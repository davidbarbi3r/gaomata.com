/** Contrat de publication partagé entre l'API (worker/) et l'admin. */

export interface PublishResult {
  triggered: boolean;
  message: string;
}

export interface PublishStatus {
  /** Dernière reconstruction demandée (ISO), vide si jamais. */
  lastPublishAt: string;
  lastPublishBy: string;
}

/** Durée typique d'un build Workers Builds, pour l'indicateur de l'admin. */
export const BUILD_DURATION_MS = 3 * 60 * 1000;
