'use client'

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth as _getAuth, type Auth } from 'firebase/auth'
import { getFirestore as _getFirestore, type Firestore } from 'firebase/firestore'
import { getFunctions as _getFunctions, type Functions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'vinie-7c225.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'vinie-7c225',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'vinie-7c225.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '874805271326',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
}

const functionsRegion = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'us-central1'
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId)

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null
let _functions: Functions | null = null

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  }
  return _app
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = _getAuth(getApp())
  return _auth
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = _getFirestore(getApp())
  return _db
}

export function getFirebaseFunctions(): Functions {
  if (!_functions) _functions = _getFunctions(getApp(), functionsRegion)
  return _functions
}
