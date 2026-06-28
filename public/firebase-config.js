import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOOWMg9quYz0YSVZAH89sttzBn9go0rlM",
  authDomain: "pomodoro-webapp-870c6.firebaseapp.com",
  projectId: "pomodoro-webapp-870c6",
  storageBucket: "pomodoro-webapp-870c6.firebasestorage.app",
  messagingSenderId: "497803327887",
  appId: "1:497803327887:web:48ab2eeba9af19d75ef3fa",
  measurementId: "G-14KX411GYT"
};

const app = initializeApp(firebaseConfig);

// App Check — ทำงานทุก environment
initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LeifzktAAAAALXts1fC9hL1hVPEVZKqlRwuiwcT"),
  isTokenAutoRefreshEnabled: true,
});

const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };