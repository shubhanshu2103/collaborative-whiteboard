import { CRDTStore } from '../store/CRDTStore';
import type { CRDTOperation, CanvasObject } from '../types/crdt';

export class HistoryManager {
    private crdtStore: CRDTStore;
    private undoStack: CRDTOperation[] = [];
    private objectSnapshots: Map<string, CanvasObject> = new Map();
    private isUndoing = false;

    constructor(crdtStore: CRDTStore) {
        this.crdtStore = crdtStore;
    }

    public pushLocalOperation(op: CRDTOperation) {
        if (this.isUndoing) return; // Prevent local loop
        // Only track local operations for undo
        this.undoStack.push(op);
    }

    public snapshotBeforeUpdate(id: string) {
        if (!this.objectSnapshots.has(id)) {
            const currentObj = this.crdtStore.getObject(id);
            if (currentObj) {
                // Deep clone to save state snapshot
                this.objectSnapshots.set(id, JSON.parse(JSON.stringify(currentObj)));
            }
        }
    }

    public clearSnapshot(id: string) {
        this.objectSnapshots.delete(id);
    }

    private getSnapshot(id: string): CanvasObject | undefined {
        return this.objectSnapshots.get(id);
    }

    public undo() {
        if (this.undoStack.length === 0) return;

        const lastOp = this.undoStack.pop();
        if (!lastOp) return;

        this.isUndoing = true; // Block undo ops from re-entering stack
        try {
            switch (lastOp.type) {
                case 'ADD': {
                    // To undo an ADD, we DELETE the object
                    if (lastOp.object?.id) {
                        this.crdtStore.delete(lastOp.object.id, true);
                    }
                    break;
                }
                case 'DELETE': {
                    // To undo a DELETE, we ADD a restored instance with a NEW (latest) timestamp
                    const restoredObj = this.crdtStore.getObject(lastOp.id);
                    if (restoredObj) {
                        const cloned = JSON.parse(JSON.stringify(restoredObj));
                        cloned.isDeleted = false;
                        this.crdtStore.add(cloned, true);
                    }
                    break;
                }
                case 'UPDATE': {
                    // To undo an UPDATE, we REVERT back to the captured state snapshot
                    const snapshot = this.getSnapshot(lastOp.id);
                    if (snapshot) {
                        this.crdtStore.update(lastOp.id, { ...snapshot }, true);
                        this.clearSnapshot(lastOp.id); // Clear after reverting to let future updates snapshot again
                    }
                    break;
                }
            }
        } finally {
            this.isUndoing = false;
        }
    }
}
