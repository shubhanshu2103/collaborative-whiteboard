import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, SendHorizontal } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface ChatProps {
    socket: Socket | null;
    roomId: string;
    username: string;
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
}

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
    </svg>
);

const Chat: React.FC<ChatProps> = ({ socket, roomId, username, isOpen, onClose, onOpen }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveMessage = (message: Message) => {
            setMessages((prev) => [...prev, message]);
        };

        socket.on('receive-message', handleReceiveMessage);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
        };
    }, [socket]);

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData: Message = {
            id: Date.now().toString(),
            text: newMessage.trim(),
            sender: username,
            timestamp: Date.now(),
        };

        // Optimistically add message
        setMessages((prev) => [...prev, messageData]);

        // Send to server
        socket.emit('send-message', { roomId, message: messageData });

        setNewMessage('');
    };

    return (
        <div className="position-absolute bottom-0 end-0 m-3" style={{ zIndex: 1000, width: '300px' }}>
            {!isOpen && (
                <button
                    type="button"
                    onClick={onOpen}
                    className="rounded-circle shadow-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 d-flex align-items-center justify-content-center float-end"
                    style={{ width: '56px', height: '56px' }}
                    aria-label="Open chat"
                >
                    <MessageSquare size={24} strokeWidth={2} />
                </button>
            )}

            {isOpen && (
                <div className="card shadow-lg border border-slate-200 overflow-hidden">
                    <div className="flex justify-between items-center px-3 py-2 bg-white border-b border-slate-200">
                        <h6 className="mb-0 text-slate-800 font-semibold text-sm">Room Chat</h6>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
                            aria-label="Close chat"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="card-body p-2 overflow-auto" style={{ height: '300px', backgroundColor: '#f8f9fa' }}>
                        {messages.length === 0 ? (
                            <div className="text-center text-muted mt-5">
                                <small>No messages yet. Say hello!</small>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`d-flex flex-column mb-2 ${msg.sender === username ? 'align-items-end' : 'align-items-start'}`}
                                >
                                    <div
                                        className={`p-2 rounded ${msg.sender === username ? 'bg-primary text-white' : 'bg-white border'}`}
                                        style={{ maxWidth: '80%' }}
                                    >
                                        <small className="d-block fw-bold mb-1" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                            {msg.sender === username ? 'You' : msg.sender}
                                        </small>
                                        <div className="text-break">{msg.text}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="card-footer p-2">
                        <form onSubmit={sendMessage} className="d-flex gap-2 align-items-center">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="btn btn-sm rounded border-0 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700 shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: '36px', height: '36px', minWidth: '36px' }}
                                aria-label="Send message"
                                disabled={!newMessage.trim()}
                            >
                                <SendHorizontal size={18} strokeWidth={2} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
