import { useState } from 'react';
import { useOrders } from './hooks/useOrders';
import { OrderCard } from './components/OrderCard';
import { HistoryModal } from './components/HistoryModal';
import { Clock } from './components/Clock';
import { WelcomeScreen } from './components/WelcomeScreen';

function App() {
  const { orders, history, isConnected, updateStatus, audioRef } = useOrders();
  const [isInteracted, setIsInteracted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Renderizado condicional limpio
  if (!isInteracted) {
    return <WelcomeScreen onStart={() => setIsInteracted(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
        
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <div className="p-1 bg-brand-light rounded-xl">
                    <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-lg" />
                </div>
                <div>
                    <h1 className="text-xl font-black leading-none text-gray-800 tracking-tight">Cocina Principal</h1>
                    <span className="text-xs text-brand-pink font-bold tracking-wide">DULCE CREPA POS</span>
                </div>
            </div>

            <div className="bg-brand-light px-6 py-2 rounded-xl border border-pink-100">
                <Clock />
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg transition"
                    title="Ver Historial del Turno"
                >
                    <span>📜</span>
                    <span className="hidden md:inline">Historial</span>
                </button>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm transition-colors ${isConnected ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-xs font-extrabold tracking-wide hidden sm:inline">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-slate-50/50"> 
            {orders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 animate-fade-in-up">
                    <div className="p-6 bg-white rounded-full shadow-sm border border-gray-100">
                        <svg className="w-16 h-16 text-brand-pink/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-500">¡Todo listo, Chef! 👨‍🍳</p>
                    <p className="text-sm text-gray-400">Esperando nuevas órdenes dulces...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-20">
                    {orders.map(order => (
                        <OrderCard 
                            key={order.orderId} 
                            order={order} 
                            onStatusChange={updateStatus} 
                        />
                    ))}
                </div>
            )}
        </main>

        <HistoryModal 
            isOpen={showHistory} 
            onClose={() => setShowHistory(false)} 
            historyOrders={history}
            onRestore={updateStatus}
        />

        <audio ref={audioRef} src="/notification.mp3" preload="auto" />
    </div>
  );
}

export default App;