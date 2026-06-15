# ShopVibe AI Support Center: NLP FAQ Chatbot & Manager

ShopVibe AI Support Center is a high-fidelity, NLP-powered FAQ Chatbot and Database Management application. It uses a Python **FastAPI** backend for natural language processing (Tokenization, Stopword removal, Lemmatization, TF-IDF, and Cosine Similarity matching) and a gorgeous **glassmorphic** HTML5/CSS3/JavaScript frontend for client chat and administrative CRUD operations.

---

## Features

### 💬 Chat Assistant
- **Automatic NLP Matching:** User queries are preprocessed and matched against the FAQ database using TF-IDF and Cosine Similarity.
- **Diagnostics Dashboard:** Displays parsed query tokens, matching FAQ name, and matching similarity score.
- **Sensitivity Slider:** Adjust the matching threshold ($0.0$ to $1.0$) in real-time. Low values match loosely, while high values require precise phrasing.
- **Quick Suggestions:** Clickable suggestion chips for common questions and typing indicator animation.
- **Clarification Fallbacks:** Recommends alternative options when questions are ambiguous or fall slightly below the threshold.

### 🗃️ FAQ Database Manager
- **CRUD Operations:** Create, Read, Update, and Delete FAQ records directly from the UI.
- **Instant Search:** Dynamic filtering by questions and answers as you type.
- **Category Filters:** Grouped chips (Shipping, Returns, Payments, Account, General) to filter the database instantly.
- **Accordion Layout:** Elegant collapsible FAQ items with smooth animations.
- **JSON Persistence:** All changes are saved instantly to a local `faqs.json` database and hot-reloaded by the NLP matcher.

### 📊 NLP Insights Visualizer
- **Pipeline Breakdown:** Shows the transformation of your last query: Raw Text $\rightarrow$ Clean Lemmatized Tokens $\rightarrow$ Vector Representation.
- **Rankings Chart:** A real-time bar chart displaying the cosine similarity scores of the top 6 FAQs, highlighting the match in green if it clears the threshold.

---

## Tech Stack
- **Backend:** Python 3.8+, FastAPI, Uvicorn, Scikit-Learn, NLTK (Natural Language Toolkit)
- **Frontend:** HTML5, Vanilla CSS3 (Glassmorphism, Light/Dark Modes, Flexbox/Grid), Vanilla JavaScript (ES6)
- **Tooling:** VS Code configuration, PowerShell/Batch automated launchers

---

## Getting Started

### 🚀 Quick Run (Windows)
Double-click the launcher script in the root directory to automatically create a virtual environment, install requirements, download NLP data, and launch the web interface:
- **Command Prompt:** Double-click `run.bat`
- **PowerShell:** Run `.\run.ps1`

The application will launch automatically at: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

### 🛠️ Manual Installation (Cross-Platform)

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/faq-chatbot.git
   cd faq-chatbot
   ```

2. **Create & Activate a Python Virtual Environment:**
   - **Windows:**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Launch the FastAPI Server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The server will start listening on `http://127.0.0.1:8000`. Navigate to `http://127.0.0.1:8000/docs` to test the API endpoints.*

---

## How the NLP Matcher Works

1. **Preprocessing:** The user query is converted to lowercase, stripped of special characters, tokenized into individual words, and filtered against NLTK's English stopword list.
2. **Lemmatization:** Tokens are reduced to their dictionary root form using NLTK's `WordNetLemmatizer` (e.g., "tracking" $\rightarrow$ "track", "orders" $\rightarrow$ "order").
3. **TF-IDF Vectorization:** The query and all FAQ questions are transformed into numerical vectors using Scikit-Learn's Term Frequency-Inverse Document Frequency vectorizer to capture word importance.
4. **Cosine Similarity:** Similarity is calculated as the cosine of the angle between the query vector $q$ and each FAQ question vector $d$:
   $$\text{Similarity}(q, d) = \frac{q \cdot d}{\|q\| \|d\|}$$
5. **Threshold Match:** The system selects the highest-scoring FAQ. If the score meets or exceeds the sensitivity slider threshold, the answer is returned; otherwise, fallback queries are suggested.

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
