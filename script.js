// ---------- Firebase Setup ----------
const firebaseConfig = {
  apiKey: "AIzaSyCJT9-254-jxY9i_plfGxu2XnMD_a7zW-Y",
  authDomain: "advanced-password-generator.firebaseapp.com",
  projectId: "advanced-password-generator",
  storageBucket: "advanced-password-generator.appspot.com",
  messagingSenderId: "126374204251",
  appId: "1:126374204251:web:YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ---------- Leet Mapping & Charset ----------
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
const leetMap = {a:"@",A:"@",e:"3",E:"3",i:"1",I:"1",o:"0",O:"0",s:"$",S:"$",t:"7",T:"7"};

// ---------- Authentication ----------
auth.signInAnonymously().then(()=>loadHistory()).catch(err=>console.error(err));

// ---------- Generate Password ----------
function generatePassword(len){
  let pass="", start=performance.now();
  for(let i=0;i<len;i++) pass+=charset[Math.floor(Math.random()*charset.length)];
  let end=performance.now();
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("timer").innerText=`Time taken: ${((end-start)/1000).toFixed(4)}s`;
  checkStrength(pass);
  saveHistory(pass);
}

// ---------- Generate Passphrase ----------
function generatePassphrase(){
  const wordList=["correct","horse","battery","staple","octopus","guitar","sunset","penguin","whisper","ladder","velvet","tornado","quasar","jigsaw","xylophone","bamboo","cascade","dolphin","eclipse","firefly"];
  let pass="";
  for(let i=0;i<4;i++){pass+=wordList[Math.floor(Math.random()*wordList.length)]; if(i<3) pass+="-";}
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  checkStrength(pass);
  saveHistory(pass);
}

// ---------- Custom Input → Hard Password ----------
function generateFromInput(){
  const inp=document.getElementById("output").value.trim();
  if(!inp){alert("Type a password first!"); return;}
  let newPass="";
  for(let c of inp){ newPass += leetMap[c]||c; newPass += charset[Math.floor(Math.random()*charset.length)];}
  document.getElementById("output").value=newPass;
  document.getElementById("suggestedPassword").innerText=newPass;
  checkStrength(newPass);
  saveHistory(newPass);
}

// ---------- Password Strength ----------
function checkStrength(p=""){
  const text=p||document.getElementById("output").value.trim();
  if(!text){document.getElementById("strength").innerText="Password Strength: -"; updateStrengthBar(0); return;}
  const res=zxcvbn(text);
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

// ---------- Firestore Save & Load ----------
function saveHistory(pass){
  const user=auth.currentUser; if(!user) return;
  db.collection("users").doc(user.uid).collection("history").doc().set({password:pass,timestamp:firebase.firestore.FieldValue.serverTimestamp()});
}
function loadHistory(){
  auth.onAuthStateChanged(user=>{
    if(!user) return;
    db.collection("users").doc(user.uid).collection("history").orderBy("timestamp","desc").limit(10).onSnapshot(s=>{
      const h=s.docs.map(d=>d.data().password);
      console.log("Last passwords:",h);
    });
  });
}

// ---------- Pwned Passwords ----------
async function checkPwned(p){
  if(!p){alert("Generate first"); return;}
  try{
    const h=await sha1(p); const prefix=h.substring(0,5); const suffix=h.substring(5).toUpperCase();
    const res=await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    const txt=await res.text(); const m=txt.split('\n').find(line=>line.startsWith(suffix));
    if(m){const count=m.split(':')[1]; alert(`⚠️ Warning: Found in ${count} breaches!`);}
    else alert("✅ Not found in known breaches.");
  } catch(e){console.error(e); alert("Error checking breaches");}
}

async function sha1(msg){ const buf=new TextEncoder().encode(msg); const hash=await crypto.subtle.digest("SHA-1",buf); return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join(""); }
