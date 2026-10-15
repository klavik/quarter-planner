import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/firebase/config';
import { z } from 'zod';

export const AuthCredentialsSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;

export const authService = {
  async login(credentials: AuthCredentials): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  },
  async register(credentials: AuthCredentials): Promise<UserCredential> {
    return createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
  },
  async logout(): Promise<void> {
    return signOut(auth);
  },
  async resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(auth, email);
  }
};
