// Using happy-dom for full DOM support in tests
import { Window } from 'happy-dom';

const window = new Window({
  url: 'https://localhost:3000',
  width: 1024,
  height: 768,
});

// Set secure context
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  writable: false,
});

// Set up globals
global.window = window as any;
global.document = window.document as any;
global.navigator = window.navigator as any;
global.HTMLElement = window.HTMLElement as any;
global.Element = window.Element as any;
global.Node = window.Node as any;
global.localStorage = window.localStorage as any;
global.sessionStorage = window.sessionStorage as any;
global.MutationObserver = window.MutationObserver as any;
global.ResizeObserver = window.ResizeObserver as any;
global.IntersectionObserver = window.IntersectionObserver as any;
global.CustomEvent = window.CustomEvent as any;
global.Event = window.Event as any;
global.KeyboardEvent = window.KeyboardEvent as any;
global.MouseEvent = window.MouseEvent as any;
global.requestAnimationFrame = window.requestAnimationFrame as any;
global.cancelAnimationFrame = window.cancelAnimationFrame as any;
global.getComputedStyle = window.getComputedStyle as any;
global.fetch = window.fetch as any;
