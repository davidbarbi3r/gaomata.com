/** Formulaire des textes d'une page, généré depuis src/cms/schema.ts. */
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  fieldKey,
  listFields,
  sameValue,
  validateValue,
  type Field,
  type ListField,
  type ScalarField,
  type StoredValue,
} from '../cms/fields';
import { CONTENT_SCHEMA, type PageId } from '../cms/schema';
import { api, ApiError } from './api';
import { AutoTextarea, FieldShell, useConfirm, useId, useToast } from './ui';

type Values = Record<string, StoredValue>;

interface Props {
  pageId: PageId;
  overrides: Values;
  onSaved: (overrides: Values) => void;
  onDirtyChange: (dirty: boolean) => void;
  onPublished: () => void;
}

const defaultOf = (field: Field) => field.default as StoredValue;

export function PageEditor({
  pageId,
  overrides,
  onSaved,
  onDirtyChange,
  onPublished,
}: Props) {
  const pageDef = CONTENT_SCHEMA[pageId];
  const toast = useToast();
  const confirm = useConfirm();

  const refs = useMemo(() => listFields(CONTENT_SCHEMA, pageId), [pageId]);

  const initial = useMemo(() => {
    const values: Values = {};
    for (const { key, field } of refs)
      values[key] = overrides[key] ?? defaultOf(field);
    return values;
  }, [refs, overrides]);

  // `initial` suit les textes enregistrés ; `draft` garde ce qui est tapé,
  // y compris pendant un enregistrement (l'éditeur est recréé par page).
  const [draft, setDraft] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const dirtyKeys = refs
    .map(({ key }) => key)
    .filter((key) => !sameValue(draft[key], initial[key]));
  const dirty = dirtyKeys.length > 0;

  useEffect(() => onDirtyChange(dirty), [dirty]);

  const update = (key: string, value: StoredValue) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const save = async () => {
    const found: Record<string, string> = {};
    for (const { key, field } of refs) {
      if (!dirtyKeys.includes(key)) continue;
      const error = validateValue(field, draft[key]);
      if (error) found[key] = `« ${field.label} » ${error}.`;
    }
    setErrors(found);
    if (Object.keys(found).length) {
      toast('Certains champs sont à corriger avant d’enregistrer.', 'error');
      document
        .getElementById(`section-${Object.keys(found)[0].split('.')[1]}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setSaving(true);
    try {
      const values = Object.fromEntries(
        dirtyKeys.map((key) => [key, draft[key]]),
      );
      const result = await api.saveContent(pageId, values);
      const next = { ...overrides };
      for (const { key, field } of refs) {
        if (!(key in values)) continue;
        if (sameValue(values[key], defaultOf(field))) delete next[key];
        else next[key] = values[key];
      }
      onSaved(next);
      if (result.triggered) onPublished();
      toast(result.message, result.triggered ? 'success' : 'info');
    } catch (error) {
      const apiError = error as ApiError;
      setErrors(apiError.fields ?? {});
      toast(apiError.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    const ok = await confirm({
      title: 'Annuler les modifications ?',
      message: `Les ${dirtyKeys.length} modification(s) non enregistrée(s) de cette page seront perdues.`,
      confirmLabel: 'Oui, tout annuler',
      cancelLabel: 'Continuer à modifier',
      danger: true,
    });
    if (ok) {
      setDraft(initial);
      setErrors({});
    }
  };

  return (
    <div class="editor">
      <header class="editor__head">
        <div>
          <p class="editor__kicker">Textes du site</p>
          <h1>{pageDef.label}</h1>
          {pageDef.help && <p class="editor__intro">{pageDef.help}</p>}
        </div>
        {pageDef.path && (
          <a
            class="btn btn--ghost"
            href={pageDef.path}
            target="_blank"
            rel="noreferrer"
          >
            Voir la page ↗
          </a>
        )}
      </header>

      <nav class="section-nav" aria-label="Sections de la page">
        {Object.entries(pageDef.sections).map(([sectionId, sectionDef]) => (
          <a
            key={sectionId}
            href={`#section-${sectionId}`}
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById(`section-${sectionId}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {sectionDef.label}
          </a>
        ))}
      </nav>

      {Object.entries(pageDef.sections).map(([sectionId, sectionDef]) => (
        <section class="card" id={`section-${sectionId}`} key={sectionId}>
          <h2>{sectionDef.label}</h2>
          {sectionDef.help && <p class="card__help">{sectionDef.help}</p>}
          <div class="card__fields">
            {Object.entries(sectionDef.fields).map(([fieldId, rawField]) => {
              const field = rawField as Field;
              const key = fieldKey(pageId, sectionId, fieldId);
              const modified = !sameValue(draft[key], defaultOf(field));
              return field.kind === 'list' ? (
                <ListEditor
                  key={key}
                  field={field}
                  value={draft[key] as Record<string, string>[]}
                  error={errors[key]}
                  modified={modified}
                  onChange={(value) => update(key, value)}
                  onReset={() => update(key, defaultOf(field))}
                />
              ) : (
                <ScalarInput
                  key={key}
                  field={field}
                  value={draft[key] as string}
                  error={errors[key]}
                  modified={modified}
                  onChange={(value) => update(key, value)}
                  onReset={() => update(key, defaultOf(field))}
                />
              );
            })}
          </div>
        </section>
      ))}

      <div class={`savebar${dirty ? ' is-visible' : ''}`} aria-hidden={!dirty}>
        <p>
          <strong>{dirtyKeys.length}</strong>{' '}
          {dirtyKeys.length > 1
            ? 'modifications non enregistrées'
            : 'modification non enregistrée'}
        </p>
        <div>
          <button
            type="button"
            class="btn btn--ghost"
            onClick={discard}
            disabled={saving || !dirty}
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn--primary"
            onClick={save}
            disabled={saving || !dirty}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer et publier'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScalarInput(props: {
  field: ScalarField;
  value: string;
  error?: string;
  modified: boolean;
  label?: string;
  onChange: (value: string) => void;
  onReset?: () => void;
}) {
  const { field, value } = props;
  const id = useId('field');
  const describedBy = props.error
    ? `${id}-error`
    : field.help
      ? `${id}-help`
      : undefined;
  return (
    <FieldShell
      id={id}
      label={props.label ?? field.label}
      help={field.help}
      error={props.error}
      optional={field.optional}
      modified={props.modified}
      onReset={props.onReset}
      counter={field.max ? { length: value.length, max: field.max } : undefined}
    >
      {field.kind === 'textarea' ? (
        <AutoTextarea
          id={id}
          value={value}
          minRows={2}
          invalid={Boolean(props.error)}
          describedBy={describedBy}
          onInput={props.onChange}
        />
      ) : (
        <input
          id={id}
          type={
            field.kind === 'url'
              ? 'url'
              : field.kind === 'email'
                ? 'email'
                : 'text'
          }
          value={value}
          inputMode={field.kind === 'url' ? 'url' : undefined}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={describedBy}
          onInput={(event) => props.onChange(event.currentTarget.value)}
        />
      )}
    </FieldShell>
  );
}

function ListEditor(props: {
  field: ListField;
  value: Record<string, string>[];
  error?: string;
  modified: boolean;
  onChange: (value: Record<string, string>[]) => void;
  onReset: () => void;
}) {
  const { field, value } = props;
  const confirm = useConfirm();
  const [open, setOpen] = useState<number | null>(null);
  const canRemove = value.length > (field.min ?? 0);
  const canAdd = field.max === undefined || value.length < field.max;

  const move = (index: number, delta: number) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    props.onChange(next);
    if (open === index) setOpen(index + delta);
  };

  const remove = async (index: number) => {
    const title = value[index][field.itemTitle] || `élément ${index + 1}`;
    const ok = await confirm({
      title: 'Supprimer cet élément ?',
      message: `« ${title} » sera retiré de la liste. Tu pourras encore annuler tant que tu n’as pas enregistré.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    props.onChange(value.filter((_, itemIndex) => itemIndex !== index));
    setOpen(null);
  };

  const add = () => {
    const empty = Object.fromEntries(
      Object.keys(field.fields).map((subId) => [subId, '']),
    );
    props.onChange([...value, empty]);
    setOpen(value.length);
  };

  return (
    <div class={`list-field${props.error ? ' field--error' : ''}`}>
      <div class="field__head">
        <span class="list-field__label">{field.label}</span>
        {props.modified && (
          <button type="button" class="link-button" onClick={props.onReset}>
            Rétablir la liste d’origine
          </button>
        )}
      </div>
      {field.help && <p class="field__help">{field.help}</p>}
      {props.error && <p class="field__error">{props.error}</p>}

      <ol class="list-items">
        {value.map((item, index) => {
          const expanded = open === index;
          const title = item[field.itemTitle]?.trim() || 'Sans titre';
          return (
            <li key={index} class={`list-item${expanded ? ' is-open' : ''}`}>
              <div class="list-item__bar">
                <button
                  type="button"
                  class="list-item__toggle"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : index)}
                >
                  <span class="list-item__index">{index + 1}</span>
                  <span class="list-item__title">{title}</span>
                  <span class="list-item__chevron" aria-hidden="true">
                    {expanded ? '−' : '+'}
                  </span>
                </button>
                <div class="list-item__tools">
                  <button
                    type="button"
                    class="icon-button"
                    aria-label={`Monter « ${title} »`}
                    title="Monter"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="icon-button"
                    aria-label={`Descendre « ${title} »`}
                    title="Descendre"
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="icon-button icon-button--danger"
                    aria-label={`Supprimer « ${title} »`}
                    title={
                      canRemove
                        ? 'Supprimer'
                        : 'Il faut garder au moins un élément'
                    }
                    disabled={!canRemove}
                    onClick={() => remove(index)}
                  >
                    ×
                  </button>
                </div>
              </div>
              {expanded && (
                <div class="list-item__body">
                  {Object.entries(field.fields).map(([subId, subField]) => (
                    <ScalarInput
                      key={subId}
                      field={subField}
                      value={item[subId] ?? ''}
                      modified={false}
                      onChange={(subValue) =>
                        props.onChange(
                          value.map((current, itemIndex) =>
                            itemIndex === index
                              ? { ...current, [subId]: subValue }
                              : current,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {canAdd && (
        <button type="button" class="btn btn--soft" onClick={add}>
          + Ajouter {field.itemLabel}
        </button>
      )}
    </div>
  );
}
