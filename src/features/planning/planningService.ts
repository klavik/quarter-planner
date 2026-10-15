import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { PlanningPeriod } from '@/domain/schemas';

export const planningService = {
  async getPeriods(workspaceId: string): Promise<PlanningPeriod[]> {
    const snap = await getDocs(collection(db, `workspaces/${workspaceId}/periods`));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PlanningPeriod)).sort((a, b) => a.dateStart.localeCompare(b.dateStart));
  },

  async createPeriod(workspaceId: string, period: Omit<PlanningPeriod, 'id'>): Promise<string> {
    const periodRef = doc(collection(db, `workspaces/${workspaceId}/periods`));
    await setDoc(periodRef, { id: periodRef.id, ...period });
    return periodRef.id;
  }
};
