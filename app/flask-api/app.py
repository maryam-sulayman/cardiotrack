from flask import Flask, request, jsonify
from openai import OpenAI
import os
import math
from datetime import datetime
from dotenv import load_dotenv
import json, re
from datetime import datetime
from flask import request, jsonify

def to_int(x, default):
    try:
        return int(x)
    except (TypeError, ValueError):
        return default

def to_float(x, default):
    try:
        return float(x)
    except (TypeError, ValueError):
        return default


load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = Flask(__name__)

def calculate_framingham_risk(age, gender, systolic_bp, smoking, bmi):
    g = (gender or "male").lower()
    age = max(int(age or 0), 18)
    systolic_bp = max(float(systolic_bp or 0), 80.0)
    bmi = max(float(bmi or 0), 10.0)
    smoke_coef = 0.618 if (smoking is True or str(smoking).lower() in ("yes","true","1")) else 0

    if g == "male":
        s_bp = 1.933 * math.log(systolic_bp)
        age_coef = 3.112 * math.log(age)
        bmi_coef = 0.792 * math.log(bmi)
        baseline_survival = 0.889
        mean_risk = 23.9802
    else:
        s_bp = 2.822 * math.log(systolic_bp)
        age_coef = 2.721 * math.log(age)
        bmi_coef = 0.511 * math.log(bmi)
        baseline_survival = 0.950
        mean_risk = 26.1931

    risk_score = age_coef + s_bp + bmi_coef + smoke_coef
    risk_percentage = 100 * (1 - baseline_survival ** math.exp(risk_score - mean_risk))
    return round(risk_percentage, 1)


# --- Heart Age Estimate ---
def estimate_heart_age(age, risk_percent):
    if risk_percent < 5:
        return age
    elif risk_percent < 10:
        return age + 2
    elif risk_percent < 20:
        return age + 5
    elif risk_percent < 30:
        return age + 8
    else:
        return age + 10

