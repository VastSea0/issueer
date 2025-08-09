import 'dotenv/config';
import OpenAI from "openai";
import readline from 'readline';
import { Octokit } from "@octokit/rest";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

const client = new OpenAI({ baseURL: endpoint, apiKey: token });
const octokit = new Octokit({ auth: token });

const messages = [
  { 
    role: "system", 
    content: `You are an AI assistant that helps create GitHub issues. When a user describes a problem, bug, feature request, or task, you can automatically create a GitHub issue for them.

Available functions:
- create_github_issue: Creates a GitHub issue with title, description, labels, and assignees

When the user mentions:
- A bug or problem
- A feature they want
- A task that needs to be done
- Something that should be fixed

Ask them which repository they want to create the issue in, then create it automatically.

Always format issues professionally with:
- Clear, descriptive titles
- Detailed descriptions with steps to reproduce (for bugs)
- Relevant labels
- Proper markdown formatting`
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createGitHubIssue(owner, repo, title, body, labels = []) {
  try {
    const response = await octokit.rest.issues.create({
      owner: owner,
      repo: repo,
      title: title,
      body: body,
      labels: labels
    });
    
    return {
      success: true,
      issueUrl: response.data.html_url,
      issueNumber: response.data.number
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function analyzeForIssueCreation(userMessage) {
  const analysisPrompt = `Analyze this user message and determine if it describes something that should become a GitHub issue:

User message: "${userMessage}"

Important: Only suggest creating an issue if the user provides SPECIFIC details about:
- A bug with clear symptoms
- A specific feature request
- A specific task with details
- A problem with clear description

DO NOT suggest creating an issue for:
- Vague requests like "create an issue" without details
- General questions
- Requests for help without specifics

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "shouldCreateIssue": true,
  "type": "bug",
  "title": "suggested issue title",
  "description": "detailed issue description with markdown formatting",
  "labels": ["label1", "label2"],
  "reasoning": "why this should/shouldn't be an issue"
}`;

  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert at analyzing text for GitHub issue creation. Only suggest creating issues when the user provides specific details about bugs, features, or tasks. Always respond with ONLY valid JSON, no markdown formatting or code blocks." },
        { role: "user", content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
      model: modelName
    });

    let content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/```\n?/, '').replace(/\n?```$/, '');
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Error analyzing message:", error);
    console.error("Raw response:", response?.choices[0]?.message?.content);
    return { shouldCreateIssue: false };
  }
}

async function askForIssueDetails() {
  console.log("\n🔍 Let me gather more details for the issue...\n");
  
  // Ask what type of issue
  console.log("What type of issue would you like to create?");
  console.log("1. 🐛 Bug Report");
  console.log("2. ✨ Feature Request"); 
  console.log("3. 📋 Task/Enhancement");
  console.log("4. 📖 Documentation");
  
  const typeChoice = await new Promise(resolve => {
    rl.question("Choose (1-4): ", resolve);
  });
  
  let issueType, issuePrompts;
  
  switch(typeChoice) {
    case '1':
      issueType = 'bug';
      issuePrompts = {
        title: "🐛 What's the bug? (Brief description): ",
        description: "📝 Describe the bug in detail (steps to reproduce, expected vs actual behavior): ",
        labels: "🏷️  Labels (comma-separated, e.g., bug,priority-high): "
      };
      break;
    case '2':
      issueType = 'feature';
      issuePrompts = {
        title: "✨ What feature would you like? (Brief description): ",
        description: "📝 Describe the feature in detail (what it should do, why it's needed): ",
        labels: "🏷️  Labels (comma-separated, e.g., enhancement,feature): "
      };
      break;
    case '3':
      issueType = 'task';
      issuePrompts = {
        title: "📋 What task needs to be done? (Brief description): ",
        description: "📝 Describe the task in detail (what needs to be accomplished): ",
        labels: "🏷️  Labels (comma-separated, e.g., task,enhancement): "
      };
      break;
    case '4':
      issueType = 'documentation';
      issuePrompts = {
        title: "📖 What documentation is needed? (Brief description): ",
        description: "📝 Describe what documentation needs to be created or updated: ",
        labels: "🏷️  Labels (comma-separated, e.g., documentation): "
      };
      break;
    default:
      issueType = 'general';
      issuePrompts = {
        title: "📝 Issue title: ",
        description: "📝 Issue description: ",
        labels: "🏷️  Labels (comma-separated): "
      };
  }
  
  console.log(`\n📝 Creating ${issueType} issue...\n`);
  
  const title = await new Promise(resolve => {
    rl.question(issuePrompts.title, resolve);
  });
  
  const description = await new Promise(resolve => {
    rl.question(issuePrompts.description, resolve);
  });
  
  const labelsInput = await new Promise(resolve => {
    rl.question(issuePrompts.labels, resolve);
  });
  
  const labels = labelsInput.trim() 
    ? labelsInput.split(',').map(l => l.trim()).filter(l => l)
    : [issueType];
  
  return {
    shouldCreateIssue: true,
    type: issueType,
    title: title.trim(),
    description: description.trim(),
    labels: labels,
    reasoning: "User provided detailed information for issue creation"
  };
}

async function chat() {
  console.log("🤖 AI-Powered GitHub Issue Assistant");
  console.log("💡 Describe any bugs, features, or tasks - I'll help create issues automatically!");
  console.log("📝 Commands: 'exit' to quit, 'help' for assistance, 'create issue' for manual issue creation");
  console.log("----------------------------------------");
  
  let defaultRepo = null;
  
  while (true) {
    const userInput = await new Promise(resolve => {
      rl.question("You: ", resolve);
    });

    if (userInput.toLowerCase() === 'exit') {
      console.log("Goodbye! 👋");
      rl.close();
      break;
    }

    if (userInput.toLowerCase() === 'help') {
      console.log(`
🔧 How to use:
- Describe specific bugs: "The login button doesn't work on mobile Safari"
- Request specific features: "Add dark mode toggle to settings page"  
- Mention specific tasks: "Update README with installation instructions"
- Set default repo: "Set default repo to owner/repository-name"
- Manual issue creation: "create issue"

I'll automatically detect when to create GitHub issues! 🚀
----------------------------------------`);
      continue;
    }

    // Manual issue creation
    if (userInput.toLowerCase() === 'create issue') {
      const analysis = await askForIssueDetails();
      
      // Continue with issue creation flow...
      let repoToUse = defaultRepo;
      if (!repoToUse) {
        repoToUse = await new Promise(resolve => {
          rl.question("🏠 Repository (owner/repo-name): ", resolve);
        });
      } else {
        console.log(`🏠 Using default repository: ${defaultRepo}`);
      }
      
      // Show final summary and create issue
      console.log(`\n📋 Final Issue Summary:`);
      console.log(`🏠 Repository: ${repoToUse}`);
      console.log(`📌 Title: ${analysis.title}`);
      console.log(`📝 Description: ${analysis.description.substring(0, 100)}${analysis.description.length > 100 ? '...' : ''}`);
      console.log(`🏷️  Labels: ${analysis.labels.join(', ')}`);
      
      const confirm = await new Promise(resolve => {
        rl.question("\n🚀 Create this issue? (y/n): ", resolve);
      });
      
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        const [owner, repo] = repoToUse.split('/');
        
        if (!owner || !repo) {
          console.log("❌ Invalid repository format. Use: owner/repo-name");
        } else {
          console.log("⏳ Creating issue...");
          const result = await createGitHubIssue(
            owner, 
            repo, 
            analysis.title, 
            analysis.description, 
            analysis.labels
          );
          
          if (result.success) {
            console.log(`✅ Issue created successfully!`);
            console.log(`🔗 URL: ${result.issueUrl}`);
            console.log(`📝 Issue #${result.issueNumber}`);
          } else {
            console.log(`❌ Failed to create issue: ${result.error}`);
          }
        }
      } else {
        console.log("❌ Issue creation cancelled.");
      }
      console.log("----------------------------------------");
      continue;
    }

    // Set default repository
    if (userInput.toLowerCase().startsWith('set default repo')) {
      const repoMatch = userInput.match(/set default repo to (.+)/i);
      if (repoMatch) {
        defaultRepo = repoMatch[1].trim();
        console.log(`✅ Default repository set to: ${defaultRepo}`);
      } else {
        console.log("❌ Please use format: 'set default repo to owner/repo-name'");
      }
      console.log("----------------------------------------");
      continue;
    }

    messages.push({ role: "user", content: userInput });

    try {
      // Analyze if this should become an issue (only for specific descriptions)
      const analysis = await analyzeForIssueCreation(userInput);
      
      if (analysis.shouldCreateIssue) {
        // Continue with existing issue creation flow...
        console.log(`\n🎯 Detected: ${analysis.type.toUpperCase()}`);
        console.log(`💭 Reasoning: ${analysis.reasoning}\n`);
        
        // Rest of the existing issue creation code...
        let repoToUse = defaultRepo;
        if (!repoToUse) {
          repoToUse = await new Promise(resolve => {
            rl.question("🏠 Repository (owner/repo-name): ", resolve);
          });
        } else {
          console.log(`🏠 Using default repository: ${defaultRepo}`);
        }
        
        // Show and allow editing of title
        console.log(`\n📋 Suggested title: "${analysis.title}"`);
        const titleInput = await new Promise(resolve => {
          rl.question("✏️  Edit title (press Enter to keep current): ", resolve);
        });
        const finalTitle = titleInput.trim() || analysis.title;
        
        // Show and allow editing of description
        console.log(`\n📝 Suggested description:\n${analysis.description}`);
        const descInput = await new Promise(resolve => {
          rl.question("✏️  Edit description (press Enter to keep current): ", resolve);
        });
        const finalDescription = descInput.trim() || analysis.description;
        
        // Show and allow editing of labels
        console.log(`\n🏷️  Suggested labels: ${analysis.labels.join(', ')}`);
        const labelsInput = await new Promise(resolve => {
          rl.question("✏️  Edit labels (comma-separated, press Enter to keep current): ", resolve);
        });
        const finalLabels = labelsInput.trim() 
          ? labelsInput.split(',').map(l => l.trim()).filter(l => l)
          : analysis.labels;
        
        // Show final summary
        console.log(`\n📋 Final Issue Summary:`);
        console.log(`🏠 Repository: ${repoToUse}`);
        console.log(`📌 Title: ${finalTitle}`);
        console.log(`📝 Description: ${finalDescription.substring(0, 100)}${finalDescription.length > 100 ? '...' : ''}`);
        console.log(`🏷️  Labels: ${finalLabels.join(', ')}`);
        
        const confirm = await new Promise(resolve => {
          rl.question("\n🚀 Create this issue? (y/n): ", resolve);
        });
        
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          const [owner, repo] = repoToUse.split('/');
          
          if (!owner || !repo) {
            console.log("❌ Invalid repository format. Use: owner/repo-name");
          } else {
            console.log("⏳ Creating issue...");
            const result = await createGitHubIssue(
              owner, 
              repo, 
              finalTitle, 
              finalDescription, 
              finalLabels
            );
            
            if (result.success) {
              console.log(`✅ Issue created successfully!`);
              console.log(`🔗 URL: ${result.issueUrl}`);
              console.log(`📝 Issue #${result.issueNumber}`);
            } else {
              console.log(`❌ Failed to create issue: ${result.error}`);
            }
          }
        } else {
          console.log("❌ Issue creation cancelled.");
        }
        console.log("----------------------------------------");
        continue;
      }

      // Continue with normal chat only if no issue was detected
      const response = await client.chat.completions.create({
        messages: messages,
        temperature: 0.7,
        top_p: 1.0,
        max_tokens: 1000,
        model: modelName
      });

      const assistantMessage = response.choices[0].message.content;
      messages.push({ role: "assistant", content: assistantMessage });
      
      console.log("🤖 Assistant:", assistantMessage);
      console.log("----------------------------------------");
    } catch (err) {
      console.error("❌ Error:", err.message);
    }
  }
}

chat().catch((err) => {
  console.error("Chat encountered an error:", err);
  rl.close();
});

export { chat };