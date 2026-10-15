import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
}

export type UserRole = 'top_manager' | 'team_lead' | 'member';

export interface WorkspaceMember {
  userId: string;
  role: UserRole;
  teamId?: string; // Обязательно для team_lead и member
  joinedAt: string;
}

export const teamService = {
  // Получить список команд в воркспейсе
  async getTeams(workspaceId: string): Promise<Team[]> {
    const q = query(collection(db, 'teams'), where('workspaceId', '==', workspaceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
  },

  // Создать команду (доступно только админам/топ-менеджерам)
  async createTeam(workspaceId: string, name: string): Promise<Team> {
    const teamRef = doc(collection(db, 'teams'));
    const team: Team = {
      id: teamRef.id,
      workspaceId,
      name,
      createdAt: new Date().toISOString()
    };
    await setDoc(teamRef, team);
    return team;
  },

  // Получить роль и данные участника в воркспейсе
  async getMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const memberRef = doc(db, `workspaces/${workspaceId}/members/${userId}`);
    const snap = await getDoc(memberRef);
    if (snap.exists()) {
      return snap.data() as WorkspaceMember;
    }
    return null;
  },

  // Назначить или обновить роль участника
  async setMemberRole(workspaceId: string, userId: string, role: UserRole, teamId?: string): Promise<void> {
    const memberRef = doc(db, `workspaces/${workspaceId}/members/${userId}`);
    await setDoc(memberRef, {
      userId,
      role,
      teamId: teamId || null,
      joinedAt: new Date().toISOString()
    }, { merge: true });
  }
};
