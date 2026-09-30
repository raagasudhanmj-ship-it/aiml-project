"""
ML Challenge 2026 - Business Entity Resolution
Prediction Module: Memory-streaming, ultra-high-throughput batched inference
generating candidate_pairs.tsv and matching_results.tsv with strict specification compliance.
"""

import os
import gc
from typing import Dict, List, Tuple
import numpy as np
from preprocessing import NormalizedRecord, preprocess_record
from blocking import BlockingIndex
from features import build_feature_matrix
from data_loader import stream_source_records


def predict_batch_s1(
    model,
    threshold: float,
    batch_s1: List[NormalizedRecord],
    idx_s2: BlockingIndex,
    idx_s3: BlockingIndex,
    test_s2: Dict[str, NormalizedRecord],
    test_s3: Dict[str, NormalizedRecord],
    f_match,
    f_cand,
    max_cands_per_source: int = 15,
    min_name_similarity: float = 0.35
) -> Tuple[int, int, int]:
    """
    Processes a single in-memory batch of S1 records:
    1. Retrieves S2 and S3 candidates using inverted index.
    2. Constructs candidate pairs and extracts vectorized similarity features.
    3. Scores pairs with the trained model and applies thresholding.
    4. Writes rows to f_cand and f_match.
    """
    total_cands = 0
    total_matches = 0
    singletons = 0

    batch_pairs = []
    pair_meta = []  # (s1_id, cid)
    s1_cand_lists = {}

    for rec1 in batch_s1:
        s1_id = rec1.entity_id
        cands_s2 = idx_s2.retrieve_candidates_for_s1(rec1, max_candidates=max_cands_per_source)
        cands_s3 = idx_s3.retrieve_candidates_for_s1(rec1, max_candidates=max_cands_per_source)

        # Deduplicate while preserving order
        seen = set()
        dedup = []
        for cid in cands_s2 + cands_s3:
            if cid not in seen:
                seen.add(cid)
                dedup.append(cid)

        s1_cand_lists[s1_id] = dedup
        total_cands += len(dedup)

        for cid in dedup:
            rec2 = test_s2.get(cid) if cid.startswith("S2-") else test_s3.get(cid)
            if rec2:
                batch_pairs.append((rec1, rec2))
                pair_meta.append((s1_id, cid))

    if not batch_pairs:
        # All S1 records in this batch had zero candidates
        for rec1 in batch_s1:
            s1_id = rec1.entity_id
            f_cand.write(f"{s1_id}\t\n")
            f_match.write(f"{s1_id}\t\n")
            singletons += 1
        return total_cands, total_matches, singletons

    # Vectorized feature extraction and model prediction
    X_batch = build_feature_matrix(batch_pairs)
    probs = model.predict_proba(X_batch)[:, 1]

    # Group matches by s1_id
    s1_matches = {rec.entity_id: [] for rec in batch_s1}
    for i, prob in enumerate(probs):
        if prob >= threshold:
            name_d3 = X_batch[i, 1]
            name_seq = X_batch[i, 0]
            if name_d3 >= min_name_similarity or name_seq >= 0.40:
                s1_id, cid = pair_meta[i]
                s1_matches[s1_id].append(cid)

    # Write candidates and matches simultaneously for each S1 entity
    for rec1 in batch_s1:
        s1_id = rec1.entity_id
        cands = s1_cand_lists.get(s1_id, [])
        f_cand.write(f"{s1_id}\t{','.join(cands)}\n")

        matched = s1_matches.get(s1_id, [])
        if matched:
            f_match.write(f"{s1_id}\t{','.join(matched)}\n")
            total_matches += len(matched)
        else:
            f_match.write(f"{s1_id}\t\n")
            singletons += 1

    return total_cands, total_matches, singletons


def stream_country_test_predictions(
    model,
    threshold: float,
    s1_filepath: str,
    country: str,
    test_s2: Dict[str, NormalizedRecord],
    test_s3: Dict[str, NormalizedRecord],
    idx_s2: BlockingIndex,
    idx_s3: BlockingIndex,
    f_match,
    f_cand,
    max_cands_per_source: int = 15,
    min_name_similarity: float = 0.35,
    batch_size: int = 5000
) -> Tuple[int, int, int, int]:
    """
    Streams test S1 entities directly from TSV for a specific country,
    processing in batches of `batch_size` to keep RAM usage strictly minimal.
    """
    total_processed = 0
    total_cands = 0
    total_matches = 0
    singletons = 0

    for raw_batch in stream_source_records(s1_filepath, country_filter=country, batch_size=batch_size):
        batch_s1 = [preprocess_record(eid, n, a, c) for eid, n, a, c in raw_batch]
        total_processed += len(batch_s1)

        b_cands, b_matches, b_singletons = predict_batch_s1(
            model=model,
            threshold=threshold,
            batch_s1=batch_s1,
            idx_s2=idx_s2,
            idx_s3=idx_s3,
            test_s2=test_s2,
            test_s3=test_s3,
            f_match=f_match,
            f_cand=f_cand,
            max_cands_per_source=max_cands_per_source,
            min_name_similarity=min_name_similarity
        )

        total_cands += b_cands
        total_matches += b_matches
        singletons += b_singletons

        if total_processed % 50000 == 0:
            f_match.flush()
            f_cand.flush()
            print(f"      ... processed {total_processed:,} S1 entities (Matches: {total_matches:,}, Singletons: {singletons:,})")

    f_match.flush()
    f_cand.flush()
    return total_processed, total_cands, total_matches, singletons
