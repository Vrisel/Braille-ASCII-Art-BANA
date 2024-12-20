declare function $<K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K] | null;
declare function $<E extends HTMLElement = HTMLElement>(selectors: string): E | null;
declare function $$<K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
declare function $$<E extends HTMLElement = HTMLElement>(selectors: string): NodeListOf<E>;
declare function on<E extends HTMLElement, K extends keyof HTMLElementEventMap>(elements: E | null, type: K, listener: (this: E, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
declare function on<E extends HTMLElement>(elements: E | null, type: string, listener: (this: E, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
declare function on<E extends HTMLElement, K extends keyof HTMLElementEventMap>(elements: NodeListOf<E>, type: K, listener: (this: E, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
declare function on<E extends HTMLElement>(elements: NodeListOf<E>, type: string, listener: (this: E, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
declare function on<E extends HTMLElement, K extends keyof HTMLElementEventMap>(elements: Array<E | null>, type: K, listener: (this: E, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
declare function on<E extends HTMLElement>(elements: Array<E | null>, type: string, listener: (this: E, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
declare function on<K extends keyof HTMLElementEventMap>(elements: Document, type: K, listener: (this: Document, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
declare function on(elements: Document, type: string, listener: (this: Document, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
export declare function rgbaOffset(x: number, y: number, width: number): number;
export { $, $$, on, };
