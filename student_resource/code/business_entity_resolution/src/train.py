"""
ML Challenge 2026 - Business Entity Resolution
Training Module: Group-split validation, controlled candidate negative sampling,
HistGradientBoostingClassifier training, and F_0.5 validation optimization.
"""

import os
import random
import joblib
import numpy as np
from typing import Dict, List, Tuple
from sklearn.ensemble import HistGradientBoostingClassifier

from preprocessing import NormalizedRecord
from blocking import generate_candidate_pairs
from features import build_feature_matrix, FEATURE_NAMES
from evaluate import optimize_threshold, evaluate_predictions


def prepare_labeled_pairs(
    candidate_map: Dict[str, List[str]],
    ground_truth: Dict[str, List[str]],
    s1_records: Dict[str, NormalizedRecord],
    target_records: Dict[str, NormalizedRecord],
    neg_pos_ratio: float = 3.0,
    random_seed: int = 42
) -> Tuple[np.ndarray, np.ndarray, int, int]:
    """
    Labels candidate pairs using ground truth and performs controlled negative sampling.
    
    Returns:
        X: feature matrix (N, num_features)
        y: label array (N,)
        pos_count: number of positive pairs
        neg_count: number of sampled negative pairs
    """
    random.seed(random_seed)
    pos_pairs = []
    neg_pairs = []

    for s1_id, cand_ids in candidate_map.items():
        true_matches = set(ground_truth.get(s1_id, []))
        rec1 = s1_records[s1_id]

        for cid in cand_ids:
            rec2 = target_records.get(cid)
            if not rec2:
                continue
            if cid in true_matches:
                pos_pairs.append((rec1, rec2))
            else:
                neg_pairs.append((rec1, rec2))

    pos_count = len(pos_pairs)
    max_negs = int(pos_count * neg_pos_ratio) if pos_count > 0 else len(neg_pairs)

    if len(neg_pairs) > max_negs:
        sampled_neg_pairs = random.sample(neg_pairs, max_negs)
    else:
        sampled_neg_pairs = neg_pairs

    neg_count = len(sampled_neg_pairs)
    all_pairs = pos_pairs + sampled_neg_pairs
    y = np.array([1.0] * pos_count + [0.0] * neg_count, dtype=np.float32)

    X = build_feature_matrix(all_pairs)
    return X, y, pos_count, neg_count


def train_matching_model(
    s1_train_records: Dict[str, NormalizedRecord],
    s2_records: Dict[str, NormalizedRecord],
    s3_records: Dict[str, NormalizedRecord],
    ground_truth: Dict[str, List[str]],
    val_fraction: float = 0.20,
    neg_pos_ratio: float = 3.0,
    random_seed: int = 42,
    model_save_path: str = None
):
    """
    Executes the training and validation workflow:
    1. Splits Source 1 entities into train and validation sets (leak-free group split).
    2. Runs blocking to produce candidate pairs.
    3. Labels pairs and samples negatives.
    4. Trains a HistGradientBoostingClassifier.
    5. Optimizes decision threshold on validation set for macro F_0.5.
    
    Returns:
        model: trained HistGradientBoostingClassifier
        best_threshold: optimal decision threshold
        val_metrics: dictionary of evaluation metrics at best threshold
        training_stats: dictionary of pair counts and ratios
    """
    # 1. Group split by Source 1 entity ID
    all_s1_ids = list(s1_train_records.keys())
    random.seed(random_seed)
    random.shuffle(all_s1_ids)

    n_val = max(1, int(len(all_s1_ids) * val_fraction))
    val_s1_ids = set(all_s1_ids[:n_val])
    train_s1_ids = set(all_s1_ids[n_val:])

    train_s1 = {sid: s1_train_records[sid] for sid in train_s1_ids}
    val_s1 = {sid: s1_train_records[sid] for sid in val_s1_ids}
    val_gt = {sid: ground_truth.get(sid, []) for sid in val_s1_ids}

    target_records = {**s2_records, **s3_records}

    # 2. Candidate generation for training set
    train_cands, total_before, total_after = generate_candidate_pairs(
        train_s1, s2_records, s3_records, max_cands_per_source=15
    )

    # 3. Labeling and controlled negative sampling
    X_train, y_train, pos_cnt, neg_cnt = prepare_labeled_pairs(
        train_cands, ground_truth, train_s1, target_records, neg_pos_ratio, random_seed
    )

    ratio_str = f"1:{neg_cnt/pos_cnt:.2f}" if pos_cnt > 0 else "N/A"
    training_stats = {
        "candidate_pairs_before_dedup": total_before,
        "candidate_pairs_after_dedup": total_after,
        "positive_pairs": pos_cnt,
        "negative_pairs": neg_cnt,
        "pos_neg_ratio": ratio_str,
        "train_s1_entities": len(train_s1),
        "val_s1_entities": len(val_s1)
    }

    # 4. Model Training
    clf = HistGradientBoostingClassifier(
        max_iter=100,
        min_samples_leaf=25,
        max_leaf_nodes=31,
        learning_rate=0.1,
        random_state=random_seed
    )
    clf.fit(X_train, y_train)

    # 5. Validation candidate generation and scoring
    val_cands, _, _ = generate_candidate_pairs(
        val_s1, s2_records, s3_records, max_cands_per_source=15
    )

    # Score validation candidate pairs
    cand_scores_by_s1 = {}
    for s1_id, c_list in val_cands.items():
        if not c_list:
            cand_scores_by_s1[s1_id] = []
            continue
        rec1 = val_s1[s1_id]
        val_pairs = [(rec1, target_records[cid]) for cid in c_list if cid in target_records]
        if not val_pairs:
            cand_scores_by_s1[s1_id] = []
            continue
        X_val = build_feature_matrix(val_pairs)
        probs = clf.predict_proba(X_val)[:, 1]
        cand_scores_by_s1[s1_id] = [(c_list[i], float(probs[i])) for i in range(len(probs))]

    # 6. Optimize F_0.5 Threshold on validation set
    best_thresh, best_f05, history = optimize_threshold(cand_scores_by_s1, val_gt)
    val_metrics = history[best_thresh]

    if model_save_path:
        os.makedirs(os.path.dirname(os.path.abspath(model_save_path)), exist_ok=True)
        joblib.dump({
            "model": clf,
            "threshold": best_thresh,
            "val_metrics": val_metrics,
            "feature_names": FEATURE_NAMES
        }, model_save_path)

    return clf, best_thresh, val_metrics, training_stats
