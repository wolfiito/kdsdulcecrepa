// kdsdulcecrepafront/src/App.tsx
import React, { useEffect, useState, useRef } from 'react';
import { 
    db, collection, doc, updateDoc, onSnapshot, query, where, orderBy,
    type Timestamp, type QuerySnapshot, type DocumentData 
} from './firebase'; 
import './App.css'; 

// --- TIPOS ACTUALIZADOS ---
interface KDSOrder {
  orderId: string;
  orderNumber: number;
  customerName?: string;
  status: string;         // Dinero (pending/paid)
  kitchenStatus?: string; // Cocina (queued/preparing/ready/delivered)
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

// ... (Hooks de Reloj y Tiempo IGUALES) ...
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

    // --- NUEVA CONSULTA INTELIGENTE ---
    // Traemos todo lo que NO esté entregado ('delivered')
    // Nota: Como 'kitchenStatus' es nuevo, algunas órdenes viejas no lo tendrán.
    // Firestore no permite filtrar por campos inexistentes fácilmente, así que traemos las del día
    // y filtramos en memoria por seguridad.
    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", today), 
      orderBy("createdAt", "asc")
    );
  
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
        setIsConnected(true);
        
        const ordersData = snapshot.docs
            .map((doc) => {
                const data = doc.data();
                return { orderId: doc.id, ...data } as KDSOrder;
            })
            // FILTRO DE MEMORIA:
            // 1. Si tiene kitchenStatus, que NO sea 'delivered'.
            // 2. Si NO tiene kitchenStatus (orden vieja), usamos la lógica anterior (status != 'DELIVERED').
            .filter(o => {
                if (o.kitchenStatus) return o.kitchenStatus !== 'delivered';
                return o.status !== 'DELIVERED'; // Retro-compatibilidad
            });

        // DETECCIÓN DE NUEVAS ÓRDENES (Sonido)
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                // Si es reciente y no está entregada, suena
                const isFresh = (Date.now() - (data.createdAt?.toMillis?.() || 0)) < 10 * 60 * 1000;
                const notDelivered = data.kitchenStatus !== 'delivered';
                
                if (isFresh && notDelivered) {
                    audioRef.current?.play().catch(() => {});
                }
            }
        });

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
      <header className="kds-header">
            <img src="/logo.png" alt="Logo" className="kds-logo" />
            <span className="kds-station-name">Cocina Principal</span>
            <span className="kds-clock">{clockTime}</span>
            <div className="connection-indicator">
                <div className={`connection-dot ${isConnected ? 'connected' : ''}`}></div>
                {isConnected ? 'Conectado' : 'Sin Conexión'}
            </div>
      </header>
      
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

const OrderCard: React.FC<{ order: KDSOrder }> = ({ order }) => {
    const mins = useElapsedTime(order.createdAt);
    const isLate = mins > 10;

    // AHORA ACTUALIZAMOS 'kitchenStatus', NO 'status'
    const updateKitchenStatus = (ks: string) => {
        updateDoc(doc(db, "orders", order.orderId), { kitchenStatus: ks }).catch(console.error);
    };

    // Lógica visual basada en el nuevo campo, con fallback para órdenes viejas
    const currentKS = order.kitchenStatus || 'queued';
    
    const isPending = currentKS === 'queued';
    const isPreparing = currentKS === 'preparing';
    const isReady = currentKS === 'ready';

    // Mapeamos 'queued' a la clase 'status-PENDING' para mantener tus colores CSS
    const cssStatus = isPending ? 'PENDING' : isPreparing ? 'PREPARING' : isReady ? 'READY' : 'DELIVERED';

    return (
        <div className={`order-card status-${cssStatus} ${isLate && !isReady ? 'alert' : ''}`}>
            <div className="order-card-header">
                <div className="flex justify-between items-start w-full">
                    <div>
                        <h2 className="order-number">#{order.orderNumber.toString().padStart(3, '0')}</h2>
                        {order.customerName && (
                            <div style={{fontSize: '1.1rem', fontWeight: 'bold', color: '#374151', marginTop: '4px'}}>
                                {order.customerName}
                            </div>
                        )}
                    </div>
                    <div className="order-meta" style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}>
                        <span className="order-type">{order.orderMode}</span>
                        <span className={`order-time ${isLate ? 'alert-time' : ''}`}>
                            {mins}m
                        </span>
                    </div>
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
                                    {mods.map((m, i) => <li key={i} className="extra">+ {m.name}</li>)}
                                </ul>
                            );
                        })()}
                    </div>
                ))}
            </div>

            <div className="card-actions">
                {isPending && (
                    <button onClick={() => updateKitchenStatus('preparing')} className="btn-action btn-preparar">
                        COCINAR 🔥
                    </button>
                )}
                {isPreparing && (
                    <button onClick={() => updateKitchenStatus('ready')} className="btn-action btn-listo">
                        TERMINAR ✅
                    </button>
                )}
                {isReady && (
                    <button onClick={() => updateKitchenStatus('delivered')} className="btn-action" style={{background: '#4b5563', color: 'white'}}>
                        ENTREGADO
                    </button>
                )}
            </div>
        </div>
    );
}

export default App;