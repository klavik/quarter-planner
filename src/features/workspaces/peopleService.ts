import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Person } from '@/domain/schemas';

export interface Allocation {
  teamId: string;
  percentage: number;
  dateStart?: string; // YYYY-MM-DD
  dateEnd?: string;   // YYYY-MM-DD
}

export interface PersonWithAllocations extends Person {
  allocations: Allocation[];
}

export const peopleService = {
  async getPeople(workspaceId: string): Promise<PersonWithAllocations[]> {
    const querySnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/people`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonWithAllocations));
  },
  
  async addPerson(workspaceId: string, person: Omit<PersonWithAllocations, 'id'>): Promise<string> {
    const docRef = doc(collection(db, `workspaces/${workspaceId}/people`));
    await setDoc(docRef, { id: docRef.id, ...person });
    return docRef.id;
  },

  async deletePerson(workspaceId: string, personId: string): Promise<void> {
    await deleteDoc(doc(db, `workspaces/${workspaceId}/people/${personId}`));
  }
};
