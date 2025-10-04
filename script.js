// ---------- Firebase Config ----------
const firebaseConfig = {
  apiKey: "AIzaSyCJT9-254-jxY9i_plfGxu2XnMD_a7zW-Y",
  authDomain: "advanced-password-generator.firebaseapp.com",
  projectId: "advanced-password-generator",
  storageBucket: "advanced-password-generator.appspot.com",
  messagingSenderId: "126374204251",
  appId: "1:126374204251:web:182b2b42ff9bd0fcef807e",
  measurementId: "G-TYGNXHMTZF"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------- Anonymous Auth ----------
auth.signInAnonymously().catch(e=>console.error(e));

// ---------- Password Generation ----------
function generatePassword(len){
  const charset="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
  let pass=""; const start=performance.now();
  for(let i=0;i<len;i++) pass+=charset[Math.floor(Math.random()*charset.length)];
  const end=performance.now();
  document.getElementById("timer").innerText=`Time taken: ${((end-start)/1000).toFixed(4)}s`;
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
  saveHistory(pass);
}

function generatePassphrase(){
  const words=["correct","horse","battery","staple","octopus","guitar","sunset","penguin","whisper","ladder","velvet","tornado","quasar","jigsaw","xylophone","bamboo","cascade","dolphin","eclipse","firefly"];
  let pass=""; for(let i=0;i<4;i++){ pass+=words[Math.floor(Math.random()*words.length)]; if(i<3) pass+="-"; }
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
  saveHistory(pass);
}

// ---------- Custom → Hard ----------
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

// ---------- Strength ----------
function checkStrength(pass=""){
  const txt=pass||document.getElementById("output").value.trim();
  if(!txt){ document.getElementById("strength").innerText="Password Strength: -"; updateStrengthBar(0); return;}
  const res=zxcvbn(txt);
  const map=[{label:"Very Weak",color:"#ff4b5c"},{label:"Weak",color:"orange"},{label:"Medium",color:"yellow"},{label:"Strong",color:"yellowgreen"},{label:"Very Strong",color:"#00aaff"}];
  const lvl=map[res.score];
  document.getElementById("strength").innerHTML=`Password Strength: <strong>${lvl.label}</strong> <small>(can be cracked ${res.crack_times_display.online_no_throttling_10_per_second})</small>`;
  updateStrengthBar((res.score/4)*100,lvl.color);
}

// ---------- Strength Bar ----------
function updateStrengthBar(w,col="red"){ const fill=document.getElementById("strength-fill"); fill.style.width=`${w}%`; fill.style.background=col; }

// ---------- Toggle Visibility ----------
function toggleVisibility(){ const o=document.getElementById("output"); o.type=o.type==="password"?"textarea":"password"; }

// ---------- Copy ----------
function copyPassword(){ const p=document.getElementById("suggestedPassword").innerText; if(!p||p==="Click to generate"){alert("Generate first"); return;} navigator.clipboard.writeText(p).then(()=>{document.getElementById("copyIcon").innerText="✅"; setTimeout(()=>{document.getElementById("copyIcon").innerText="📋"},2000);});}

// ---------- Clear ----------
function clearTextarea(){document.getElementById("output").value="";document.getElementById("strength").innerText="Password Strength: -";document.getElementById("timer").innerText="Time taken: 0s";updateStrengthBar(0);}

// ---------- Dark Mode ----------
function toggleDarkMode(){
  document.body.classList.toggle("dark-mode");
  const btn=document.querySelector(".toggle-theme");
  btn.innerText=document.body.classList.contains("dark-mode")?"🌞 Light Mode":"🌙 Dark Mode";
  localStorage.setItem("darkMode",document.body.classList.contains("dark-mode"));
}
if(localStorage.getItem("darkMode")==="true"){document.body.classList.add("dark-mode");document.querySelector(".toggle-theme").innerText="🌞 Light Mode";}

// ---------- Firestore Save ----------
function saveHistory(pass){
  const user=auth.currentUser; if(!user) return;
  db.collection("users").doc(user.uid).collection("history").doc().set({password:pass,timestamp:firebase.firestore.FieldValue.serverTimestamp()});
}

// ---------- Pwned ----------
async function checkPwned(p){
  if(!p){alert("Generate first"); return;}
  try{
    const h=await sha1(p); const prefix=h.substring(0,5); const suffix=h.substring(5).toUpperCase();
    const res=await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const txt=await res.text(); const m=txt.split('\n').find(line=>line.startsWith(suffix));
    if(m){const count=m.split(':')[1]; alert(`⚠️ Found in ${count} breaches!`);}
    else alert("✅ Not found in known breaches.");
  } catch(e){console.error(e); alert("Error checking breaches");}
}
async function sha1(msg){ const buf=new TextEncoder().encode(msg); const hash=await crypto.subtle.digest("SHA-1",buf); return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join(""); }
