import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

async function reportClientError(payload: any) {
  try {
    const body = JSON.stringify(payload);
    const runtimeBase = (window as any).__RUNTIME__?.backendUrl || '';
    const endpoint = runtimeBase
      ? `${runtimeBase.replace(/\/+$/, '')}/api/internal/client-error`
      : '/api/internal/client-error';

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch (e) {
    console.error('Failed to send client error to server', e, payload);
  }
}

window.addEventListener('error', (evt) => {
  const payload = {
    type: 'error',
    message: evt.message,
    filename: (evt as ErrorEvent).filename,
    lineno: (evt as ErrorEvent).lineno,
    colno: (evt as ErrorEvent).colno,
    stack: (evt.error && (evt.error as any).stack) || null,
    userAgent: navigator.userAgent,
    url: location.href,
  };
  // fire and forget
  void reportClientError(payload);
});

window.addEventListener('unhandledrejection', (evt) => {
  const reason = (evt as PromiseRejectionEvent).reason;
  const payload = {
    type: 'unhandledrejection',
    message: reason?.message || String(reason),
    stack: reason?.stack || null,
    userAgent: navigator.userAgent,
    url: location.href,
  };
  void reportClientError(payload);
});

async function loadRuntimeConfig() {
  try {
    const res = await fetch('/assets/runtime.json', { cache: 'no-cache' });
    if (res.ok) {
      // attach to window for app code to read synchronously
      (window as any).__RUNTIME__ = await res.json();
      return;
    }
  } catch (e) {
    // ignore
  }
  (window as any).__RUNTIME__ = {};
}

(async () => {
  await loadRuntimeConfig();
  bootstrapApplication(App, appConfig)
    .catch((err) => {
      console.error(err);
      void reportClientError({ type: 'bootstrap', message: err?.message || String(err), stack: err?.stack || null, url: location.href, userAgent: navigator.userAgent });
    });
})();
