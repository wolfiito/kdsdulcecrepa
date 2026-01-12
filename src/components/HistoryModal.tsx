import React, { useState } from 'react';
import type { KDSOrder } from '../types/types';
import { AdminPinModal } from './AdminPinModal'; // Importamos el modal de PIN

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    historyOrders: KDSOrder[];
    onRestore: (orderId: string, status: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, historyOrders, onRestore }) => {
    // Estados para manejar el flujo de autorización
    const [authOpen, setAuthOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<KDSOrder | null>(null);

    if (!isOpen) return null;

    // Paso 1: El usuario hace clic en Restaurar
    const handleRestoreClick = (order: KDSOrder) => {
        setSelectedOrder(order);
        setAuthOpen(true); // Abrimos el teclado numérico
    };

    // Paso 2: El PIN fue correcto
    const handleAuthSuccess = () => {
        if (selectedOrder) {
            onRestore(selectedOrder.orderId, 'queued');
            onClose(); // Cerramos el historial
        }
        setAuthOpen(false);
        setSelectedOrder(null);
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                    
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">📜</span> Historial del Turno
                        </h2>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-200">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {historyOrders.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No hay órdenes en el historial.</div>
                        ) : (
                            historyOrders.map((order) => {
                                const isCancelled = order.kitchenStatus === 'cancelled' || order.status === 'CANCELLED';
                                return (
                                    <div key={order.orderId} className={`flex justify-between items-center p-4 rounded-xl border-l-4 shadow-sm ${isCancelled ? 'bg-red-50 border-red-400' : 'bg-gray-50 border-gray-400'}`}>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-lg text-gray-700">#{order.orderNumber}</span>
                                                {isCancelled ? (
                                                    <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">CANCELADA</span>
                                                ) : (
                                                    <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">ENTREGADA</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">{order.customerName}</p>
                                        </div>

                                        <button 
                                            onClick={() => handleRestoreClick(order)} // 🔒 Pide Auth
                                            className="px-4 py-2 bg-white border border-gray-200 text-brand-pink font-bold rounded-lg hover:bg-brand-pink hover:text-white transition shadow-sm text-sm"
                                        >
                                            Restaurar 🔒
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de PIN superpuesto */}
            <AdminPinModal 
                isOpen={authOpen} 
                onClose={() => setAuthOpen(false)} 
                onSuccess={handleAuthSuccess}
                title="Autorizar Restauración"
            />
        </>
    );
};