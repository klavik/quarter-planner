import { collection, doc, setDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Task, TaskStatus } from '@/domain/schemas';

export const taskService = {
  async getTasks(workspaceId: string, periodId: string): Promise<Task[]> {
    const snap = await getDocs(collection(db, `workspaces/${workspaceId}/periods/${periodId}/tasks`));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
  },

  async addTask(workspaceId: string, periodId: string, task: Omit<Task, 'id'>): Promise<string> {
    const docRef = doc(collection(db, `workspaces/${workspaceId}/periods/${periodId}/tasks`));
    await setDoc(docRef, { id: docRef.id, ...task });
    return docRef.id;
  },

  async updateTask(workspaceId: string, periodId: string, taskId: string, data: Partial<Task>): Promise<void> {
    const docRef = doc(db, `workspaces/${workspaceId}/periods/${periodId}/tasks/${taskId}`);
    await updateDoc(docRef, data);
  },

  async updateTaskStatus(workspaceId: string, periodId: string, taskId: string, status: TaskStatus, statusReason?: string): Promise<void> {
    const docRef = doc(db, `workspaces/${workspaceId}/periods/${periodId}/tasks/${taskId}`);
    const updateData: any = { status };
    if (statusReason !== undefined) updateData.statusReason = statusReason;
    await updateDoc(docRef, updateData);
  },

  async deleteTask(workspaceId: string, periodId: string, taskId: string): Promise<void> {
    await deleteDoc(doc(db, `workspaces/${workspaceId}/periods/${periodId}/tasks/${taskId}`));
  }
};
