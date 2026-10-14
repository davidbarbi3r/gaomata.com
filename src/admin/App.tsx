/** Application d'administration : navigation, chargement initial, état de publication. */
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { StoredValue } from '../cms/fields';
import { CONTENT_SCHEMA, type PageId } from '../cms/schema';
import { BUILD_DURATION_MS, type PublishStatus } from '../cms/publish';
import { api, ApiError } from './api';
import { PageEditor } from './PageEditor';
import {
  ConfirmProvider,
  formatDateTime,
  Spinner,
  ToastProvider,
  useConfirm,
  useToast,
} from './ui';
import { WorkshopEditor, WorkshopList } from './Workshops';

type Route =
  | { name: 'workshops' }
  | { name: 'workshop'; id: string | null }
  | { name: 'page'; pageId: PageId };

const PAGE_IDS = Object.keys(CONTENT_SCHEMA) as PageId[];

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/ateliers';
  const workshop = path.match(/^\/ateliers\/(.+)$/);
  if (workshop) {
    return {
      name: 'workshop',
      id: workshop[1] === 'nouveau' ? null : workshop[1],
    };
  }
  const page = path.match(/^\/pages\/(.+)$/);
  if (page && PAGE_IDS.includes(page[1] as PageId)) {
    return { name: 'page', pageId: page[1] as PageId };
  }
  return { name: 'workshops' };
}

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AdminShell />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function AdminShell() {
  const toast = useToast();
  const confirm = useConfirm();
  const [email, setEmail] = useState('');
  const [fatal, setFatal] = useState<ApiError | null>(null);
  const [overrides, setOverrides] = useState<Record<
    string,
    StoredValue
  > | null>(null);
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
  const [menuOpen, setMenuOpen] = useState(false);
  const dirty = useRef(false);
  const currentHash = useRef(location.hash);

  useEffect(() => {
    Promise.all([api.me(), api.content()])
      .then(([me, content]) => {
        setEmail(me.email);
        setOverrides(content.values);
      })
      .catch((error: ApiError) => setFatal(error));
  }, []);

  const askToLeave = useCallback(
    () =>
      dirty.current
        ? confirm({
            title: 'Quitter sans enregistrer ?',
            message:
              'Tes dernières modifications n’ont pas été enregistrées et seront perdues.',
            confirmLabel: 'Quitter sans enregistrer',
            cancelLabel: 'Rester sur la page',
            danger: true,
          })
        : Promise.resolve(true),
    [confirm],
  );

  /** Change à chaque navigation : l'éditeur affiché repart de zéro. */
  const [editorKey, setEditorKey] = useState(0);

  const navigate = useCallback(
    async (path: string, force = false) => {
      if (!force && !(await askToLeave())) return;
      dirty.current = false;
      currentHash.current = `#${path}`;
      history.pushState(null, '', `#${path}`);
      setRoute(parseRoute(`#${path}`));
      setEditorKey((key) => key + 1);
      setMenuOpen(false);
      window.scrollTo({ top: 0 });
    },
    [askToLeave],
  );

  /** Atelier tout juste créé : l'adresse change, mais l'éditeur reste en place. */
  const onWorkshopCreated = useCallback((id: string) => {
    currentHash.current = `#/ateliers/${id}`;
    history.replaceState(null, '', currentHash.current);
    setRoute({ name: 'workshop', id });
  }, []);

  useEffect(() => {
    const onPop = async () => {
      if (location.hash === currentHash.current) return;
      if (!(await askToLeave())) {
        history.pushState(null, '', currentHash.current);
        return;
      }
      dirty.current = false;
      currentHash.current = location.hash;
      setRoute(parseRoute(location.hash));
      setEditorKey((key) => key + 1);
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) event.preventDefault();
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [askToLeave]);

  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);

  const [status, setStatus] = useState<PublishStatus | null>(null);
  useEffect(() => {
    api
      .publishStatus()
      .then(setStatus)
      .catch(() => undefined);
  }, []);
  const onPublished = useCallback(() => {
    setStatus((current) => ({
      lastPublishBy: current?.lastPublishBy ?? email,
      lastPublishAt: new Date().toISOString(),
    }));
  }, [email]);

  const republish = async () => {
    try {
      const result = await api.republish();
      toast(result.message, result.triggered ? 'success' : 'info');
      if (result.triggered) onPublished();
    } catch (error) {
      toast((error as ApiError).message, 'error');
    }
  };

  if (fatal) return <FatalScreen error={fatal} />;
  if (!overrides) {
    return (
      <div class="loading-screen">
        <Spinner label="Ouverture de l’espace admin…" />
      </div>
    );
  }

  // Textes utiles à la fiche atelier : version modifiée, sinon d'origine.
  const placeOptions = (
    (overrides['commun.lieux.items'] as Record<string, string>[] | undefined) ??
    CONTENT_SCHEMA.commun.sections.lieux.fields.items.default
  ).map((place) => `${place.name}, ${place.city}`);
  const defaultBookingLabel =
    (overrides['ateliers.page.bookingLabel'] as string | undefined) ??
    CONTENT_SCHEMA.ateliers.sections.page.fields.bookingLabel.default;

  const link = (
    path: string,
    label: string,
    active: boolean,
    extra?: string,
  ) => (
    <a
      href={`#${path}`}
      class={`nav-link${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={(event) => {
        event.preventDefault();
        navigate(path);
      }}
    >
      <span>{label}</span>
      {extra && <small>{extra}</small>}
    </a>
  );

  return (
    <div class="admin">
      <header class="topbar">
        <button
          type="button"
          class="topbar__menu"
          aria-expanded={menuOpen}
          aria-controls="admin-nav"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Fermer' : 'Menu'}
        </button>
        <a class="topbar__brand" href="/" target="_blank" rel="noreferrer">
          <span class="brand-name">Gao Mata</span>
          <small>Espace admin</small>
        </a>
        <PublishBadge status={status} onRepublish={republish} />
        <div class="topbar__user">
          <span title={email}>{email}</span>
          <a href="/cdn-cgi/access/logout" class="link-button">
            Se déconnecter
          </a>
        </div>
      </header>

      <div class="layout">
        <nav
          id="admin-nav"
          class={`sidebar${menuOpen ? ' is-open' : ''}`}
          aria-label="Navigation de l’admin"
        >
          <p class="sidebar__title">Ateliers</p>
          {link('/ateliers', 'Tous les ateliers', route.name === 'workshops')}
          {link(
            '/ateliers/nouveau',
            '+ Nouvel atelier',
            route.name === 'workshop' && route.id === null,
          )}
          <p class="sidebar__title">Textes du site</p>
          {PAGE_IDS.map((pageId) =>
            link(
              `/pages/${pageId}`,
              CONTENT_SCHEMA[pageId].label,
              route.name === 'page' && route.pageId === pageId,
              countOverrides(overrides, pageId),
            ),
          )}
          <a
            class="nav-link nav-link--external"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            <span>Voir le site ↗</span>
          </a>
        </nav>

        <main class="content" id="contenu">
          {route.name === 'workshops' && <WorkshopList navigate={navigate} />}
          {route.name === 'workshop' && (
            <WorkshopEditor
              key={editorKey}
              id={route.id}
              places={placeOptions}
              defaultBookingLabel={defaultBookingLabel}
              navigate={navigate}
              onCreated={onWorkshopCreated}
              onDirtyChange={setDirty}
              onPublished={onPublished}
            />
          )}
          {route.name === 'page' && (
            <PageEditor
              key={route.pageId}
              pageId={route.pageId}
              overrides={overrides}
              onSaved={setOverrides}
              onDirtyChange={setDirty}
              onPublished={onPublished}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function countOverrides(
  overrides: Record<string, StoredValue>,
  pageId: string,
) {
  const count = Object.keys(overrides).filter((key) =>
    key.startsWith(`${pageId}.`),
  ).length;
  return count ? `${count} modifié${count > 1 ? 's' : ''}` : undefined;
}

/** Indique si une reconstruction a été demandée il y a moins de 3 minutes. */
function PublishBadge({
  status,
  onRepublish,
}: {
  status: PublishStatus | null;
  onRepublish: () => void;
}) {
  const [, setTick] = useState(0);
  const since = status?.lastPublishAt
    ? Date.now() - new Date(status.lastPublishAt).getTime()
    : Infinity;
  const building = since < BUILD_DURATION_MS;

  // Rafraîchit l'affichage à la fin de la durée estimée du build.
  useEffect(() => {
    if (!building) return;
    const timer = window.setTimeout(
      () => setTick((tick) => tick + 1),
      BUILD_DURATION_MS - since + 500,
    );
    return () => window.clearTimeout(timer);
  }, [building, since]);

  if (!status) return <div class="publish" />;
  return (
    <div class={`publish${building ? ' publish--building' : ''}`} role="status">
      <span class="publish__dot" aria-hidden="true" />
      <span class="publish__label">
        {building
          ? 'Mise à jour du site en cours (2 à 3 min)…'
          : status.lastPublishAt
            ? `Dernière publication : ${formatDateTime(status.lastPublishAt)}`
            : 'Site publié'}
      </span>
      {!building && (
        <button
          type="button"
          class="link-button"
          onClick={onRepublish}
          title="Relance la mise en ligne du site, par exemple si une modification n’apparaît pas."
        >
          Republier
        </button>
      )}
    </div>
  );
}

function FatalScreen({ error }: { error: ApiError }) {
  const unauthorized = error.status === 401 || error.status === 403;
  return (
    <div class="fatal">
      <h1>{unauthorized ? 'Accès réservé' : 'L’admin ne répond pas'}</h1>
      <p>{error.message}</p>
      {unauthorized ? (
        <p>
          Seuls les comptes autorisés peuvent modifier le site.{' '}
          <a href="/cdn-cgi/access/logout">Se connecter avec un autre compte</a>
        </p>
      ) : (
        <button
          type="button"
          class="btn btn--primary"
          onClick={() => location.reload()}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
