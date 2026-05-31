/* --- Global Application State --- */
let activeUserProfile = null;
let activeChatHistory = [];
const backendUrl = window.location.protocol === "file:"
    ? "http://localhost:5001"
    : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5001" : "");

/* --- Intersection Observer for Scroll Reveals --- */
const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* --- FutureMe Generation Engine --- */
async function generateFutureMe(event) {
    event.preventDefault();
    
    // UI DOM Elements
    const form = document.getElementById('futureForm');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMsg');
    const loadingState = document.getElementById('loadingState');
    const resultState = document.getElementById('resultState');
    const chatSection = document.getElementById('chat');
    const navChatLink = document.getElementById('navChatLink');
    
    // Collect Input Coordinates
    const name = document.getElementById('userName').value.trim();
    const age = parseInt(document.getElementById('userAge').value);
    const goal = document.getElementById('userGoal').value.trim();
    const struggle = document.getElementById('userStruggle').value.trim();
    const oneYearVision = document.getElementById('userTimeline').value.trim();
    const tone = document.getElementById('futureTone').value;

    // Simple Form Validation
    if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
        errorMsg.style.display = 'block';
        return;
    }
    errorMsg.style.display = 'none';

    // Transition UI to Loading State
    submitBtn.disabled = true;
    loadingState.style.display = 'block';
    resultState.style.display = 'none';
    chatSection.style.display = 'none';
    navChatLink.style.display = 'none';

    // Build the user payload profile
    activeUserProfile = { name, age, goal, struggle, oneYearVision, tone };

    try {
        const response = await fetch(`${backendUrl}/api/generate-futureme`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(activeUserProfile)
        });

        if (!response.ok) {
            throw new Error("Server responded with error status");
        }

        const payload = await response.json();
        if (!payload.success || !payload.data) {
            throw new Error(payload.error || "Invalid response payload structure");
        }

        const data = payload.data;

        // Render Generated Response Data
        document.getElementById('displayTone').innerText = `Tone: ${tone}`;
        document.getElementById('dynamicMessage').innerText = `“${data.message}”`;
        document.getElementById('dynamicIdentity').innerText = data.futureIdentity;
        
        // Populate Next Steps Moves list
        const movesElement = document.getElementById('dynamicMoves');
        movesElement.innerHTML = '';
        if (Array.isArray(data.nextMoves)) {
            data.nextMoves.forEach(move => {
                const li = document.createElement('li');
                li.innerText = move;
                movesElement.appendChild(li);
            });
        }

        document.getElementById('dynamicHabit').innerText = data.habit;
        document.getElementById('dynamicWarning').innerText = data.warning || "None";
        document.getElementById('dynamicMantra').innerText = `“${data.mantra || "Keep moving forward."}”`;

        // Populate Actionable Daily Plan Timeline Checklist
        const timelineElement = document.getElementById('dynamicDailyPlan');
        timelineElement.innerHTML = '';
        if (Array.isArray(data.dailyPlan)) {
            data.dailyPlan.forEach((planItem, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'timeline-item';
                itemDiv.id = `timelineItem-${index}`;
                itemDiv.innerHTML = `
                    <div class="timeline-checkbox-wrapper">
                        <input type="checkbox" class="timeline-checkbox" id="taskCheckbox-${index}" onchange="toggleTimelineTask(${index})">
                    </div>
                    <div class="timeline-content-wrapper">
                        <div class="timeline-time">${planItem.time}</div>
                        <div class="timeline-task">${planItem.task}</div>
                        <div class="timeline-motivation">${planItem.motivation}</div>
                    </div>
                `;
                timelineElement.appendChild(itemDiv);
            });
            // Reset Progress bar and labels
            updateTimelineProgress();
        }

        // Reset and Prepare Interactive Chat Interface
        activeChatHistory = [];
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = ''; // Clear previous messages

        // Inject first welcome message matching tone from FutureMe
        const welcomeMessage = `Hello, ${name}. I am the version of you who successfully completed our vision to ${oneYearVision}. I've set up this link so we can align directly. Ask me anything about our journey, how I bypassed our struggle with ${struggle}, or what actions you need to take right now.`;
        appendChatBubble("future", welcomeMessage);
        
        // Save initial greeting to history
        activeChatHistory.push({
            role: "futureme",
            message: welcomeMessage
        });

        // Interface Transition: Reveal results & Chat section
        loadingState.style.display = 'none';
        resultState.style.display = 'block';
        chatSection.style.display = 'block';
        navChatLink.style.display = 'flex';
        submitBtn.disabled = false;

        // Smooth scroll transition to reflection outcomes
        setTimeout(() => {
            resultState.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

    } catch (error) {
        console.error("FutureMe generator error:", error);
        loadingState.style.display = 'none';
        submitBtn.disabled = false;
        errorMsg.innerText = "FutureMe could not respond right now. Try again.";
        errorMsg.style.display = 'block';
    }
}

