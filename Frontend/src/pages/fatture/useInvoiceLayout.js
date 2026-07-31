import { useLayoutEffect, useMemo, useState } from "react";

import {
  arePageIndexesEqual,
  INVOICE_PAGE_HEIGHT,
  INVOICE_PAGE_WIDTH,
  paginateRowsByHeight,
  reconcilePageIndexes,
} from "./invoiceLayout";

const MIN_PAGE_SCALE = 0.45;
const SCALE_EPSILON = 0.002;

function getHeight(root, selector) {
  return root.querySelector(selector)?.getBoundingClientRect().height ?? 0;
}

function measurePagination(root, rowCount) {
  const rowNodes = Array.from(
    root.querySelectorAll("[data-invoice-row-measure]"),
  );
  if (rowNodes.length !== rowCount) return null;

  const tableChromeHeight = getHeight(root, "[data-measure-table-chrome]");
  const footerHeight = getHeight(root, "[data-measure-footer]");
  const metrics = {
    firstPageFixedHeight:
      getHeight(root, "[data-measure-full-header]") +
      getHeight(root, "[data-measure-client]") +
      tableChromeHeight +
      footerHeight,
    continuationFixedHeight:
      getHeight(root, "[data-measure-compact-header]") +
      tableChromeHeight +
      footerHeight,
    totalsHeight: getHeight(root, "[data-measure-totals]"),
  };

  return paginateRowsByHeight(
    rowNodes.map((node) => node.getBoundingClientRect().height),
    metrics,
  );
}

function scheduleAnimationFrame(callback) {
  let frameId = null;

  return {
    run() {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(callback);
    },
    cancel() {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    },
  };
}

export function useInvoicePagination({
  measurementRef,
  rowCount,
  layoutKey,
}) {
  const [measuredPages, setMeasuredPages] = useState(() => [
    Array.from({ length: rowCount }, (_, index) => index),
  ]);

  useLayoutEffect(() => {
    const measurementRoot = measurementRef.current;
    if (!measurementRoot) return undefined;

    const calculate = () => {
      const nextPages = measurePagination(measurementRoot, rowCount);
      if (!nextPages) return;

      setMeasuredPages((current) =>
        arePageIndexesEqual(current, nextPages) ? current : nextPages,
      );
    };
    const scheduledCalculation = scheduleAnimationFrame(calculate);

    calculate();

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduledCalculation.run);
    observer?.observe(measurementRoot);

    return () => {
      scheduledCalculation.cancel();
      observer?.disconnect();
    };
  }, [layoutKey, measurementRef, rowCount]);

  return useMemo(
    () => reconcilePageIndexes(measuredPages, rowCount),
    [measuredPages, rowCount],
  );
}

export function useInvoiceViewportLayout({
  contentRef,
  fitPageToViewport,
}) {
  const [layout, setLayout] = useState({ scale: 1, topOffset: 0 });

  useLayoutEffect(() => {
    const viewport = contentRef.current?.parentElement;
    if (!viewport) return undefined;

    const calculate = () => {
      const style = window.getComputedStyle(viewport);
      const horizontalPadding =
        Number.parseFloat(style.paddingLeft || "0") +
        Number.parseFloat(style.paddingRight || "0");
      const verticalPadding =
        Number.parseFloat(style.paddingTop || "0") +
        Number.parseFloat(style.paddingBottom || "0");
      const availableWidth = viewport.clientWidth - horizontalPadding - 4;
      const availableHeight = viewport.clientHeight - verticalPadding - 4;
      const widthScale = Math.min(1, availableWidth / INVOICE_PAGE_WIDTH);
      const heightScale = fitPageToViewport
        ? Math.min(1, availableHeight / INVOICE_PAGE_HEIGHT)
        : 1;
      const nextScale = Math.max(
        MIN_PAGE_SCALE,
        Math.min(widthScale, heightScale),
      );
      const nextTopOffset = fitPageToViewport
        ? Math.max(
            (availableHeight - INVOICE_PAGE_HEIGHT * nextScale) / 2,
            0,
          )
        : 0;

      setLayout((current) =>
        Math.abs(current.scale - nextScale) < SCALE_EPSILON &&
        Math.abs(current.topOffset - nextTopOffset) < SCALE_EPSILON
          ? current
          : { scale: nextScale, topOffset: nextTopOffset },
      );
    };
    const scheduledCalculation = scheduleAnimationFrame(calculate);

    calculate();

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduledCalculation.run);
    observer?.observe(viewport);

    return () => {
      scheduledCalculation.cancel();
      observer?.disconnect();
    };
  }, [contentRef, fitPageToViewport]);

  return layout;
}
