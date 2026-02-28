import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { CRDTStore } from '../store/CRDTStore';
import type { CanvasObject, ConnectorObject, ShapeObject, ShapeType, PathObject } from '../types/crdt';

export type ToolMode = 'select' | 'pan' | 'draw' | 'shape' | 'connect' | 'sticky-note';

export class FlowchartManager {
    public canvas: fabric.Canvas;
    private crdtStore: CRDTStore;
    private mode: ToolMode = 'draw';
    private currentShapeSelection: ShapeType | null = null;
    private connectingFromId: string | null = null;

    private fabricObjectMap: Map<string, fabric.Object> = new Map();
    private unsubscribeCRDT: () => void;

    private currentLine: fabric.Line | null = null; // Temp line for connection mode

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

    public setMode(mode: ToolMode, shapeType: ShapeType | null = null) {
        this.mode = mode;
        this.currentShapeSelection = shapeType;
        this.connectingFromId = null;

        if (this.currentLine) {
            this.canvas.remove(this.currentLine);
            this.currentLine = null;
        }

        if (mode === 'draw') {
            this.canvas.isDrawingMode = true;
            this.canvas.selection = false;
            this.fabricObjectMap.forEach((obj) => obj.set('selectable', false));
        } else if (mode === 'select') {
            this.canvas.isDrawingMode = false;
            this.canvas.selection = true;
            this.fabricObjectMap.forEach((obj) => obj.set('selectable', true));
        } else {
            // Shape or Connect mode
            this.canvas.isDrawingMode = false;
            this.canvas.selection = false;
            this.fabricObjectMap.forEach((obj) => obj.set('selectable', true));
        }
        this.canvas.renderAll();
    }

    public getMode() {
        return this.mode;
    }

    private setupEventListeners() {
        this.canvas.on('object:modified', this.handleObjectModified);
        this.canvas.on('mouse:down', this.handleMouseDown);
        this.canvas.on('mouse:move', this.handleMouseMove);
        this.canvas.on('path:created', this.handlePathCreated);
        this.canvas.on('object:moving', this.handleObjectMoving);
    }

    private removeEventListeners() {
        this.canvas.off('object:modified', this.handleObjectModified);
        this.canvas.off('mouse:down', this.handleMouseDown);
        this.canvas.off('mouse:move', this.handleMouseMove);
        this.canvas.off('path:created', this.handlePathCreated);
        this.canvas.off('object:moving', this.handleObjectMoving);
    }

    private handleObjectMoving = (e: fabric.IEvent) => {
        if (!e.target) return;
        const target = e.target as any;
        if (!target.id) return;

        // If a shape is moving, we should update all connectors attached to it immediately locally
        const id = target.id;
        this.updateConnectorsForShape(id);
    };

    private updateConnectorsForShape(shapeId: string) {
        const objects = this.crdtStore.getObjects();
        objects.forEach((obj) => {
            if (obj.objectType === 'connector' && !obj.isDeleted) {
                if (obj.fromId === shapeId || obj.toId === shapeId) {
                    this.redrawConnector(obj as ConnectorObject);
                }
            }
        });
    }

    private redrawConnector(connector: ConnectorObject) {
        const line = this.fabricObjectMap.get(connector.id) as fabric.Line;
        if (!line) return;

        const fromShape = this.fabricObjectMap.get(connector.fromId);
        const toShape = this.fabricObjectMap.get(connector.toId);
        if (!fromShape || !toShape) return;

        // Calculate center to center for now, or edge points
        const fromCenter = fromShape.getCenterPoint();
        const toCenter = toShape.getCenterPoint();

        line.set({
            x1: fromCenter.x,
            y1: fromCenter.y,
            x2: toCenter.x,
            y2: toCenter.y
        });
        line.setCoords();
        this.canvas.requestRenderAll();
    }

    private handleObjectModified = (e: fabric.IEvent) => {
        if (!e.target) return;
        const target = e.target as any;
        if (!target.id) return;

        if (target.type === 'path') {
            // freehand path update logic if you choose to track movement
        } else if (target.isFlowchartShape) {
            // Convert Scale values into physical Base Coordinates
            const newWidth = target.width * target.scaleX;
            const newHeight = target.height * target.scaleY;

            this.crdtStore.update(target.id, {
                position: { x: target.left, y: target.top },
                dimension: {
                    width: newWidth,
                    height: newHeight
                }
            });

            // Send connector updates as well
            const id = target.id;
            this.updateConnectorsForShape(id);
        }
    };

    private handlePathCreated = (e: any) => {
        const path = e.path;
        path.id = uuidv4();

        // Disable selectable if we want
        path.selectable = (this.mode === 'select');

        // Add to CRDT
        this.crdtStore.add({
            id: path.id,
            objectType: 'path',
            timestamp: Date.now(),
            peerId: '', // store sets it properly in add method
            zIndex: 0,
            pathData: path.toJSON(),
            stroke: path.stroke,
            strokeWidth: path.strokeWidth
        } as PathObject);

        this.fabricObjectMap.set(path.id, path);
    };

