import 'dotenv/config';
import OpenAI from "openai";
import readline from 'readline';
import { Octokit } from "@octokit/rest";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

const client = new OpenAI({ baseURL: endpoint, apiKey: token });
const octokit = new Octokit({ auth: token });

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

async function improveIssueWithAI(issueData) {
  const improvementPrompt = `Improve this GitHub issue for better clarity and professionalism:

Title: "${issueData.title}"
Description: "${issueData.description}"
Type: ${issueData.type}
Labels: ${issueData.labels.join(', ')}

Please enhance the issue with:
1. Better, more descriptive title
2. Professional description with proper formatting
3. Relevant sections (for bugs: steps to reproduce, expected behavior, etc.)
4. Suggested additional labels
5. Use proper markdown formatting

Respond with ONLY valid JSON:
{
  "improvedTitle": "Enhanced title",
  "improvedDescription": "Enhanced description with markdown",
  "suggestedLabels": ["label1", "label2"],
  "improvements": "What was improved"
}`;

  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert at writing professional GitHub issues. Always respond with valid JSON and use proper markdown formatting in descriptions." },
        { role: "user", content: improvementPrompt }
      ],
      temperature: 0.5,
      max_tokens: 800,
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
    console.error("Error improving issue:", error);
    return null;
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

  // Ask if user wants AI improvement
  console.log("\n🤖 Would you like AI to improve this issue for better clarity and professionalism?");
  const wantsImprovement = await new Promise(resolve => {
    rl.question("Improve with AI? (y/n): ", resolve);
  });

  let finalIssueData = {
    shouldCreateIssue: true,
    type: issueType,
    title: title.trim(),
    description: description.trim(),
    labels: labels,
    reasoning: "User provided detailed information for issue creation"
  };

  if (wantsImprovement.toLowerCase() === 'y' || wantsImprovement.toLowerCase() === 'yes') {
    console.log("🔄 AI is improving your issue...");
    
    const improvement = await improveIssueWithAI(finalIssueData);
    
    if (improvement) {
      console.log("\n✨ AI Improvements:");
      console.log(`📌 Original Title: "${finalIssueData.title}"`);
      console.log(`📌 Improved Title: "${improvement.improvedTitle}"`);
      console.log(`\n📝 Original Description:\n${finalIssueData.description}`);
      console.log(`\n📝 Improved Description:\n${improvement.improvedDescription}`);
      console.log(`\n🏷️  Original Labels: ${finalIssueData.labels.join(', ')}`);
      console.log(`🏷️  Suggested Labels: ${improvement.suggestedLabels.join(', ')}`);
      console.log(`\n💡 What was improved: ${improvement.improvements}`);
      
      const acceptImprovement = await new Promise(resolve => {
        rl.question("\n✅ Accept AI improvements? (y/n): ", resolve);
      });
      
      if (acceptImprovement.toLowerCase() === 'y' || acceptImprovement.toLowerCase() === 'yes') {
        finalIssueData.title = improvement.improvedTitle;
        finalIssueData.description = improvement.improvedDescription;
        finalIssueData.labels = improvement.suggestedLabels;
        console.log("✅ AI improvements accepted!");
      } else {
        console.log("📝 Keeping original issue details.");
      }
    } else {
      console.log("❌ AI improvement failed, keeping original details.");
    }
  }
  
  return finalIssueData;
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

✨ New: AI can improve your issues for better clarity and professionalism!
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

export { chat, createGitHubIssue, analyzeForIssueCreation, improveIssueWithAI };