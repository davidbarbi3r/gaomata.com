/**
 * Le site est statique : un atelier passé reste dans les pages jusqu'au
 * prochain build. Ce script applique la date du jour dans le navigateur.
 *
 * - `[data-workshop-until="AAAA-MM-JJ"]` : masqué une fois la date passée ;
 * - `[data-workshops]` : masqué s'il ne contient plus aucun atelier visible ;
 * - `[data-past-notice]` : affiché une fois la date passée, et les
 *   éléments `[data-booking]` de la page masqués.
 */
const today = new Date().toLocaleDateString('sv-SE');
const isPast = (element: HTMLElement) =>
  (element.dataset.workshopUntil ?? element.dataset.until ?? '') < today;

document
  .querySelectorAll<HTMLElement>('[data-workshops]')
  .forEach((section) => {
    const cards = [
      ...section.querySelectorAll<HTMLElement>('[data-workshop-until]'),
    ];
    cards.forEach((card) => (card.hidden = isPast(card)));
    section.hidden = cards.every((card) => card.hidden);
  });

const notice = document.querySelector<HTMLElement>('[data-past-notice]');
if (notice && isPast(notice)) {
  notice.hidden = false;
  document
    .querySelectorAll<HTMLElement>('[data-booking]')
    .forEach((element) => (element.hidden = true));
}
