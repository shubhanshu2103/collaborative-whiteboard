import { Square, Type, Diamond, Circle, Hexagon, MousePointer2, ArrowRight, PenLine, StickyNote, Wand2 } from 'lucide-react';
import type { ToolMode } from '../managers/FlowchartManager';
import type { ShapeType } from '../types/crdt';

interface Props {
    mode: ToolMode;
    setMode: (mode: ToolMode, shape?: ShapeType) => void;
    activeShape: ShapeType | null;
}

const FlowchartToolbar = ({ mode, setMode, activeShape }: Props) => {
    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2 bg-white/90 backdrop-blur-xl px-2 py-3 rounded-2xl shadow-xl border border-slate-200/80 drop-shadow-sm transition-all hover:shadow-md">

            <button
                onClick={() => setMode('select')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'select' ? 'bg-primary-100 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Select Mode"
            >
                <MousePointer2 size={20} />
            </button>

            <button
                onClick={() => setMode('draw')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'draw' ? 'bg-primary-100 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Draw (Freehand)"
            >
                <PenLine size={20} />
            </button>

            <button
                onClick={() => setMode('laser')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'laser' ? 'bg-red-100 text-red-600 shadow-sm' : 'text-slate-500 hover:text-red-500 hover:bg-slate-100'}`}
                title="Laser Pointer"
            >
                <Wand2 size={20} />
            </button>

            <div className="w-6 h-px bg-slate-200 my-1"></div>

            <button
                onClick={() => setMode('shape', 'text')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'shape' && activeShape === 'text' ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Text Label"
            >
                <Type size={20} />
            </button>

            <button
                onClick={() => setMode('shape', 'rectangle')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'shape' && activeShape === 'rectangle' ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Rectangle (Process)"
            >
                <Square size={20} />
            </button>

            <button
                onClick={() => setMode('shape', 'ellipse')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'shape' && activeShape === 'ellipse' ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Ellipse"
            >
                <Circle size={20} />
            </button>

            <button
                onClick={() => setMode('shape', 'diamond')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'shape' && activeShape === 'diamond' ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Diamond"
            >
                <Diamond size={20} />
            </button>

            <button
                onClick={() => setMode('shape', 'parallelogram')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'shape' && activeShape === 'parallelogram' ? 'bg-primary-50 text-primary-600 ring-1 ring-primary-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Parallelogram"
            >
                <Hexagon size={20} className="rotate-90" />
            </button>

            <button
                onClick={() => setMode('sticky-note')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'sticky-note' ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-300 shadow-sm' : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50'}`}
                title="Sticky Note"
            >
                <StickyNote size={20} />
            </button>

            <div className="w-6 h-px bg-slate-200 my-1"></div>

            <button
                onClick={() => setMode('connect')}
                className={`p-2.5 rounded-xl transition-colors ${mode === 'connect' ? 'bg-primary-100 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                title="Connect Mode"
            >
                <ArrowRight size={20} />
            </button>
        </div>
    );
};

export default FlowchartToolbar;
