export type Position = { x: number; y: number };
export type Dimension = { width: number; height: number };

export type ShapeType = 'rectangle' | 'diamond' | 'ellipse' | 'parallelogram' | 'text';

export type BaseObject = {
    id: string;
    objectType: 'shape' | 'connector' | 'path' | 'sticky-note';
    timestamp: number;
    peerId: string;
    zIndex: number;
    isDeleted?: boolean;
};

export type ShapeObject = BaseObject & {
    objectType: 'shape';
    shapeType: ShapeType;
    position: Position;
    dimension: Dimension;
    fill: string;
    stroke: string;
    text?: string;
};

export type ConnectorObject = BaseObject & {
    objectType: 'connector';
    fromId: string;
    toId: string;
    stroke: string;
    hasArrowhead: boolean;
    label?: string;
};

export type PathObject = BaseObject & {
    objectType: 'path';
    pathData: any;
    stroke: string;
    strokeWidth: number;
};

export type StickyNoteObject = BaseObject & {
    objectType: 'sticky-note';
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    backgroundColor: string;
    textColor: string;
    fontSize: number;
    rotation: number;
};

export type CanvasObject = ShapeObject | ConnectorObject | PathObject | StickyNoteObject;

export type CRDTOperation =
    | { type: 'ADD'; object: CanvasObject; timestamp: number; peerId: string }
    | { type: 'UPDATE'; id: string; changes: Partial<CanvasObject>; timestamp: number; peerId: string }
    | { type: 'DELETE'; id: string; timestamp: number; peerId: string };
