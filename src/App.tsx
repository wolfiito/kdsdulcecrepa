// kdsdulcecrepafront/src/App.tsx (CORREGIDO: Lógica Nueva + Estilos CSS Originales)
import React, { useEffect, useState, useRef } from 'react';
import { 
    db, collection, doc, updateDoc, onSnapshot, query, where, orderBy,
    type Timestamp, type QuerySnapshot, type DocumentData 
} from './firebase'; 
import './App.css'; // <--- Importante: Usa tus estilos

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
        modifiers?: { name: string; price: number; group: string }[];
    };
}

// --- HOOKS DE TIEMPO ---
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // CONSULTA OPTIMIZADA (Busca PENDING y paid/pending)
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["paid", "pending", "PENDING", "PREPARING", "READY"]), 
      where("createdAt", ">=", today), 
      orderBy("createdAt", "asc")
    );
  
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        setIsConnected(true);
        snapshot.docChanges().forEach((change) => {
          const s = change.doc.data().status;
          if (change.type === "added" && (s === 'paid' || s === 'pending' || s === 'PENDING')) {
            const data = change.doc.data();
            const created = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
            if (Date.now() - created < 10 * 60 * 1000) {
                audioRef.current?.play().catch(e => console.warn("Audio error", e));
            }
          }
        });
        const ordersData = snapshot.docs.map((doc) => ({ orderId: doc.id, ...doc.data() })) as KDSOrder[];
        setOrders(ordersData);
      },
      (error) => {
        console.error("KDS Error:", error);
        setIsConnected(false);
      }
    );
    return () => unsubscribe();
  }, [isInteracted]);

  if (!isInteracted) {
    return (
        <div className="kds-welcome-screen" onClick={() => setIsInteracted(true)}>
            <img src="/logo.png" alt="Logo" style={{height: '150px', marginBottom: '20px', borderRadius: '20px'}} />
            <h1>KDS Dulce Crepa</h1>
            <p>Tocar para Iniciar</p>
        </div>
    );
  }

  return (
    <div className="App">
      {/* HEADER (Estilo Original) */}
      <header className="kds-header">
            <img src="/logo.png" alt="Logo" className="kds-logo" />
            <span className="kds-station-name">Cocina Principal</span>
            <span className="kds-clock">{clockTime}</span>
            <div className="connection-indicator">
                <div className={`connection-dot ${isConnected ? 'connected' : ''}`}></div>
                {isConnected ? 'Conectado' : 'Sin Conexión'}
            </div>
      </header>
      
      {/* GRID (Estilo Original) */}
      <div className="order-grid">
        {orders.length === 0 && (
            <h2 style={{color: 'var(--text-muted)', textAlign: 'center', width: '100%', marginTop: '50px'}}>
                Todo en orden, chef 👨‍🍳
            </h2>
        )}
        {orders.map(order => <OrderCard key={order.orderId} order={order} />)}
      </div>

      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
    </div>
  );
}

// --- TARJETA DE ORDEN (Estilo Original) ---

const OrderCard: React.FC<{ order: KDSOrder }> = ({ order }) => {
    const mins = useElapsedTime(order.createdAt);
    const isLate = mins > 10;

    const updateStatus = (status: string) => {
        updateDoc(doc(db, "orders", order.orderId), { status }).catch(console.error);
    };

    // Normalizar estado (paid/pending -> PENDING)
    const uiStatus = (order.status === 'paid' || order.status === 'pending') ? 'PENDING' : order.status;

    const isPending = uiStatus === 'PENDING';
    const isPreparing = uiStatus === 'PREPARING';
    const isReady = uiStatus === 'READY';

    return (
        // Usamos las clases CSS de App.css: order-card, status-..., alert
        <div className={`order-card status-${uiStatus} ${isLate && !isReady ? 'alert' : ''}`}>
            <div className="order-card-header">
                <h2 className="order-number">#{order.orderNumber.toString().padStart(3, '0')}</h2>
                <div className="order-meta">
                    <span className="order-type">{order.orderMode}</span>
                    <span className={`order-time ${isLate ? 'alert-time' : ''}`}>
                        {mins}m
                    </span>
                </div>
            </div>

            <div className="kds-item-list">
                {order.items.map((item, idx) => (
                    <div key={idx} className="kds-item">
                        <h3 className="kds-item-name">
                            1 {item.baseName} {item.details.variantName && `(${item.details.variantName})`}
                        </h3>
                        
                        {(() => {
                            const mods = item.details.selectedModifiers || item.details.modifiers || [];
                            if (mods.length === 0) return null;
                            return (
                                <ul className="kds-item-details">
                                    {mods.map((m, i) => (
                                        <li key={i} className="extra">
                                            + {m.name}
                                        </li>
                                    ))}
                                </ul>
                            );
                        })()}
                    </div>
                ))}
            </div>

            <div className="card-actions">
                {isPending && (
                    <button onClick={() => updateStatus('PREPARING')} className="btn-action btn-preparar">
                        COCINAR 🔥
                    </button>
                )}
                {isPreparing && (
                    <button onClick={() => updateStatus('READY')} className="btn-action btn-listo">
                        TERMINAR ✅
                    </button>
                )}
                {isReady && (
                    <button onClick={() => updateStatus('DELIVERED')} className="btn-action" style={{background: '#4b5563', color: 'white'}}>
                        ENTREGADO
                    </button>
                )}
            </div>
        </div>
    );
}

export default App;