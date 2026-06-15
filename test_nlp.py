import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from nlp_engine import FAQMatcher
    
    faqs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "faqs.json")
    print(f"Initializing FAQMatcher with: {faqs_path}")
    matcher = FAQMatcher(faqs_path)
    
    # Test cases
    queries = [
        "How do I track my package?",
        "what's your return policy",
        "can i pay with credit card",
        "how long does it take to ship",
        "forgot password"
    ]
    
    print("\nRunning NLP Matching tests:")
    print("=" * 60)
    
    for q in queries:
        print(f"Query: '{q}'")
        res = matcher.match(q, threshold=0.2)
        print(f"  Match Found: {res['match_found']}")
        if res['match_found']:
            print(f"  Best Match: '{res['faq']['question']}' (Score: {res['score']})")
        else:
            print(f"  Best Score (Below threshold): {res['score']}")
            if res['matches']:
                print(f"  Closest was: '{res['matches'][0]['question']}' (Score: {res['matches'][0]['score']})")
        print("-" * 60)
        
    print("\nNLP engine test completed successfully!")

except Exception as e:
    print(f"Error executing test: {e}")
    sys.exit(1)
