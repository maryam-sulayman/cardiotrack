# 🫀 CardioTrack

> An AI-powered mobile health app that helps users at risk of cardiovascular disease build healthier habits through personalised guidance.

---

## About

CardioTrack was developed as part of an MSc dissertation in Data Science & Artificial Intelligence at Northumbria University, achieving a First Class result.

Cardiovascular disease is one of the leading causes of death globally, yet many of its risk factors stem from everyday lifestyle choices — meaning prevention is possible. Most health apps focus on *recording* data but fail to help users *act* on it. CardioTrack bridges that gap by combining clinical risk assessment with AI-generated personalised feedback.

---

## Key Features

- **Daily Habit Logging** — users log lifestyle factors including sleep, exercise, diet, stress, and smoking
- **Framingham Risk Score (FRS)** — a validated clinical model that calculates a user's 10-year cardiovascular risk percentage and heart age
- **AI Health Summaries** — GPT-4 generates personalised feedback based on the user's logged data and risk profile
- **Weekly Heart Plan** — GPT-3.5 creates a tailored 7-day improvement plan with achievable goals
- **Meal Planning Assistant** — GPT-3.5 suggests heart-healthy meal plans based on the user's dietary habits
- **User Onboarding** — personalised profile setup capturing medical history and lifestyle baseline

---

## 📸 Screenshots

| Dashboard | Habit Logging | AI Weekly Plan |
|-----------|--------------|----------------|
| ![Dashboard](https://github.com/user-attachments/assets/00a7b020-03c6-4bef-8e75-78b92b597b97) | ![Logging](https://github.com/user-attachments/assets/1f3e288b-2eb5-4089-8d2e-faab186f9f6e) | ![Weekly Plan](https://github.com/user-attachments/assets/b69e0a64-b999-4f18-b29a-f49e621b8ef0) |

| AI Clinical Summary | Completion | Meal Plan |
|---------------------|------------|-----------|
| ![Clinical Summary](https://github.com/user-attachments/assets/e86b0354-4e3a-8815-6cc4da4f9795) | ![Completion](https://github.com/user-attachments/assets/307dbf21-2898-4440-8357-c553ce6c8af3) | ![Meal Plan](https://github.com/user-attachments/assets/1ee8bfd6-31e6-4622-94e6-0a416d34cd7e) |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React Native |
| Backend | Firebase (Firestore + Auth) |
| AI / NLP | OpenAI GPT-4 & GPT-3.5 API |
| Risk Model | Framingham Risk Score (clinical algorithm) |
| Image Handling | Cloudinary |
| Language | TypeScript / JavaScript |

---

## Research & Validation

The app was evaluated through a structured research methodology:

- **15 simulated user profiles** were used to validate the accuracy of the Framingham Risk Score implementation against established clinical calculators
- **2 detailed user profiles** were used to assess the quality, relevance, and reliability of GPT-generated feedback
- **Usability testing** was conducted using the Mobile App Rating Scale (MARS), with reviewers rating the app highly on engagement, functionality, and aesthetics
- Results demonstrated that AI can meaningfully enhance mHealth applications beyond simple data logging by providing personalised, actionable guidance

---

## What I Learned

- How to integrate large language models (LLMs) into a production mobile app with appropriate safeguards
- How to implement and validate a clinical risk algorithm (Framingham Risk Score) in a software context
- The ethical considerations of using AI in healthcare settings — including transparency, data privacy, and scope of advice
- How to design for behaviour change using frameworks like the Fogg Behaviour Model and Behaviour Change Techniques (BCTs)

---

## Dissertation

This project was submitted as a dissertation for the MSc in Web & Mobile Development Technologies at Northumbria University.

**Title:** CardioTrack: Designing an AI-Powered Mobile Health Application to Support Cardiovascular Health Through Behaviour Change

**Result:** First Class (70%)

---

## Disclaimer

CardioTrack is a research and educational project. It is not a medical device and should not be used as a substitute for professional medical advice, diagnosis, or treatment. The Framingham Risk Score is used for educational purposes only.

---

## Author

**Maryam Sulayman**
MSc Data Science & Artificial Intelligence — University of Liverpool
[LinkedIn](https://www.linkedin.com/in/maryam-sulayman-4484601b3/) | [GitHub](https://github.com/maryam-sulayman)
