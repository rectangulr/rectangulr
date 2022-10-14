"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Disposable = void 0;
class Disposable {
    constructor(func) {
        this.func = func;
    }
    dispose() {
        this.func();
    }
    static from(...disposables) {
        return new Disposable(() => {
            for (const disposable of disposables) {
                disposable.dispose();
            }
        });
    }
}
exports.Disposable = Disposable;
