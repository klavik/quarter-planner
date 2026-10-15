import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Workspace } from '@/domain/schemas';

export const workspaceService = {
  async createWorkspace(userId: string, name: string): Promise<Workspace> {
    const wsRef = doc(collection(db, 'workspaces'));
    const workspace: Workspace = {
      id: wsRef.id,
      name,
      defaultIterationDays: 14,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(wsRef, workspace);

    const memberRef = doc(db, `workspaces/${wsRef.id}/members/${userId}`);
    await setDoc(memberRef, { userId, role: 'owner', joinedAt: new Date().toISOString() });

    const userRef = doc(db, `users/${userId}`);
    await setDoc(userRef, { lastWorkspaceId: wsRef.id }, { merge: true });

    return workspace;
  },

  async getUserWorkspace(userId: string): Promise<Workspace | null> {
    const userRef = doc(db, `users/${userId}`);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists() && userSnap.data().lastWorkspaceId) {
      const wsRef = doc(db, `workspaces/${userSnap.data().lastWorkspaceId}`);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        return { id: wsSnap.id, ...wsSnap.data() } as Workspace;
      }
    }
    return null;
  }
};
