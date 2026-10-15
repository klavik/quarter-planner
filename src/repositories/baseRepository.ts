import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  QueryConstraint, query, DocumentData, PartialWithFieldValue, WithFieldValue 
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export class BaseRepository<T extends { id?: string }> {
  protected collectionName: string;

  constructor(collectionPath: string) {
    this.collectionName = collectionPath;
  }

  protected getCollectionRef() {
    return collection(db, this.collectionName);
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.getCollectionRef(), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }

  async create(id: string, data: WithFieldValue<Omit<T, 'id'>>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await setDoc(docRef, data);
  }

  async add(data: WithFieldValue<Omit<T, 'id'>>): Promise<string> {
    const docRef = doc(this.getCollectionRef());
    await setDoc(docRef, data);
    return docRef.id;
  }

  async update(id: string, data: PartialWithFieldValue<Omit<T, 'id'>>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data as DocumentData);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}
