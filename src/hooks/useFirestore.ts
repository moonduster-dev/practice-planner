import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseFirestoreOptions {
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  options: UseFirestoreOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const collectionRef = collection(db, collectionName);

      let q;
      if (options.orderByField) {
        q = query(
          collectionRef,
          orderBy(options.orderByField, options.orderDirection || 'asc')
        );
      } else {
        q = query(collectionRef);
      }

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...convertTimestamps(data),
          id: doc.id,
        } as T;
      });

      setData(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [collectionName, options.orderByField, options.orderDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const add = async (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const collectionRef = collection(db, collectionName);
    const now = Timestamp.now();
    const docRef = await addDoc(collectionRef, {
      ...item,
      createdAt: now,
      updatedAt: now,
    });
    await fetchData();
    return docRef.id;
  };

  const update = async (id: string, updates: Partial<T>): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    } as DocumentData);
    await fetchData();
  };

  const remove = async (id: string): Promise<void> => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    await fetchData();
  };

  const getById = async (id: string): Promise<T | null> => {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        ...convertTimestamps(data),
        id: snapshot.id,
      } as T;
    }
    return null;
  };

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    add,
    update,
    remove,
    getById,
  };
}

// Helper to convert Firestore Timestamps to Date objects
function convertTimestamps(data: DocumentData): DocumentData {
  const converted: DocumentData = {};

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      converted[key] = convertTimestamps(value);
    } else {
      converted[key] = value;
    }
  }

  return converted;
}
