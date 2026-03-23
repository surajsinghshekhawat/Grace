"""
Build (1) column_question_key.csv: maps every merged column to the actual question from codebooks.
(2) merged_with_question_headers.csv: same data as merged.csv but with headers = question text.
Uses docs/data/DATA_DOCUMENTS_REFERENCE.md codebook.
Run from project root: python eldersense/build_readable_merged.py
"""
import os
import pandas as pd

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MERGED_PATH = os.path.join(PROJECT_ROOT, "eldersense", "data", "merged.csv")
OUT_DIR = os.path.join(PROJECT_ROOT, "eldersense", "data")

# ---- Demographics (Sheet1): demo_4 .. demo_24 = 21 columns ----
DEMO_QUESTIONS = [
    "Age (60-65, 66-70, 71-75, 76-80, 81+)",
    "Sex (Male, Female, Transgender)",
    "Religion (Hindu, Christian, Muslim, Others)",
    "Educational status (Illiterate to Profession)",
    "Type of family (Nuclear, Joint, Extended)",
    "Monthly income (bands)",
    "Marital status (Married, Divorced/Separated, Single, Widower)",
    "Having children (Yes/No)",
    "Sex of children (Male, Female, Both)",
    "Number of children (Male; Female)",
    "Financial status (Independent, Dependent)",
    "Previous occupation",
    "Current employment",
    "Satisfaction at workplace if employed (Not/Moderately/Highly satisfied)",
    "Serious life events past 1 year (Death, Financial, Separated, Other)",
    "History of abuse (Verbal, Physical: Yes/No)",
    "Perceived dignity and self-respect (Treated with dignity: Yes/No)",
    "Part of old-age association (Yes/No)",
    "Part of social welfare association (Yes/No)",
    "Type of social activity (Specify open text)",
    "Perceived social support (MSPSS assessed in Sheet3)",
]

# ---- CGA (Sheet2): 32 columns - order matches merged CSV ----
CGA_QUESTIONS = [
    "CGA 1.1 Physical problems section",
    "CGA 1.1 Visual impairment (Present/Not present)",
    "CGA 1.2 Hearing impairment (Present/Not present)",
    "CGA 1.3 Chronic pain (Present/Not present)",
    "CGA 1.4 Obesity (Present/Not present)",
    "CGA 1.5 Sleep disturbances (Present/Not present)",
    "CGA 1.6 Chronic disease (Present/Not present)",
    "CGA 1.7 Gait changes (Present/Not present)",
    "CGA Physical sub-item or blank",
    "CGA 2. Psychological problems section",
    "CGA 2.1 Loneliness (Present/Not present)",
    "CGA 2.2 Boredom (Present/Not present)",
    "CGA 2.3 Irritation (Present/Not present)",
    "CGA 2.4 Apathy (Present/Not present)",
    "CGA 2.5 Lack of self-confidence (Present/Not present)",
    "CGA 2.6 Sense of worthlessness (Present/Not present)",
    "CGA 2.7 Increased frustration (Present/Not present)",
    "CGA 2.8 Self-doubts (Present/Not present)",
    "CGA Psychological sub-item or blank",
    "CGA 3. Cognitive impairment section",
    "CGA 3.1 Memory loss (Present/Not present)",
    "CGA 3.2 Delayed verbal response (Present/Not present)",
    "CGA Cognitive sub-item or blank",
    "CGA 4. Social issues section",
    "CGA 4.1 Support from family (Present/Not present)",
    "CGA 4.2 Loss of status perception (Present/Not present)",
    "CGA 4.3 Acceptance and respect by society (Present/Not present)",
    "CGA 4.4 New friendships (Present/Not present)",
    "CGA Social sub-item or blank",
    "CGA Social sub-item or blank",
    "CGA 5. Economical problems section",
    "CGA 5.1 Reduction in income (Present/Not present)",
    "CGA 5.2 Financial support from family (Present/Not present)",
    "CGA 5.3 Ability to meet financial needs (Present/Not present)",
]

