// src/components/WelcomeScreen.tsx
import { useState, useEffect } from 'react';
import { db, collection, getDocs, query, where } from '../firebase';

interface WelcomeScreenProps {
    onStart: (branchId: string, branchName: string) => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
    const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                // 1. Intentamos buscar las sucursales activas
                let q = query(collection(db, 'branches'), where('isActive', '==', true));
                let snap = await getDocs(q);
                
                // 2. Si no hay activas, intentamos traer todas (FALLBACK)
                if (snap.empty) {
                    q = query(collection(db, 'branches'));
                    snap = await getDocs(q);
                }

                const loaded = snap.docs.map(d => {
                    const data = d.data();
                    return { id: d.id, name: data.name || data.nombre || 'Sin nombre' };
                });
                
                setBranches(loaded);
                if (loaded.length > 0) setSelectedBranch(loaded[0].id);
            } catch (error: any) {

            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    const handleStart = () => {
        if (!selectedBranch) return;
        const branch = branches.find(b => b.id === selectedBranch);
        onStart(selectedBranch, branch?.name || 'Cocina');
    };

    return (
        <div className="h-screen w-full bg-brand-light flex flex-col items-center justify-center select-none space-y-8 animate-fade-in-up">
            <div className="relative group">
                <div className="absolute inset-0 bg-brand-pink blur-3xl opacity-20 rounded-full"></div>
                <img src="/logo.png" alt="Logo" className="relative w-48 h-48 rounded-full shadow-2xl border-4 border-white" />
            </div>
            
            <div className="text-center space-y-2">
                <h1 className="text-5xl font-black text-gray-800 tracking-tight">KDS Cocina</h1>
                <p className="text-xl text-gray-500 font-bold">Configuración de Tableta</p>
            </div>

            {loading ? (
                <div className="text-brand-pink font-bold animate-pulse">Cargando sucursales...</div>
            ) : (
                <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-3xl shadow-lg border border-gray-100 w-80">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest w-full text-center">
                        Selecciona tu Sucursal
                    </label>
                    <select 
                        className="w-full bg-gray-50 border-2 border-gray-200 text-gray-800 font-bold text-lg rounded-xl px-4 py-3 focus:outline-none focus:border-brand-pink"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <button 
                        onClick={handleStart}
                        className="w-full bg-brand-pink text-white font-black text-xl py-4 rounded-xl shadow-md hover:bg-pink-500 transition-colors transform active:scale-95"
                    >
                        INICIAR TURNO
                    </button>
                </div>
            )}
        </div>
    );
};