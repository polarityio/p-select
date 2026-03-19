// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView ??= function () {};

// jsdom doesn't implement ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}