# ---- MSPSS (Sheet3): 12 items ----
MSPSS_QUESTIONS = [
    "MSPSS 1: There is a special person who is around when I am in need",
    "MSPSS 2: There is a special person with whom I can share joys and sorrows",
    "MSPSS 3: My family really tries to help me",
    "MSPSS 4: I get the emotional help and support I need from my family",
    "MSPSS 5: I have a special person who is a real source of comfort to me",
    "MSPSS 6: My friends really try to help me",
    "MSPSS 7: I can count on my friends when things go wrong",
    "MSPSS 8: I can talk about my problems with my family",
    "MSPSS 9: I have friends with whom I can share my joys and sorrows",
    "MSPSS 10: There is a special person in my life who cares about my feelings",
    "MSPSS 11: My family is willing to help me make decisions",
    "MSPSS 12: I can get help from my friends when I need it",
]

# ---- GDS-15 (Sheet4): 15 items (Yes/No) ----
GDS_QUESTIONS = [
    "GDS-15 1: Are you basically satisfied with your life? (No = depression)",
    "GDS-15 2: Have you dropped many of your activities and interests? (Yes = depression)",
    "GDS-15 3: Do you feel that your life is empty? (Yes = depression)",
    "GDS-15 4: Do you often get bored? (Yes = depression)",
    "GDS-15 5: Are you in good spirits most of the time? (No = depression)",
    "GDS-15 6: Are you afraid that something bad is going to happen to you? (Yes = depression)",
    "GDS-15 7: Do you feel happy most of the time? (No = depression)",
    "GDS-15 8: Do you often feel helpless? (Yes = depression)",
    "GDS-15 9: Do you prefer to stay at home rather than going out? (Yes = depression)",
    "GDS-15 10: Do you feel you have more problems with memory than most? (Yes = depression)",
    "GDS-15 11: Do you think it is wonderful to be alive now? (No = depression)",
    "GDS-15 12: Do you feel pretty worthless the way you are now? (Yes = depression)",
    "GDS-15 13: Do you feel full of energy? (No = depression)",
    "GDS-15 14: Do you feel that your situation is hopeless? (Yes = depression)",
    "GDS-15 15: Do you think that most people are better off than you? (Yes = depression)",
]

# ---- HSB (Sheet5): 42 columns ----
# Part A: 1=concept, 2=measures maintain, 3=measures prevent, 4=measures mental health; then perception; Part B 1-7; Part C 1-11
HSB_QUESTIONS = [
    "HSB Part A 1: Describe your idea or concept about good health (open text)",
    "HSB Part A 2: Measures taken to maintain good health (e.g. Diet, Exercise, Sleep, Yoga)",
    "HSB Part A 3: Measures taken to prevent illness",
    "HSB Part A 4: Measures taken to maintain good mental health",
    "HSB Part A Unnamed 4 (e.g. multi-select or coding)",
    "HSB Part A Unnamed 5",
    "HSB Part A Unnamed 6",
    "HSB Part A: Perception about own health currently (POOR/AVERAGE/BETTER/GOOD)",
    "HSB Part A: Perception about own health for last 1 year (POOR/AVERAGE/BETTER/GOOD)",
    "HSB Part A Unnamed 9",
    "HSB Part A Unnamed 10",
    "HSB Part A Unnamed 11",
    "HSB Part A Unnamed 12",
    "HSB Part A Unnamed 13",
    "HSB Part A Unnamed 14",
    "HSB Part A Unnamed 15",
    "HSB Part A Unnamed 16",
    "HSB Part A Unnamed 17",
    "HSB Part A Unnamed 18",
    "HSB Part A Unnamed 19",
    "HSB Part B 1: When you feel sick what immediate measures do you take? (Seek advice, Religious, Home remedies, Self-medication, Nothing)",
    "HSB Part B 2: What type of medical facility do you choose when sick? (Private, Govt, Alternative, etc.)",
    "HSB Part B 3: If alternative medicine which practitioner? (Siddha, Unani, Ayurveda, Homeopathy)",
    "HSB Part B 4: Reason for seeking medical advice or treatment (Relief, Maintain health, Compulsion, Others)",
    "HSB Part B 5: Reason for not taking treatment (Not interested, Body heals, Fear, No caregiver)",
    "HSB Part B 6: When sick how long before you go to a medical facility? (Within 1-2-3 days, More than a week)",
    "HSB Part B 7: Reason for choosing the specific health facility (Easy access, Emergency, Low cost, Free, Good treatment)",
    "HSB Part B Unnamed 27",
    "HSB Part B Unnamed 28",
    "HSB Part B Unnamed 29",
    "HSB Part B Unnamed 30",
    "HSB Part C 1: When I feel sick I immediately seek medical advice (1-5 Likert)",
    "HSB Part C 2: I seek medical advice when signs and symptoms become severe (1-5)",
    "HSB Part C 3: When I am sick I follow diet restrictions as per medical advice (1-5)",
    "HSB Part C 4: When I feel sick I follow medications as per medical advice (1-5)",
    "HSB Part C 5: I take diet as per my preference even during illness (1-5)",
    "HSB Part C 6: I follow sleep and rest pattern as per medical advice (1-5)",
    "HSB Part C 7: I follow the exercises as per medical advice (1-5)",
    "HSB Part C 8: I go for regular follow-up as per medical advice (1-5)",
    "HSB Part C 9: I clarify my doubts regarding my health from the health facility (1-5)",
    "HSB Part C 10: I seek medical advice for maintaining good health and preventing illness (1-5)",
    "HSB Part C 11: I follow the medical advice given to maintain good health and prevent illness (1-5)",
]

