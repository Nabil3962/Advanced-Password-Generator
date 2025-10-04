import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// Firebase Config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Leet mapping for custom → hard password
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
const leetMap = { a:"@", A:"@", e:"3", E:"3", i:"1", I:"1", o:"0", O:"0", s:"$", S:"$", t:"7", T:"7" };

// Anonymous auth for multi-device sync
signInAnonymously(auth).then(loadHistory).catch(console.error);

// ---------- Password Generation ----------
function generatePassword(len){
  let pass="", start=performance.now();
  for(let i=0;i<len;i++) pass+=charset[Math.floor(Math.random()*charset.length)];
  const end=performance.now();
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("timer").innerText=`Time taken: ${((end-start)/1000).toFixed(4)}s`;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
  saveHistory(pass);
}

function generatePassphrase(){
  const words=["correct","horse","battery","staple","octopus","guitar","sunset","penguin","whisper","ladder","velvet","tornado","quasar","jigsaw","xylophone","bamboo","cascade","dolphin","eclipse","firefly"];
  let pass="";
  for(let i=0;i<4;i++){ pass+=words[Math.floor(Math.random()*words.length)]; if(i<3) pass+="-"; }
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
  saveHistory(pass);
}

function customToHard(){
  let base=document.getElementById("output").value.trim();
  if(!base){ alert("Enter your custom password first"); return; }
  let hard=base.split("").map(c=>{
    if(/[a-z]/.test(c)) return c.toUpperCase();
    if(/[A-Z]/.test(c)) return c.toLowerCase();
    if(/[0-9]/.test(c)) return (parseInt(c)+7)%10;
    return c==" "?"_":c;
  }).join("")+Math.random().toString(36).slice(-4);
  document.getElementById("output").value=hard;
  document.getElementById("suggestedPassword").innerText=hard;
  checkStrength(hard);
  saveHistory(hard);
}

function checkStrength(pass=""){
  const txt=pass||document.getElementById("output").value.trim();
  if(!txt){ document.getElementById("strength").innerText="Password Strength: -"; updateStrengthBar(0); return;}
  const res=zxcvbn(txt);
  const map=[{label:"Very Weak",color:"#ff4b5c"},{label:"Weak",color:"orange"},{label:"Medium",color:"yellow"},{label:"Strong",color:"yellowgreen"},{label:"Very Strong",color:"#00aaff"}];
  const lvl=map[res.score];
  document.getElementById("strength").innerHTML=`Password Strength: <strong>${lvl.label}</strong>`;
  updateStrengthBar((res.score+1)*20,lvl.color);
}

function updateStrengthBar(perc=0,color="#00aaff"){
  const bar=document.getElementById("strength-fill");
  bar.style.width=`${perc}%`;
  bar.style.background=color;
}

// ---------- Firebase History ----------
function saveHistory(pass){
  const user = auth.currentUser; if(!user) return;
  const ref = doc(collection(db,"users",user.uid,"history"));
  setDoc(ref,{password:pass,timestamp:serverTimestamp()});
}

function loadHistory(){
  auth.onAuthStateChanged(user=>{
    if(!user) return;
    const q = query(collection(db,"users",user.uid,"history"),orderBy("timestamp","desc"),limit(10));
    onSnapshot(q,snap=>{
      const h = snap.docs.map(d=>d.data().password);
      console.log("Last passwords:",h);
    });
  });
}

// ---------- Utilities ----------
function toggleDarkMode(){
  document.body.classList.toggle("dark-mode");
  const btn=document.querySelector(".toggle-theme");
  btn.innerText=document.body.classList.contains("dark-mode")?"🌞 Light Mode":"🌙 Dark Mode";
  localStorage.setItem("darkMode",document.body.classList.contains("dark-mode"));
}

if(localStorage.getItem("darkMode")==="true") toggleDarkMode();

function clearTextarea(){ document.getElementById("output").value=""; checkStrength(); }
function copyPassword(){ navigator.clipboard.writeText(document.getElementById("output").value); document.getElementById("copyIcon").innerText="✅"; }
function toggleVisibility(){
  const t=document.getElementById("output");
  t.type=t.type==="password"?"text":"password";
}
