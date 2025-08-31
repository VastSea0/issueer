# 🤖 Issueer - AI-Powered GitHub Issue Assistant

> Intelligent GitHub issue creation with AI assistance and natural language processing

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-blue.svg)](https://openai.com/)
[![GitHub API](https://img.shields.io/badge/GitHub-API-black.svg)](https://docs.github.com/en/rest)

## ✨ Features

- 🎯 **Intelligent Issue Detection** - Automatically detects when conversations should become GitHub issues
- 📝 **AI-Enhanced Issue Creation** - Improves issue titles, descriptions, and formatting
- 🔄 **Interactive Editing** - Edit all issue details before creation
- 🏠 **Repository Management** - Set default repositories for quick issue creation
- 📋 **Multiple Issue Types** - Support for bugs, features, tasks, and documentation
- 🤖 **Natural Language Processing** - Chat naturally and let AI handle the rest
- 🌐 **Web Interface** - Modern web UI for easy access from any browser
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or higher
- GitHub Personal Access Token with `repo` permissions
- OpenAI API access (GitHub Models)

### Installation

```bash
# Clone the repository
git clone https://github.com/VastSea0/issueer.git
cd issueer

# Install dependencies
npm install

# Set up environment variables
echo "GITHUB_TOKEN=your_github_token_here" > .env

# Start the web UI
npm start
```

### Alternative: CLI Version

```bash
# Start the command-line version
npm run cli
```

### GitHub Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token with `repo` scope
3. Add it to your `.env` file

## 💬 Usage

### Automatic Issue Detection

Just describe your problem naturally:

```bash
You: The login button doesn't work on mobile Safari
🎯 Detected: BUG
💭 Reasoning: User reports a technical problem with login functionality

🏠 Repository (owner/repo-name): VastSea0/my-app
📋 Suggested title: "Fix login button functionality on mobile Safari"
✏️ Edit title (press Enter to keep current): 
🚀 Create this issue? (y/n): y
```

### Manual Issue Creation

```bash
You: create issue
🔍 Let me gather more details for the issue...

What type of issue would you like to create?
1. 🐛 Bug Report
2. ✨ Feature Request
3. 📋 Task/Enhancement
4. 📖 Documentation
Choose (1-4): 1
```

### Commands

| Command | Description |
|---------|-------------|
| `create issue` | Start manual issue creation wizard |
| `set default repo to owner/repo` | Set default repository |
| `help` | Show available commands |
| `exit` | Quit the application |

## 🌐 Web UI

The application now includes a modern web interface that provides the same functionality as the CLI version with an intuitive chat-based interface.

### Features

- 💬 **Chat Interface** - Natural conversation flow for describing issues
- 📝 **AI-Powered Analysis** - Automatic detection and categorization of issues
- ✨ **AI Enhancement** - Improve issue quality with AI suggestions
- 🚀 **One-Click Creation** - Create GitHub issues directly from the web interface
- 📱 **Responsive Design** - Works on desktop and mobile devices

### Accessing the Web UI

```bash
# Start the web server
npm start

# Open your browser and navigate to
http://localhost:3000
```

### Web UI Workflow

1. **Describe Your Issue** - Type a natural description of your bug, feature, or task
2. **AI Analysis** - The system automatically analyzes and suggests issue details
3. **Review & Edit** - Review and modify the suggested title, description, and labels
4. **AI Enhancement** - Optionally improve the issue with AI suggestions
5. **Create Issue** - Specify the target repository and create the GitHub issue

### Example Usage

```
You: The login button crashes the app on iOS Safari

🤖 Assistant: I detected a bug! Here's what I suggest:

📋 Issue Details:
Title: Login button causes app crash on iOS Safari
Type: Bug
Labels: bug, ios, safari

[Edit form appears with pre-filled details]
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for GitHub integration
GITHUB_TOKEN=your_github_personal_access_token

# Optional
PORT=3000  # Web server port
```

### Default Repository

Set a default repository to skip entering it every time:

```bash
You: set default repo to VastSea0/issueer
✅ Default repository set to: VastSea0/issueer
```

## 📋 Issue Types

### 🐛 Bug Reports
- Automatic steps to reproduce sections
- Expected vs actual behavior
- Proper formatting with markdown

### ✨ Feature Requests
- Clear feature descriptions
- Use case explanations
- Implementation suggestions

### 📋 Tasks/Enhancements
- Detailed task descriptions
- Acceptance criteria
- Priority labeling

### 📖 Documentation
- Documentation requirements
- Content structure
- Update specifications

## 🤖 AI Enhancement

The AI assistant can automatically improve your issues by:

- ✍️ **Better Titles** - More descriptive and professional
- 📝 **Structured Descriptions** - Proper markdown formatting and sections
- 🏷️ **Smart Labels** - Relevant tags based on content
- 🔧 **Template Application** - Issue-type specific formatting

### Example Enhancement

**Before:**
```
Title: button not working
Description: when i click the button its not working and crashing
```

**After AI Enhancement:**
```
Title: Button click causes application crash - functionality broken

## Bug Description
The application crashes when clicking a specific button, preventing normal functionality.

## Steps to Reproduce
1. Navigate to the main interface
2. Click the problematic button
3. Application crashes immediately

## Expected Behavior
Button should perform its intended function without crashing

## Actual Behavior
Application crashes upon button click
```

## 📁 Project Structure

```
issueer/
├── models/
│   └── model.js          # Main AI logic and GitHub integration
├── index.js              # Application entry point
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables
└── README.md            # This file
```

## 🛠️ Development

### Scripts

```bash
# Start web UI server
npm start

# Start development server (same as start)
npm run dev

# Start command-line version
npm run cli
```

### API Integration

- **GitHub API**: Issue creation, repository management
- **OpenAI (GitHub Models)**: Natural language processing and issue enhancement
- **Readline Interface**: Interactive CLI experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for powerful language models
- [GitHub](https://github.com/) for excellent API and platform
- [Octokit](https://github.com/octokit/octokit.js) for GitHub API integration

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/VastSea0/issueer/issues) page
2. Create a new issue with detailed information
3. Use this tool to create the issue! 😉

---

Made with ❤️