# ---- WHOQOL-BREF (Sheet6): 26 items ----
WHOQOL_QUESTIONS = [
    "WHOQOL 1: How would you rate your quality of life?",
    "WHOQOL 2: How satisfied are you with your health?",
    "WHOQOL 3: To what extent do you feel life physically painful? (reverse-scored)",
    "WHOQOL 4: How much do you need any medical treatment to function? (reverse-scored)",
    "WHOQOL 5: How much do you enjoy life?",
    "WHOQOL 6: To what extent do you feel your life to be meaningful?",
    "WHOQOL 7: How well are you able to concentrate?",
    "WHOQOL 8: How safe do you feel in your daily life?",
    "WHOQOL 9: How healthy is your physical environment?",
    "WHOQOL 10: Do you have enough energy for everyday life?",
    "WHOQOL 11: Are you able to accept your bodily appearance?",
    "WHOQOL 12: Have you enough money to meet your needs?",
    "WHOQOL 13: How accessible is information you need in your day-to-day life?",
    "WHOQOL 14: To what extent do you have opportunity for leisure?",
    "WHOQOL 15: How well are you able to get around?",
    "WHOQOL 16: How satisfied are you with your sleep?",
    "WHOQOL 17: How satisfied are you with your ability to perform daily living activities?",
    "WHOQOL 18: How satisfied are you with your capacity for work?",
    "WHOQOL 19: How satisfied are you with yourself?",
    "WHOQOL 20: How satisfied are you with your personal relationships?",
    "WHOQOL 21: How satisfied are you with your sex life?",
    "WHOQOL 22: How satisfied are you with the support you get from your friends?",
    "WHOQOL 23: How satisfied are you with the conditions of your living place?",
    "WHOQOL 24: How satisfied are you with your access to health services?",
    "WHOQOL 25: How satisfied are you with your transport?",
    "WHOQOL 26: How often do you have negative feelings? (reverse-scored)",
]


