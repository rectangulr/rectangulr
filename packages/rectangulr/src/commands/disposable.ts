export interface Disposable {
  dispose()
}

export class Disposable {
  constructor(private func) {}

  dispose() {
    this.func()
  }

  static from(...disposables: Disposable[]) {
    return new Disposable(() => {
      for (const disposable of disposables) {
        disposable.dispose()
      }
    })
  }
}
