import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
	appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

function isConfigComplete(cfg) {
	return Boolean(
		cfg.apiKey &&
		cfg.authDomain &&
		cfg.projectId &&
		cfg.storageBucket &&
		cfg.messagingSenderId &&
		cfg.appId
	)
}

let app = null
let auth = null
let firebaseInitError = ''
let db = null

if (isConfigComplete(firebaseConfig)) {
	try {
		app = initializeApp(firebaseConfig)
		auth = getAuth(app)
		db = getFirestore(app)
	} catch (e) {
		firebaseInitError = (e && e.message) ? e.message : 'Failed to initialize Firebase'
	}
} else {
	firebaseInitError = 'Missing Firebase environment variables. Create .env.local with VITE_FIREBASE_* keys.'
}

export { app, auth, db, firebaseInitError }