def build_column_to_question():
    """Return dict: merged column name -> full question text (for key CSV and headers)."""
    mapping = {}
    for i, q in enumerate(DEMO_QUESTIONS):
        mapping[f"demo_{4 + i}"] = q
    # CGA: use exact column order from merged CSV (32 columns)
    cga_col_order = (
        ["cga_1.1.PHYSICALPROBLEMS"] + [f"cga_Unnamed: {i}" for i in range(1, 9)]
        + ["cga_2.PSYCHOLOGICAL PROBLEMS:"] + [f"cga_Unnamed: {i}" for i in range(10, 19)]
        + ["cga_3.COGNITIVE IMPAIRMENT"] + [f"cga_Unnamed: {i}" for i in [20, 21, 22]]
        + ["cga_4.SOCIAL ISSUES:"] + [f"cga_Unnamed: {i}" for i in range(24, 29)]
        + ["cga_5.ECONOMICAL PROBLEMS:"] + [f"cga_Unnamed: {i}" for i in [30, 31]]
    )
    for i, col in enumerate(cga_col_order):
        mapping[col] = CGA_QUESTIONS[i] if i < len(CGA_QUESTIONS) else "CGA (see codebook)"
    for i, q in enumerate(MSPSS_QUESTIONS):
        mapping[f"mspss_{i + 1}"] = q
    for i, q in enumerate(GDS_QUESTIONS):
        mapping[f"gds_{i + 1}"] = q
    # HSB: hsb_1,2,3,4, Unnamed 4,5,6, hsb_1.1, 2.1, Unnamed 9..19, hsb_1.2, 2.2, 3.1, 4.1, hsb_5,6,7, Unnamed 27..30, hsb_1.3, 2.3, 3.2, 4.2, 5.1, 6.1, 7.1, hsb_8..11
    hsb_cols = (
        ["hsb_1", "hsb_2", "hsb_3", "hsb_4"]
        + [f"hsb_Unnamed: {j}" for j in [4, 5, 6]]
        + ["hsb_1.1", "hsb_2.1"]
        + [f"hsb_Unnamed: {j}" for j in range(9, 20)]
        + ["hsb_1.2", "hsb_2.2", "hsb_3.1", "hsb_4.1"]
        + ["hsb_5", "hsb_6", "hsb_7"]
        + [f"hsb_Unnamed: {j}" for j in [27, 28, 29, 30]]
        + ["hsb_1.3", "hsb_2.3", "hsb_3.2", "hsb_4.2", "hsb_5.1", "hsb_6.1", "hsb_7.1"]
        + ["hsb_8", "hsb_9", "hsb_10", "hsb_11"]
    )
    for i, col in enumerate(hsb_cols):
        mapping[col] = HSB_QUESTIONS[i] if i < len(HSB_QUESTIONS) else "HSB (see codebook)"
    for i, q in enumerate(WHOQOL_QUESTIONS):
        mapping[f"whoqol_{i + 1}"] = q
    return mapping


def get_sheet(col):
    if col.startswith("demo_"): return "Demographics"
    if col.startswith("cga_"): return "CGA"
    if col.startswith("mspss_"): return "MSPSS"
    if col.startswith("gds_"): return "GDS-15"
    if col.startswith("hsb_"): return "HSB"
    if col.startswith("whoqol_"): return "WHOQOL-BREF"
    return ""


def main():
    df = pd.read_csv(MERGED_PATH)
    cols = list(df.columns)
    mapping = build_column_to_question()

    # (1) column_question_key.csv
    key_rows = []
    for c in cols:
        key_rows.append({
            "column_name": c,
            "sheet": get_sheet(c),
            "question_or_description": mapping.get(c, "(no codebook match)"),
        })
    key_df = pd.DataFrame(key_rows)
    key_path = os.path.join(OUT_DIR, "column_question_key.csv")
    key_df.to_csv(key_path, index=False)
    print(f"Saved: {key_path}")

    # (2) merged_with_question_headers.csv — same data, headers = question text
    header_map = {c: mapping.get(c, c) for c in cols}
    df_readable = df.rename(columns=header_map)
    out_path = os.path.join(OUT_DIR, "merged_with_question_headers.csv")
    df_readable.to_csv(out_path, index=False, quoting=1)  # QUOTE_MINIMAL
    print(f"Saved: {out_path}")
    print(f"Rows: {len(df_readable)}, Columns: {len(df_readable.columns)}")


if __name__ == "__main__":
    main()
