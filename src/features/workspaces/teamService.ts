import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Team, ResourceType } from '@/domain/schemas';

export const teamService = {
  // --- Teams ---
  async getTeams(workspaceId: string): Promise<Team[]> {
    const querySnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/teams`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
  },
  
  async addTeam(workspaceId: string, team: Omit<Team, 'id'>): Promise<string> {
    const docRef = doc(collection(db, `workspaces/${workspaceId}/teams`));
    await setDoc(docRef, { id: docRef.id, ...team });
    return docRef.id;
  },

  async deleteTeam(workspaceId: string, teamId: string): Promise<void> {
    await deleteDoc(doc(db, `workspaces/${workspaceId}/teams/${teamId}`));
  },

  // --- Resource Types ---
  async getResourceTypes(workspaceId: string): Promise<ResourceType[]> {
    const querySnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/resourceTypes`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceType));
  },
  
  async addResourceType(workspaceId: string, name: string): Promise<string> {
    const docRef = doc(collection(db, `workspaces/${workspaceId}/resourceTypes`));
    await setDoc(docRef, { id: docRef.id, name });
    return docRef.id;
  },

  async deleteResourceType(workspaceId: string, typeId: string): Promise<void> {
    await deleteDoc(doc(db, `workspaces/${workspaceId}/resourceTypes/${typeId}`));
  }
};
