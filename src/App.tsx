// kdsdulcecrepafront/src/App.tsx (VERSIÓN CORREGIDA COMPATIBLE CON POS)
import React, { useEffect, useState, useRef } from 'react';
import { 
    db, collection, doc, updateDoc, onSnapshot, query, where, orderBy,
    type Timestamp, type QuerySnapshot, type DocumentData 
} from './firebase'; 
import './App.css';

// --- TIPOS ---
interface KDSOrder {
  orderId: string;
  orderNumber: number;
  status: string; 
  orderMode: string;
  createdAt: Timestamp; 
  items: KDSOrderItem[];
}

interface KDSOrderItem {
    ticketItemId: string;
    baseName: string;
    details: {
        variantName?: string;
        selectedModifiers?: { name: string; price: number; group: string }[];
        modifiers?: { name: string; price: number; group: string }[]; // Compatibilidad
    };
}

// --- HOOKS ---
function useKdsClock() {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function useElapsedTime(createdAt: any) {
    const [mins, setMins] = useState(0);
    useEffect(() => {
        const calc = () => {
            if (!createdAt) return;
            const start = createdAt.toMillis ? createdAt.toMillis() : new Date(createdAt).getTime();
            const diff = Math.floor((Date.now() - start) / 60000);
            setMins(diff);
        };
        calc();
        const timer = setInterval(calc, 30000);
        return () => clearInterval(timer);
    }, [createdAt]);
    return mins;
}

// --- APP PRINCIPAL ---
function App() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isInteracted, setIsInteracted] = useState(false); 
  const clockTime = useKdsClock();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isInteracted) return;
    audioRef.current?.play().catch(() => {}); 

    // 1. Inicio del día (00:00 hrs)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. CONSULTA MAESTRA CORREGIDA
    // Ahora buscamos 'paid' y 'pending' (lo que manda el POS) Y TAMBIÉN los estados de cocina.
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["paid", "pending", "PENDING", "PREPARING", "READY"]), 
      where("createdAt", ">=", today), 
      orderBy("createdAt", "asc")
    );
  
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        setIsConnected(true);
  
        // Sonido al llegar nueva orden pendiente/pagada
        snapshot.docChanges().forEach((change) => {
          const s = change.doc.data().status;
          if (change.type === "added" && (s === 'paid' || s === 'pending' || s === 'PENDING')) {
            const data = change.doc.data();
            const created = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
            // Solo sonar si es reciente (menos de 10 min)
            if (Date.now() - created < 10 * 60 * 1000) {
                audioRef.current?.play().catch(e => console.warn("Audio error", e));
            }
          }
        });
  
        const ordersData = snapshot.docs.map((doc) => ({
          orderId: doc.id,
          ...doc.data()
        })) as KDSOrder[];
  
        setOrders(ordersData);
      },
      (error) => {
        console.error("KDS Error:", error);
        // Si falla por índice, avisa en consola pero intenta seguir
        setIsConnected(false);
      }
    );
  
    return () => unsubscribe();
  }, [isInteracted]);

  if (!isInteracted) {
    return (
        <div className="kds-welcome-screen" onClick={() => setIsInteracted(true)}>
            <h1 className="text-4xl font-bold">KDS Cocina</h1>
            <p className="opacity-60 mt-2">Tocar pantalla para iniciar</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 shadow-md z-10">
        <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-blue-400">Dulce Crepa KDS</span>
        </div>
        <div className="text-2xl font-mono font-bold">{clockTime}</div>
        <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Online' : 'Offline'}
        </div>
      </header>
      
      <div className="order-grid p-4 overflow-y-auto flex-1">
        {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full w-full opacity-20">
                <span className="text-6xl">👨‍🍳</span>
                <h2 className="text-2xl mt-4">Esperando órdenes...</h2>
            </div>
        ) : (
            orders.map(order => <OrderCard key={order.orderId} order={order} />)
        )}
      </div>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
    </div>
  );
}

// --- TARJETA INTELIGENTE ---

const OrderCard: React.FC<{ order: KDSOrder }> = ({ order }) => {
    const mins = useElapsedTime(order.createdAt);
    const isLate = mins > 10;

    const updateStatus = (status: string) => {
        updateDoc(doc(db, "orders", order.orderId), { status }).catch(console.error);
    };

    // Normalizar estado para UI (Cualquier variante de pendiente es "PENDING")
    const uiStatus = (order.status === 'paid' || order.status === 'pending') ? 'PENDING' : order.status;

    // Colores según estado normalizado
    let borderClass = "border-l-4 border-gray-600";
    if (uiStatus === 'PENDING') borderClass = isLate ? "border-l-8 border-red-500 animate-pulse" : "border-l-4 border-yellow-400";
    if (uiStatus === 'PREPARING') borderClass = "border-l-4 border-blue-500";
    if (uiStatus === 'READY') borderClass = "border-l-4 border-green-500";

    return (
        <div className={`bg-gray-800 rounded-lg shadow-lg flex flex-col h-full ${borderClass} transition-all duration-300`}>
            <div className="p-3 border-b border-gray-700 flex justify-between items-start">
                <div>
                    <span className="text-2xl font-black">#{order.orderNumber}</span>
                    <div className="text-xs uppercase font-bold text-gray-400 mt-1">{order.orderMode}</div>
                </div>
                <div className={`text-lg font-mono font-bold ${isLate ? 'text-red-400' : 'text-gray-300'}`}>
                    {mins}m
                </div>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {order.items.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-700/50 last:border-0 pb-2 last:pb-0">
                        <div className="font-bold text-lg leading-tight text-white">
                            1 {item.baseName}
                            {item.details.variantName && <span className="text-sm font-normal text-blue-300 ml-1">({item.details.variantName})</span>}
                        </div>
                        
                        {(() => {
                            // Combinamos lógica vieja y nueva de modificadores
                            const mods = item.details.selectedModifiers || item.details.modifiers || [];
                            if (mods.length === 0) return null;
                            return (
                                <ul className="mt-1 ml-2 space-y-0.5">
                                    {mods.map((m, i) => (
                                        <li key={i} className="text-sm text-green-400 flex items-center gap-1 font-medium">
                                            <span>+ {m.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            );
                        })()}
                    </div>
                ))}
            </div>

            <div className="p-2 bg-gray-800/50 mt-auto flex gap-2">
                {uiStatus === 'PENDING' && (
                    <button onClick={() => updateStatus('PREPARING')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-md font-bold text-lg">
                        COCINAR 🔥
                    </button>
                )}
                {uiStatus === 'PREPARING' && (
                    <button onClick={() => updateStatus('READY')} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-md font-bold text-lg">
                        TERMINAR ✅
                    </button>
                )}
                {uiStatus === 'READY' && (
                    <button onClick={() => updateStatus('DELIVERED')} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-md font-bold text-sm uppercase">
                        Entregar 📦
                    </button>
                )}
            </div>
        </div>
    );
}

export default App;