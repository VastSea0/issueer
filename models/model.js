import 'dotenv/config';
import OpenAI from "openai";
import readline from 'readline';

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

const client = new OpenAI({ baseURL: endpoint, apiKey: token });
const messages = [
  { role: "system", content: "You are a helpful assistant that helps people about writing github issues." }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chat() {
  console.log("GitHub Issue Assistant Chat (type 'exit' to quit)");
  console.log("----------------------------------------");
  
  while (true) {
    const userInput = await new Promise(resolve => {
      rl.question("You: ", resolve);
    });

    if (userInput.toLowerCase() === 'exit') {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    messages.push({ role: "user", content: userInput });

    try {
      const response = await client.chat.completions.create({
        messages: messages,
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 1000,
        model: modelName
      });

      const assistantMessage = response.choices[0].message.content;
      messages.push({ role: "assistant", content: assistantMessage });
      
      console.log("Assistant:", assistantMessage);
      console.log("----------------------------------------");
    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

chat().catch((err) => {
  console.error("Chat encountered an error:", err);
  rl.close();
});

export { chat };