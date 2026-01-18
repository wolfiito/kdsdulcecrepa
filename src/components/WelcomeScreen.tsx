interface WelcomeScreenProps {
    onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
    return (
        <div 
            onClick={onStart}
            className="h-screen w-full bg-brand-light flex flex-col items-center justify-center cursor-pointer select-none space-y-8 animate-fade-in-up"
        >
            <div className="relative group">
                <div className="absolute inset-0 bg-brand-pink blur-3xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity"></div>
                <img src="/logo.png" alt="Logo" className="relative w-48 h-48 rounded-full shadow-2xl border-4 border-white transform transition-transform group-hover:scale-105" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-5xl font-black text-gray-800 tracking-tight">Dulce Crepa KDS</h1>
                <p className="text-xl text-brand-pink font-bold animate-pulse">Tocar pantalla para iniciar turno</p>
            </div>
        </div>
    );
};