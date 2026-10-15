import { collection, doc, setDoc, deleteDoc, getDocs, query } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { z } from 'zod';

export const AbsenceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Укажите причину/название"),
  personId: z.string().nullable(), // null = Глобальный праздник для всех
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type Absence = z.infer<typeof AbsenceSchema>;

export const calendarService = {
  async getAbsences(workspaceId: string): Promise<Absence[]> {
    const q = query(collection(db, `workspaces/${workspaceId}/absences`));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Absence));
  },
  
  async addAbsence(workspaceId: string, absence: Omit<Absence, 'id'>): Promise<string> {
    const docRef = doc(collection(db, `workspaces/${workspaceId}/absences`));
    await setDoc(docRef, { id: docRef.id, ...absence });
    return docRef.id;
  },

  async deleteAbsence(workspaceId: string, absenceId: string): Promise<void> {
    await deleteDoc(doc(db, `workspaces/${workspaceId}/absences/${absenceId}`));
  }
};
