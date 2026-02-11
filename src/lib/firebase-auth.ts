// Firebase Auth initialization - separate file for easy removal
// Delete this file to remove auth dependency
import { getAuth, Auth } from 'firebase/auth';
import { app } from './firebase';

// Only initialize auth if app is available
export const auth: Auth | null = app ? getAuth(app) : null;
