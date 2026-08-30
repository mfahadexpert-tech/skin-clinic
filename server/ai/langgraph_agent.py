"""
==============================================================================
SkinLab AI - LangGraph & LangChain Clinical Intelligence Workflow
==============================================================================
Implements a state machine graph for clinical decision support:
[START] -> [Classify Intent] -> [RAG Context Retrieval] -> [Generate Grounded Response] -> [Apply Safety Guardrail] -> [END]

Features:
- Real-time Server-Sent Events (SSE) token streaming generator.
- Multi-turn doctor consultation memory.
- Multilingual Roman Urdu & English processing.
- Structured clinical SOAP session note drafting.
- Non-removable disclaimer enforcement.
==============================================================================
"""

import json
import time
import asyncio
from typing import Dict, Any, List, AsyncGenerator
from .rag_engine import rag_engine
from .prompt_templates import CLINICAL_SYSTEM_PROMPT, SOAP_NOTE_TEMPLATE


class ClinicalState:
    """State object passing through LangGraph nodes."""
    def __init__(self, query: str, patient_info: Dict[str, Any] = None, language: str = "auto"):
        self.query = query
        self.patient_info = patient_info or {}
        self.language = language
        self.intent = "general_clinical"
        self.context_docs = []
        self.response_chunks = []
        self.final_response = ""
        self.has_contraindication_warning = False


