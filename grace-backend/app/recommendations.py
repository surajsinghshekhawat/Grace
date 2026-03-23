"""
Actionable recommendations from questionnaire answers + model outputs.
Each item can link to Resources via resource_slug (matches API catalog id).
"""
from __future__ import annotations


def _num(a: dict, key: str) -> float | None:
    v = a.get(key)
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def build_recommendations(
    answers: dict,
    depression_probability: float,
    qol_0_100: float,
    max_items: int = 8,
) -> list[dict]:
    """Return list of {rec_id, name, effect, resource_slug, priority}."""
    a = answers or {}
    recs: list[dict] = []
    prob = float(depression_probability or 0)
    qol = float(qol_0_100 or 50)

    def add(rec_id: str, name: str, effect: str, slug: str, priority: int = 50):
        recs.append(
            {"rec_id": rec_id, "name": name, "effect": effect, "resource_slug": slug, "priority": priority}
        )

    # Risk-based
    if prob >= 0.45:
        add(
            "reach_out_today",
            "Reach out today",
            "When stress feels heavy, talking to someone you trust or a counsellor often helps. You’re not alone.",
            "mental_health_support",
            95,
        )
    if prob >= 0.35:
        add(
            "gentle_routine",
            "Gentle routine",
            "Short walks, daylight, and regular meals can steady mood. Small steps count.",
            "healthy_movement",
            80,
        )

    # QoL-based
    if qol < 45:
        add(
            "rebuild_enjoyable",
            "Rebuild enjoyable moments",
            "Pick one pleasant activity this week — music, calling a friend, or time outside.",
            "social_connection",
            75,
        )

    # Answer-driven
    sq = _num(a, "sleep_quality")
    if sq is not None and sq <= 2:
        add(
            "sleep_support",
            "Sleep support",
            "Your answers suggest sleep is rough. Try a wind-down routine and our sleep & relaxation resources.",
            "mindfulness_relaxation",
            88,
        )

    stress = _num(a, "stress_anxiety")
    if stress is not None and stress >= 4:
        add(
            "stress_skills",
            "Stress skills",
            "Breathing and grounding exercises can reduce tension in minutes.",
            "mindfulness_relaxation",
            85,
        )

    lonely = _num(a, "lonely_around_others")
    sat = _num(a, "social_satisfaction")
    if lonely is not None and lonely >= 4:
        add(
            "connection_boost",
            "Connection boost",
            "Loneliness is common. Community groups and regular contact can help — see social resources.",
            "social_connection",
            90,
        )
    if sat is not None and sat <= 2:
        add(
            "social_nourishment",
            "Social nourishment",
            "Try one low-pressure social touchpoint: a short call, neighbour hello, or community post.",
            "community_fun",
            82,
        )

    fi = _num(a, "family_interaction")
    fr = _num(a, "friends_interaction")
    if fi is not None and fi <= 2 and fr is not None and fr <= 2:
        add(
            "strengthen_support",
            "Strengthen support",
            "Reaching out to family or friends — even briefly — supports emotional health.",
            "social_connection",
            78,
        )

    move = _num(a, "exercise_frequency")
    if move is not None and move <= 2:
        add(
            "move_more",
            "Move a little more",
            "Gentle movement supports mood and energy. See safe exercise ideas for your level.",
            "healthy_movement",
            70,
        )

    if qol >= 60 and prob < 0.35:
        add(
            "keep_working",
            "Keep what’s working",
            "Your patterns look fairly steady. Maintain sleep, movement, and people you enjoy.",
            "learning_growth",
            40,
        )
        add(
            "share_encouragement",
            "Share encouragement",
            "Others in Community may appreciate hearing what helps you — consider a short post.",
            "community_fun",
            35,
        )

    # Nutrition / health seeking
    hu = _num(a, "health_checkups")
    if hu is not None and hu <= 2:
        add(
            "stay_on_health",
            "Stay on top of health",
            "Regular check-ups help catch issues early. See health-seeking tips in Resources.",
            "nutrition_wellbeing",
            65,
        )

    med_adherence = _num(a, "medication")
    if med_adherence is not None and med_adherence <= 2:
        add(
            "medication_habits",
            "Medication habits",
            "If taking medicines is hard, talk to your doctor or pharmacist about simpler schedules.",
            "health_routines",
            72,
        )

    respect = _num(a, "respect")
    if respect is not None and respect <= 2:
        add(
            "feeling_valued",
            "Feeling valued",
            "When respect feels low, trusted friends, faith groups, or counsellors can help you process it.",
            "mental_health_support",
            76,
        )

    comm_act = _num(a, "community_activities")
    if comm_act is not None and comm_act <= 2:
        add(
            "local_activities",
            "Local activities",
            "Try a small group activity — library events, walking club, or faith community.",
            "social_connection",
            74,
        )

    mem = _num(a, "memory")
    if mem is not None and mem >= 4:
        add(
            "brain_health",
            "Brain health",
            "If memory worries you, note examples for your clinician and explore cognitive wellness tips.",
            "cognitive_health",
            79,
        )

    conc = _num(a, "concentration")
    if conc is not None and conc >= 4:
        add(
            "focus_rest",
            "Focus and rest",
            "Poor concentration often improves with sleep, hydration, and shorter task blocks — see guides in Resources.",
            "cognitive_health",
            68,
        )

    joy = _num(a, "joy")
    if joy is not None and joy <= 2:
        add(
            "small_joys",
            "Bring back small joys",
            "Plan one lighthearted moment: music, a favourite show, or a short outing.",
            "learning_growth",
            73,
        )

    ctrl = _num(a, "control")
    if ctrl is not None and ctrl <= 2:
        add(
            "regain_control",
            "Regain a sense of control",
            "Pick one tiny decision you fully own today — meal time, a walk route, or who to call.",
            "mindfulness_relaxation",
            70,
        )

    if prob < 0.25 and qol >= 55:
        add(
            "joy_list",
            "Joy list",
            "Write three small things that went well this week — it reinforces positive patterns.",
            "mindfulness_relaxation",
            28,
        )

    # Dedupe by rec_id, sort by priority
    seen: set[str] = set()
    out: list[dict] = []
    for r in sorted(recs, key=lambda x: -x["priority"]):
        rid = r["rec_id"]
        if rid in seen:
            continue
        seen.add(rid)
        out.append(
            {"rec_id": rid, "name": r["name"], "effect": r["effect"], "resource_slug": r["resource_slug"]}
        )
        if len(out) >= max_items:
            break

    if not out:
        add(
            "explore_wellbeing",
            "Explore wellbeing topics",
            "Browse resources for movement, calm, social connection, and learning.",
            "learning_growth",
            30,
        )
        out = [
            {"rec_id": r["rec_id"], "name": r["name"], "effect": r["effect"], "resource_slug": r["resource_slug"]}
            for r in recs[:3]
        ]

    return out


def wellness_index_0_100(
    depression_probability: float,
    qol_0_100: float,
    daily_avg_1_5: float | None,
) -> float:
    """
    Single composite 0–100: higher = better overall wellbeing.
    mental: (1-p)*100, qol: qol_0_100, daily: (avg-1)/4*100
    """
    mental = (1 - float(depression_probability or 0)) * 100
    qol = float(qol_0_100 or 50)
    if daily_avg_1_5 is not None:
        daily = max(0, min(100, (float(daily_avg_1_5) - 1) / 4 * 100))
        return round(0.38 * mental + 0.37 * qol + 0.25 * daily, 1)
    return round(0.55 * mental + 0.45 * qol, 1)
