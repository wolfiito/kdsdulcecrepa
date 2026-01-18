import { useState, useEffect } from 'react';

export const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <span className="font-mono text-xl md:text-2xl font-bold tracking-widest text-brand-dark">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
    );
};