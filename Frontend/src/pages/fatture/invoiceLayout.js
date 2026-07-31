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
    .filter((page) => page.length > 0);

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
    const requiredHeight = rowHeight + (isLastRow ? metrics.totalsHeight : 0);

    if (
      pages[pageIndex].length > 0 &&
      usedHeight + requiredHeight > availableHeight
    ) {
      pages.push([]);
      pageIndex += 1;
      usedHeight = 0;
      availableHeight =
        pageContentHeight - metrics.continuationFixedHeight;
    }

    pages[pageIndex].push(rowIndex);
    usedHeight += rowHeight;

    if (
      isLastRow &&
      usedHeight + metrics.totalsHeight > availableHeight
    ) {
      pages.push([]);
    }
  });

  return pages;
}
