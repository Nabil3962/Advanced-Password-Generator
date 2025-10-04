const charset="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
const leetMap={a:"@",A:"4",s:"$",S:"5",i:"1",I:"!",o:"0",O:"0",e:"3",E:"3",g:"9",G:"6",t:"7",T:"7"};

function generatePassword(len){
  let pass="";
  const start=performance.now();
  for(let i=0;i<len;i++) pass+=charset[Math.floor(Math.random()*charset.length)];
  const end=performance.now();
  document.getElementById("timer").innerText=`Time taken: ${((end-start)/1000).toFixed(4)}s`;
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
}

function generatePassphrase(){
  const words=["correct","horse","battery","staple","octopus","guitar","sunset","penguin","whisper","ladder","velvet","tornado","quasar","jigsaw","xylophone","bamboo","cascade","dolphin","eclipse","firefly"];
  let pass="";
  for(let i=0;i<4;i++){ pass+=words[Math.floor(Math.random()*words.length)]; if(i<3) pass+="-";}
  document.getElementById("output").value=pass;
  document.getElementById("suggestedPassword").innerText=pass;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(pass);
}

function generateFromInput(){
  const base=prompt("Enter your password / word:"); if(!base) return;
  let mutated="";
  for(let ch of base) mutated+=leetMap[ch]?Math.random()>0.5?leetMap[ch]:ch:ch;
  mutated=mutated.split("").map(ch=>Math.random()>0.3?ch.toUpperCase():ch).join("");
  for(let i=0;i<4;i++){ 
    const r=charset[Math.floor(Math.random()*charset.length)];
    const pos=Math.floor(Math.random()*(mutated.length+1));
    mutated=mutated.slice(0,pos)+r+mutated.slice(pos);
  }
  mutated=mutated.split('').sort(()=>Math.random()-0.5).join('');
  document.getElementById("output").value=mutated;
  document.getElementById("suggestedPassword").innerText=mutated;
  document.getElementById("copyIcon").innerText="📋";
  checkStrength(mutated);
}

function checkStrength(password=""){
  const text=password||document.getElementById("output").value.trim();
  if(!text){ document.getElementById("strength").innerText="Password Strength: -"; updateStrengthBar(0); return;}
  const res=zxcvbn(text);
  const map=[{label:"Very Weak",color:"#ff4b5c"},{label:"Weak",color:"orange"},{label:"Medium",color:"yellow"},{label:"Strong",color:"yellowgreen"},{label:"Very Strong",color:"#00aaff"}];
  const lvl=map[res.score];
  document.getElementById("strength").innerHTML=`Password Strength: <strong>${lvl.label}</strong> <small>(can be cracked ${res.crack_times_display.online_no_throttling_10_per_second})</small>`;
  updateStrengthBar((res.score/4)*100,lvl.color);
}

function updateStrengthBar(width,color="red"){document.getElementById("strength-fill").style.width=width+"%";document.getElementById("strength-fill").style.background=color;}

function toggleVisibility(){const o=document.getElementById("output");o.type=o.type==="password"?"textarea":"password";}

async function checkPwned(password){
  if(!password){alert("Please generate or enter a password first");return;}
  try{
    const hash=await sha1(password);
    const pre=hash.substring(0,5);
    const suf=hash.substring(5).toUpperCase();
    const res=await fetch(`https://api.pwnedpasswords.com/range/${pre}`);
    const data=await res.text();
    const match=data.split("\n").find(l=>l.startsWith(suf));
    if(match){ const count=match.split(":")[1]; alert(`⚠️ Warning: This password has appeared in ${count} breaches!`);}
    else alert("✅ This password has NOT been found in any known breaches.");
  }catch(e){console.error(e);alert("Error checking password");}
}

async function sha1(msg){const buf=new TextEncoder().encode(msg);const hash=await crypto.subtle.digest("SHA-1",buf);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");}

function copyPassword(){const p=document.getElementById("suggestedPassword").innerText;if(!p||p==="Click to generate"){alert("Please generate a password first");return;}navigator.clipboard.writeText(p).then(()=>{document.getElementById("copyIcon").innerText="✅";setTimeout(()=>document.getElementById("copyIcon").innerText="📋",2000);});}

function clearTextarea(){document.getElementById("output").value="";document.getElementById("strength").innerText="Password Strength: -";document.getElementById("timer").innerText="Time taken: 0s";updateStrengthBar(0);}

function toggleDarkMode(){document.body.classList.toggle("dark-mode");localStorage.setItem("darkMode",document.body.classList.contains("dark-mode"));}

if(localStorage.getItem("darkMode")==="true") document.body.classList.add("dark-mode");
document.getElementById("output").type="textarea";
