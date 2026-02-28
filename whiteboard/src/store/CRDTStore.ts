import type { CanvasObject, CRDTOperation } from '../types/crdt';

export type CRDTListener = (objects: Map<string, CanvasObject>, operation: CRDTOperation, isRemote: boolean, isUndo?: boolean) => void;

export class CRDTStore {
    private objects: Map<string, CanvasObject> = new Map();
    private peerId: string;
    private listeners: Set<CRDTListener> = new Set();
    private emitNetworkOperation: (op: CRDTOperation) => void;
    private localOperationHistoryCallback?: (op: CRDTOperation) => void;

    constructor(peerId: string, emitNetworkOperation: (op: CRDTOperation) => void) {
        this.peerId = peerId;
        this.emitNetworkOperation = emitNetworkOperation;
    }

    public setHistoryCallback(callback: (op: CRDTOperation) => void) {
        this.localOperationHistoryCallback = callback;
    }

    public getObjects(): Map<string, CanvasObject> {
        return this.objects;
    }

    public getObject(id: string): CanvasObject | undefined {
        return this.objects.get(id);
    }

    public subscribe(listener: CRDTListener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(op: CRDTOperation, isRemote: boolean, isUndo: boolean = false) {
        for (const listener of this.listeners) {
            listener(this.objects, op, isRemote, isUndo);
        }
    }

    // Local operations
    public add(object: CanvasObject, isUndo: boolean = false) {
        const op: CRDTOperation = { type: 'ADD', object, timestamp: Date.now(), peerId: this.peerId };
        this.applyOperation(op, false, isUndo);
        this.emitNetworkOperation(op);
        if (this.localOperationHistoryCallback && !isUndo) this.localOperationHistoryCallback(op);
    }

    public update(id: string, changes: Partial<CanvasObject>, isUndo: boolean = false) {
        const op: CRDTOperation = { type: 'UPDATE', id, changes, timestamp: Date.now(), peerId: this.peerId };
        this.applyOperation(op, false, isUndo);
        this.emitNetworkOperation(op);
        if (this.localOperationHistoryCallback && !isUndo) this.localOperationHistoryCallback(op);
    }

    public delete(id: string, isUndo: boolean = false) {
        const op: CRDTOperation = { type: 'DELETE', id, timestamp: Date.now(), peerId: this.peerId };
        this.applyOperation(op, false, isUndo);
        this.emitNetworkOperation(op);
        if (this.localOperationHistoryCallback && !isUndo) this.localOperationHistoryCallback(op);
    }

    // Remote operations from network
    public applyRemoteOperation(op: CRDTOperation) {
        this.applyOperation(op, true);
    }

    private applyOperation(op: CRDTOperation, isRemote: boolean, isUndo: boolean = false) {
        switch (op.type) {
            case 'ADD': {
                const existing = this.objects.get(op.object.id);
                if (!existing || existing.timestamp <= op.timestamp) {
                    this.objects.set(op.object.id, op.object);
                    this.notifyListeners(op, isRemote, isUndo);
                }
                break;
            }
            case 'UPDATE': {
                const existing = this.objects.get(op.id);
                if (existing) {
                    // Simple LWW check based on operation timestamp
                    if (existing.timestamp <= op.timestamp) {
                        const updated = { ...existing };
                        for (const key in op.changes) {
                            if (op.changes.hasOwnProperty(key)) {
                                (updated as any)[key] = (op.changes as any)[key];
                            }
                        }
                        updated.timestamp = op.timestamp;
                        this.objects.set(op.id, updated as CanvasObject);
                        this.notifyListeners(op, isRemote, isUndo);
                    }
                }
                break;
            }
            case 'DELETE': {
                const existing = this.objects.get(op.id);
                if (existing) {
                    if (existing.timestamp <= op.timestamp) {
                        existing.isDeleted = true;
                        existing.timestamp = op.timestamp;
                        this.objects.set(op.id, existing);
                        this.notifyListeners(op, isRemote, isUndo);
                    }
                }
                break;
            }
        }
    }
}
