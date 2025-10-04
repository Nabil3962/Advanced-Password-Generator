const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
const leetMap = {
  "a": "@", "A": "4",
  "s": "$", "S": "5",
  "i": "1", "I": "!",
  "o": "0", "O": "0",
  "e": "3", "E": "3",
  "g": "9", "G": "6",
  "t": "7", "T": "7"
};

// Set password in box & check strength
function setPassword(pass) {
  document.getElementById("password").value = pass;
  checkStrength(pass);
}

// Copy password
function copyPassword() {
  const pass = document.getElementById("password");
  pass.select();
  document.execCommand("copy");
  alert("Copied: " + pass.value);
}

// Random password
function generatePassword() {
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += charset[Math.floor(Math.random() * charset.length)];
  }
  setPassword(pass);
}

// Simple shuffle
function generateCustomSimple() {
  const base = prompt("Enter your base password/word:");
  if (!base) return;
  const shuffled = base.split('').sort(() => Math.random() - 0.5).join('');
  setPassword(shuffled);
}

// AI Mutation
function generateCustomAI() {
  const base = prompt("Enter your base password/word:");
  if (!base) return;

  let mutated = "";

  // Step 1: Leet replacements
  for (let ch of base) {
    if (leetMap[ch]) {
      mutated += Math.random() > 0.5 ? leetMap[ch] : ch;
    } else {
      mutated += ch;
    }
  }

  // Step 2: Random uppercase
  mutated = mutated.split("").map(ch =>
    Math.random() > 0.3 ? ch.toUpperCase() : ch
  ).join("");

  // Step 3: Insert random chars
  for (let i = 0; i < 4; i++) {
    const randChar = charset[Math.floor(Math.random() * charset.length)];
    const pos = Math.floor(Math.random() * (mutated.length + 1));
    mutated = mutated.slice(0, pos) + randChar + mutated.slice(pos);
  }

  // Step 4: Shuffle
  mutated = mutated.split('').sort(() => Math.random() - 0.5).join('');
  setPassword(mutated);
}

// Strength checker
function checkStrength(password) {
  let strength = "Weak ❌";

  if (password.length >= 12 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[!@#$%^&*]/.test(password)) {
    strength = "Strong ✅";
  } else if (password.length >= 8) {
    strength = "Medium ⚡";
  }

  document.getElementById("strength").textContent = "Strength: " + strength;
}
