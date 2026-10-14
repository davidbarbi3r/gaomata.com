import { expect, test } from '@playwright/test';
import { listFields, validateValue } from '../src/cms/fields';
import { CONTENT_SCHEMA } from '../src/cms/schema';
import {
  emptyWorkshop,
  formatWorkshopDate,
  formatWorkshopTime,
  slugify,
  validateWorkshop,
} from '../src/cms/workshops';

// Tests sans navigateur : une seule exécution suffit.
const once = () =>
  test.skip(test.info().project.name !== 'chromium', 'Test sans navigateur');

test('chaque texte d’origine respecte la définition de son champ', () => {
  once();
  const errors = listFields(CONTENT_SCHEMA)
    .map((ref) => ({
      key: ref.key,
      error: validateValue(ref.field, ref.field.default),
    }))
    .filter((result) => result.error);
  expect(errors).toEqual([]);
});

test('les éléments de liste d’origine ont exactement les sous-champs déclarés', () => {
  once();
  for (const ref of listFields(CONTENT_SCHEMA)) {
    if (ref.field.kind !== 'list') continue;
    const declared = Object.keys(ref.field.fields).sort();
    expect(Object.keys(ref.field.fields)).toContain(ref.field.itemTitle);
    for (const item of ref.field.default) {
      expect(Object.keys(item).sort(), ref.key).toEqual(declared);
    }
  }
});

test('un atelier publié doit être complet, un brouillon peut ne pas l’être', () => {
  once();
  const draft = { ...emptyWorkshop(), title: 'Fly & Zen', slug: 'fly-zen' };
  expect(validateWorkshop(draft)).toEqual({});

  const errors = validateWorkshop({ ...draft, status: 'published' });
  expect(Object.keys(errors).sort()).toEqual(
    ['coverKey', 'location', 'startsOn', 'summary'].sort(),
  );
  expect(
    validateWorkshop({ ...draft, startsOn: '2026-11-10', endsOn: '2026-11-09' })
      .endsOn,
  ).toBeTruthy();
  expect(
    validateWorkshop({ ...draft, bookingUrl: 'aurarios.fr' }).bookingUrl,
  ).toBeTruthy();
  // Seules les photos envoyées par l'admin (clé aléatoire en JPEG) passent.
  expect(
    validateWorkshop({ ...draft, coverKey: 'autre/fichier.png', coverAlt: 'x' })
      .coverKey,
  ).toBeTruthy();
  expect(
    validateWorkshop({
      ...draft,
      coverKey: 'ateliers/2026/1a7e8f13-de35-4a8d-8cb0-2b59238e684f.jpg',
      coverAlt: 'Photo',
    }).coverKey,
  ).toBeUndefined();
});

test('adresses et dates des ateliers', () => {
  once();
  expect(slugify('Fly & Zen Pyjama : spécial pleine lune')).toBe(
    'fly-zen-pyjama-special-pleine-lune',
  );
  expect(slugify('L’atelier d’été')).toBe('l-atelier-d-ete');
  expect(formatWorkshopDate({ startsOn: '2026-11-14', endsOn: '' })).toBe(
    'samedi 14 novembre 2026',
  );
  expect(
    formatWorkshopDate({ startsOn: '2026-11-14', endsOn: '2026-11-15' }),
  ).toBe('du 14 au 15 novembre 2026');
  expect(
    formatWorkshopDate({ startsOn: '2026-10-30', endsOn: '2026-11-02' }),
  ).toBe('du 30 octobre au 2 novembre 2026');
  expect(
    formatWorkshopDate({ startsOn: '2026-12-30', endsOn: '2027-01-02' }),
  ).toBe('du 30 décembre 2026 au 2 janvier 2027');
  expect(formatWorkshopTime({ startTime: '14:00', endTime: '17:30' })).toBe(
    '14 h – 17 h 30',
  );
});
