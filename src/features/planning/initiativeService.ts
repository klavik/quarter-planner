import { collection, doc, setDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Initiative, InitiativeStatus } from '@/domain/schemas';

export const initiativeService = {
  async getInitiatives(workspaceId: string, periodId: string): Promise<Initiative[]> {
    const snap = await getDocs(collection(db, `workspaces/${workspaceId}/periods/${periodId}/initiatives`));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Initiative)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async addInitiative(workspaceId: string, periodId: string, initiative: Omit<Initiative, 'id'>): Promise<string> {
    const docRef = doc(collection(db, `workspaces/${workspaceId}/periods/${periodId}/initiatives`));
    await setDoc(docRef, { id: docRef.id, ...initiative });
    return docRef.id;
  },

  async updateInitiativeStatus(workspaceId: string, periodId: string, initiativeId: string, status: InitiativeStatus): Promise<void> {
    const docRef = doc(db, `workspaces/${workspaceId}/periods/${periodId}/initiatives/${initiativeId}`);
    await updateDoc(docRef, { status });
  },

  async updateInitiative(workspaceId: string, periodId: string, initiativeId: string, data: Partial<Initiative>): Promise<void> {
    const docRef = doc(db, 'workspaces', workspaceId, 'periods', periodId, 'initiatives', initiativeId);
    await updateDoc(docRef, data as any);
  },

  async deleteInitiative(workspaceId: string, periodId: string, initiativeId: string): Promise<void> {
    await deleteDoc(doc(db, `workspaces/${workspaceId}/periods/${periodId}/initiatives/${initiativeId}`));
  }
};
