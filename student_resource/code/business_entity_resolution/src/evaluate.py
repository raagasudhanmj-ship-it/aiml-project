"""
ML Challenge 2026 - Business Entity Resolution
Evaluation Module: Macro-averaged F_0.5 computation and threshold optimization.
Accurately implements singleton scoring and per-entity macro evaluation.
"""

from typing import Dict, List, Set, Tuple


def compute_entity_f05(pred_set: Set[str], true_set: Set[str]) -> Tuple[float, float, float]:
    """
    Computes (F_0.5, precision, recall) for a single Source 1 entity.
    
    Singletons:
      - If true is empty and pred is empty: F_0.5 = 1.0, precision = 1.0, recall = 1.0
      - If true is empty and pred is non-empty: F_0.5 = 0.0, precision = 0.0, recall = 1.0
      - If true is non-empty and pred is empty: F_0.5 = 0.0, precision = 1.0, recall = 0.0
    """
    if len(true_set) == 0:
        if len(pred_set) == 0:
            return 1.0, 1.0, 1.0  # Correctly predicted singleton
        else:
            return 0.0, 0.0, 1.0  # False merge on singleton

    if len(pred_set) == 0:
        return 0.0, 1.0, 0.0  # Missed all true matches

    tp = len(pred_set & true_set)
    if tp == 0:
        return 0.0, 0.0, 0.0

    precision = tp / len(pred_set)
    recall = tp / len(true_set)

    denom = 0.25 * precision + recall
    if denom == 0.0:
        f05 = 0.0
    else:
        f05 = (1.25 * precision * recall) / denom

    return f05, precision, recall


def evaluate_predictions(
    predictions: Dict[str, List[str]],
    ground_truth: Dict[str, List[str]]
) -> Dict[str, float]:
    """
    Evaluates predictions against ground truth using macro-averaged F_0.5 across all entities.
    
    Args:
        predictions: mapping s1_id -> list of predicted matched IDs
        ground_truth: mapping s1_id -> list of true matched IDs
    
    Returns:
        dictionary with macro_f05, macro_precision, macro_recall, singleton_accuracy, etc.
    """
    total_entities = len(ground_truth)
    if total_entities == 0:
        return {"macro_f05": 0.0, "macro_precision": 0.0, "macro_recall": 0.0, "singleton_accuracy": 0.0}

    f05_sum = 0.0
    prec_sum = 0.0
    rec_sum = 0.0
    singleton_total = 0
    singleton_correct = 0

    for s1_id, true_list in ground_truth.items():
        true_set = set(true_list)
        pred_set = set(predictions.get(s1_id, []))

        f05, prec, rec = compute_entity_f05(pred_set, true_set)
        f05_sum += f05
        prec_sum += prec
        rec_sum += rec

        if len(true_set) == 0:
            singleton_total += 1
            if len(pred_set) == 0:
                singleton_correct += 1

    macro_f05 = f05_sum / total_entities
    macro_prec = prec_sum / total_entities
    macro_rec = rec_sum / total_entities
    singleton_acc = (singleton_correct / singleton_total) if singleton_total > 0 else 1.0

    return {
        "macro_f05": macro_f05,
        "macro_precision": macro_prec,
        "macro_recall": macro_rec,
        "singleton_accuracy": singleton_acc,
        "total_entities": total_entities,
        "singletons_total": singleton_total,
        "singletons_correct": singleton_correct
    }


def optimize_threshold(
    candidate_scores: Dict[str, List[Tuple[str, float]]],
    ground_truth: Dict[str, List[str]],
    thresholds: List[float] = None
) -> Tuple[float, float, Dict[float, Dict[str, float]]]:
    """
    Sweeps prediction thresholds to identify the threshold that maximizes macro F_0.5 on validation.
    
    Args:
        candidate_scores: s1_id -> list of (cand_id, probability_score)
        ground_truth: s1_id -> list of true matched IDs
        thresholds: list of candidate thresholds to test
    
    Returns:
        (best_threshold, best_f05, history_dict)
    """
    if thresholds is None:
        thresholds = [round(t * 0.02, 2) for t in range(20, 48)]  # 0.40 to 0.94 in 0.02 steps

    best_thresh = 0.50
    best_f05 = -1.0
    history = {}

    for thresh in thresholds:
        preds = {}
        for s1_id in ground_truth.keys():
            scores = candidate_scores.get(s1_id, [])
            matched = [cid for cid, score in scores if score >= thresh]
            preds[s1_id] = matched

        metrics = evaluate_predictions(preds, ground_truth)
        history[thresh] = metrics
        if metrics["macro_f05"] > best_f05:
            best_f05 = metrics["macro_f05"]
            best_thresh = thresh

    return best_thresh, best_f05, history
