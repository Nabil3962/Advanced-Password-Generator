import { auth, db } from './firebase.js';

// ---------- Charset & Leet ----------
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
const leetMap = {a:"@",A:"@",e:"3",E:"3",i:"1",I:"1",o:"0",O:"0",s:"$",S:"$",t:"7",T:"7"};

// ---------- Password Generation ----------
function generatePassword(len){
  let pass="", start=performance.now();
  for(let i=0;i<len;i++) pass+=charset[Math.floor(Math.random()*charset.length)];
  let end=performance.now();
  document.getElementById("timer").innerText=`Time taken: ${((end-start)/1000).toFixed(4)}s`;
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
  saveHistory(pass);
}

function generatePassphrase(){
  const words=["correct","horse","battery","staple","octopus","guitar","sunset","penguin","whisper","ladder","velvet","tornado","quasar","jigsaw","xylophone","bamboo","cascade","dolphin","eclipse","firefly"];
  let pass="";
  for(let i=0;i<4;i++){pass+=words[Math.floor(Math.random()*words.length)]; if(i<3) pass+="-";}
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
  let score=0;
  if(txt.length>=8) score=1;
  if(txt.length>=12) score=2;
  if(txt.length>=16) score=3;
  if(txt.length>=20) score=4;
  const labels=["Very Weak","Weak","Medium","Strong","Very Strong"];
  document.getElementById("strength").innerText=`Password Strength: ${labels[score]}`;
  updateStrengthBar(score*20);
}

function updateStrengthBar(percent){ document.getElementById("strength-fill").style.width=percent+"%"; }

// ---------- Copy ----------
function copyPassword(){ navigator.clipboard.writeText(document.getElementById("output").value); document.getElementById("copyIcon").innerText="✅"; }
function clearTextarea(){ document.getElementById("output").value=""; checkStrength(); }

// ---------- Visibility ----------
function toggleVisibility(){ let t=document.getElementById("output"); t.type=t.type==="password"?"text":"password"; }

// ---------- Dark Mode ----------
function toggleDarkMode(){
  document.body.classList.toggle("dark-mode");
  const btn=document.querySelector(".toggle-theme");
  btn.innerText=document.body.classList.contains("dark-mode")?"🌞 Light Mode":"🌙 Dark Mode";
}

// ---------- Firestore Save ----------
function saveHistory(pass){
  const user=auth.currentUser; if(!user) return;
  db.collection("users").doc(user.uid).collection("history").doc().set({password:pass,timestamp:Date.now()});
}

// ---------- Load History ----------
auth.onAuthStateChanged(user=>{
  if(!user) return;
  db.collection("users").doc(user.uid).collection("history").orderBy("timestamp","desc").limit(10).onSnapshot(s=>{
    console.log("Last passwords:",s.docs.map(d=>d.data().password));
  });
});
