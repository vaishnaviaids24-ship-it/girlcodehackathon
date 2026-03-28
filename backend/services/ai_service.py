"""
AI Service – wraps Google Gemini (falls back to rule-based logic when the
API key is missing or a quota error occurs so the MVP always works).
"""

import os
import re
import json
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Attempt to load the Gemini client
_gemini_model = None
if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        logger.info("Gemini model loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load Gemini: {e}")


def _call_gemini(prompt: str) -> str:
    if _gemini_model is None:
        return ""
    try:
        response = _gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.warning(f"Gemini call failed: {e}")
        return ""


# ── Smart Message Generation ─────────────────────────────────────────────────

def generate_smart_message(trigger: str, product_name: str, user_name: str) -> str:
    """
    Generate a personalised re-engagement message.
    trigger: 'view_no_cart' | 'cart_no_checkout'
    """
    prompt = f"""You are a friendly e-commerce assistant. Write a SHORT (1-2 sentences),
conversational re-engagement message for a customer.

Customer name: {user_name}
Product: {product_name}
Trigger: {"The customer viewed this product but did NOT add it to cart" if trigger == "view_no_cart"
          else "The customer added this product to cart but did NOT checkout"}

Rules:
- Be warm and helpful, never pushy
- Mention the product name
- If trigger is cart_no_checkout, offer a small incentive (e.g. 10% discount)
- Keep it under 40 words
- No markdown, no emojis unless one at the end

Reply with ONLY the message text."""

    result = _call_gemini(prompt)
    if result:
        return result

    # ── Fallback rule-based messages ──
    name = user_name.split()[0]
    if trigger == "view_no_cart":
        msgs = {
            "Stylish Travel Bag": f"Hey {name}! That travel bag you checked out is almost sold out — want me to reserve one for you?",
            "Wireless Headphones": f"Hi {name}! Still curious about those headphones? They sound incredible — come take another look!",
        }
    else:
        msgs = {
            "Stylish Travel Bag": f"Hey {name}! Your travel bag is still waiting in your cart. Use code SAVE10 for 10% off today only!",
            "Wireless Headphones": f"Hi {name}! Those headphones in your cart are going fast. Grab them now and save 10% with code SAVE10!",
        }
    return msgs.get(product_name, f"Hi {name}! We noticed you were interested in {product_name}. Come back and complete your purchase!")


# ── Intent Detection ──────────────────────────────────────────────────────────

INTENT_LABELS = {
    "price_concern": "price_concern",
    "not_interested": "not_interested",
    "buy": "buy",
    "unknown": "unknown",
}


def detect_intent(reply_text: str) -> dict:
    """
    Classify the user's chat reply.
    Returns: { intent, confidence, follow_up_message }
    """
    prompt = f"""Classify this e-commerce customer reply into exactly ONE intent label.

Reply: "{reply_text}"

Intent labels:
- price_concern  → customer thinks it is too expensive or wants a deal
- not_interested → customer does not want the product
- buy            → customer wants to purchase or is ready to checkout
- unknown        → cannot determine

Respond ONLY with valid JSON, no markdown fences:
{{"intent": "<label>", "confidence": <0.0-1.0>, "reason": "<one sentence>"}}"""

    raw = _call_gemini(prompt)
    if raw:
        try:
            # strip possible ```json fences
            cleaned = re.sub(r"```[a-z]*", "", raw).strip("` \n")
            data = json.loads(cleaned)
            intent = data.get("intent", "unknown")
            confidence = float(data.get("confidence", 0.8))
            reason = data.get("reason", "")
            follow_up = _follow_up_for_intent(intent, reply_text)
            return {"intent": intent, "confidence": confidence, "reason": reason, "follow_up_message": follow_up}
        except Exception as e:
            logger.warning(f"Intent parse error: {e} | raw={raw}")

    # ── Fallback keyword matcher ──
    text = reply_text.lower()
    if any(w in text for w in ["expensive", "costly", "price", "cheap", "afford", "discount", "deal", "too much"]):
        intent = "price_concern"
    elif any(w in text for w in ["no", "not interested", "stop", "leave", "don't", "nope", "never", "unsubscribe"]):
        intent = "not_interested"
    elif any(w in text for w in ["yes", "ok", "buy", "purchase", "checkout", "order", "want it", "sure", "great", "add"]):
        intent = "buy"
    else:
        intent = "unknown"

    follow_up = _follow_up_for_intent(intent, reply_text)
    return {"intent": intent, "confidence": 0.75, "reason": "Keyword-based fallback", "follow_up_message": follow_up}


def _follow_up_for_intent(intent: str, original: str) -> str:
    if intent == "price_concern":
        return "No worries! Here's an exclusive 15% discount just for you — use code DEAL15 at checkout. You won't find this anywhere else!"
    elif intent == "not_interested":
        return "Totally understood! We'll stop messaging you about this. Feel free to browse again whenever you're ready. 😊"
    elif intent == "buy":
        return "Awesome! Let me take you straight to checkout. Your item is ready and waiting — let's get it shipped to you!"
    else:
        return "Thanks for reaching out! Can you tell me more so I can help you better?"


# ── Recommendation Logic ──────────────────────────────────────────────────────

def get_recommendation(current_product_id: int, all_products: list) -> dict | None:
    """Return the other product as a simple cross-sell recommendation."""
    for p in all_products:
        if p["id"] != current_product_id:
            return p
    return None