    private handleMouseDown = (e: fabric.IEvent) => {
        if (this.mode === 'shape' && this.currentShapeSelection) {
            const pointer = this.canvas.getPointer(e.e);
            this.addShape(this.currentShapeSelection, pointer.x, pointer.y);
            // Revert back to select mode automatically or keep it? Let's revert to select.
            this.setMode('select');
        } else if (this.mode === 'connect') {
            const target = e.target as any;
            if (target && target.id && target.isFlowchartShape) {
                if (!this.connectingFromId) {
                    this.connectingFromId = target.id;
                    const pointer = this.canvas.getPointer(e.e);
                    // Start drawing temp line
                    const center = target.getCenterPoint();
                    this.currentLine = new fabric.Line([center.x, center.y, pointer.x, pointer.y], {
                        stroke: 'black',
                        strokeWidth: 2,
                        selectable: false,
                        evented: false
                    });
                    this.canvas.add(this.currentLine);
                } else {
                    if (this.connectingFromId !== target.id) {
                        this.addConnector(this.connectingFromId, target.id);
                    }
                    this.connectingFromId = null;
                    if (this.currentLine) {
                        this.canvas.remove(this.currentLine);
                        this.currentLine = null;
                    }
                    this.setMode('select');
                }
            } else {
                // Clicked empty space
                this.connectingFromId = null;
                if (this.currentLine) {
                    this.canvas.remove(this.currentLine);
                    this.currentLine = null;
                }
            }
        }
    };

    private handleMouseMove = (e: fabric.IEvent) => {
        if (this.mode === 'connect' && this.connectingFromId && this.currentLine) {
            const pointer = this.canvas.getPointer(e.e);
            this.currentLine.set({ x2: pointer.x, y2: pointer.y });
            this.canvas.requestRenderAll();
        }
    };

    private createFabricShapeFromCRDT(obj: ShapeObject): fabric.Object {
        const commonOpts = {
            left: obj.position.x,
            top: obj.position.y,
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: 2,
            width: obj.dimension.width,
            height: obj.dimension.height,
            selectable: this.mode === 'select',
            originX: 'center',
            originY: 'center',
        };

        let fabricShape: fabric.Object;
        switch (obj.shapeType) {
            case 'rectangle':
                fabricShape = new fabric.Rect(commonOpts);
                break;
            case 'ellipse':
                fabricShape = new fabric.Ellipse({
                    ...commonOpts,
                    rx: obj.dimension.width / 2,
                    ry: obj.dimension.height / 2
                });
                break;
            case 'diamond':
                fabricShape = new fabric.Polygon([
                    { x: obj.dimension.width / 2, y: 0 },
                    { x: obj.dimension.width, y: obj.dimension.height / 2 },
                    { x: obj.dimension.width / 2, y: obj.dimension.height },
                    { x: 0, y: obj.dimension.height / 2 },
                ], commonOpts as any);
                break;
            case 'parallelogram':
                fabricShape = new fabric.Polygon([
                    { x: 20, y: 0 },
                    { x: obj.dimension.width, y: 0 },
                    { x: obj.dimension.width - 20, y: obj.dimension.height },
                    { x: 0, y: obj.dimension.height },
                ], commonOpts as any);
                break;
            case 'text':
                fabricShape = new fabric.Rect({ ...commonOpts, fill: 'transparent', stroke: 'transparent' });
                break;
            default:
                fabricShape = new fabric.Rect(commonOpts);
        }

        // Limit allowed scaling controls for optimal usability
        fabricShape.setControlsVisibility({
            mt: false, // middle top
            mb: false, // middle bottom
            ml: false, // middle left
            mr: false, // middle right
        });

        const isLockUniScaling = obj.shapeType === 'diamond' || obj.shapeType === 'ellipse';

        const groupOpts = {
            left: obj.position.x,
            top: obj.position.y,
            originX: 'center',
            originY: 'center',
            selectable: this.mode === 'select',
            subTargetCheck: false,
            hasControls: true,
            lockUniScaling: isLockUniScaling
        };

        let retObj: fabric.Object = fabricShape;

        const textObj = new fabric.IText(obj.text || '', {
            fontSize: 16,
            fontFamily: 'arial',
            originX: 'center',
            originY: 'center',
            textAlign: 'center',
            selectable: false,
            left: 0,
            top: 0
        });
        // CRITICAL: reset inner absolute coords so Group bounds encapsulate perfectly!
        fabricShape.set({ left: 0, top: 0, originX: 'center', originY: 'center' });
        retObj = new fabric.Group([fabricShape, textObj], groupOpts as any);

        // Ensure final object returned respects scaling locks
        retObj.setControlsVisibility({
            mt: false, // middle top
            mb: false, // middle bottom
            ml: false, // middle left
            mr: false, // middle right
        });

        (retObj as any).id = obj.id;
        (retObj as any).isFlowchartShape = true;
        return retObj;
    }

