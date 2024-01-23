```typescript
class DeferSync {
  isBeforeApply: boolean = true;
  tasks: Array<() => any> = [];
  constructor() {}

  do(fn: () => any) {
    if (this.isBeforeApply) {
      this.tasks.push(fn);
    } else {
      fn();
    }
  }
  getSync<U>(fn: () => U, fallback: U) {
    return this.isBeforeApply ? fallback : fn();
  }
  apply() {
    this.isBeforeApply = false;
    const { tasks } = this;
    this.tasks = [];
    for (const fn of tasks) {
      fn();
    }
  }
}

type Result<T, E> = Ok<T, E> | Err<T, E>;
class Ok<T, E> {
  value: T;
  constructor(value: T) {
    this.value = value;
  }
}
class Err<T, E> {
  error: E;
  constructor(error: E) {
    this.error = error;
  }
}

type CancelHandler = () => void | Promise<void>;
type CancelableExecutor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
  onCancel: (handler: CancelHandler) => void,
) => void;

class CancelError extends Error {}
class Cancelable<T> extends Promise<T> {
  onCancel: CancelHandler = () => {};
  onFinallySync: () => void = () => {};
  constructor(executor: CancelableExecutor<T>) {
    const afterSuper = new DeferSync();
    super((resolve, reject) => {
      executor(
        (value) => {
          resolve(value);
          afterSuper.do(() => this.onFinallySync());
        },
        (value) => {
          reject(value);
          afterSuper.do(() => this.onFinallySync());
        },
        (handler) => afterSuper.do(() => (this.onCancel = handler)),
      );
    });
    afterSuper.apply();
  }
  cancel() {
    return this.onCancel();
  }

  finallySync(onFinallySync: () => void) {
    this.onFinallySync = onFinallySync;
  }
}
```