/* --- Interactive Chat Interface Operations --- */
async function sendChatMessage(event) {
    event.preventDefault();

    const chatInput = document.getElementById('chatInput');
    const questionText = chatInput.value.trim();
    if (!questionText || !activeUserProfile) return;

    // Clear input immediately to make UI responsive
    chatInput.value = "";

    // Append User Message to Board
    appendChatBubble("user", questionText);
    
    // Save User message to history
    activeChatHistory.push({
        role: "user",
        message: questionText
    });

    // Render Typing bubble indicator
    const typingIndicator = appendTypingIndicator();

    try {
        const response = await fetch(`${backendUrl}/api/chat-futureme`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userProfile: activeUserProfile,
                chatHistory: activeChatHistory.slice(0, -1), // Send previous history without current user query
                question: questionText
            })
        });

        // Remove Typing Indicator
        typingIndicator.remove();

        if (!response.ok) {
            throw new Error("Server responded with error status");
        }

        const payload = await response.json();
        if (!payload.success || !payload.reply) {
            throw new Error(payload.error || "Invalid response payload");
        }

        // Render FutureMe Response Bubble
        appendChatBubble("future", payload.reply);

        // Save reply to history
        activeChatHistory.push({
            role: "futureme",
            message: payload.reply
        });

    } catch (error) {
        console.error("FutureMe chat error:", error);
        typingIndicator.remove();
        appendChatBubble("future", "Transmission disrupted. FutureMe could not respond right now. Try again.");
    }
}

/* --- Helper functions for Chat Interface --- */
function appendChatBubble(role, message) {
    const chatMessages = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerText = message;
    chatMessages.appendChild(bubble);
    
    // Auto Scroll to new messages
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const bubble = document.createElement('div');
    bubble.className = "chat-bubble future typing";
    bubble.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
}

function scrollToChat() {
    const chatSection = document.getElementById('chat');
    chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function regenerateFutureMe() {
    const createSection = document.getElementById('create');
    createSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* --- Timeline Checklist Progress Helpers --- */
function toggleTimelineTask(index) {
    const item = document.getElementById(`timelineItem-${index}`);
    const checkbox = document.getElementById(`taskCheckbox-${index}`);
    if (checkbox.checked) {
        item.classList.add('completed');
    } else {
        item.classList.remove('completed');
    }
    updateTimelineProgress();
}

function updateTimelineProgress() {
    const checkboxes = document.querySelectorAll('#dynamicDailyPlan .timeline-checkbox');
    const total = checkboxes.length;
    if (total === 0) {
        document.getElementById('planProgressText').innerText = "0 tasks generated";
        document.getElementById('planProgressBar').style.width = "0%";
        return;
    }
    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;
    const percentage = Math.round((checked / total) * 100);
    
    // Update visual tracker assets
    document.getElementById('planProgressText').innerText = `${checked} of ${total} tasks completed (${percentage}%)`;
    document.getElementById('planProgressBar').style.width = `${percentage}%`;
}

/* --- Clipboard Copy Utilities --- */
function copyResult() {
    if (!activeUserProfile) {
        triggerToast("Please generate your reflection before copying.");
        return;
    }

    const name = activeUserProfile.name;
    const tone = activeUserProfile.tone;
    const message = document.getElementById('dynamicMessage').innerText;
    const identity = document.getElementById('dynamicIdentity').innerText;
    const habit = document.getElementById('dynamicHabit').innerText;
    const warning = document.getElementById('dynamicWarning').innerText;
    const mantra = document.getElementById('dynamicMantra').innerText;

    // Gather and format moves list
    const moves = [];
    document.querySelectorAll('#dynamicMoves li').forEach(li => moves.push(li.innerText));
    const formattedMoves = moves.map((move, index) => `${index + 1}. ${move}`).join("\n");

    // Gather and format Daily Timeline Checklist
    const dailyPlanItems = [];
    document.querySelectorAll('#dynamicDailyPlan .timeline-item').forEach(item => {
        const time = item.querySelector('.timeline-time').innerText;
        const task = item.querySelector('.timeline-task').innerText;
        const motivation = item.querySelector('.timeline-motivation').innerText;
        const isChecked = item.querySelector('.timeline-checkbox').checked ? " [x] " : " [ ] ";
        dailyPlanItems.push(`${isChecked}${time} - ${task}\n      Motivation: ${motivation}`);
    });
    const formattedDailyPlan = dailyPlanItems.length > 0
        ? dailyPlanItems.join("\n\n")
        : "None generated.";

    const copyText = `✨ FutureMe Reflection — Aniruth's Founder Labs ✨
--------------------------------------------------------
Current Self: ${name} (Age ${activeUserProfile.age})
Trajectory Tone: ${tone}

✉️ Message from Future Self:
${message}

👤 Future Identity:
${identity}

⚡ Next 3 Moves:
${formattedMoves}

🌱 Daily Habit:
${habit}

⚠️ Future Self Warning:
${warning}

🧘 Daily Mantra:
${mantra}

📅 Daily Action Plan Checklist:
${formattedDailyPlan}

--------------------------------------------------------
Generate yours live at FutureMe.
`;

    navigator.clipboard.writeText(copyText)
        .then(() => {
            triggerToast("Reflection copied to clipboard.");
        })
        .catch(err => {
            console.error("Clipboard copy failure:", err);
            triggerToast("Copy failed. Please manually select and copy text.");
        });
}

/* --- Dopamine Feedback Toast Launcher --- */
function triggerToast(text) {
    const toast = document.getElementById('shareToast');
    if (text) {
        toast.innerText = text;
    }
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