    private addShape(type: ShapeType, x: number, y: number) {
        const id = uuidv4();
        const obj: ShapeObject = {
            id,
            objectType: 'shape',
            shapeType: type,
            position: { x, y },
            dimension: { width: 100, height: 60 },
            fill: '#ffffff',
            stroke: '#000000',
            text: '', // Start empty
            timestamp: 0,
            peerId: '',
            zIndex: 1
        };

        this.crdtStore.add(obj);
        // Will be rendered via CRDT hook, but we can do it locally for performance
        this.renderObject(obj);
    }

    private addConnector(fromId: string, toId: string) {
        const id = uuidv4();
        const obj: ConnectorObject = {
            id,
            objectType: 'connector',
            fromId,
            toId,
            stroke: '#000000',
            hasArrowhead: true,
            timestamp: 0,
            peerId: '',
            zIndex: 0
        };

        this.crdtStore.add(obj);
        this.renderObject(obj);
    }

    private applyRemoteOperation(op: any) {
        if (op.type === 'DELETE') {
            const fabricObj = this.fabricObjectMap.get(op.id);
            if (fabricObj) {
                this.canvas.remove(fabricObj);
                this.fabricObjectMap.delete(op.id);
            }
        } else if (op.type === 'ADD' || op.type === 'UPDATE') {
            this.renderObject(op.object || this.crdtStore.getObject(op.id));
        }
        this.canvas.requestRenderAll();
    }

    public renderObject(obj: CanvasObject | undefined) {
        if (!obj || obj.isDeleted) {
            if (obj && obj.id) {
                const existing = this.fabricObjectMap.get(obj.id);
                if (existing) {
                    this.canvas.remove(existing);
                    this.fabricObjectMap.delete(obj.id);
                }
            }
            return;
        }

        const existing = this.fabricObjectMap.get(obj.id);

        if (obj.objectType === 'path') {
            if (!existing) {
                fabric.util.enlivenObjects([obj.pathData], (objects: any[]) => {
                    const pathObj = objects[0];
                    pathObj.id = obj.id;
                    pathObj.selectable = this.mode === 'select';
                    this.canvas.add(pathObj);
                    this.fabricObjectMap.set(obj.id, pathObj);
                    this.canvas.sendToBack(pathObj);
                    this.canvas.requestRenderAll();
                }, 'fabric');
            }
        } else if (obj.objectType === 'shape') {
            if (existing) {
                // Check if text has changed to trigger a structural rebuild.
                let structuralChange = false;
                if ((existing as fabric.Group).isType('group')) {
                    const textObj = (existing as fabric.Group).item(1) as unknown as fabric.IText;
                    if (textObj && textObj.text !== (obj.text || '')) {
                        structuralChange = true;
                    }
                }

                if (structuralChange) {
                    const wasSelected = this.canvas.getActiveObject() === existing;
                    this.canvas.remove(existing);
                    const shape = this.createFabricShapeFromCRDT(obj);
                    this.canvas.add(shape);
                    this.fabricObjectMap.set(obj.id, shape);
                    if (wasSelected) {
                        this.canvas.setActiveObject(shape);
                    }
                } else {
                    existing.set({
                        left: obj.position.x,
                        top: obj.position.y,
                        scaleX: obj.dimension.width / (existing.width || 1),
                        scaleY: obj.dimension.height / (existing.height || 1),
                    });
                    existing.setCoords();
                }
            } else {
                const shape = this.createFabricShapeFromCRDT(obj);
                this.canvas.add(shape);
                this.fabricObjectMap.set(obj.id, shape);
            }
        } else if (obj.objectType === 'connector') {
            if (existing) {
                this.redrawConnector(obj);
            } else {
                const fromShape = this.fabricObjectMap.get(obj.fromId);
                const toShape = this.fabricObjectMap.get(obj.toId);

                // Use default points if shape not completely loaded yet, but typically it is
                let x1 = 0, y1 = 0, x2 = 100, y2 = 100;
                if (fromShape && toShape) {
                    const p1 = fromShape.getCenterPoint();
                    const p2 = toShape.getCenterPoint();
                    x1 = p1.x; y1 = p1.y; x2 = p2.x; y2 = p2.y;
                }

                const line = new fabric.Line([x1, y1, x2, y2], {
                    stroke: obj.stroke,
                    strokeWidth: 2,
                    selectable: false,
                    evented: false
                });
                (line as any).id = obj.id;
                this.canvas.add(line);
                this.fabricObjectMap.set(obj.id, line);
                this.canvas.sendToBack(line);
            }
        }

        // After rendering a shape, we need to make sure connectors attached are redrawn
        if (obj.objectType === 'shape' && existing) {
            this.updateConnectorsForShape(obj.id);
        }
    }
}
