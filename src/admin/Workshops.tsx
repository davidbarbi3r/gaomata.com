/** Liste et fiche d'édition des ateliers. */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  emptyWorkshop,
  formatWorkshopDate,
  formatWorkshopTime,
  isUpcoming,
  mediaPath,
  slugify,
  SUMMARY_MAX,
  toWorkshopInput,
  workshopPath,
  validateWorkshop,
  type Workshop,
  type WorkshopErrors,
  type WorkshopInput,
} from '../cms/workshops';
import { api, ApiError } from './api';
import { CoverUpload } from './CoverUpload';
import { RichTextEditor } from './RichTextEditor';
import {
  AutoTextarea,
  FieldShell,
  formatDateTime,
  Spinner,
  useConfirm,
  useId,
  useToast,
} from './ui';

type Badge = { label: string; tone: 'draft' | 'live' | 'past' };

function badgeOf(
  workshop: Pick<Workshop, 'status' | 'startsOn' | 'endsOn'>,
): Badge {
  if (workshop.status === 'draft') return { label: 'Brouillon', tone: 'draft' };
  if (workshop.startsOn && !isUpcoming(workshop))
    return { label: 'Passé', tone: 'past' };
  return { label: 'En ligne', tone: 'live' };
}

export function WorkshopList({
  navigate,
}: {
  navigate: (path: string) => void;
}) {
  const [workshops, setWorkshops] = useState<Workshop[] | null>(null);
  const [problem, setProblem] = useState('');

  useEffect(() => {
    api
      .workshops()
      .then((result) => setWorkshops(result.workshops))
      .catch((error: ApiError) => setProblem(error.message));
  }, []);

  const groups = useMemo(() => {
    const all = workshops ?? [];
    const upcoming = all
      .filter((workshop) => badgeOf(workshop).tone !== 'past')
      .sort((a, b) =>
        (a.startsOn || '9999').localeCompare(b.startsOn || '9999'),
      );
    const past = all.filter((workshop) => badgeOf(workshop).tone === 'past');
    return { upcoming, past };
  }, [workshops]);

  return (
    <div class="editor">
      <header class="editor__head">
        <div>
          <p class="editor__kicker">Ateliers</p>
          <h1>Les ateliers</h1>
          <p class="editor__intro">
            Les ateliers publiés et à venir apparaissent sur la page d’accueil,
            avec leur propre page. Un brouillon reste invisible tant qu’il n’est
            pas publié.
          </p>
        </div>
        <button
          type="button"
          class="btn btn--primary"
          onClick={() => navigate('/ateliers/nouveau')}
        >
          + Nouvel atelier
        </button>
      </header>

      {problem && <p class="notice notice--error">{problem}</p>}
      {!workshops && !problem && <Spinner label="Chargement des ateliers…" />}

      {workshops && workshops.length === 0 && (
        <div class="empty">
          <h2>Aucun atelier pour le moment</h2>
          <p>
            Crée ton premier atelier : titre, date, lieu, photo et texte de
            présentation. Tant qu’il n’y a aucun atelier à venir, rien ne
            s’affiche sur la page d’accueil.
          </p>
          <button
            type="button"
            class="btn btn--primary"
            onClick={() => navigate('/ateliers/nouveau')}
          >
            Créer un atelier
          </button>
        </div>
      )}

      {groups.upcoming.length > 0 && (
        <WorkshopGroup
          title="À venir et brouillons"
          workshops={groups.upcoming}
          navigate={navigate}
        />
      )}
      {groups.past.length > 0 && (
        <WorkshopGroup
          title="Ateliers passés"
          workshops={groups.past}
          navigate={navigate}
        />
      )}
    </div>
  );
}

