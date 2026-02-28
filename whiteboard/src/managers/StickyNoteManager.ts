import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { CRDTStore } from '../store/CRDTStore';
import type { StickyNoteObject, CanvasObject } from '../types/crdt';
import type { ToolMode } from './FlowchartManager';

export class StickyNoteManager {
    public canvas: fabric.Canvas;
    private crdtStore: CRDTStore;
    private mode: ToolMode = 'draw';
    private fabricObjectMap: Map<string, fabric.Object> = new Map();
    private unsubscribeCRDT: () => void;

    constructor(canvas: fabric.Canvas, crdtStore: CRDTStore) {
        this.canvas = canvas;
        this.crdtStore = crdtStore;

        this.unsubscribeCRDT = this.crdtStore.subscribe((_objects, op, isRemote, isUndo) => {
            if (isRemote || isUndo) {
                this.applyRemoteOperation(op);
            }
        });

        this.setupEventListeners();
    }

    public dispose() {
        this.unsubscribeCRDT();
        this.removeEventListeners();
    }

    public setMode(mode: ToolMode) {
        this.mode = mode;
        if (mode === 'draw') {
            this.fabricObjectMap.forEach(obj => obj.set('selectable', false));
        } else if (mode === 'select' || mode === 'sticky-note') {
            this.fabricObjectMap.forEach(obj => obj.set('selectable', true));
        } else {
            this.fabricObjectMap.forEach(obj => obj.set('selectable', true));
        }
    }

    private setupEventListeners() {
        this.canvas.on('mouse:down', this.handleMouseDown);
        this.canvas.on('object:modified', this.handleObjectModified);
        this.canvas.on('mouse:dblclick', this.handleDoubleClick);
        this.canvas.on('mousedblclick', this.handleDoubleClick);
    }

    private removeEventListeners() {
        this.canvas.off('mouse:down', this.handleMouseDown);
        this.canvas.off('object:modified', this.handleObjectModified);
        this.canvas.off('mouse:dblclick', this.handleDoubleClick);
        this.canvas.off('mousedblclick', this.handleDoubleClick);
    }

    private handleMouseDown = (e: fabric.IEvent) => {
        if (this.mode === 'sticky-note') {
            const pointer = this.canvas.getPointer(e.e);
            this.addStickyNote(pointer.x, pointer.y);
            // Optionally, we don't reset the mode right away, let external control do it,
            // but for smooth UX, returning to select is common.
            // But we actually fire a 'mode-change' locally, since we can't let Whiteboard know easily.
            // Leaving it as it depends on Whiteboard's handleSetMode.
            // In FlowchartManager it did setMode('select').
            this.setMode('select');

            // To sync the UI state properly we might need a callback, or just let the user re-select tool.
        }
    };

    private handleDoubleClick = (e: fabric.IEvent) => {
        if (!e.target || !(e.target as any).isStickyNote) return;

        const group = e.target as fabric.Group;
        const textObject = group.getObjects().find((obj) => obj.type === 'textbox') as fabric.Textbox;

        if (textObject) {
            this.startTextEditing(group, textObject);
        }
    };

    private startTextEditing(group: fabric.Group, textObject: fabric.Textbox) {
        group.visible = false;

        // create a temporary textbox outside the group
        const tempText = new fabric.Textbox(textObject.text || '', {
            left: group.left,
            top: group.top,
            width: textObject.width! * group.scaleX!,
            fontSize: textObject.fontSize! * group.scaleX!,
            fontFamily: textObject.fontFamily,
            fill: textObject.fill,
            textAlign: textObject.textAlign,
            backgroundColor: 'transparent',
            editingBorderColor: 'transparent',
            hasControls: false,
            hasBorders: false,
            originX: 'center',
            originY: 'center'
        });

        (tempText as any).stickyId = (group as any).id;
        (tempText as any).originalGroup = group;
        (tempText as any).originalText = textObject;

        tempText.on('editing:exited', () => {
            this.handleTextEditingExited({ target: tempText } as any);
        });

        tempText.on('deselected', () => {
            if (tempText.isEditing) {
                tempText.exitEditing();
            }
        });

        this.canvas.add(tempText);
        this.canvas.setActiveObject(tempText);

        setTimeout(() => {
            tempText.enterEditing();
            tempText.selectAll();
            this.canvas.requestRenderAll();
        }, 50);
    }

    private handleTextEditingExited = (e: fabric.IEvent) => {
        const target = e.target as any;
        if (!target || !target.stickyId) return;

        const newText = target.text;
        const stickyId = target.stickyId;
        const group = target.originalGroup;

        this.canvas.remove(target);
        group.visible = true;

        this.crdtStore.update(stickyId, { text: newText });

        // Update locally
        this.updateStickyNoteFabric(stickyId, { text: newText });

        this.canvas.requestRenderAll();
    };

