// ShopVibe FAQ Chatbot Frontend Javascript Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let faqs = [];
    let currentView = 'chat';
    let editMode = false;
    let lastDiagnosticData = null;

    // DOM Elements
    const htmlEl = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeText = document.querySelector('.theme-text');
    
    // View Switchers
    const btnChatView = document.getElementById('btn-chat-view');
    const btnFaqView = document.getElementById('btn-faq-view');
    const btnInsightsView = document.getElementById('btn-insights-view');
    const viewChat = document.getElementById('view-chat');
    const viewFaq = document.getElementById('view-faq');
    const viewInsights = document.getElementById('view-insights');
    const currentViewTitle = document.getElementById('current-view-title');
    const currentViewDesc = document.getElementById('current-view-desc');

    // Chatbot Elements
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const suggestionsBox = document.getElementById('suggestions-box');
    const thresholdSlider = document.getElementById('threshold-slider');
    const thresholdVal = document.getElementById('threshold-val');
    const insightsThresholdVal = document.getElementById('insights-threshold-val');
    const diagLastScore = document.getElementById('diag-last-score');
    const diagLastMatch = document.getElementById('diag-last-match');
    const diagTokensBox = document.getElementById('diag-tokens-box');
    
    // FAQ Manager Elements
    const faqList = document.getElementById('faq-list');
    const faqSearch = document.getElementById('faq-search');
    const categoryFiltersContainer = document.getElementById('category-filters-container');
    const btnOpenAddForm = document.getElementById('btn-open-add-form');
    const faqFormContainer = document.getElementById('faq-form-container');
    const btnCloseForm = document.getElementById('btn-close-form');
    const btnCancelForm = document.getElementById('btn-cancel-form');
    const faqEditorForm = document.getElementById('faq-editor-form');
    const formTitle = document.getElementById('form-title');
    const editFaqId = document.getElementById('edit-faq-id');
    const faqQuestion = document.getElementById('faq-question');
    const faqAnswer = document.getElementById('faq-answer');
    const faqCategory = document.getElementById('faq-category');

    // Insights Elements
    const insightRawQuery = document.getElementById('insight-raw-query');
    const insightCleanTokens = document.getElementById('insight-clean-tokens');
    const similarityChart = document.getElementById('similarity-chart');

    // Toast Notification
    const toast = document.getElementById('toast');

    // ==========================================
    // 1. INITIALIZATION & DATA FETCHING
    // ==========================================
    
    // Initialize Theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlEl.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);

    // Fetch FAQs from API
    async function fetchFAQs() {
        try {
            const response = await fetch('/api/faqs');
            if (!response.ok) throw new Error('Failed to fetch FAQs');
            faqs = await response.json();
            renderFAQList();
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            faqList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i> Error loading FAQs. Make sure the API server is running.</div>`;
        }
    }

    // Initial load
    fetchFAQs();

    // ==========================================
    // 2. THEME & NAVIGATION
    // ==========================================
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeUI(newTheme);
    });

    function updateThemeUI(theme) {
        if (theme === 'dark') {
            themeText.textContent = 'Dark Mode';
        } else {
            themeText.textContent = 'Light Mode';
        }
    }

    // View Switching Logic
    const views = [
        { btn: btnChatView, view: viewChat, name: 'chat', title: 'Chat Assistant', desc: 'Interact with the NLP-powered FAQ support chatbot.' },
        { btn: btnFaqView, view: viewFaq, name: 'faq', title: 'FAQ Database Manager', desc: 'Browse, search, edit, create or delete FAQ records.' },
        { btn: btnInsightsView, view: viewInsights, name: 'insights', title: 'NLP Similarity Insights', desc: 'See real-time pre-processing, tokenization and similarity scores for your last message.' }
    ];

    views.forEach(v => {
        v.btn.addEventListener('click', () => {
            // Remove active class from all buttons and views
            views.forEach(item => {
                item.btn.classList.remove('active');
                item.view.classList.remove('active');
            });
            
            // Add active class
            v.btn.classList.add('active');
            v.view.classList.add('active');
            currentView = v.name;
            currentViewTitle.textContent = v.title;
            currentViewDesc.textContent = v.desc;
            
            // If viewing FAQ, close any open forms and reset
            if (currentView === 'faq') {
                closeForm();
            }

            // If switching to insights, re-draw insights chart
            if (currentView === 'insights' && lastDiagnosticData) {
                renderInsights(lastDiagnosticData);
            }
        });
    });

    // ==========================================
    // 3. TOAST & UTILITIES
    // ==========================================
    
    function showToast(message, isSuccess = true) {
        const toastMessageEl = toast.querySelector('.toast-message');
        const toastIconEl = toast.querySelector('.toast-icon');
        
        toastMessageEl.textContent = message;
        if (isSuccess) {
            toast.style.borderLeftColor = 'var(--success)';
            toastIconEl.className = 'fa-solid fa-check-circle toast-icon';
            toastIconEl.style.color = 'var(--success)';
        } else {
            toast.style.borderLeftColor = 'var(--danger)';
            toastIconEl.className = 'fa-solid fa-times-circle toast-icon';
            toastIconEl.style.color = 'var(--danger)';
        }
        
        toast.classList.add('active');
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    // ==========================================
    // 4. CHAT BOT CORE LOGIC
    // ==========================================
    
    // Slider event listener
    thresholdSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        thresholdVal.textContent = val;
        insightsThresholdVal.textContent = val;
    });

    // Add suggestions click behavior
    function registerSuggestionChips() {
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chatInput.value = chip.textContent;
                sendMessage();
            });
        });
    }
    registerSuggestionChips();

    // Handle Form Submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message to UI
        addMessage(text, 'user');
        chatInput.value = '';

        // Clear suggestions if they exist
        if (suggestionsBox) {
            suggestionsBox.style.display = 'none';
        }

        // Show typing indicator
        const typingIndicator = showTypingIndicator();

        try {
            const threshold = parseFloat(thresholdSlider.value);
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, threshold: threshold })
            });

            // Remove typing indicator
            typingIndicator.remove();

            if (!response.ok) throw new Error('API server returned an error');
            const data = await response.json();

            // Process bot response
            processBotResponse(data, text);
            
        } catch (error) {
            console.error('Chat error:', error);
            typingIndicator.remove();
            addMessage("I'm sorry, I seem to be having trouble reaching the NLP service. Please check that the server is running locally.", 'bot');
        }
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        
        const avatarHTML = sender === 'bot' 
            ? `<div class="avatar"><i class="fa-solid fa-robot"></i></div>`
            : `<div class="avatar"><i class="fa-solid fa-user"></i></div>`;
            
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        msgDiv.innerHTML = `
            ${avatarHTML}
            <div class="message-content-wrapper">
                <div class="message-content">
                    <p>${text}</p>
                </div>
                <span class="message-time">${timeString}</span>
            </div>
        `;
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing';
        typingDiv.innerHTML = `
            <div class="avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="message-content-wrapper">
                <div class="message-content">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        chatBox.appendChild(typingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return typingDiv;
    }

    function processBotResponse(data, originalQuery) {
        // Save diagnostic data globally
        lastDiagnosticData = data;
        lastDiagnosticData.query = originalQuery;

        // 1. Update Diagnostics Sidebar Pane
        const bestScore = data.score;
        diagLastScore.textContent = bestScore > 0 ? bestScore.toFixed(4) : "0.0000";
        
        if (data.match_found) {
            diagLastMatch.textContent = data.faq.question;
            diagLastMatch.title = data.faq.question;
            addMessage(data.faq.answer, 'bot');
        } else {
            diagLastMatch.textContent = "No match found";
            
            // Build fallback response
            let responseMsg = "I couldn't find a direct match for your question. ";
            
            // Filter matches that have some similarity (score > 0.05) to recommend
            const options = data.matches ? data.matches.filter(m => m.score > 0.05).slice(0, 3) : [];
            
            if (options.length > 0) {
                responseMsg += "Did you mean one of these?<br><br>";
                options.forEach((opt, idx) => {
                    responseMsg += `<strong>${idx + 1}.</strong> <span class="clarifying-question" style="color:var(--primary); cursor:pointer; text-decoration:underline;" data-question="${opt.question}">${opt.question}</span> (Score: ${opt.score.toFixed(2)})<br>`;
                });
            } else {
                responseMsg += "Could you try rephrasing your question? You can ask about shipping, returns, payment methods, or resetting passwords.";
            }
            
            addMessage(responseMsg, 'bot');
            
            // Add click listeners to clarifying questions dynamically
            setTimeout(() => {
                document.querySelectorAll('.clarifying-question').forEach(el => {
                    el.addEventListener('click', (e) => {
                        chatInput.value = e.target.getAttribute('data-question');
                        sendMessage();
                    });
                });
            }, 100);
        }

        // 2. Generate token diagnostic chips
        updateDiagnosticTokens(originalQuery);

        // 3. Update NLP Insights tab directly
        renderInsights(lastDiagnosticData);
    }

    function updateDiagnosticTokens(query) {
        diagTokensBox.innerHTML = '';
        
        const stopwords = new Set(["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"]);
        
        const tokens = query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t && !stopwords.has(t));
            
        if (tokens.length === 0) {
            diagTokensBox.innerHTML = '<span class="token-placeholder">No content words</span>';
            return;
        }

        tokens.forEach(tok => {
            const chip = document.createElement('span');
            chip.className = 'token-chip';
            chip.textContent = tok;
            diagTokensBox.appendChild(chip);
        });
    }

    // ==========================================
    // 5. NLP INSIGHTS & VISUALIZATION
    // ==========================================
    
    function renderInsights(data) {
        if (!data) return;

        // Raw Query
        insightRawQuery.textContent = `"${data.query}"`;
        
        // Tokens
        const stopwords = new Set(["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"]);
        const tokens = data.query.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t && !stopwords.has(t));
            
        insightCleanTokens.textContent = tokens.length > 0 ? `[${tokens.join(', ')}]` : '[]';

        // Render Similarity Chart (Top 6 matches)
        similarityChart.innerHTML = '';
        const limitMatches = data.matches ? data.matches.slice(0, 6) : [];
        
        if (limitMatches.length === 0) {
            similarityChart.innerHTML = '<div class="no-chart-data">No diagnostic data.</div>';
            return;
        }

        limitMatches.forEach(match => {
            const pct = (match.score * 100).toFixed(1);
            const isMatched = data.match_found && data.faq.id === match.id;
            
            const barItem = document.createElement('div');
            barItem.className = `chart-bar-item ${isMatched ? 'matched' : ''}`;
            
            barItem.innerHTML = `
                <div class="chart-bar-labels">
                    <span class="chart-bar-question" title="${match.question}">${match.question}</span>
                    <span class="chart-bar-score">${match.score.toFixed(4)}</span>
                </div>
                <div class="chart-bar-outer">
                    <div class="chart-bar-inner" style="width: ${pct}%"></div>
                </div>
            `;
            
            similarityChart.appendChild(barItem);
        });
    }

    // ==========================================
    // 6. FAQ MANAGER LOGIC
    // ==========================================
    
    // Render FAQ accordion
    function renderFAQList(searchFilter = '', categoryFilter = 'all') {
        faqList.innerHTML = '';
        
        const filtered = faqs.filter(faq => {
            const matchesSearch = 
                faq.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchFilter.toLowerCase());
            
            const matchesCategory = 
                categoryFilter === 'all' || 
                faq.category.toLowerCase() === categoryFilter.toLowerCase();
                
            return matchesSearch && matchesCategory;
        });

        if (filtered.length === 0) {
            faqList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-database"></i>
                    No FAQs found matching the filters.
                </div>`;
            return;
        }

        filtered.forEach(faq => {
            const catClass = faq.category ? faq.category.toLowerCase() : 'general';
            
            const faqDiv = document.createElement('div');
            faqDiv.className = 'faq-item';
            faqDiv.id = `faq-item-${faq.id}`;
            
            faqDiv.innerHTML = `
                <div class="faq-question-bar">
                    <div class="faq-question-title">
                        <span class="faq-tag ${catClass}">${faq.category || 'General'}</span>
                        <span>${faq.question}</span>
                    </div>
                    <div class="faq-question-actions">
                        <button class="btn-faq-action edit" data-id="${faq.id}" title="Edit FAQ">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-faq-action delete" data-id="${faq.id}" title="Delete FAQ">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        <i class="fa-solid fa-chevron-down faq-arrow"></i>
                    </div>
                </div>
                <div class="faq-answer-body">
                    <div class="faq-answer-content">
                        ${faq.answer.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
            
            faqList.appendChild(faqDiv);
            
            // Accordion Collapse/Expand toggle
            const questionBar = faqDiv.querySelector('.faq-question-bar');
            questionBar.addEventListener('click', (e) => {
                // If clicked edit or delete button, don't trigger accordion toggle
                if (e.target.closest('.btn-faq-action')) return;
                
                const isOpen = faqDiv.classList.contains('open');
                
                // Close all other accordions
                document.querySelectorAll('.faq-item').forEach(item => {
                    item.classList.remove('open');
                });
                
                if (!isOpen) {
                    faqDiv.classList.add('open');
                }
            });
        });

        // Add Listeners to Action Buttons
        document.querySelectorAll('.btn-faq-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                openEditForm(id);
            });
        });

        document.querySelectorAll('.btn-faq-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                deleteFAQRecord(id);
            });
        });
    }

    // Filter FAQs by Search Input
    faqSearch.addEventListener('input', () => {
        const activeCategory = categoryFiltersContainer.querySelector('.filter-chip.active').getAttribute('data-category');
        renderFAQList(faqSearch.value, activeCategory);
    });

    // Filter FAQs by Category Chips
    categoryFiltersContainer.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            categoryFiltersContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.getAttribute('data-category');
            renderFAQList(faqSearch.value, category);
        });
    });

    // Form Panels Handling
    btnOpenAddForm.addEventListener('click', () => {
        openAddForm();
    });

    btnCloseForm.addEventListener('click', () => closeForm());
    btnCancelForm.addEventListener('click', () => closeForm());

    function openAddForm() {
        editMode = false;
        formTitle.textContent = "Add New FAQ";
        editFaqId.value = "";
        faqQuestion.value = "";
        faqAnswer.value = "";
        faqCategory.value = "General";
        faqFormContainer.classList.add('active');
    }

    function openEditForm(id) {
        editMode = true;
        const faq = faqs.find(f => f.id === id);
        if (!faq) return;
        
        formTitle.textContent = "Edit FAQ Record";
        editFaqId.value = faq.id;
        faqQuestion.value = faq.question;
        faqAnswer.value = faq.answer;
        faqCategory.value = faq.category || "General";
        faqFormContainer.classList.add('active');
    }

    function closeForm() {
        faqFormContainer.classList.remove('active');
        faqEditorForm.reset();
    }

    // Submit FAQ Form (Add or Edit)
    faqEditorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = editFaqId.value;
        const payload = {
            question: faqQuestion.value.trim(),
            answer: faqAnswer.value.trim(),
            category: faqCategory.value
        };

        try {
            let url = '/api/faqs';
            let method = 'POST';
            
            if (editMode && id) {
                url = `/api/faqs/${id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save FAQ');
            
            showToast(editMode ? "FAQ updated successfully!" : "FAQ created successfully!");
            closeForm();
            fetchFAQs(); // Refresh database
            
        } catch (error) {
            console.error('Form submit error:', error);
            showToast("Error saving FAQ records.", false);
        }
    });

    // Delete FAQ Record
    async function deleteFAQRecord(id) {
        if (!confirm("Are you sure you want to delete this FAQ record?")) return;
        
        try {
            const response = await fetch(`/api/faqs/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete FAQ');
            
            showToast("FAQ deleted successfully!");
            fetchFAQs(); // Refresh database
        } catch (error) {
            console.error('Delete error:', error);
            showToast("Error deleting FAQ.", false);
        }
    }
});
