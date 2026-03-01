import { fabric } from 'fabric';

export type RecognizedShape = 'ellipse' | 'rectangle' | 'none';

export class ShapeRecognizer {

    /**
     * Attempts to recognize if a freehand fabric path intentionally represents a basic geometric shape.
     * @param path The drawn path object
     * @returns The recognized shape type, or 'none' if it's just a freehand scribble
     */
    public static recognizeShape(path: fabric.Path): RecognizedShape {
        const pathData = path.path;
        if (!pathData || pathData.length < 5) return 'none'; // Too short to be a shape

        // 1. Check if the path is closed (start and end points are close)
        const pathArray = pathData as any[];
        const startPoint = this.getPointFromCmd(pathArray[0]);
        const endPoint = this.getPointFromCmd(pathArray[pathArray.length - 1]);

        if (!startPoint || !endPoint) return 'none';

        const distance = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
            Math.pow(endPoint.y - startPoint.y, 2)
        );

        // If the start and end point of the drawing are very far apart, it's a line/scribble, not a enclosed shape
        const bounds = path.getBoundingRect();
        const maxDimension = Math.max(bounds.width, bounds.height);

        // Strict closure requirement: ends must be within 30% of the shape's max size
        if (distance > maxDimension * 0.35) {
            console.log(`[ShapeRecognizer] Failed Closure Test. Distance: ${distance}, MaxDim: ${maxDimension}`);
            return 'none';
        }

        // 2. Aspect ratio check
        // A perfect circle or square has an aspect ratio of 1.0. 
        // We'll allow anything from 0.5 to 2.0 to be "shape-like"
        const aspectRatio = bounds.width / bounds.height;
        if (aspectRatio < 0.2 || aspectRatio > 5) {
            return 'none'; // Too squished, probably a line or scribble
        }

        // 3. Shape Classification based on Area / Bounding Box Fill Ratio
        // We calculate the rough area of the drawn polygon versus the area of its bounding box.
        const points = this.extractPoints(pathData);
        if (points.length < 3) return 'none';

        const polygonArea = this.calculatePolygonArea(points);
        const bboxArea = bounds.width * bounds.height;

        const fillRatio = Math.abs(polygonArea / bboxArea);

        // Tolerance thresholds based on empiric testing of human drawing
        console.log(`[ShapeRecognizer] Polygon Area: ${polygonArea}, Bbox Area: ${bboxArea}, Fill Ratio: ${fillRatio}`);

        // A perfect rectangle fills exactly 1.0 of its bounding box.
        // A perfect circle fills exactly PI/4 (approx 0.785) of its bounding box.

        // Let's be much more forgiving for hand drawn shapes
        if (fillRatio > 0.80) {
            return 'rectangle';
        } else if (fillRatio > 0.50 && fillRatio <= 0.80) {
            return 'ellipse';
        }

        return 'none';
    }

    private static extractPoints(pathData: any[]): { x: number, y: number }[] {
        const points: { x: number, y: number }[] = [];
        for (const cmd of pathData) {
            const pt = this.getPointFromCmd(cmd);
            if (pt) points.push(pt);
        }
        return points;
    }

    private static getPointFromCmd(cmd: any[]): { x: number, y: number } | null {
        // cmd format: ['M', x, y] or ['L', x, y] or ['Q', cx, cy, x, y] etc
        if (!cmd || cmd.length < 3) return null;

        // The actual coordinate is typically the last two numbers of the command array
        const x = cmd[cmd.length - 2];
        const y = cmd[cmd.length - 1];

        if (typeof x === 'number' && typeof y === 'number') {
            return { x, y };
        }
        return null;
    }

    // Shoelace formula for area
    private static calculatePolygonArea(points: { x: number, y: number }[]): number {
        let area = 0;
        const j = points.length - 1;

        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[i === j ? 0 : i + 1];
            area += (p1.x * p2.y) - (p2.x * p1.y);
        }

        return Math.abs(area / 2.0);
    }
}