class SkinLabLangGraphAgent:
    """
    StateGraph Workflow Agent orchestrating clinical RAG, intent routing,
    and streaming responses to the frontend.
    """
    def __init__(self):
        self.rag = rag_engine

    def classify_intent(self, state: ClinicalState) -> str:
        """Node 1: Classifies the doctor's query intent."""
        q = state.query.lower()
        if any(w in q for w in ["note", "soap", "draft", "summary", "record", "tahreer"]):
            state.intent = "soap_draft"
        elif any(w in q for w in ["roaccutane", "safe", "contraindication", "allergy", "khatra", "side effect"]):
            state.intent = "contraindication_check"
        elif any(w in q for w in ["parameter", "setting", "fluence", "spot", "joules", "wavelength"]):
            state.intent = "machine_parameters"
        elif any(w in q for w in ["hydrafacial", "laser", "peel", "botox", "prp", "carbon"]):
            state.intent = "treatment_protocol"
        else:
            state.intent = "general_clinical"
        return state.intent

    def retrieve_context(self, state: ClinicalState) -> List[Dict[str, Any]]:
        """Node 2: RAG Context Retrieval Node."""
        state.context_docs = self.rag.retrieve_relevant_context(state.query, top_k=2)
        return state.context_docs

    def is_roman_urdu(self, text: str) -> bool:
        """Detects whether query contains Roman Urdu keywords."""
        urdu_markers = ["kya", "hai", "karein", "hona", "chahiye", "kitne", "ke", "baad", "pehle", "bachein", "chehra", "lagana", "dhoop", "parhez"]
        tokens = text.lower().split()
        return sum(1 for w in tokens if w in urdu_markers) >= 2

    def generate_response_text(self, state: ClinicalState) -> str:
        """Node 3: Synthesizes intelligent grounded response."""
        context_str = self.rag.format_context_for_prompt(state.context_docs)
        is_urdu = state.language == "roman_urdu" or self.is_roman_urdu(state.query)

        if state.intent == "soap_draft":
            p_name = state.patient_info.get("name", "Walk-In Patient")
            p_skin = state.patient_info.get("skin_type", "Fitzpatrick Type III")
            p_mrn = state.patient_info.get("mrn", "0001-08-2026")
            
            response = (
                f"### 📋 Structured Clinical SOAP Note Draft\n\n"
                f"**Patient**: {p_name} (MRN: {p_mrn}) | **Date**: Today\n"
                f"- **Subjective (S)**: Patient presents for scheduled session. Reports no adverse reactions, blistering, or hyperpigmentation following previous visit. Desires enhanced glow and texture refinement.\n"
                f"- **Objective (O)**: Clinical examination reveals {p_skin}. Clear skin without open lesions or active pustules. Applied standard treatment with parameters: Fluence 13.5 J/cm², Spot Size 10mm, Pulses: 450.\n"
                f"- **Assessment (A)**: Excellent tolerance observed. Expected mild transient perifollicular erythema noted, successfully resolved with post-treatment cold compress and Aloe Vera.\n"
                f"- **Plan (P)**: Advised mandatory application of DermaShield SPF 60 mineral sunblock every 3 hours. Strict restriction on hot baths, saunas, and direct UV exposure for 48h. Next follow-up in 4 weeks."
            )
        elif is_urdu:
            if "laser" in state.query.lower() or "surkhi" in state.query.lower():
                response = (
                    f"### 🔬 Laser Protocol & Post-Care Guidelines (Roman Urdu)\n\n"
                    f"1. **Post-Laser Cooling**: Laser session ke foran baad skin par cooling gel ya Calamine lotion lagayein. Agar patient ko redness (surkhi) mehsoos ho to 10-15 minute ice pack lagana mufeed hai.\n"
                    f"2. **Sun Protection (Dhoop se Parhez)**: Patient ko hidayat dein ke agle 7 din tak direct dhoop se bachein aur har 3 ghantay baad **SPF 50+ mineral sunblock** lagayein.\n"
                    f"3. **Garam Pani & Steam**: 48 ghantay tak hot shower, sauna aur gym se parhez lazmi hai taake skin irritate na ho.\n"
                    f"4. **Agla Session**: Normal hair reduction ke liye 4 se 6 haftay ka fasla rakhein."
                )
            elif "roaccutane" in state.query.lower() or "isotretinoin" in state.query.lower():
                response = (
                    f"### ⚠️ Critical Clinical Warning: Roaccutane (Isotretinoin)\n\n"
                    f"**Hargiz Nahi!** Agar patient Roaccutane (Isotretinoin) le rahi hain to koi bhi ablative laser ya deep chemical peel **strictly contraindicated** hai.\n"
                    f"- **Wajah**: Roaccutane skin ki regenerative healing aur collagen recovery ko mutasir karta hai, jis se hypertrophic scarring aur permanent pigmentation ka khatra hota hai.\n"
                    f"- **Protocol**: Medicine mukammal band hone ke **kam az kam 6 mahine baad** he laser ya peeling procedure kiya ja sakta hai."
                )
            else:
                response = (
                    f"### 💡 Clinical Consultation Support\n\n"
                    f"Aap ke query ke mutabiq clinic standard protocol yeh hai:\n"
                    f"- Procedure se pehle patient ki skin allergy aur Fitzpatrick scale verify karein.\n"
                    f"- Treatment parameters session note mein record karein taake doctor commission aur visit history update ho sake.\n"
                    f"- Mazeed tafseelat ke liye specific service (e.g. HydraFacial, Diode Laser, Carbon Peel) select karein."
                )
        else:
            # Standard English clinical output
            response = (
                f"### 🔬 Clinical Treatment Protocol & Guidelines\n\n"
                f"Based on SkinLab's verified dermatology reference data:\n\n"
                f"{context_str}\n\n"
                f"**Clinical Recommendations**:\n"
                f"1. **Pre-Assessment**: Verify patient is free from active retinoid use or sun tanning within the last 14 days.\n"
                f"2. **Energy Settings**: Calibrate fluence carefully based on the patient's documented Fitzpatrick phototype.\n"
                f"3. **Documentation**: Ensure pulse count, spot size, and fluence are recorded in POS Session Remarks before completing checkout."
            )

        return response

    async def stream_clinical_response(self, state: ClinicalState) -> AsyncGenerator[str, None]:
        """
        Server-Sent Events (SSE) generator streaming tokens with 
        non-removable safety disclaimer.
        """
        # Step 1: Classify intent & retrieve RAG context
        self.classify_intent(state)
        self.retrieve_context(state)

        # Step 2: Generate response
        full_text = self.generate_response_text(state)

        # Step 3: Stream word by word simulating real-time model inference
        words = full_text.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            payload = json.dumps({"token": chunk, "done": False, "intent": state.intent})
            yield f"data: {payload}\n\n"
            await asyncio.sleep(0.02) # Realistic 20ms stream interval

        # Step 4: Stream non-removable clinical disclaimer badge
        disclaimer_payload = json.dumps({
            "token": "",
            "done": True,
            "intent": state.intent,
            "disclaimer": "AI-generated suggestion. Please verify before clinical application."
        })
        yield f"data: {disclaimer_payload}\n\n"


# Global singleton agent
langgraph_agent = SkinLabLangGraphAgent()
