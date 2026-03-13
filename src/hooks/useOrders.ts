import { useState, useEffect, useRef } from 'react';
import { 
    db, collection, query, where, orderBy, onSnapshot, 
    updateDoc, doc, type QuerySnapshot, type DocumentData 
} from '../firebase';
import type { KDSOrder } from '../types/types';

export function useOrders(branchId: string | null) {
    const [orders, setOrders] = useState<KDSOrder[]>([]); // Órdenes Activas
    const [history, setHistory] = useState<KDSOrder[]>([]); // Órdenes Terminadas/Canceladas
    const [isConnected, setIsConnected] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio bloqueado:", e));
        }
    };

    useEffect(() => {
        if (!branchId) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Traemos TODAS las órdenes del día
        const q = query(
            collection(db, "orders"),
            where("branchId", "==", branchId),
            where("createdAt", ">=", today),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
            setIsConnected(true);
            
            const allOrders = snapshot.docs.map(d => ({ orderId: d.id, ...d.data() } as KDSOrder));

            // 1. Filtramos las ACTIVAS (Para la pantalla principal)
            const activeOrders = allOrders.filter(o => {
                if (o.kitchenStatus) {
                    return o.kitchenStatus !== 'delivered' && o.kitchenStatus !== 'cancelled';
                }
                return o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
            });

            // 2. Filtramos el HISTORIAL (Para recuperar)
            // Las ordenamos al revés (la más reciente entregada primero)
            const historyOrders = allOrders.filter(o => {
                if (o.kitchenStatus) {
                    return o.kitchenStatus === 'delivered' || o.kitchenStatus === 'cancelled';
                }
                return o.status === 'DELIVERED' || o.status === 'CANCELLED';
            }).sort((a, b) => {
                // Ordenar por hora de creación descendente (lo más nuevo arriba)
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
            });

            // Detección de sonido (Solo para nuevas activas)
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    const isFresh = (Date.now() - (data.createdAt?.toMillis?.() || 0)) < 10 * 60 * 1000;
                    const isNotDone = data.kitchenStatus !== 'delivered' && data.kitchenStatus !== 'cancelled';
                    
                    if (isFresh && isNotDone) {
                        playSound();
                    }
                }
            });

            setOrders(activeOrders);
            setHistory(historyOrders);

        }, (error) => {
            console.error("Error conexión KDS:", error);
            setIsConnected(false);
        });

        return () => unsubscribe();
    }, [branchId]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "orders", orderId), { kitchenStatus: newStatus });
        } catch (error) {
            console.error("Error actualizando orden:", error);
        }
    };

    return { orders, history, isConnected, updateStatus, audioRef };
}