"""
Curated wellbeing resources for Grace (static catalog; extensible to DB later).
IDs match recommendation resource_slug values.
"""
from __future__ import annotations

CATALOG = [
    {
        "id": "mindfulness_relaxation",
        "category": "Calm & sleep",
        "title": "Mindfulness & relaxation",
        "summary": "Breathing, body scans, and wind-down routines that take 5–15 minutes.",
        "tags": ["stress", "sleep", "anxiety"],
        "links": [
            {"label": "NIH: Mindfulness for health", "url": "https://www.nccih.nih.gov/health/meditation-and-mindfulness-what-you-need-to-know"},
            {"label": "Headspace — guided basics", "url": "https://www.headspace.com/meditation/meditation-for-beginners"},
        ],
    },
    {
        "id": "mental_health_support",
        "category": "Mental health",
        "title": "Mental health & counselling",
        "summary": "When mood feels heavy for weeks, or you have thoughts of self-harm, professional support matters.",
        "tags": ["depression", "counselling", "crisis"],
        "links": [
            {"label": "iCall (TISS, India) — call 9152987821", "url": "https://icallhelpline.org/"},
            {
                "label": "Vandrevala Foundation (India) — call 18602662345",
                "url": "https://www.vandrevalafoundation.com/",
            },
            {"label": "988 Suicide & Crisis Lifeline (US only)", "url": "https://988lifeline.org/"},
            {"label": "WHO mental health", "url": "https://www.who.int/teams/mental-health-and-substance-use"},
        ],
    },
    {
        "id": "healthy_movement",
        "category": "Movement",
        "title": "Gentle movement & exercise",
        "summary": "Walking, chair exercises, and balance ideas suited to different ability levels.",
        "tags": ["exercise", "mobility", "energy"],
        "links": [
            {"label": "CDC — Physical Activity for Older Adults", "url": "https://www.cdc.gov/physicalactivity/basics/older_adults/index.htm"},
            {"label": "NHS — Sitting exercises", "url": "https://www.nhs.uk/live-well/exercise/sitting-exercises/"},
        ],
    },
    {
        "id": "social_connection",
        "category": "Connection",
        "title": "Staying socially connected",
        "summary": "Ideas to reduce loneliness: calls, groups, volunteering, and faith or hobby communities.",
        "tags": ["loneliness", "friends", "family"],
        "links": [
            {"label": "AARP — Connect2Affect", "url": "https://www.aarp.org/ppi/info-2017/isolation-loneliness-health.html"},
            {"label": "Mind — loneliness tips", "url": "https://www.mind.org.uk/information-support/tips-for-everyday-living/loneliness/about-loneliness/"},
        ],
    },
    {
        "id": "nutrition_wellbeing",
        "category": "Nutrition",
        "title": "Healthy eating for older adults",
        "summary": "Balanced plates, hydration, and talking to your clinician about appetite changes.",
        "tags": ["food", "hydration", "health"],
        "links": [
            {"label": "USDA — Nutrition for older adults", "url": "https://www.myplate.gov/life-stages/older-adults"},
            {"label": "WHO — Healthy diet", "url": "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"},
        ],
    },
    {
        "id": "learning_growth",
        "category": "Learning",
        "title": "Learning & healthy ageing",
        "summary": "Articles and courses on sleep, mood, cognition, and staying engaged.",
        "tags": ["education", "habits"],
        "links": [
            {"label": "National Institute on Aging", "url": "https://www.nia.nih.gov/health"},
            {"label": "HelpGuide — Senior emotional health", "url": "https://www.helpguide.org/articles/aging-issues/aging-well-tips-for-older-adults.htm"},
        ],
    },
    {
        "id": "community_fun",
        "category": "Community",
        "title": "Community inside Grace",
        "summary": "Share wins, ask questions, and cheer others on in the Community tab.",
        "tags": ["peers", "support"],
        "links": [{"label": "Open Grace Community", "url": "/elder/community"}],
    },
    {
        "id": "sleep_wellbeing",
        "category": "Calm & sleep",
        "title": "Sleep hygiene",
        "summary": "Regular wake time, dim screens at night, and a simple bedtime routine.",
        "tags": ["sleep", "insomnia"],
        "links": [
            {"label": "Sleep Foundation — Older adults", "url": "https://www.sleepfoundation.org/aging"},
        ],
    },
    {
        "id": "cognitive_health",
        "category": "Brain health",
        "title": "Memory & thinking",
        "summary": "When to talk to a doctor, staying mentally active, and reducing distractions.",
        "tags": ["memory", "focus"],
        "links": [
            {"label": "Alzheimer's Association", "url": "https://www.alz.org/help-support/resources"},
        ],
    },
    {
        "id": "health_routines",
        "category": "Daily care",
        "title": "Medicines & routines",
        "summary": "Pill organisers, alarms, and pharmacist reviews can make adherence easier.",
        "tags": ["medication", "habits"],
        "links": [
            {"label": "FDA — Medication safety", "url": "https://www.fda.gov/drugs/special-features/use-medicines-safely"},
        ],
    },
    {
        "id": "crisis_help",
        "category": "Urgent",
        "title": "Crisis & emergency",
        "summary": "If you or someone else is in immediate danger, call your local emergency number.",
        "tags": ["emergency", "crisis"],
        "links": [
            {"label": "iCall (India) — 9152987821", "url": "https://icallhelpline.org/"},
            {"label": "Vandrevala Foundation (India) — 18602662345", "url": "https://www.vandrevalafoundation.com/"},
            {"label": "988 Lifeline (US only)", "url": "https://988lifeline.org/"},
            {"label": "Find A Helpline (global)", "url": "https://findahelpline.com/"},
        ],
    },
]

CATEGORIES = sorted({item["category"] for item in CATALOG})