    private handleObjectModified = (e: fabric.IEvent) => {
        if (!e.target) return;
        const target = e.target as any;
        if (!target.id || !target.isStickyNote) return;

        const newWidth = target.width * target.scaleX;
        const newHeight = target.height * target.scaleY;

        this.crdtStore.update(target.id, {
            x: target.left,
            y: target.top,
            width: newWidth,
            height: newHeight
        });

        // We could reset scale locally (target.set({ scaleX: 1, scaleY: 1, width: newWidth, height: newHeight }))
        // but that might mess up children text sizes un-proportionally unless handled perfectly. Let's keep native scale.
    };

    private addStickyNote(x: number, y: number) {
        const id = uuidv4();
        const obj: StickyNoteObject = {
            id,
            objectType: 'sticky-note',
            x,
            y,
            width: 200,
            height: 200,
            text: 'Double click to edit',
            backgroundColor: '#fef3c7', // pastel yellow
            textColor: '#1f2937',
            fontSize: 24,
            rotation: 0,
            timestamp: 0,
            peerId: '',
            zIndex: 1
        };

        this.crdtStore.add(obj);
        this.renderObject(obj);
    }

    private createFabricShapeFromCRDT(obj: StickyNoteObject): fabric.Object {
        const rect = new fabric.Rect({
            width: obj.width,
            height: obj.height,
            fill: obj.backgroundColor,
            rx: 8,
            ry: 8,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.1)',
                blur: 10,
                offsetX: 2,
                offsetY: 4
            }),
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0
        });

        const text = new fabric.Textbox(obj.text, {
            width: obj.width - 24,
            fontSize: obj.fontSize,
            fontFamily: 'arial',
            fill: obj.textColor,
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            splitByGrapheme: true,
            left: 0,
            top: 0
        });

        const group = new fabric.Group([rect, text], {
            left: obj.x,
            top: obj.y,
            originX: 'center',
            originY: 'center',
            selectable: this.mode === 'select',
            hasRotatingPoint: false,
        });

        group.setControlsVisibility({
            mt: false,
            mb: false,
            ml: false,
            mr: false,
        });

        (group as any).id = obj.id;
        (group as any).isStickyNote = true;

        return group;
    }

    public updateStickyNoteFabric(id: string, updates: Partial<StickyNoteObject>) {
        const group = this.fabricObjectMap.get(id) as fabric.Group;
        if (!group) return;

        group.set({
            left: updates.x !== undefined ? updates.x : group.left,
            top: updates.y !== undefined ? updates.y : group.top,
        });

        if (updates.width !== undefined || updates.height !== undefined) {
            // Keep native scale if we adjusted from remote
            const newScaleX = updates.width !== undefined ? updates.width / (group.width || 1) : group.scaleX;
            const newScaleY = updates.height !== undefined ? updates.height / (group.height || 1) : group.scaleY;
            group.set({ scaleX: newScaleX, scaleY: newScaleY });
        }

        if (updates.text !== undefined || updates.backgroundColor !== undefined) {
            const rect = group.getObjects()[0] as fabric.Rect;
            const text = group.getObjects()[1] as fabric.Textbox;
            if (updates.text !== undefined) {
                text.set({ text: updates.text });
            }
            if (updates.backgroundColor !== undefined) {
                rect.set({ fill: updates.backgroundColor });
            }
        }

        group.setCoords();
    }

    private applyRemoteOperation(op: any) {
        if (op.type === 'DELETE') {
            const fabricObj = this.fabricObjectMap.get(op.id);
            if (fabricObj) {
                this.canvas.remove(fabricObj);
                this.fabricObjectMap.delete(op.id);
            }
        } else if (op.type === 'ADD' || op.type === 'UPDATE') {
            const objData = op.object || this.crdtStore.getObject(op.id);
            if (objData && objData.objectType === 'sticky-note') {
                this.renderObject(objData as StickyNoteObject);
            }
        }
        this.canvas.requestRenderAll();
    }

    public renderObject(obj: CanvasObject | undefined) {
        if (!obj || obj.objectType !== 'sticky-note') return;

        if (obj.isDeleted) {
            const existing = this.fabricObjectMap.get(obj.id);
            if (existing) {
                this.canvas.remove(existing);
                this.fabricObjectMap.delete(obj.id);
            }
            return;
        }

        const stickyObj = obj as StickyNoteObject;
        const existing = this.fabricObjectMap.get(stickyObj.id);

        if (existing) {
            this.updateStickyNoteFabric(stickyObj.id, stickyObj);
        } else {
            const shape = this.createFabricShapeFromCRDT(stickyObj);
            this.canvas.add(shape);
            this.fabricObjectMap.set(stickyObj.id, shape);
        }
    }
}
