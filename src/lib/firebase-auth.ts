// Firebase Auth initialization - separate file for easy removal
// Delete this file to remove auth dependency
import { getAuth } from 'firebase/auth';
import { app } from './firebase';

export const auth = getAuth(app);
