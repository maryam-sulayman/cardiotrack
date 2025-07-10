from flask import Flask, request, jsonify
from openai import OpenAI
import os
import math
from datetime import datetime

# Initialize
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = Flask(__name__)

# --- Framingham Risk Score (simplified for demo purposes) ---
def calculate_framingham_risk(age, gender, systolic_bp, smoking, bmi):
    if gender.lower() == "male":
        s_bp = 1.933 * math.log(systolic_bp)
        age_coef = 3.112 * math.log(age)
        bmi_coef = 0.792 * math.log(bmi)
        smoke_coef = 0.618 if smoking else 0
        baseline_survival = 0.889
        mean_risk = 23.9802
    else:
        s_bp = 2.822 * math.log(systolic_bp)
        age_coef = 2.721 * math.log(age)
        bmi_coef = 0.511 * math.log(bmi)
        smoke_coef = 0.618 if smoking else 0
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

# --- Main Endpoint ---
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        user_data = request.get_json()

        age = user_data["age"]
        gender = user_data["gender"]
        ethnicity = user_data.get("ethnicity", "unspecified")
        bmi = user_data["bmi"]
        systolic_bp = user_data["ap_hi"]
        smoking = (
    user_data["smoking"].lower() in ["yes", "true", "1"]
    if isinstance(user_data["smoking"], str)
    else bool(user_data["smoking"])
)

        stress = user_data["stress"]
        steps = user_data["steps"]

        # --- Risk + Heart Age ---
        risk_percent = calculate_framingham_risk(age, gender, systolic_bp, smoking, bmi)
        heart_age = estimate_heart_age(age, risk_percent)

        # --- GPT Clinical Summary ---
        analysis_prompt = f"""
        You are a cardiologist. A user is {age} years old, {gender}, from the {ethnicity} ethnic group. 
        BMI is {bmi}, blood pressure is {systolic_bp}/{user_data['ap_lo']}, stress level is {stress}, 
        activity level is {steps} steps per day, and smoking status is {user_data['smoking']}.
        Please analyse their cardiovascular risk and explain what heart-related problems may arise.
        """

        analysis_response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": analysis_prompt}]
        )
        clinical_summary = analysis_response.choices[0].message.content.strip()

        # --- GPT Short Bullet Summary ---
        # --- GPT Short Bullet Summary (Improved, Personalised) ---
        summary_prompt = f"""
        You are helping someone improve their heart health week by week.

        Turn this clinical summary into 2–3 short, personalised messages that will be shown on their app dashboard.

        Use a warm, encouraging tone. Focus on what matters to them: habits they can improve, risk factors that apply to them, and reminders that feel personal.

        Do not mention 'medical evaluation' or 'urgent action' — this app is focused on small steps, not emergency care.

        {clinical_summary}
        """


        summary_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": summary_prompt}]
        )
        summary_bullets = summary_response.choices[0].message.content.strip().split("\n")

        # --- GPT Weekly Plan (ongoing habits) ---
        completion = user_data.get("completion", [])

        completion_str = (
            f"Here is how the user did with their last 7-day plan: {completion}.\n"
            "True = completed, False = not completed.\n"
            "Please consider this pattern when adjusting the next week's plan.\n"
            "Repeat any important tasks they skipped, and celebrate what they did well.\n"
        )

        plan_prompt = f"""
        This user is working on improving their heart health continuously.

        {completion_str}

        Based on the clinical risk below, suggest a weekly plan with one new habit per day for 7 days.
        Make each habit practical, beginner-friendly, and motivating.
        Keep it positive and focused on long-term lifestyle improvement.

        {clinical_summary}
        """


        plan_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": plan_prompt}]
        )
        plan = plan_response.choices[0].message.content.strip().split("\n")

        return jsonify({
            "heart_risk_percent": risk_percent,
            "estimated_heart_age": heart_age,
            "clinical_summary": clinical_summary,
            "dashboard_summary": summary_bullets,
            "weekly_plan": plan
        })
        

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
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
        You are a heart-health nutritionist.

        Create a healthy daily meal plan for someone who is {age} years old, {gender}, of {ethnicity} background,
        with a BMI of {bmi}, stress level of {stress}, smoking status: {smoking}, and daily steps: {steps}.

        Suggest:
        • A heart-healthy breakfast
        • A lunch option
        • A dinner option

        Keep it clear and friendly. Meals should be realistic and not too fancy. No need to mention their exact numbers again.
        """

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": base_prompt}]
        )

        tips = response.choices[0].message.content.strip()

        return jsonify({"meal_tips": tips,
                        "generatedAt": datetime.utcnow().isoformat()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
