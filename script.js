import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";

// Firebase config using .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Leet map for custom → hard password
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
const leetMap = {a:"@",A:"@",e:"3",E:"3",i:"1",I:"1",o:"0",O:"0",s:"$",S:"$",t:"7",T:"7"};

// Anonymous login and load history
signInAnonymously(auth).then(loadHistory).catch(console.error);

// Password generation
export function generatePassword(len){
  let pass="", start=performance.now();
  for(let i=0;i<len;i++) pass+=charset[Math.floor(Math.random()*charset.length)];
  const end=performance.now();
  document.getElementById("timer").innerText=`Time taken: ${((end-start)/1000).toFixed(4)}s`;
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
  saveHistory(pass);
}

// Passphrase
export function generatePassphrase(){
  const words=["correct","horse","battery","staple","octopus","guitar","sunset","penguin","whisper","ladder","velvet","tornado","quasar","jigsaw","xylophone","bamboo","cascade","dolphin","eclipse","firefly"];
  let pass=""; for(let i=0;i<4;i++){ pass+=words[Math.floor(Math.random()*words.length)]; if(i<3) pass+="-"; }
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
  saveHistory(pass);
}

// Custom → Hard
export function customToHard(){
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

// Password strength
export function checkStrength(pass=""){
  const txt=pass||document.getElementById("output").value.trim();
  if(!txt){ document.getElementById("strength").innerText="Password Strength: -"; updateStrengthBar(0); return;}
  const res=zxcvbn(txt);
  const map=[{label:"Very Weak",color:"#ff4b5c"},{label:"Weak",color:"orange"},{label:"Medium",color:"yellow"},{label:"Strong",color:"yellowgreen"},{label:"Very Strong",color:"#00aaff"}];
  const lvl=map[res.score];
  document.getElementById("strength").innerHTML=`Password Strength: <strong>${lvl.label}</strong> <small>(can be cracked ${res.crack_times_display.online_no_throttling_10_per_second})</small>`;
  updateStrengthBar((res.score+1)*20,lvl.color);
}

function updateStrengthBar(width=0,color="#00aaff"){
  const bar=document.getElementById("strength-fill");
  bar.style.width=width+"%";
  bar.style.backgroundColor=color;
}

// Toggle dark mode
export function toggleDarkMode(){
  const body=document.body;
  body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode",body.classList.contains("dark-mode"));
  document.querySelector(".toggle-theme").innerText=body.classList.contains("dark-mode")?"🌞 Light Mode":"🌙 Dark Mode";
}

if(localStorage.getItem("darkMode")==="true") toggleDarkMode();

// Copy password
export function copyPassword(){
  const out=document.getElementById("output");
  out.select(); navigator.clipboard.writeText(out.value);
  document.getElementById("copyIcon").innerText="✅";
}

// Toggle visibility
export function toggleVisibility(){
  const out=document.getElementById("output");
  out.type = out.type==="password"?"text":"password";
}

// Clear textarea
export function clearTextarea(){
  document.getElementById("output").value="";
  document.getElementById("suggestedPassword").innerText="";
  document.getElementById("copyIcon").innerText="📋";
  document.getElementById("strength").innerText="Password Strength: -";
  updateStrengthBar(0);
}

// Firestore save/load
function saveHistory(pass){
  const user=auth.currentUser; if(!user) return;
  setDoc(doc(collection(db,"users",user.uid,"history")), {password:pass, timestamp:serverTimestamp()});
}

function loadHistory(){
  auth.onAuthStateChanged(user=>{
    if(!user) return;
    const q=query(collection(db,"users",user.uid,"history"), orderBy("timestamp","desc"), limit(10));
    onSnapshot(q,snap=>{
      const h=snap.docs.map(d=>d.data().password);
      console.log("Last passwords:",h);
    });
  });
}
