// src/services/authService.ts
import { db, collection, query, where, getDocs } from '../firebase';

// Definimos la interfaz basada en tu estructura de Firebase
export interface PosUser {
    name: string;
    username: string;
    role: string;
    // password no la exportamos por seguridad en la UI
}

export const authService = {
    // 1. Verificar si el usuario existe y traer sus datos (sin loguear aún)
    async checkUserExists(username: string): Promise<PosUser | null> {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return null;

            // Retornamos los datos del primer usuario encontrado
            const userData = snapshot.docs[0].data();
            return { 
                name: userData.name, 
                username: userData.username, 
                role: userData.role 
            } as PosUser;
        } catch (error) {
            console.error("Error buscando usuario:", error);
            return null;
        }
    },

    // 2. Verificar credenciales (Usuario + Contraseña)
    async loginWithCredentials(username: string, password: string): Promise<boolean> {
        try {
            const usersRef = collection(db, "users");
            // Nota: En un futuro, lo ideal es no guardar contraseñas en texto plano, 
            // pero esto se ajusta a tu sistema actual.
            const q = query(
                usersRef, 
                where("username", "==", username), 
                where("password", "==", password)
            );
            const snapshot = await getDocs(q);
            
            return !snapshot.empty; // Retorna true si encontró coincidencia
        } catch (error) {
            console.error("Error en login:", error);
            return false;
        }
    }
};