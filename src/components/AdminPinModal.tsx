import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService, type PosUser } from '../services/authService';

interface AdminPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (authorizerName: string) => void;
    title?: string;
    requireAdmin?: boolean;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({ 
    isOpen, onClose, onSuccess, title = "Autorización Requerida", requireAdmin = true 
}) => {
    // Estados de la lógica original
    const [step, setStep] = useState<'USERNAME' | 'PASSWORD'>('USERNAME');
    const [inputValue, setInputValue] = useState('');
    const [tempUser, setTempUser] = useState<PosUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Resetear al abrir
    useEffect(() => {
        if (isOpen) {
            setStep('USERNAME');
            setInputValue('');
            setTempUser(null);
            setIsLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- LÓGICA DE NEGOCIO ---

    const handleNumberClick = (num: string) => {
        if (inputValue.length >= 6 || isLoading) return;
        
        const newValue = inputValue + num;
        setInputValue(newValue);

        // Auto-envío al llegar a 6 dígitos (como en tu POS)
        if (newValue.length === 6) {
            if (step === 'USERNAME') verifyUsername(newValue);
            else verifyPassword(newValue);
        }
    };

    const verifyUsername = async (username: string) => {
        setIsLoading(true);
        const user = await authService.checkUserExists(username);
        setIsLoading(false);

        if (!user) {
            toast.error("Usuario no encontrado");
            setInputValue('');
            return;
        }

        if (requireAdmin && user.role !== 'ADMIN' && user.role !== 'GERENTE') {
            toast.error(`Rol '${user.role}' no autorizado`);
            setInputValue('');
            return;
        }

        // Si pasa, avanzamos al paso de contraseña
        setTempUser(user);
        setStep('PASSWORD');
        setInputValue('');
    };

    const verifyPassword = async (password: string) => {
        if (!tempUser) return;
        
        setIsLoading(true);
        const isValid = await authService.loginWithCredentials(tempUser.username, password);
        setIsLoading(false);

        if (isValid) {
            toast.success(`Autorizado: ${tempUser.name}`);
            onSuccess(tempUser.name);
            onClose();
        } else {
            toast.error("Contraseña incorrecta");
            setInputValue('');
        }
    };

    const handleClear = () => setInputValue('');
    const handleDelete = () => setInputValue(prev => prev.slice(0, -1));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* HEADER */}
                <div className="p-6 bg-gray-50 border-b border-gray-100 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${requireAdmin ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-800">
                        {step === 'USERNAME' ? title : `Hola, ${tempUser?.name}`}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1 text-gray-400">
                        {step === 'USERNAME' ? 'Ingrese ID de Usuario' : 'Ingrese Contraseña'}
                    </p>
                </div>

                {/* DISPLAY DE PUNTOS */}
                <div className="p-6 pb-2 flex justify-center">
                    {isLoading ? (
                        <div className="animate-pulse flex space-x-2">
                            <div className="w-3 h-3 bg-brand-pink rounded-full"></div>
                            <div className="w-3 h-3 bg-brand-pink rounded-full delay-75"></div>
                            <div className="w-3 h-3 bg-brand-pink rounded-full delay-150"></div>
                        </div>
                    ) : (
                        <div className="flex gap-3 h-8 items-center">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${inputValue.length > i ? 'bg-gray-800 border-gray-800 scale-110' : 'border-gray-300'}`}></div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TECLADO */}
                <div className="p-6 pt-4 grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num.toString())}
                            disabled={isLoading}
                            className="h-16 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 active:bg-brand-pink active:text-white transition-colors shadow-sm"
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={handleClear} className="h-16 rounded-xl bg-red-50 text-red-500 font-bold active:bg-red-100 text-sm">LIMPIAR</button>
                    <button onClick={() => handleNumberClick("0")} className="h-16 rounded-xl bg-gray-100 text-2xl font-bold text-gray-700 active:bg-brand-pink active:text-white">0</button>
                    <button onClick={handleDelete} className="h-16 rounded-xl bg-gray-200 text-gray-600 font-bold text-xl">⌫</button>
                </div>

                {/* BOTÓN CANCELAR */}
                <div className="p-4 pt-0">
                    <button 
                        onClick={onClose} 
                        className="w-full py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar Operación
                    </button>
                </div>
            </div>
        </div>
    );
};