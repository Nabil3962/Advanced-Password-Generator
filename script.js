// ------------------ Firebase Setup ------------------
// TODO: Replace these with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Anonymous login for multi-device sync
auth.signInAnonymously().catch(console.error);

// ------------------ Password Logic ------------------
const charset="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
const leetMap={a:"@",A:"4",s:"$",S:"5",i:"1",I:"!",o:"0",O:"0",e:"3",E:"3",g:"9",G:"6",t:"7",T:"7"};

let userId=null;
auth.onAuthStateChanged(user=>{
  if(user){
    userId=user.uid;
    loadHistory();
  }
});

function saveHistory(password){
  if(!userId) return;
  const docRef=db.collection("users").doc(userId);
  docRef.set({
    history: firebase.firestore.FieldValue.arrayUnion(password)
  }, {merge:true});
  loadHistory();
}

async function loadHistory(){
  if(!userId) return;
  const docRef = db.collection("users").doc(userId);
  const doc = await docRef.get();
  const listEl = document.getElementById("historyList");
  listEl.innerHTML="";
  if(doc.exists && doc.data().history){
    doc.data().history.slice(-10).reverse().forEach(p=>{
      const li=document.createElement("li");
      li.textContent=p;
      listEl.appendChild(li);
    });
  }
}

// ------------------ Existing Features ------------------
function generatePassword(len){
  let pass="";
  const start=performance.now();
  for(let i=0;i<len;i++) pass+=charset[Math.floor(Math.random()*charset.length)];
  const end=performance.now();
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("timer").innerText=`Time taken: ${((end-start)/1000).toFixed(4)}s`;
  checkStrength(pass);
  saveHistory(pass);
}

function generatePassphrase(){
  const wordList=["correct","horse","battery","staple","octopus","guitar","sunset","penguin","whisper","ladder","velvet","tornado","quasar","jigsaw","xylophone","bamboo","cascade","dolphin","eclipse","firefly"];
  let pass="";
  for(let i=0;i<4;i++){pass+=wordList[Math.floor(Math.random()*wordList.length)]; if(i<3) pass+="-";}
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  checkStrength(pass);
  saveHistory(pass);
}

function generateFromInput(){
  const inp=document.getElementById("output").value.trim();
  if(!inp){alert("Type a password first!"); return;}
  let newPass="";
  for(let c of inp){ newPass += leetMap[c] || c; newPass += charset[Math.floor(Math.random()*charset.length)];}
  document.getElementById("output").value=newPass;
  document.getElementById("suggestedPassword").innerText=newPass;
  checkStrength(newPass);
  saveHistory(newPass);
}

// ------------------ Strength & Breach ------------------
function checkStrength(p=""){
  const text=p||document.getElementById("output").value.trim();
  if(!text){document.getElementById("strength").innerText="Password Strength: -"; updateStrengthBar(0); return;}
  const res=zxcvbn(text);
  const map=[{label:"Very Weak",color:"#ff4b5c"},{label:"Weak",color:"orange"},{label:"Medium",color:"yellow"},{label:"Strong",color:"yellowgreen"},{label:"Very Strong",color: "#00aaff"}];
  const lvl=map[res.score];
  document.getElementById("strength").innerHTML=`Password Strength: <strong>${lvl.label}</strong> <small>(can be cracked ${res.crack_times_display.online_no_throttling_10_per_second})</small>`;
  updateStrengthBar((res.score/4)*100,lvl.color);
}

function updateStrengthBar(w,color="var(--primary)"){document.getElementById("strength-fill").style.width=w+"%"; document.getElementById("strength-fill").style.background=color;}

function toggleVisibility(){const o=document.getElementById("output"); o.type=o.type==="password"?"textarea":"password";}

async function checkPwned(password){
  if(!password){alert("Generate or type password first"); return;}
  try{
    const hash=await sha1(password);
    const prefix=hash.substring(0,5);
    const suffix=hash.substring(5).toUpperCase();
    const res=await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const data=await res.text();
    const match=data.split('\n').find(l=>l.startsWith(suffix));
    match?alert(`⚠️ Appeared in ${match.split(':')[1]} breaches!`):alert("✅ Not found in known breaches.");
  }catch(e){console.error(e); alert("Error checking breaches.");}
}

async function sha1(msg){const buf=new TextEncoder().encode(msg); const hash=await crypto.subtle.digest('SHA-1',buf); return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');}

// ------------------ Copy & Clear ------------------
function copyPassword(){const p=document.getElementById("suggestedPassword").innerText; if(!p||p==="Click to generate"){alert("Generate first"); return;} navigator.clipboard.writeText(p).then(()=>{document.getElementById("copyIcon").innerText="✅"; setTimeout(()=>{document.getElementById("copyIcon").innerText="📋";},2000);});}

function clearTextarea(){document.getElementById("output").value=""; document.getElementById("strength").innerText="Password Strength: -"; document.getElementById("timer").innerText="Time taken: 0s"; updateStrengthBar(0);}

// ------------------ Dark Mode ------------------
function toggleDarkMode(){
  const btn=document.querySelector('.toggle-theme');
  document.body.classList.toggle("dark-mode");
  const isDark=document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode",isDark);
  btn.innerText=isDark?"☀️ Light Mode":"🌙 Dark Mode";
}

const modeBtn=document.querySelector('.toggle-theme');
if(localStorage.getItem("darkMode")==="true"){document.body.classList.add("dark-mode"); modeBtn.innerText="☀️ Light Mode";} 
else{modeBtn.innerText="🌙 Dark Mode";}

document.getElementById("output").type="textarea";
