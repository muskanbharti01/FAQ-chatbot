import os
import json
import re
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Pre-download NLTK resources to avoid runtime lookup issues
def download_nltk_resources():
    resources = ['punkt', 'stopwords', 'wordnet', 'omw-1.4', 'punkt_tab']
    for resource in resources:
        try:
            # Check if package is already downloaded
            if resource == 'punkt' or resource == 'punkt_tab':
                nltk.data.find('tokenizers/punkt')
            else:
                nltk.data.find(f'corpora/{resource}')
        except LookupError:
            try:
                nltk.download(resource, quiet=True)
            except Exception as e:
                print(f"Warning: Failed to download NLTK resource '{resource}': {e}")

# Call downloader
download_nltk_resources()

# Try imports
try:
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    from nltk.tokenize import word_tokenize
except ImportError as e:
    print(f"NLTK Sub-modules import failed: {e}")

class FAQMatcher:
    def __init__(self, faqs_path):
        self.faqs_path = faqs_path
        self.faqs = []
        # Setup vectorizer with custom analyzer/tokenizer
        self.vectorizer = TfidfVectorizer(tokenizer=self.preprocess_and_tokenize, token_pattern=None)
        self.tfidf_matrix = None
        self.stopwords_set = set()
        self.lemmatizer = None
        
        # Load NLTK stopwords with fallbacks
        try:
            self.stopwords_set = set(stopwords.words('english'))
        except Exception:
            # Extensive fallback list if stopwords corpus is not available
            self.stopwords_set = {
                "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
                "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", 
                "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", 
                "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", 
                "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", 
                "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", 
                "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", 
                "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", 
                "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", 
                "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", 
                "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", 
                "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "d", 
                "ll", "m", "o", "re", "ve", "y", "ain", "aren", "couldn", "didn", "doesn", "hadn", 
                "hasn", "haven", "isn", "ma", "mightn", "mustn", "needn", "shan", "shouldn", "wasn", 
                "weren", "won", "wouldn"
            }
            
        try:
            self.lemmatizer = WordNetLemmatizer()
        except Exception:
            self.lemmatizer = None

        self.load_faqs()

    def load_faqs(self):
        """Loads FAQs from JSON file and fits the vectorizer."""
        if os.path.exists(self.faqs_path):
            try:
                with open(self.faqs_path, 'r', encoding='utf-8') as f:
                    self.faqs = json.load(f)
            except Exception as e:
                print(f"Error loading FAQs from file: {e}")
                self.faqs = []
        else:
            self.faqs = []
        
        self.fit_vectorizer()

    def save_faqs(self):
        """Saves FAQs back to the JSON file and fits the vectorizer."""
        try:
            with open(self.faqs_path, 'w', encoding='utf-8') as f:
                json.dump(self.faqs, f, indent=2)
        except Exception as e:
            print(f"Error saving FAQs: {e}")
        self.fit_vectorizer()

    def add_faq(self, question, answer, category):
        """Adds a new FAQ and refits the vectorizer."""
        new_id = max([faq["id"] for faq in self.faqs]) + 1 if self.faqs else 1
        new_faq = {
            "id": new_id,
            "question": question,
            "answer": answer,
            "category": category
        }
        self.faqs.append(new_faq)
        self.save_faqs()
        return new_faq

    def update_faq(self, faq_id, question, answer, category):
        """Updates an existing FAQ and refits the vectorizer."""
        for faq in self.faqs:
            if faq["id"] == faq_id:
                faq["question"] = question
                faq["answer"] = answer
                faq["category"] = category
                self.save_faqs()
                return faq
        return None

    def delete_faq(self, faq_id):
        """Deletes an FAQ and refits the vectorizer."""
        initial_len = len(self.faqs)
        self.faqs = [faq for faq in self.faqs if faq["id"] != faq_id]
        if len(self.faqs) < initial_len:
            self.save_faqs()
            return True
        return False

    def preprocess_and_tokenize(self, text):
        """Standard NLP pipeline: lowercases, cleans, tokenizes, removes stopwords, lemmatizes."""
        if not text:
            return []
        
        # Lowercase
        text = text.lower()
        
        # Remove special characters and punctuation (keep letters and numbers)
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Tokenization
        try:
            tokens = word_tokenize(text)
        except Exception:
            # Quick split fallback if nltk tokenizer fails
            tokens = text.split()
            
        # Clean, stopword filter, and lemmatize
        clean_tokens = []
        for token in tokens:
            token = token.strip()
            if token and token not in self.stopwords_set:
                if self.lemmatizer:
                    try:
                        token = self.lemmatizer.lemmatize(token)
                    except Exception:
                        pass
                clean_tokens.append(token)
                
        return clean_tokens
        
    def fit_vectorizer(self):
        """Fits the TF-IDF Vectorizer on all current FAQ questions."""
        if not self.faqs:
            self.tfidf_matrix = None
            return
        
        questions = [faq['question'] for faq in self.faqs]
        try:
            self.tfidf_matrix = self.vectorizer.fit_transform(questions)
        except Exception as e:
            print(f"Error fitting TF-IDF Vectorizer: {e}")
            self.tfidf_matrix = None

    def match(self, user_query, threshold=0.2):
        """Finds the most similar FAQ using TF-IDF and Cosine Similarity."""
        if not self.faqs or self.tfidf_matrix is None:
            return {
                "match_found": False,
                "faq": None,
                "score": 0.0,
                "matches": []
            }
            
        try:
            # Transform user query
            query_vec = self.vectorizer.transform([user_query])
            
            # Compute cosine similarity with all stored questions
            similarities = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            
            # Rank matches
            matches_indices = similarities.argsort()[::-1]
            
            all_matches = []
            for idx in matches_indices:
                score = float(similarities[idx])
                all_matches.append({
                    "id": self.faqs[idx]["id"],
                    "question": self.faqs[idx]["question"],
                    "answer": self.faqs[idx]["answer"],
                    "category": self.faqs[idx].get("category", "General"),
                    "score": round(score, 4)
                })
                
            # If top match is above the similarity threshold
            if all_matches and all_matches[0]["score"] >= threshold:
                return {
                    "match_found": True,
                    "faq": all_matches[0],
                    "score": all_matches[0]["score"],
                    "matches": all_matches
                }
            else:
                return {
                    "match_found": False,
                    "faq": None,
                    "score": all_matches[0]["score"] if all_matches else 0.0,
                    "matches": all_matches
                }
        except Exception as e:
            print(f"Error during FAQ matching: {e}")
            return {
                "match_found": False,
                "faq": None,
                "score": 0.0,
                "matches": []
            }
