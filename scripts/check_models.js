import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.API_KEY || process.env.VITE_API_KEY;

if (!apiKey && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  // Simple parsing for VITE_API_KEY or API_KEY
  const match = envContent.match(/VITE_API_KEY=["']?([^"'\n]+)["']?/) || envContent.match(/API_KEY=["']?([^"'\n]+)["']?/);
  if (match) {
    apiKey = match[1].trim();
  }
}

if (!apiKey) {
  console.error("❌ Could not find API Key in environment or .env.local");
  process.exit(1);
}

console.log(`Using API Key: ${apiKey.substring(0, 5)}...`);

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ Error listing models:", JSON.stringify(data.error, null, 2));
    } else if (data.models) {
      console.log("✅ Available Gemini Models:");
      const geminiModels = data.models.filter(m => m.name.includes('gemini'));
      if (geminiModels.length === 0) {
        console.log("No models with 'gemini' in the name found.");
      }
      geminiModels.forEach(m => {
        console.log(`- ${m.name.replace('models/', '')}`);
      });
    } else {
      console.log("⚠️ Unexpected response format:", data);
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  }
}

listModels();
