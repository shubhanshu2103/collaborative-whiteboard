import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { io, Socket } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft, Download, Trash2, Undo2, Image as ImageIcon, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import Chat from './components/Chat';
import { useUser, UserButton } from '@clerk/clerk-react';
import { CRDTStore } from './store/CRDTStore';
import { FlowchartManager } from './managers/FlowchartManager';
import { HistoryManager } from './managers/HistoryManager';
import { StickyNoteManager } from './managers/StickyNoteManager';
import type { ToolMode } from './managers/FlowchartManager';
import type { ShapeType } from './types/crdt';
import FlowchartToolbar from './components/FlowchartToolbar';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

// Moved outside the component to keep the code clean and prevent re-rendering issues
const getRandomColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const Whiteboard = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const roomId = sessionId;
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [chatOpen, setChatOpen] = useState(false);

    const [toolMode, setToolMode] = useState<ToolMode>('draw');
    const [activeShape, setActiveShape] = useState<ShapeType | null>(null);
    const [selectedObjectInfo, setSelectedObjectInfo] = useState<{ id: string, text: string, x: number, y: number, w: number, h: number } | null>(null);
    const crdtStoreRef = useRef<CRDTStore | null>(null);
    const flowManagerRef = useRef<FlowchartManager | null>(null);
    const stickyNoteManagerRef = useRef<StickyNoteManager | null>(null);
    const historyManagerRef = useRef<HistoryManager | null>(null);

    // Clerk instantly provides the logged-in user's data!
    const { user } = useUser();
    const username = user?.firstName || 'User';

    // History for Undo/Redo
    const [history, setHistory] = useState<string[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    // Remote Cursors
    const cursorsRef = useRef<Map<string, fabric.Group>>(new Map());

    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.emit('join-room', roomId);

        const canvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: true,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 'transparent',
        });

        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;

        setFabricCanvas(canvas);

        const store = new CRDTStore(newSocket.id || 'unknown-peer', (op) => {
            newSocket.emit('crdt-operation', { roomId, operation: op });
        });
        crdtStoreRef.current = store;

        const manager = new FlowchartManager(canvas, store);
        flowManagerRef.current = manager;

        const stickyManager = new StickyNoteManager(canvas, store);
        stickyNoteManagerRef.current = stickyManager;

        const historyManager = new HistoryManager(store);
        historyManagerRef.current = historyManager;

        store.setHistoryCallback((op) => {
            historyManager.pushLocalOperation(op);
        });

        // Add object snapshot capture before mutation for UPDATE crrts
        canvas.on('object:scaling', (e) => {
            if (e.target && (e.target as any).id) {
                historyManager.snapshotBeforeUpdate((e.target as any).id);
            }
        });
        canvas.on('object:moving', (e) => {
            if (e.target && (e.target as any).id) {
                historyManager.snapshotBeforeUpdate((e.target as any).id);
            }
        });

        newSocket.on('crdt-operation', (op: any) => {
            store.applyRemoteOperation(op);
        });

        newSocket.on('draw-line', (data: any) => {
            fabric.util.enlivenObjects([data], (objects: any[]) => {
                objects.forEach((obj) => {
                    canvas.add(obj);
                });
                canvas.renderAll();
            }, 'fabric');
        });

        newSocket.on('clear', () => {
            canvas.clear();
            canvas.backgroundColor = 'transparent';
            canvas.renderAll();
        });

        newSocket.on('cursor-move', ({ username: remoteUser, x, y, socketId }) => {
            if (!canvas) return;

            const cursors = cursorsRef.current;
            let cursor = cursors.get(socketId);

            if (!cursor) {
                const cursorText = new fabric.Text(remoteUser, {
                    fontSize: 12,
                    left: 10,
                    top: 0,
                    fill: 'white',
                    backgroundColor: getRandomColor(socketId),
                    originX: 'left',
                    originY: 'bottom'
                });

                const cursorIcon = new fabric.Circle({
                    radius: 5,
                    fill: getRandomColor(socketId),
                    left: 0,
                    top: 0
                });

                cursor = new fabric.Group([cursorIcon, cursorText], {
                    left: x,
                    top: y,
                    selectable: false,
                    evented: false,
                    originX: 'left',
                    originY: 'top'
                });

                canvas.add(cursor);
                cursors.set(socketId, cursor);
            } else {
                cursor.set({ left: x, top: y });
                cursor.setCoords();
            }

            canvas.renderAll();
        });

        const handleResize = () => {
            canvas.setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (flowManagerRef.current) {
                flowManagerRef.current.dispose();
            }
            if (stickyNoteManagerRef.current) {
                stickyNoteManagerRef.current.dispose();
            }
            newSocket.disconnect();
            canvas.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, [roomId, navigate]);

    useEffect(() => {
        if (!fabricCanvas) return;
        fabricCanvas.freeDrawingBrush.color = color;
        fabricCanvas.freeDrawingBrush.width = brushSize;
    }, [color, brushSize, fabricCanvas]);

    useEffect(() => {
        if (!fabricCanvas) return;
        if (history.length === 0) {
            const emptyState = JSON.stringify(fabricCanvas.toJSON());
            setHistory([emptyState]);
            setHistoryStep(0);
        }
    }, [fabricCanvas]);

    useEffect(() => {
        if (!fabricCanvas || !socket || !roomId) return;

        const handlePathCreated = () => {
            if (historyStep < history.length - 1) {
                history.length = historyStep + 1;
            }
            const json = JSON.stringify(fabricCanvas);
            setHistory([...history, json]);
            setHistoryStep(prev => prev + 1);

            // Network sync is now handled by FlowchartManager via CRDTStore
        };

        const handleMouseMove = (opt: fabric.IEvent) => {
            if (!opt.pointer) return;
            socket.emit('cursor-move', {
                roomId,
                username,
                x: opt.pointer.x,
                y: opt.pointer.y
            });
        };

        const handleSelection = () => {
            const active = fabricCanvas.getActiveObject() as any;
            if (active && active.isFlowchartShape && active.id) {
                const shapeId = active.id;
                const crdtObj = crdtStoreRef.current?.getObject(shapeId) as any;
                const bounds = active.getBoundingRect();

                setSelectedObjectInfo({
                    id: shapeId,
                    text: crdtObj?.text || '',
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top + bounds.height / 2,
                    w: bounds.width,
                    h: bounds.height
                });
            } else {
                setSelectedObjectInfo(null);
            }
        };

        const handleObjectDrag = () => {
            const active = fabricCanvas.getActiveObject() as any;
            if (active && active.isFlowchartShape && active.id && selectedObjectInfo) {
                const bounds = active.getBoundingRect();
                setSelectedObjectInfo(prev => prev ? {
                    ...prev,
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top + bounds.height / 2,
                    w: bounds.width,
                    h: bounds.height
                } : null);
            }
        };

        fabricCanvas.on('selection:created', handleSelection);
        fabricCanvas.on('selection:updated', handleSelection);
        fabricCanvas.on('selection:cleared', handleSelection);
        fabricCanvas.on('object:moving', handleObjectDrag);
        fabricCanvas.on('object:scaling', handleObjectDrag);
        fabricCanvas.on('path:created', handlePathCreated);
        fabricCanvas.on('mouse:move', handleMouseMove);

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (historyManagerRef.current) {
                    historyManagerRef.current.undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            fabricCanvas.off('selection:created', handleSelection);
            fabricCanvas.off('selection:updated', handleSelection);
            fabricCanvas.off('selection:cleared', handleSelection);
            fabricCanvas.off('object:moving', handleObjectDrag);
            fabricCanvas.off('object:scaling', handleObjectDrag);
            fabricCanvas.off('path:created', handlePathCreated);
            fabricCanvas.off('mouse:move', handleMouseMove);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [fabricCanvas, socket, history, historyStep, roomId, username]);

    const handleSetMode = (mode: ToolMode, shape?: ShapeType) => {
        setToolMode(mode);
        setActiveShape(shape || null);
        if (flowManagerRef.current) {
            flowManagerRef.current.setMode(mode, shape);
        }
        if (stickyNoteManagerRef.current) {
            stickyNoteManagerRef.current.setMode(mode);
        }
    };

    // --- Toolbar Actions ---

    const clearBoard = () => {
        if (fabricCanvas && socket && roomId) {
            fabricCanvas.clear();
            fabricCanvas.backgroundColor = 'transparent';
            fabricCanvas.renderAll();
            socket.emit('clear', roomId);
        }
    };

    const withWhiteBackground = (action: () => void) => {
        if (!fabricCanvas) return;
        const originalBg = fabricCanvas.backgroundColor;
        fabricCanvas.backgroundColor = 'white';
        fabricCanvas.renderAll();
        action();
        fabricCanvas.backgroundColor = originalBg;
        fabricCanvas.renderAll();
    };

    const saveImage = () => {
        withWhiteBackground(() => {
            const dataURL = fabricCanvas!.toDataURL({ format: 'png' });
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `whiteboard-session-${roomId}.png`;
            link.click();
        });
    };

    const savePDF = () => {
        withWhiteBackground(() => {
            const imgData = fabricCanvas!.toDataURL({ format: 'png' });
            const pdf = new jsPDF({
                orientation: 'landscape',
            });
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`whiteboard-session-${roomId}.pdf`);
        });
    };

    const undo = () => {
        // Freehand fallback
        if (fabricCanvas && historyStep > 0 && toolMode === 'draw') {
            const prevStep = historyStep - 1;
            setHistoryStep(prevStep);
            fabricCanvas.loadFromJSON(history[prevStep], () => {
                fabricCanvas.renderAll();
                fabricCanvas.isDrawingMode = true;
            });
        }

        // CRDT native operation undo
        if (historyManagerRef.current) {
            historyManagerRef.current.undo();
        }
    };

    const leaveSession = () => {
        navigate('/');
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
            {/* Subtle Dot Grid Background */}
            <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 0)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Toolbar for Flowchart System */}
            <FlowchartToolbar mode={toolMode} setMode={handleSetMode} activeShape={activeShape} />

            {/* Shape Text Bar */}
            {selectedObjectInfo && toolMode === 'select' && (
                <div
                    className="absolute z-10 flex flex-col justify-center items-center pointer-events-none"
                    style={{
                        left: selectedObjectInfo.x,
                        top: selectedObjectInfo.y,
                        transform: 'translate(-50%, -50%)',
                        width: Math.max(120, selectedObjectInfo.w + 40),
                    }}
                >
                    <input
                        type="text"
                        onKeyDown={(e) => {
                            // Don't trigger native undo logic when typing inside input box!
                            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                                e.stopPropagation();
                            }
                        }}
                        className="bg-transparent border border-transparent text-slate-800 text-center text-base rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent focus:bg-white/95 focus:shadow-xl transition-all pointer-events-auto shadow-sm"
                        placeholder="Type shape text..."
                        value={selectedObjectInfo.text}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedObjectInfo({ ...selectedObjectInfo, text: val });
                            crdtStoreRef.current?.update(selectedObjectInfo.id, { text: val });

                            // Immediately map it structurally to fabric natively for buttery typing!
                            if (fabricCanvas) {
                                const active = fabricCanvas.getActiveObject();
                                if (active && active.isType('group')) {
                                    const textNode = (active as fabric.Group).item(1) as unknown as fabric.IText;
                                    if (textNode) {
                                        textNode.set({ text: val });
                                        fabricCanvas.requestRenderAll();
                                    }
                                }
                            }
                        }}
                    />
                </div>
            )}

            {/* Action Bar (Top Left) */}
            <div className="fixed top-6 left-6 z-10 flex items-center gap-4 bg-white/80 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-sm border border-slate-200/60 drop-shadow-sm transition-all hover:shadow-md">
                <button
                    onClick={leaveSession}
                    className="p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Back to Dashboard"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="flex flex-col pr-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Session</span>
                    <span className="text-sm font-semibold text-slate-700 font-mono bg-slate-100/80 border border-slate-200 px-2 py-0.5 rounded-md leading-none">{roomId}</span>
                </div>
            </div>

            {/* Utility Bar (Top Right) */}
            <div className="fixed top-6 right-6 z-10 flex items-center gap-1.5 bg-white/80 backdrop-blur-xl px-3 py-3 rounded-2xl shadow-sm border border-slate-200/60 drop-shadow-sm transition-all hover:shadow-md">
                <button
                    onClick={undo}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={20} strokeWidth={2.5} />
                </button>

                <button
                    onClick={clearBoard}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Clear Board"
                >
                    <Trash2 size={20} strokeWidth={2.5} />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                {/* Export Dropdown Group */}
                <div className="relative group">
                    <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1" title="Export">
                        <Download size={20} strokeWidth={2.5} />
                    </button>
                    {/* Hover Dropdown */}
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-200/50 rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 z-50">
                        <button onClick={saveImage} className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 rounded-lg flex items-center gap-2.5 transition-colors">
                            <ImageIcon size={18} className="text-slate-400" /> Save as PNG
                        </button>
                        <button onClick={savePDF} className="w-full text-left px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 rounded-lg flex items-center gap-2.5 transition-colors mt-0.5">
                            <FileText size={18} className="text-slate-400" /> Save as PDF
                        </button>
                    </div>
                </div>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                <button
                    onClick={() => setChatOpen((prev) => !prev)}
                    className={`p-2 rounded-xl transition-colors relative ${chatOpen ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                    title={chatOpen ? 'Close chat' : 'Open chat'}
                >
                    <MessageSquare size={20} strokeWidth={2.5} />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center p-0.5 mr-1">
                    <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-full h-full" } }} />
                </div>
            </div>

            {/* Main Toolbar (Bottom Center) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center p-2.5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 drop-shadow-sm transition-all hover:shadow-2xl">
                {/* Custom Color Picker Preset Colors */}
                <div className="flex items-center gap-2 px-3 border-r border-slate-200 pr-5">
                    {['#0f172a', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full transition-all hover:scale-110 shadow-sm ${color === c ? 'ring-4 ring-offset-2 ring-slate-200 scale-110' : 'ring-1 ring-slate-200 hover:ring-2'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                        />
                    ))}
                    {/* Fallback Custom Color Picker */}
                    <div className="relative w-8 h-8 overflow-hidden rounded-full ring-1 ring-slate-200 shadow-sm ml-1 cursor-pointer transition-transform hover:scale-110 bg-gradient-to-tr from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                            title="Custom Color"
                        />
                    </div>
                </div>

                {/* Custom Brush Sizes */}
                <div className="flex items-center gap-1.5 px-3 pl-4">
                    {[
                        { size: 2, label: 'Thin' },
                        { size: 5, label: 'Normal' },
                        { size: 10, label: 'Thick' },
                        { size: 20, label: 'Marker' }
                    ].map((b) => (
                        <button
                            key={b.size}
                            onClick={() => setBrushSize(b.size)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${brushSize === b.size ? 'bg-slate-100 text-slate-800 shadow-inner ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            title={b.label}
                        >
                            <div className="bg-current rounded-full" style={{ width: Math.max(4, b.size), height: Math.max(4, b.size) }}></div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Canvas */}
            <div className="relative w-full h-full z-[1]">
                <canvas ref={canvasRef} />
            </div>

            {/* Chat Component */}
            <Chat
                socket={socket}
                roomId={roomId || ''}
                username={username}
                isOpen={chatOpen}
                onClose={() => setChatOpen(false)}
                onOpen={() => setChatOpen(true)}
            />
        </div>
    );
};

export default Whiteboard;
