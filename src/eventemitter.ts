interface EventEmitterOptions {
  once?: boolean;
}

type EventEmitterListenerItem = EventEmitterOptions & {
  callback: (...args: unknown[]) => void;
};

type EventEmitterBaseEventMap = Record<string, any>;

export type Off = () => void

/**
 * A EventEmitter work like node/event
 */
export class EventEmitter<E extends EventEmitterBaseEventMap> {
  #listeners = {} as Record<keyof E, EventEmitterListenerItem[]>;

  get listeners() {
    return this.#listeners
  }

  set listeners(listeners: Record<keyof E, EventEmitterListenerItem[]>) {
    this.#listeners = Object.fromEntries(
      Object.entries(
        listeners
      ).map(([id, listeners]) =>
        [id, listeners.filter((listener) =>
          listener.callback != null
        )]
      ).filter(([, listeners]) =>
        listeners.length
      )
    )
  }

  constructor(data?: Partial<EventEmitter<any>>) {
    Object.assign(this, data)
  }

  /**
   * Send Event to all listener
   * @param eventName Event Name
   * @param args arguments
   */
  emit<K extends keyof E>(eventName: K, ...args: Parameters<E[K]>) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((item) => {
        if (typeof item.callback === 'function') {
          item.callback(...args)
        }

        if (item.once === true) {
          this.off(eventName, item.callback as E[K])
        }
      })
    }

    return this
  }

  /**
   * Add event listener
   * @param eventName Event Name
   * @param callback Event Callback
   */
  on<K extends keyof E>(
    eventName: K,
    callback: E[K],
    options?: EventEmitterOptions
  ): Off {
    if (!callback) return () => { }

    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    const hasListener = this.listeners[eventName].some(
      (item) => item.callback === callback
    );

    if (!hasListener) {
      this.listeners[eventName].push({ ...options, callback });
    }

    return () => {
      this.off(eventName, callback)
    }
  }

  /**
   * Remove event listener
   * @param eventName Event Name
   * @param callback Event Callback
   */
  off<K extends keyof E>(eventName: K, callback: E[K]) {
    if (!this.listeners[eventName]) {
      return;
    }

    const index = this.listeners[eventName].findIndex(
      (item) => item.callback === callback
    );
    if (index >= 0) {
      this.listeners[eventName].splice(index, 1);
    }

    if (this.listeners[eventName].length === 0) {
      delete this.listeners[eventName];
    }

    return this;
  }

  /**
   * Like on but just run once
   * @param eventName Event Name
   * @param callback Event Callback
   */
  once<K extends keyof E>(eventName: K, callback: E[K]) {
    return this.on(eventName, callback, { once: true });
  }
}