# --- Analyze Endpoint ---

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        user_data = request.get_json()

        age          = to_int(user_data.get("age"), 40)
        gender       = (user_data.get("gender") or "").strip()
        ethnicity    = user_data.get("ethnicity", "unspecified")
        bmi          = to_float(user_data.get("bmi"), 25.0)
        systolic_bp  = to_int(user_data.get("ap_hi"), 120)
        diastolic_bp = to_int(user_data.get("ap_lo"), 80)
        stress       = user_data.get("stress", "unknown")
        smoking      = user_data.get("smoking", "no")
        steps        = to_int(user_data.get("steps"), 0)
        water        = to_float(user_data.get("water"), 0.0)
        sleep        = to_float(user_data.get("sleep"), 0.0)
        completion   = user_data.get("completion", [])


        is_smoker    = smoking if isinstance(smoking, bool) else str(smoking).lower() in ("yes", "true", "1")
        risk_percent = calculate_framingham_risk(age, gender, systolic_bp, is_smoker, bmi)
        heart_age    = estimate_heart_age(age, risk_percent)

        # Enforce variety via fixed themes (use each once, in order)
        day_themes = [
            "Movement (aerobic / steps)",
            "Nutrition (salt/fiber/swaps/hydration)",
            "Sleep (routine & wind-down)",
            "Stress (brief techniques & micro-breaks)",
            "Strength/Balance (beginner)",
            "Social/Outdoors (company or green space)",
            "Prep (plan, cues, stock)"
        ]

        schema = {
            "type": "object",
            "properties": {
                "clinical_summary": {"type": "string"},
                "dashboard_messages": {
                    "type": "array", "items": {"type": "string"}, "minItems": 2, "maxItems": 3
                },
                "weekly_plan": {
                    "type": "array", "items": {"type": "string"}, "minItems": 7, "maxItems": 7
                }
            },
            "required": ["clinical_summary", "dashboard_messages", "weekly_plan"]
        }

        prompt = f"""
You are a preventive cardiology coach. Create ONE clear 7-day plan and a detailed summary.

USER
- Age: {age}; Gender: {gender}; Ethnicity: {ethnicity}
- BMI: {bmi:.1f}; BP: {systolic_bp}/{diastolic_bp}
- Smoker: {"Yes" if is_smoker else "No"}
- Stress (1–10 or label): {stress}
- Daily steps (baseline): {steps}
- Water (L/day): {water}; Sleep (hrs): {sleep}
- Last-week completion (True=done): {completion}
- Framingham 10-yr risk: {risk_percent:.1f}% ; Estimated heart age: {heart_age}

DAY THEMES (use exactly once, in this order)
1. {day_themes[0]}
2. {day_themes[1]}
3. {day_themes[2]}
4. {day_themes[3]}
5. {day_themes[4]}
6. {day_themes[5]}
7. {day_themes[6]}

RULES
- **clinical_summary**: thorough, plain-English breakdown tailored to THIS profile. Explain what’s going well, where risk is coming from (BP/BMI/smoking/stress/sleep/steps), what heart-related problems may arise and 1–3 priorities. No word limit; write as if you’re a clinician cardiologist explaining clearly and kindly.
- **dashboard_messages**: Turn this clinical summary into 2-3 short, personalised messages that will be shown on their app dashboard to let them know how they're doing. Use a warm, encouraging tone.
- **weekly_plan**: you are helping THIS profile improve their heart health week by week, ONE clear 7-day plan, exactly 7 items. Format every line as:
  “Day {{n}}: {{Theme}} — {{instruction}}”
  • Themes (use each once): Movement; Nutrition; Sleep; Stress; Strength/Balance; Social/Outdoors; Prep.
  • One task per day (no alternatives). Write the reminder inline, e.g., “Set an alarm for 19:45…”.
  • Include: concrete task, time window (24-hour clock).
  • Add a clear metric (duration / count / steps) when it obviously fits; otherwise use a clear completion criterion.
  • Reflect completion: repeat/reshape missed items; progress completed items slightly.
  • Avoid vague lines (“walk 30 min”) and admin (“check your BP at home”).
  • Keep each line compact but complete (aim ~20-32 words).
  • Each item MUST begin exactly with “Day {{n}}: ”.


EXAMPLES (format, not content)
- Day 1: Movement — Set an alarm for 19:45 to take a 25–30-min brisk walk after dinner today to get some physical activity.
- Day 3: Sleep — Set an alarm for 22:15. Do a 30-min wind-down: take a warm shower, dim lights and read a book in bed. Lights out at 23:00, Target is 7 hours sleep.
- Day 5: Strength — After breakfast, do 2× (8 squats, 8 wall-push-ups, 20-s plank) in your living room. Finish in ≤ 15 min.

Return ONLY valid JSON with keys:
{json.dumps(schema)}
"""

        resp = client.chat.completions.create(
            model="gpt-4o-mini",                # keep your preferred model
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            response_format={"type": "json_object"}  # if unsupported, fallback parser below handles it
        )
        raw = resp.choices[0].message.content

        # Parse JSON (fallback if model returns extra text)
        try:
            payload = json.loads(raw)
        except:
            m = re.search(r"\{.*\}\s*$", raw, re.S)
            payload = json.loads(m.group(0) if m else raw)

        clinical_summary = str(payload.get("clinical_summary", "")).strip()
        summary_bullets  = [s.strip() for s in (payload.get("dashboard_messages") or []) if isinstance(s, str) and s.strip()]
        weekly_plan      = [s.strip() for s in (payload.get("weekly_plan") or []) if isinstance(s, str) and s.strip()]

        # Enforce exactly 7 Day-lines
        # Enforce exactly 7 Day-lines (no vague terms, no Plan B)
        weekly_plan = [p for p in weekly_plan if p.lower().startswith("day")]
        if len(weekly_plan) != 7:
            fallback_by_theme = [
                "Movement — Set an alarm for 20:00 to take a 20–25-min brisk walk near your home.",
                "Nutrition — At 16:00, swap crisps for a handful of unsalted nuts.",
                "Sleep — Set an alarm for 22:15. Do a 30-min wind-down; lights out 23:00.",
                "Stress — At 10:00, 14:00 and 20:00, do 3 rounds of 4-7-8 breathing (about 3 minutes).",
                "Strength/Balance — After breakfast, do 2× (8 squats, 8 wall push-ups, 20-s plank) in your living room. Finish in ≤15 min.",
                "Social/Outdoors — At 19:30, take a 15–20-min walk with a friend or family member near your home.",
                "Prep — At 20:00, plan next week and set two phone reminders for your chosen times."
            ]
            weekly_plan = [f"Day {i+1}: {fallback_by_theme[i]}" for i in range(7)]


        return jsonify({
            "heart_risk_percent": risk_percent,
            "estimated_heart_age": heart_age,
            "clinical_summary": clinical_summary,
            "dashboard_summary": summary_bullets,
            "weekly_plan": weekly_plan,
            "generatedAt": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- Meal Tips Endpoint ---
# --- Meal Tips Endpoint ---
@app.route("/meal-tips", methods=["POST"])
def meal_tips():
    try:
        user_data = request.get_json()
        age = user_data["age"]
        gender = user_data["gender"]
        ethnicity = user_data.get("ethnicity", "unspecified")
        bmi = user_data["bmi"]
        stress = user_data["stress"]
        smoking = user_data["smoking"]
        steps = user_data["steps"]

        base_prompt = f"""
        Provide a heart-healthy meal plan in the EXACT format below:

        Breakfast:
        Name: [short meal name]
        Description: [one short sentence about benefits]
        Ingredients: [comma-separated list of 4–6 ingredients]
        Steps: [list of 3–5 short cooking steps]

        Lunch:
        Name: ...
        Description: ...
        Ingredients: ...
        Steps: ...

        Dinner:
        Name: ...
        Description: ...
        Ingredients: ...
        Steps: ...

        User details:
        - Age: {age}
        - Gender: {gender}
        - Ethnicity: {ethnicity}
        - BMI: {bmi}
        - Stress: {stress}
        - Smoking: {smoking}
        - Daily steps: {steps}

        Rules:
        - Keep meal names short & realistic.
        - Ingredients must be common and easy to find.
        - Steps should be short, clear, and numbered.
        - No extra commentary outside the exact format.
        """

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": base_prompt}]
        )

        meal_text = response.choices[0].message.content.strip()

        # Parse GPT output
        meals = {}
        current_meal = None

        for line in meal_text.split("\n"):
            line = line.strip()
            if line.startswith("Breakfast:"):
                current_meal = "breakfast"
                meals[current_meal] = {}
            elif line.startswith("Lunch:"):
                current_meal = "lunch"
                meals[current_meal] = {}
            elif line.startswith("Dinner:"):
                current_meal = "dinner"
                meals[current_meal] = {}
            elif line.startswith("Name:") and current_meal:
                meals[current_meal]["name"] = line.replace("Name:", "").strip()
            elif line.startswith("Description:") and current_meal:
                meals[current_meal]["desc"] = line.replace("Description:", "").strip()
            elif line.startswith("Ingredients:") and current_meal:
                meals[current_meal]["ingredients"] = [
                    i.strip() for i in line.replace("Ingredients:", "").split(",")
                ]
            elif line.startswith("Steps:") and current_meal:
                meals[current_meal]["steps"] = []
            elif line and current_meal and "steps" in meals[current_meal]:
                meals[current_meal]["steps"].append(line)

        return jsonify({
            "meal_tips": meals,
            "generatedAt": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
