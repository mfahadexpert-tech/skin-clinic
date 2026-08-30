"""
==============================================================================
SkinLab AI - Clinical RAG (Retrieval-Augmented Generation) Engine
==============================================================================
This module indexes verified aesthetic clinical protocols, contraindications,
laser machine parameters, and FAQ pairs. When a query is received from
a doctor or receptionist, it retrieves the most relevant context documents
to ground the response and prevent hallucinations.
==============================================================================
"""

import json
import os
import re
from typing import List, Dict, Any


class ClinicalRAGEngine:
    def __init__(self, knowledge_base_path: str = None):
        if not knowledge_base_path:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            knowledge_base_path = os.path.join(current_dir, "knowledge_base.json")

        self.knowledge_base = self._load_knowledge(knowledge_base_path)

    def _load_knowledge(self, path: str) -> Dict[str, Any]:
        """Loads clinical protocols and guidelines from json file."""
        try:
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            print(f"[RAG] Error loading knowledge base: {e}")
        return {"clinical_protocols": [], "faq_knowledge": []}

    def retrieve_relevant_context(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves matching protocols and safety records based on query tokens.
        Handles both English keywords and Roman Urdu terms (e.g., 'laser', 'peel', 'roaccutane', 'gora', 'surkhi').
        """
        query_normalized = query.lower()
        results = []

        # 1. Search Protocols
        for protocol in self.knowledge_base.get("clinical_protocols", []):
            score = 0
            # Check treatment name match
            if any(term in query_normalized for term in protocol.get("treatment", "").lower().split()):
                score += 3

            # Check contraindication keywords
            for c in protocol.get("contraindications", []):
                if any(w in query_normalized for w in c.lower().split() if len(w) > 3):
                    score += 2

            # Check Roman Urdu keywords
            urdu_text = protocol.get("roman_urdu_summary", "").lower()
            if any(w in query_normalized for w in ["kya", "karein", "surkhi", "lagana", "chehra", "dhoop", "sunblock"] if w in urdu_text):
                score += 1

            if score > 0:
                results.append({"type": "protocol", "data": protocol, "score": score})

        # 2. Search FAQs
        for faq in self.knowledge_base.get("faq_knowledge", []):
            q_text = faq.get("question", "").lower()
            overlap = len(set(query_normalized.split()) & set(q_text.split()))
            if overlap > 0:
                results.append({"type": "faq", "data": faq, "score": overlap * 2})

        # Sort by relevance score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def format_context_for_prompt(self, context_docs: List[Dict[str, Any]]) -> str:
        """Formats retrieved documents into a clean prompt context block."""
        if not context_docs:
            return "No specific pre-indexed protocol found. Use standard aesthetic dermatology principles."

        formatted_blocks = []
        for i, doc in enumerate(context_docs, 1):
            if doc["type"] == "protocol":
                p = doc["data"]
                block = f"[{i}] Protocol: {p.get('treatment')}\n- Parameters: {p.get('recommended_parameters', p.get('laser_type', 'N/A'))}\n- Contraindications: {', '.join(p.get('contraindications', []))}\n- Post-Care: {p.get('post_care')}\n- Urdu Guide: {p.get('roman_urdu_summary')}"
                formatted_blocks.append(block)
            elif doc["type"] == "faq":
                f = doc["data"]
                block = f"[{i}] Q&A Guidance:\nQ: {f.get('question')}\nA: {f.get('answer')}"
                formatted_blocks.append(block)

        return "\n\n".join(formatted_blocks)


# Global singleton instance
rag_engine = ClinicalRAGEngine()
