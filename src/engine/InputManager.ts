export class InputManager {
    keys: { [key: string]: boolean } = {};
    virtualKeys: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Expose to window for easy React access
        (window as any).setVirtualKey = this.setVirtualKey.bind(this);
    }

    private onKeyDown(event: KeyboardEvent) {
        this.keys[event.code] = true;
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        this.keys[event.code] = false;
        if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
            event.preventDefault();
        }
    }

    setVirtualKey(code: string, state: boolean) {
        this.virtualKeys[code] = state;
    }

    isKeyPressed(code: string): boolean {
        return !!this.keys[code] || !!this.virtualKeys[code];
    }

    dispose() {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        window.removeEventListener('keyup', this.onKeyUp.bind(this));
        delete (window as any).setVirtualKey;
    }
}
