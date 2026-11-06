import pickle
import sys
import re
import json
import warnings
import numpy as np
import nltk
from os import path

# Suppress sklearn and other warnings
warnings.filterwarnings("ignore")

from nltk.stem import WordNetLemmatizer
from sklearn.base import BaseEstimator, TransformerMixin
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Ensure NLTK data is downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet', quiet=True)

class TextPreprocessor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.negation_patterns = [
            (r'\bne\s+(\w+)\s+pas\b', r'NEG_\1'),
            (r"\bn'(\w+)\s+pas\b", r'NEG_\1'),
            (r'\bimpossible\s+de\s+(\w+)', r'NEG_\1'),
            (r"\bimpossible\s+d'(\w+)", r'NEG_\1'),
            (r'\baucun\s+(\w+)', r'NEG_\1'),
            (r'\baucune\s+(\w+)', r'NEG_\1'),
            (r'\bjamais\s+(\w+)', r'NEG_\1'),
            (r'\bne\s+fonctionne\s+pas', 'NEG_fonctionner'),
            (r'\bne\s+répond\s+plus', 'NEG_répondre'),
            (r'\bne\s+marche\s+pas', 'NEG_marcher')
        ]
        self.normalization = {
            r'\bpb\b': 'problème',
            r'\bpbm\b': 'problème',
            r'\bmdp\b': 'mot de passe',
            r'\bsvp\b': 'sil vous plaît',
            r'\bstp\b': 'sil te plaît',
            r'\bttj\b': 'toujours',
            r'\bac\b': 'avec',
            r'\bqd\b': 'quand',
            r'\bpk\b': 'pourquoi',
            r'\bpour\s+quoi\b': 'pourquoi'
        }
        self.stop_words = set(['ce', 'dans', 'en', 'mais', 'ou', 'que', 'si', 'tout', 'un', 'une'])

    def fit(self, X, y=None):
        return self

    def preprocess_text(self, text):
        if not isinstance(text, str):
            return ""
        text = text.lower()
        # Normalization
        for pattern, replacement in self.normalization.items():
            text = re.sub(pattern, replacement, text)
        # Negation handling
        for pattern, replacement in self.negation_patterns:
            text = re.sub(pattern, replacement, text)
        # Tokenization & Lemmatization
        tokens = nltk.word_tokenize(text)
        tokens = [self.lemmatizer.lemmatize(t) for t in tokens if t.isalnum() and t not in self.stop_words]
        return " ".join(tokens)

    def transform(self, X):
        return [self.preprocess_text(text) for text in X]

def extract_meta_features(text):
    if not isinstance(text, str):
        return [0] * 11
    
    tokens = nltk.word_tokenize(text)
    words = [t for t in tokens if t.isalnum()]
    
    text_len = len(text)
    word_count = len(words)
    sentence_count = len(nltk.sent_tokenize(text))
    avg_word_len = np.mean([len(w) for w in words]) if words else 0
    exclamation_count = text.count('!')
    question_count = text.count('?')
    upper_count = sum(1 for w in tokens if w.isupper())
    digit_count = sum(1 for c in text if c.isdigit())
    stop_word_count = 0 
    special_char_count = len(re.findall(r'[^a-zA-Z0-9\s]', text))
    title_word_count = sum(1 for w in tokens if w.istitle())
    
    return [
        text_len, word_count, sentence_count, avg_word_len,
        exclamation_count, question_count, upper_count, digit_count,
        stop_word_count, special_char_count, title_word_count
    ]

def classify(title, description):
    try:
        model_path = path.join(path.dirname(__file__), 'ticket_classifier.pkl')
        if not path.exists(model_path):
            return f"Error: Model file not found at {model_path}"
            
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
        
        model = data['model']
        tfidf = data['tfidf']
        bow = data['bow']
        le = data['label_encoder']
        preprocessor = data.get('preprocessor', TextPreprocessor())
        vader = data['vader_analyzer']
        
        full_text = f"{title} {description}"
        
        # 1. Preprocess
        clean_text = preprocessor.preprocess_text(full_text)
        
        # 2. Vectorize
        tfidf_features = tfidf.transform([clean_text]).toarray()
        bow_features = bow.transform([clean_text]).toarray()
        
        # 3. Sentiment
        sentiment = vader.polarity_scores(full_text)
        sentiment_features = np.array([[sentiment['neg'], sentiment['neu'], sentiment['pos'], sentiment['compound']]])
        
        # 4. Meta features
        meta_features = np.array([extract_meta_features(full_text)])
        
        # Combine all features
        all_features = np.hstack([tfidf_features, bow_features, sentiment_features, meta_features])
        
        # 5. Predict
        prediction = model.predict(all_features)
        category = le.inverse_transform(prediction)[0]
        
        return category
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python classify.py <title> <description>")
        sys.exit(1)
    
    title = sys.argv[1]
    description = sys.argv[2]
    
    result = classify(title, description)
    print(result)
