export const INVOICE_PAGE_WIDTH = 640;
export const INVOICE_PAGE_HEIGHT = 905;
export const INVOICE_PAGE_PADDING = 32;
export const INVOICE_PAGE_CONTENT_HEIGHT =
  INVOICE_PAGE_HEIGHT - INVOICE_PAGE_PADDING * 2 - 2;

export function arePageIndexesEqual(current, next) {
  if (current.length !== next.length) return false;

  return current.every(
    (page, pageIndex) =>
      page.length === next[pageIndex].length &&
      page.every((rowIndex, index) => rowIndex === next[pageIndex][index]),
  );
}

export function reconcilePageIndexes(pages, rowCount) {
  if (rowCount === 0) return [[]];

  const seen = new Set();
  const reconciled = pages
    .map((page) =>
      page.filter((rowIndex) => {
        const valid =
          Number.isInteger(rowIndex) &&
          rowIndex >= 0 &&
          rowIndex < rowCount &&
          !seen.has(rowIndex);

        if (valid) seen.add(rowIndex);
        return valid;
      }),
    )
    // Le pagine senza righe si scartano, tranne l'ultima: quando i totali
    // non entrano sotto l'ultima riga, la paginazione crea apposta una
    // pagina finale senza righe che li ospita. Scartandola i totali
    // finirebbero in overflow sulla pagina precedente, che ha
    // overflow-hidden, e verrebbero tagliati via dalla stampa.
    .filter((page, index, tutte) => page.length > 0 || index === tutte.length - 1);

  if (reconciled.length === 0) reconciled.push([]);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    if (!seen.has(rowIndex)) {
      reconciled[reconciled.length - 1].push(rowIndex);
    }
  }

  return reconciled;
}

export function paginateRowsByHeight(
  rowHeights,
  metrics,
  pageContentHeight = INVOICE_PAGE_CONTENT_HEIGHT,
) {
  if (rowHeights.length === 0) return [[]];

  const pages = [[]];
  let usedHeight = 0;

  rowHeights.forEach((rowHeight, rowIndex) => {
    const isLastRow = rowIndex === rowHeights.length - 1;
    let pageIndex = pages.length - 1;
    let availableHeight =
      pageContentHeight -
      (pageIndex === 0
        ? metrics.firstPageFixedHeight
        : metrics.continuationFixedHeight);

    // Ogni riga va dove entra, i totali non entrano in questo calcolo:
    // sommarli all'ultima riga la spingerebbe a pagina nuova anche quando
    // sulla pagina corrente c'e ancora spazio, lasciando un buco a meta
    // documento e una riga orfana in fondo.
    if (
      pages[pageIndex].length > 0 &&
      usedHeight + rowHeight > availableHeight
    ) {
      pages.push([]);
      pageIndex += 1;
      usedHeight = 0;
      availableHeight =
        pageContentHeight - metrics.continuationFixedHeight;
    }

    pages[pageIndex].push(rowIndex);
    usedHeight += rowHeight;

    // Solo i totali traboccano, e solo se davvero non ci stanno.
    if (
      isLastRow &&
      usedHeight + metrics.totalsHeight > availableHeight
    ) {
      pages.push([]);
    }
  });

  return pages;
}
