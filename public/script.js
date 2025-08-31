// DOM elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const issueForm = document.getElementById('issue-form');
const loading = document.getElementById('loading');
const repoInput = document.getElementById('repo-input');
const titleInput = document.getElementById('title-input');
const descriptionInput = document.getElementById('description-input');
const labelsInput = document.getElementById('labels-input');
const improveButton = document.getElementById('improve-button');
const createButton = document.getElementById('create-button');
const cancelButton = document.getElementById('cancel-button');

// State
let currentIssueData = null;

// Event listeners
sendButton.addEventListener('click', handleSendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

improveButton.addEventListener('click', handleImproveIssue);
createButton.addEventListener('click', handleCreateIssue);
cancelButton.addEventListener('click', handleCancelIssue);

// Functions
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';

    // Show loading
    showLoading();

    try {
        // Analyze the message
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        const analysis = await response.json();

        if (analysis.shouldCreateIssue) {
            // Show issue form with suggested data
            showIssueForm(analysis);
        } else {
            // Show bot response
            addMessage("I didn't detect a specific issue to create. Try describing a bug, feature request, or task more specifically!", 'bot');
        }
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'bot');
    }

    hideLoading();
}

function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const paragraph = document.createElement('p');
    paragraph.innerHTML = content.replace(/\n/g, '<br>');
    contentDiv.appendChild(paragraph);

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showIssueForm(analysis) {
    currentIssueData = analysis;

    titleInput.value = analysis.title;
    descriptionInput.value = analysis.description;
    labelsInput.value = analysis.labels.join(', ');

    issueForm.classList.remove('hidden');
    issueForm.scrollIntoView({ behavior: 'smooth' });
}

function hideIssueForm() {
    issueForm.classList.add('hidden');
    currentIssueData = null;
}

async function handleImproveIssue() {
    if (!currentIssueData) return;

    const issueData = {
        title: titleInput.value,
        description: descriptionInput.value,
        type: currentIssueData.type,
        labels: labelsInput.value.split(',').map(l => l.trim()).filter(l => l)
    };

    showLoading();

    try {
        const response = await fetch('/api/improve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ issueData }),
        });

        const improvement = await response.json();

        if (improvement) {
            // Show improvement options
            const accept = confirm(`AI suggests these improvements:\n\nTitle: "${improvement.improvedTitle}"\n\nDescription: ${improvement.improvedDescription.substring(0, 100)}...\n\nAccept improvements?`);

            if (accept) {
                titleInput.value = improvement.improvedTitle;
                descriptionInput.value = improvement.improvedDescription;
                labelsInput.value = improvement.suggestedLabels.join(', ');
                addMessage('✅ Issue improved with AI!', 'bot');
            }
        }
    } catch (error) {
        addMessage(`Error improving issue: ${error.message}`, 'bot');
    }

    hideLoading();
}

async function handleCreateIssue() {
    const repo = repoInput.value.trim();
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const labels = labelsInput.value.split(',').map(l => l.trim()).filter(l => l);

    if (!repo || !title || !description) {
        alert('Please fill in all required fields');
        return;
    }

    if (!repo.includes('/')) {
        alert('Repository must be in format: owner/repo-name');
        return;
    }

    showLoading();

    try {
        const response = await fetch('/api/create-issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                owner: repo.split('/')[0],
                repo: repo.split('/')[1],
                title,
                body: description,
                labels
            }),
        });

        const result = await response.json();

        if (result.success) {
            addMessage(`✅ Issue created successfully!\n🔗 ${result.issueUrl}\n📝 Issue #${result.issueNumber}`, 'bot');
            hideIssueForm();
        } else {
            addMessage(`❌ Failed to create issue: ${result.error}`, 'bot');
        }
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'bot');
    }

    hideLoading();
}

function handleCancelIssue() {
    hideIssueForm();
    addMessage('Issue creation cancelled.', 'bot');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    userInput.focus();
});
