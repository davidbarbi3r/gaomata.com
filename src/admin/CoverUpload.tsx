/** Choix de la photo de couverture : redimensionnée dans le navigateur, puis envoyée dans R2. */
import { useRef, useState } from 'preact/hooks';
import { mediaPath } from '../cms/workshops';
import { api, ApiError } from './api';

const MAX_SIDE = 2400;
const ACCEPTED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
];

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('conversion'))),
      'image/jpeg',
      0.88,
    ),
  );
}

interface Props {
  id: string;
  coverKey: string;
  error?: string;
  onUploaded: (key: string) => void;
  onRemove: () => void;
}

export function CoverUpload({
  id,
  coverKey,
  error,
  onUploaded,
  onRemove,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [dragging, setDragging] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setProblem('');
    if (file.type && !ACCEPTED.includes(file.type)) {
      setProblem(
        'Ce fichier n’est pas une photo. Choisis un fichier JPEG, PNG ou WebP.',
      );
      return;
    }
    setBusy(true);
    try {
      const blob = await shrink(file);
      const { key } = await api.uploadCover(
        blob,
        file.name.replace(/\.\w+$/, '.jpg'),
      );
      onUploaded(key);
    } catch (caught) {
      setProblem(
        caught instanceof ApiError
          ? caught.message
          : 'Cette photo n’a pas pu être lue. Essaie avec une photo JPEG ou PNG.',
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div class="cover">
      {coverKey ? (
        <div class="cover__preview">
          <img src={mediaPath(coverKey)} alt="" />
          <div class="cover__actions">
            <button
              type="button"
              class="btn btn--soft btn--small"
              onClick={() => input.current?.click()}
              disabled={busy}
            >
              {busy ? 'Envoi…' : 'Changer la photo'}
            </button>
            <button
              type="button"
              class="btn btn--ghost btn--small"
              onClick={onRemove}
              disabled={busy}
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          class={`cover__drop${dragging ? ' is-dragging' : ''}${error ? ' is-invalid' : ''}`}
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handle(event.dataTransfer?.files[0]);
          }}
          disabled={busy}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <span class="cover__icon" aria-hidden="true">
            ＋
          </span>
          <strong>{busy ? 'Envoi de la photo…' : 'Ajouter une photo'}</strong>
          <span>Clique ou glisse une photo ici (JPEG, PNG ou WebP)</span>
        </button>
      )}
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        class="sr-only"
        onChange={(event) => handle(event.currentTarget.files?.[0])}
      />
      {(problem || error) && (
        <p class="field__error" id={`${id}-error`}>
          {problem || error}
        </p>
      )}
    </div>
  );
}
