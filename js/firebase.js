// Configuración de la plataforma: conecta la aplicación con el proyecto de Firebase.
//
// Estos datos solo IDENTIFICAN el proyecto; no son una contraseña ni un secreto.
// Lo que protege la información son las reglas de seguridad (firestore.rules),
// que Firebase evalúa en sus servidores para cada lectura y escritura.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCoPOEf1hbfLO0XQtuWusZQgeaI1Fv57MQ',
  authDomain: 'miah-catalogo-2026.firebaseapp.com',
  projectId: 'miah-catalogo-2026',
  storageBucket: 'miah-catalogo-2026.firebasestorage.app',
  messagingSenderId: '911498462721',
  appId: '1:911498462721:web:50f58bf67c4a57cb4ce200',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);     // inicio de sesión y registro
export const db = getFirestore(app);  // base de datos Cloud Firestore