function WorkshopGroup(props: {
  title: string;
  workshops: Workshop[];
  navigate: (path: string) => void;
}) {
  return (
    <section class="workshop-group">
      <h2>{props.title}</h2>
      <ul class="workshop-rows">
        {props.workshops.map((workshop) => {
          const badge = badgeOf(workshop);
          return (
            <li key={workshop.id}>
              <a
                class="workshop-row"
                href={`#/ateliers/${workshop.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  props.navigate(`/ateliers/${workshop.id}`);
                }}
              >
                <span class="workshop-row__thumb">
                  {workshop.coverKey ? (
                    <img
                      src={mediaPath(workshop.coverKey)}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span aria-hidden="true">◌</span>
                  )}
                </span>
                <span class="workshop-row__text">
                  <strong>{workshop.title || 'Sans titre'}</strong>
                  <span>
                    {formatWorkshopDate(workshop) || 'Date à définir'}
                    {workshop.location ? ` · ${workshop.location}` : ''}
                  </span>
                </span>
                <span class={`badge badge--${badge.tone}`}>{badge.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

interface EditorProps {
  id: string | null;
  places: string[];
  /** Texte du bouton quand l'atelier n'en précise pas (Pages des ateliers). */
  defaultBookingLabel: string;
  navigate: (path: string, force?: boolean) => void;
  onCreated: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onPublished: () => void;
}

export function WorkshopEditor({
  id,
  places,
  defaultBookingLabel,
  navigate,
  onCreated,
  onDirtyChange,
  onPublished,
}: EditorProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [loaded, setLoaded] = useState<Workshop | null>(null);
  const [baseline, setBaseline] = useState<WorkshopInput>(emptyWorkshop());
  const [draft, setDraft] = useState<WorkshopInput>(emptyWorkshop());
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<WorkshopErrors>({});
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  /** Identifiant que l'on vient de créer : inutile de recharger le formulaire. */
  const createdId = useRef<string | null>(null);
  const ids = {
    title: useId('w'),
    startsOn: useId('w'),
    endsOn: useId('w'),
    startTime: useId('w'),
    endTime: useId('w'),
    location: useId('w'),
    price: useId('w'),
    summary: useId('w'),
    cover: useId('w'),
    coverAlt: useId('w'),
    body: useId('w'),
    program: useId('w'),
    bookingUrl: useId('w'),
    bookingLabel: useId('w'),
    slug: useId('w'),
  };

  useEffect(() => {
    if (!id) {
      const fresh = emptyWorkshop();
      setBaseline(fresh);
      setDraft(fresh);
      setLoaded(null);
      setSlugTouched(false);
      return;
    }
    api
      .workshop(id)
      .then(({ workshop }) => {
        setLoaded(workshop);
        if (id === createdId.current) return;
        const input = toWorkshopInput(workshop);
        setBaseline(input);
        setDraft(input);
        setSlugTouched(true);
      })
      .catch((error: ApiError) => setProblem(error.message));
  }, [id]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  useEffect(() => onDirtyChange(dirty), [dirty]);

  const set = <K extends keyof WorkshopInput>(
    key: K,
    value: WorkshopInput[K],
  ) => {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (status: WorkshopInput['status']) => {
    const snapshot = draft;
    const input: WorkshopInput = {
      ...snapshot,
      status,
      slug: snapshot.slug || slugify(snapshot.title),
    };
    const found = validateWorkshop(input);
    setErrors(found);
    if (Object.keys(found).length) {
      toast(
        status === 'published'
          ? 'Il manque des informations pour publier cet atelier.'
          : 'Certains champs sont à corriger.',
        'error',
      );
      return;
    }
    setSaving(true);
    try {
      const result = id
        ? await api.updateWorkshop(id, input)
        : await api.createWorkshop(input);
      setBaseline(input);
      // Ce qui a été tapé pendant l'enregistrement reste à enregistrer.
      setDraft((current) =>
        current === snapshot ? input : { ...current, status, slug: input.slug },
      );
      toast(result.message, result.triggered ? 'success' : 'info');
      if (result.triggered) onPublished();
      if (!id) {
        createdId.current = result.id;
        onCreated(result.id);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setErrors(apiError.fields as WorkshopErrors);
      toast(apiError.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    const ok = await confirm({
      title: 'Supprimer cet atelier ?',
      message: `« ${draft.title || 'Sans titre'} » sera définitivement supprimé, avec sa photo. Cette action est irréversible.`,
      confirmLabel: 'Supprimer définitivement',
      danger: true,
    });
    if (!ok) return;
    try {
      const result = await api.deleteWorkshop(id);
      toast(result.message, 'success');
      if (result.triggered) onPublished();
      navigate('/ateliers', true);
    } catch (error) {
      toast((error as ApiError).message, 'error');
    }
  };

  if (problem) return <p class="notice notice--error">{problem}</p>;
  if (id && !loaded) return <Spinner label="Chargement de l’atelier…" />;

  const published = draft.status === 'published';
  const wasPublished = baseline.status === 'published';
  const time = formatWorkshopTime(draft);
  const badge = badgeOf(draft);

  return (
    <div class="editor">
      <header class="editor__head">
        <div>
          <a
            class="back-link"
            href="#/ateliers"
            onClick={(event) => {
              event.preventDefault();
              navigate('/ateliers');
            }}
          >
            ← Tous les ateliers
          </a>
          <h1>{id ? draft.title || 'Atelier sans titre' : 'Nouvel atelier'}</h1>
          {loaded && (
            <p class="editor__intro">
              Dernière modification le {formatDateTime(loaded.updatedAt)} par{' '}
              {loaded.updatedBy}.
            </p>
          )}
        </div>
        <span class={`badge badge--${badge.tone} badge--large`}>
          {badge.label}
        </span>
      </header>

      <div class="workshop-layout">
        <div class="workshop-main">
          <section class="card">
            <h2>L’essentiel</h2>
            <div class="card__fields">
              <FieldShell
                id={ids.title}
                label="Titre de l’atelier"
                error={errors.title}
              >
                <input
                  id={ids.title}
                  type="text"
                  value={draft.title}
                  maxLength={120}
                  placeholder="Ex. Fly & Zen Pyjama"
                  aria-invalid={errors.title ? true : undefined}
                  onInput={(event) => set('title', event.currentTarget.value)}
                />
              </FieldShell>
              <div class="field-row">
                <FieldShell
                  id={ids.startsOn}
                  label="Date"
                  error={errors.startsOn}
                >
                  <input
                    id={ids.startsOn}
                    type="date"
                    value={draft.startsOn}
                    aria-invalid={errors.startsOn ? true : undefined}
                    onInput={(event) =>
                      set('startsOn', event.currentTarget.value)
                    }
                  />
                </FieldShell>
                <FieldShell
                  id={ids.endsOn}
                  label="Date de fin"
                  optional
                  help="Seulement pour un atelier sur plusieurs jours."
                  error={errors.endsOn}
                >
                  <input
                    id={ids.endsOn}
                    type="date"
                    value={draft.endsOn}
                    min={draft.startsOn || undefined}
                    onInput={(event) =>
                      set('endsOn', event.currentTarget.value)
                    }
                  />
                </FieldShell>
              </div>
              <div class="field-row">
                <FieldShell
                  id={ids.startTime}
                  label="Heure de début"
                  optional
                  error={errors.startTime}
                >
                  <input
                    id={ids.startTime}
                    type="time"
                    value={draft.startTime}
                    onInput={(event) =>
                      set('startTime', event.currentTarget.value)
                    }
                  />
                </FieldShell>
                <FieldShell
                  id={ids.endTime}
                  label="Heure de fin"
                  optional
                  error={errors.endTime}
                >
                  <input
                    id={ids.endTime}
                    type="time"
                    value={draft.endTime}
                    onInput={(event) =>
                      set('endTime', event.currentTarget.value)
                    }
                  />
                </FieldShell>
              </div>
              <div class="field-row">
                <FieldShell
                  id={ids.location}
                  label="Lieu"
                  help="Choisis un lieu proposé ou écris une adresse."
                  error={errors.location}
                >
                  <input
                    id={ids.location}
                    type="text"
                    list={`${ids.location}-list`}
                    value={draft.location}
                    aria-invalid={errors.location ? true : undefined}
                    onInput={(event) =>
                      set('location', event.currentTarget.value)
                    }
                  />
                  <datalist id={`${ids.location}-list`}>
                    {places.map((place) => (
                      <option key={place} value={place} />
                    ))}
                  </datalist>
                </FieldShell>
                <FieldShell
                  id={ids.price}
                  label="Tarif"
                  optional
                  help="Ex. 27 € ou 45 € le duo."
                  error={errors.price}
                >
                  <input
                    id={ids.price}
                    type="text"
                    value={draft.price}
                    onInput={(event) => set('price', event.currentTarget.value)}
                  />
                </FieldShell>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>Photo de couverture</h2>
            <p class="card__help">
              Une photo horizontale fonctionne le mieux. Elle est recadrée
              automatiquement sur les cartes de la page d’accueil.
            </p>
            <div class="card__fields">
              <CoverUpload
                id={ids.cover}
                coverKey={draft.coverKey}
                error={errors.coverKey}
                onUploaded={(key) => set('coverKey', key)}
                onRemove={() => set('coverKey', '')}
              />
              {draft.coverKey && (
                <FieldShell
                  id={ids.coverAlt}
                  label="Description de la photo"
                  help="Lue par les lecteurs d’écran et par Google. Ex. « Trois personnes allongées dans des hamacs au sol »."
                  error={errors.coverAlt}
                >
                  <input
                    id={ids.coverAlt}
                    type="text"
                    value={draft.coverAlt}
                    aria-invalid={errors.coverAlt ? true : undefined}
                    onInput={(event) =>
                      set('coverAlt', event.currentTarget.value)
                    }
                  />
                </FieldShell>
              )}
            </div>
          </section>

          <section class="card">
            <h2>Textes</h2>
            <div class="card__fields">
              <FieldShell
                id={ids.summary}
                label="Résumé"
                help="Deux ou trois phrases, affichées sur la carte de la page d’accueil."
                error={errors.summary}
                counter={{ length: draft.summary.length, max: SUMMARY_MAX }}
              >
                <AutoTextarea
                  id={ids.summary}
                  value={draft.summary}
                  minRows={3}
                  invalid={Boolean(errors.summary)}
                  onInput={(value) => set('summary', value)}
                />
              </FieldShell>
              <div class="field">
                <div class="field__head">
                  <span class="list-field__label" id={`${ids.body}-label`}>
                    Présentation
                  </span>
                </div>
                <RichTextEditor
                  id={ids.body}
                  labelledBy={`${ids.body}-label`}
                  value={draft.bodyHtml}
                  placeholder="Raconte l’atelier : pour qui, l’ambiance, ce qu’on y vit…"
                  onChange={(html) => set('bodyHtml', html)}
                />
              </div>
              <div class="field">
                <div class="field__head">
                  <span class="list-field__label" id={`${ids.program}-label`}>
                    Programme <span class="field__optional">(facultatif)</span>
                  </span>
                </div>
                <RichTextEditor
                  id={ids.program}
                  labelledBy={`${ids.program}-label`}
                  value={draft.programHtml}
                  placeholder="Ex. une liste : 14 h accueil, 14 h 15 échauffement…"
                  onChange={(html) => set('programHtml', html)}
                />
                <p class="field__help">
                  Affiché dans un encadré à côté de la présentation.
                </p>
              </div>
            </div>
          </section>

          <section class="card">
            <h2>Réservation</h2>
            <div class="card__fields">
              <FieldShell
                id={ids.bookingUrl}
                label="Lien de réservation"
                optional
                help="Ex. le lien Aurarios de l’atelier. Sans lien, le bouton propose d’écrire un email."
                error={errors.bookingUrl}
              >
                <input
                  id={ids.bookingUrl}
                  type="url"
                  inputMode="url"
                  placeholder="https://www.aurarios.fr/…"
                  value={draft.bookingUrl}
                  aria-invalid={errors.bookingUrl ? true : undefined}
                  onInput={(event) =>
                    set('bookingUrl', event.currentTarget.value)
                  }
                />
              </FieldShell>
              <FieldShell
                id={ids.bookingLabel}
                label="Texte du bouton"
                optional
                help={`Vide = « ${defaultBookingLabel} ».`}
                error={errors.bookingLabel}
              >
                <input
                  id={ids.bookingLabel}
                  type="text"
                  value={draft.bookingLabel}
                  placeholder={defaultBookingLabel}
                  onInput={(event) =>
                    set('bookingLabel', event.currentTarget.value)
                  }
                />
              </FieldShell>
            </div>
          </section>

          <details class="card card--quiet">
            <summary>Réglages avancés</summary>
            <div class="card__fields">
              <FieldShell
                id={ids.slug}
                label="Adresse de la page"
                help={`La page sera visible sur gaomata.fr${workshopPath(draft.slug || '…')}. Évite de la changer une fois l’atelier partagé.`}
                error={errors.slug}
              >
                <input
                  id={ids.slug}
                  type="text"
                  value={draft.slug}
                  onInput={(event) => {
                    setSlugTouched(true);
                    set('slug', slugify(event.currentTarget.value));
                  }}
                />
              </FieldShell>
            </div>
          </details>
        </div>

        <aside class="workshop-side">
          <div class="card">
            <h2>Publication</h2>
            <p class="card__help">
              {published
                ? 'Visible sur le site. Chaque enregistrement met le site à jour (une à deux minutes).'
                : 'Brouillon : visible seulement ici. Publie-le quand il est prêt.'}
            </p>
            <div class="side-actions">
              {published ? (
                <>
                  <button
                    type="button"
                    class="btn btn--primary"
                    disabled={saving || (!dirty && wasPublished)}
                    onClick={() => submit('published')}
                  >
                    {saving ? 'Enregistrement…' : 'Enregistrer et publier'}
                  </button>
                  <button
                    type="button"
                    class="btn btn--ghost"
                    disabled={saving}
                    onClick={() => submit('draft')}
                  >
                    Repasser en brouillon
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    class="btn btn--primary"
                    disabled={saving}
                    onClick={() => submit('published')}
                  >
                    {saving ? 'Enregistrement…' : 'Publier sur le site'}
                  </button>
                  <button
                    type="button"
                    class="btn btn--ghost"
                    disabled={saving || (!dirty && Boolean(id))}
                    onClick={() => submit('draft')}
                  >
                    Enregistrer le brouillon
                  </button>
                </>
              )}
              {wasPublished && draft.slug && (
                <a
                  class="link-button"
                  href={workshopPath(baseline.slug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir la page de l’atelier ↗
                </a>
              )}
            </div>
            {dirty && <p class="side-dirty">Modifications non enregistrées</p>}
          </div>

          <div class="card">
            <h2>Aperçu sur l’accueil</h2>
            <article class="preview-card">
              <div class="preview-card__media">
                {draft.coverKey ? (
                  <img src={mediaPath(draft.coverKey)} alt="" />
                ) : (
                  <span>Photo</span>
                )}
              </div>
              <div class="preview-card__body">
                <p class="preview-card__meta">
                  {formatWorkshopDate(draft) || 'Date'}
                  {time ? ` · ${time}` : ''}
                </p>
                <h3>{draft.title || 'Titre de l’atelier'}</h3>
                <p class="preview-card__place">{draft.location || 'Lieu'}</p>
                <p class="preview-card__summary">
                  {draft.summary || 'Le résumé s’affichera ici.'}
                </p>
              </div>
            </article>
          </div>

          {id && (
            <button
              type="button"
              class="btn btn--danger-ghost"
              onClick={remove}
            >
              Supprimer l’atelier
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
