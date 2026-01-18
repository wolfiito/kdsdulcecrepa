import React, { useState, useEffect } from 'react';
import type { KDSOrder, KDSOrderItem } from '../types/types';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { AdminPinModal } from './AdminPinModal'; // Importamos el Modal de PIN

function useElapsedTime(createdAt: Timestamp) {
    const [mins, setMins] = useState(0);
    useEffect(() => {
        const calc = () => {
            if (!createdAt) return;
            const start = typeof createdAt.toMillis === 'function' 
                ? createdAt.toMillis() 
                : new Date(createdAt as unknown as string).getTime();
            const diff = Math.floor((Date.now() - start) / 60000);
            setMins(diff);
        };
        calc();
        const interval = setInterval(calc, 30000);
        return () => clearInterval(interval);
    }, [createdAt]);
    return mins;
}

interface OrderCardProps {
    order: KDSOrder;
    onStatusChange: (orderId: string, newStatus: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange }) => {
    const [authOpen, setAuthOpen] = useState(false); // Estado para abrir el teclado
    
    const mins = useElapsedTime(order.createdAt);
    const isLate = mins > 10; 

    const currentKS = order.kitchenStatus || 'queued';
    const isPending = currentKS === 'queued';
    const isPreparing = currentKS === 'preparing';
    const isReady = currentKS === 'ready';

    const statusStyles = {
        queued: 'border-l-brand-pink bg-white',
        preparing: 'border-l-blue-500 bg-blue-50',
        ready: 'border-l-green-500 bg-green-50',
        delivered: 'border-l-gray-400 bg-gray-100'
    };
    const cardStyle = statusStyles[currentKS as keyof typeof statusStyles] || statusStyles.queued;

    // Acción cuando el PIN es correcto
    const handleAuthSuccess = (authorizerName: string) => {
        onStatusChange(order.orderId, 'cancelled');
        toast.error(`Orden cancelada por: ${authorizerName}`);
        setAuthOpen(false);
    };

    return (
        <>
            <div className={`
                flex flex-col 
                h-[400px] lg:h-[350px] 
                rounded-xl shadow-md overflow-hidden border-l-[8px] ${cardStyle}
                transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fade-in-up group relative
                ${isLate && !isReady ? 'ring-2 ring-red-400 animate-pulse' : ''}
            `}>
                {!isReady && (
                    <button 
                        onClick={() => setAuthOpen(true)} // Abre el modal de PIN
                        className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-20"
                        title="Cancelar Orden (Requiere PIN)"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}

                {/* HEADER COMPACTO */}
                <div className="p-3 pb-1 flex justify-between items-start border-b border-gray-100 shrink-0">
                    <div className="overflow-hidden"> {/* overflow-hidden para evitar desbordes */}
                        {/* Texto responsivo: lg:text-2xl reduce el tamaño cuando hay 5 columnas */}
                        <h2 className="text-3xl lg:text-2xl font-black text-gray-800">
                            #{order.orderNumber.toString().padStart(3, '0')}
                        </h2>
                        <p className="text-sm text-gray-500 font-bold uppercase truncate w-full">
                            {order.customerName || 'Cliente'}
                        </p>
                    </div>
                    <div className="text-right pt-2"> {/* pt-4 a pt-2 */}
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            {order.orderMode}
                        </span>
                        <span className={`text-xl lg:text-lg font-black ${isLate ? 'text-red-500' : 'text-gray-700'}`}>
                            {mins}m
                        </span>
                    </div>
                </div>

                {/* ITEMS COMPACTOS */}
                <div className="flex-1 p-3 pt-2 overflow-y-auto custom-scrollbar space-y-2 bg-white/50">
                    {order.items.map((item: KDSOrderItem, idx: number) => (
                        <div key={idx} className="flex flex-col border-b border-gray-100 last:border-0 pb-1">
                            <div className="flex items-start gap-1 leading-tight">
                                <span className="text-brand-pink font-black text-sm pt-0.5">1x</span>
                                {/* text-sm en lugar de text-lg para que quepan nombres largos */}
                                <span className="text-base lg:text-sm font-bold text-gray-800 break-words">
                                    {item.baseName}
                                </span>
                            </div>
                            <div className="pl-5 text-xs text-gray-500">
                                {item.details.variantName && <div className="font-medium">• {item.details.variantName}</div>}
                                {[...(item.details.selectedModifiers || []), ...(item.details.modifiers || [])].map((mod, i) => (
                                    <div key={i} className="text-brand-dark font-semibold">+ {mod.name}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* BUTTONS COMPACTOS */}
                <div className="p-2 bg-white border-t border-gray-100 shrink-0">
                    {/* Botones más delgados (py-2 en vez de py-3) */}
                    {isPending && <button onClick={() => { onStatusChange(order.orderId, 'preparing'); toast.success('Cocinando 🔥'); }} className="w-full py-2 text-sm bg-brand-pink hover:bg-brand-dark text-white font-bold rounded-lg transition active:scale-95">COCINAR 👨‍🍳</button>}
                    {isPreparing && <button onClick={() => { onStatusChange(order.orderId, 'ready'); toast.success('Orden Lista ✅'); }} className="w-full py-2 text-sm bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition active:scale-95">TERMINAR ✅</button>}
                    {isReady && <button onClick={() => { onStatusChange(order.orderId, 'delivered'); toast('Entregado 🚀', { icon: '👋' }); }} className="w-full py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition active:scale-95">ENTREGAR 🚀</button>}
                </div>
            </div>

            {/* MODAL DE PIN PARA ESTA TARJETA */}
            <AdminPinModal 
                isOpen={authOpen} 
                onClose={() => setAuthOpen(false)} 
                onSuccess={handleAuthSuccess}
                title="Autorizar Cancelación"
                requireAdmin={true}
            />
        </>
    );
};