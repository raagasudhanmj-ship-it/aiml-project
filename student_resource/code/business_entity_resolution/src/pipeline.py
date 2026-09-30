"""
ML Challenge 2026 - Business Entity Resolution
Pipeline Orchestration Module: End-to-end execution of data loading, preprocessing,
blocking, training, validation optimization, country-partitioned test inference, and official validation.
"""

import os
import gc
import sys
import time
import argparse
import subprocess

# Bypass expensive CPU detection in joblib on Windows
os.environ["LOKY_MAX_CPU_COUNT"] = "4"
import joblib
try:
    joblib.cpu_count = lambda *args, **kwargs: 4
except Exception:
    pass

# Ensure UTF-8 output
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from data_loader import (
    load_source_records,
    load_ground_truth,
    load_target_records_with_required_ids,
    get_distinct_countries,
    stream_source_records
)
from blocking import BlockingIndex
from preprocessing import preprocess_record
from train import train_matching_model
from predict import stream_country_test_predictions, predict_batch_s1


def run_pipeline(
    data_dir: str,
    output_dir: str,
    train_sample_size: int = 25000,
    test_sample_size: int = None,
    val_fraction: float = 0.20,
    model_save_path: str = None,
    validate_script_path: str = None
):
    """
    Executes the complete entity resolution pipeline.
    """
    total_start_time = time.time()
    print("=" * 75)
    print("      ML Challenge 2026 - Business Entity Resolution Pipeline Execution    ")
    print("=" * 75)

    train_dir = os.path.join(data_dir, "train")
    test_dir = os.path.join(data_dir, "test")

    # ---------------------------------------------------------
    # 1. LOAD & PREPROCESS TRAINING DATA
    # ---------------------------------------------------------
    t0 = time.time()
    print(f"\n[1/5] Loading and Preprocessing Training Data (S1 sample={train_sample_size:,})...")

    # Load raw S1 records
    raw_train_s1 = load_source_records(
        os.path.join(train_dir, "train_source1.tsv"), max_rows=train_sample_size
    )
    s1_ids_set = set(raw_train_s1.keys())

    # Preprocess S1
    prep_train_s1 = {
        eid: preprocess_record(eid, name, addr, country)
        for eid, (name, addr, country) in raw_train_s1.items()
    }

    # Load Ground Truth for selected S1 entities
    train_gt = load_ground_truth(
        os.path.join(train_dir, "train_ground_truth.tsv"), s1_id_filter=s1_ids_set
    )

    # Collect all true matched IDs for these S1 entities
    needed_s2_ids = set()
    needed_s3_ids = set()
    for m_list in train_gt.values():
        for m in m_list:
            if m.startswith("S2-"):
                needed_s2_ids.add(m)
            elif m.startswith("S3-"):
                needed_s3_ids.add(m)

    # Load S2 and S3 ensuring all true matches are included plus distractor rows
    raw_train_s2 = load_target_records_with_required_ids(
        os.path.join(train_dir, "train_source2.tsv"),
        required_ids=needed_s2_ids,
        max_additional_rows=train_sample_size * 4
    )
    raw_train_s3 = load_target_records_with_required_ids(
        os.path.join(train_dir, "train_source3.tsv"),
        required_ids=needed_s3_ids,
        max_additional_rows=train_sample_size * 4
    )

    prep_train_s2 = {
        eid: preprocess_record(eid, name, addr, country)
        for eid, (name, addr, country) in raw_train_s2.items()
    }
    prep_train_s3 = {
        eid: preprocess_record(eid, name, addr, country)
        for eid, (name, addr, country) in raw_train_s3.items()
    }

    prep_time = time.time() - t0
    print(f"  Preprocessed {len(prep_train_s1):,} S1, {len(prep_train_s2):,} S2 ({len(needed_s2_ids):,} GT targets), {len(prep_train_s3):,} S3 ({len(needed_s3_ids):,} GT targets) in {prep_time:.2f}s")

    # ---------------------------------------------------------
    # 2. MODEL TRAINING & F_0.5 OPTIMIZATION
    # ---------------------------------------------------------
    t1 = time.time()
    print(f"\n[2/5] Blocking, Pair Feature Extraction, Model Training & Validation...")
    model, best_threshold, val_metrics, train_stats = train_matching_model(
        s1_train_records=prep_train_s1,
        s2_records=prep_train_s2,
        s3_records=prep_train_s3,
        ground_truth=train_gt,
        val_fraction=val_fraction,
        neg_pos_ratio=3.0,
        model_save_path=model_save_path
    )
    training_time = time.time() - t1
    print(f"  Training & Validation completed in {training_time:.2f}s")
    print(f"  Candidate pairs before dedup: {train_stats['candidate_pairs_before_dedup']:,}")
    print(f"  Candidate pairs after dedup : {train_stats['candidate_pairs_after_dedup']:,}")
    print(f"  Training positives : {train_stats['positive_pairs']:,}")
    print(f"  Training negatives : {train_stats['negative_pairs']:,} (Ratio: {train_stats['pos_neg_ratio']})")
    print(f"  Validation Entities: {val_metrics['total_entities']:,} (Singletons: {val_metrics['singletons_total']:,})")
    print(f"  Optimized Threshold: {best_threshold:.2f}")
    print(f"  Validation Macro F_0.5 : {val_metrics['macro_f05']:.4f}")
    print(f"  Validation Precision   : {val_metrics['macro_precision']:.4f}")
    print(f"  Validation Recall      : {val_metrics['macro_recall']:.4f}")
    print(f"  Singleton Accuracy     : {val_metrics['singleton_accuracy']*100:.2f}%")

    # Release training memory
    del raw_train_s1, raw_train_s2, raw_train_s3
    del prep_train_s1, prep_train_s2, prep_train_s3, train_gt
    gc.collect()

    # ---------------------------------------------------------
    # 3. TEST INFERENCE (COUNTRY-PARTITIONED OR SAMPLE)
    # ---------------------------------------------------------
    t2 = time.time()
    matching_tsv = os.path.join(output_dir, "matching_results.tsv")
    candidate_tsv = os.path.join(output_dir, "candidate_pairs.tsv")
    os.makedirs(output_dir, exist_ok=True)

    total_cands = 0
    total_matches = 0
    singletons = 0
    total_test_s1_processed = 0

    if test_sample_size is not None:
        # Sample mode for rapid validation
        print(f"\n[3/5] Test Inference in Sample Mode (limit={test_sample_size:,})...")
        raw_test_s1 = load_source_records(os.path.join(test_dir, "test_source1.tsv"), max_rows=test_sample_size)
        prep_test_s1 = [preprocess_record(eid, n, a, c) for eid, (n, a, c) in raw_test_s1.items()]
        raw_test_s2 = load_source_records(os.path.join(test_dir, "test_source2.tsv"), max_rows=test_sample_size * 5)
        raw_test_s3 = load_source_records(os.path.join(test_dir, "test_source3.tsv"), max_rows=test_sample_size * 5)
        prep_test_s2 = {eid: preprocess_record(eid, n, a, c) for eid, (n, a, c) in raw_test_s2.items()}
        prep_test_s3 = {eid: preprocess_record(eid, n, a, c) for eid, (n, a, c) in raw_test_s3.items()}
        idx_s2 = BlockingIndex(max_postings_per_key=100)
        idx_s2.build_index(prep_test_s2)
        idx_s3 = BlockingIndex(max_postings_per_key=100)
        idx_s3.build_index(prep_test_s3)

        with open(matching_tsv, "w", encoding="utf-8", newline="\n") as f_m, \
             open(candidate_tsv, "w", encoding="utf-8", newline="\n") as f_c:
            f_m.write("source1_entity_id\tmatched_entity_ids\n")
            f_c.write("source1_entity_id\tcandidate_entity_ids\n")
            total_cands, total_matches, singletons = predict_batch_s1(
                model=model,
                threshold=best_threshold,
                batch_s1=prep_test_s1,
                idx_s2=idx_s2,
                idx_s3=idx_s3,
                test_s2=prep_test_s2,
                test_s3=prep_test_s3,
                f_match=f_m,
                f_cand=f_c,
                max_cands_per_source=15,
                min_name_similarity=0.35
            )
        total_test_s1_processed = len(prep_test_s1)
    else:
        # Full mode: Partitioned by open-set country with streaming S1 to maintain strict memory efficiency (< 1.5 GB RAM)
        print("\n[3/5] Test Inference in Full Partitioned Mode (Open-set Countries)...")
        countries = get_distinct_countries(os.path.join(test_dir, "test_source1.tsv"))
        print(f"  Detected distinct test countries: {countries}")

        # Initialize output files with headers
        with open(matching_tsv, "w", encoding="utf-8", newline="\n") as f_m, \
             open(candidate_tsv, "w", encoding="utf-8", newline="\n") as f_c:
            f_m.write("source1_entity_id\tmatched_entity_ids\n")
            f_c.write("source1_entity_id\tcandidate_entity_ids\n")

            for country in countries:
                tc0 = time.time()
                print(f"\n  --> Processing Country: {country}...")
                
                # Load & index S2 for this country
                t_load2 = time.time()
                raw_c_s2 = load_source_records(os.path.join(test_dir, "test_source2.tsv"), country_filter=country)
                prep_c_s2 = {eid: preprocess_record(eid, n, a, c) for eid, (n, a, c) in raw_c_s2.items()}
                del raw_c_s2
                idx_s2 = BlockingIndex(max_postings_per_key=100)
                idx_s2.build_index(prep_c_s2)
                print(f"      Loaded & indexed {len(prep_c_s2):,} S2 records in {time.time()-t_load2:.2f}s")

                # Load & index S3 for this country
                t_load3 = time.time()
                raw_c_s3 = load_source_records(os.path.join(test_dir, "test_source3.tsv"), country_filter=country)
                prep_c_s3 = {eid: preprocess_record(eid, n, a, c) for eid, (n, a, c) in raw_c_s3.items()}
                del raw_c_s3
                idx_s3 = BlockingIndex(max_postings_per_key=100)
                idx_s3.build_index(prep_c_s3)
                print(f"      Loaded & indexed {len(prep_c_s3):,} S3 records in {time.time()-t_load3:.2f}s")

                # Stream S1 test records
                c_proc, c_cands, c_matches, c_singletons = stream_country_test_predictions(
                    model=model,
                    threshold=best_threshold,
                    s1_filepath=os.path.join(test_dir, "test_source1.tsv"),
                    country=country,
                    test_s2=prep_c_s2,
                    test_s3=prep_c_s3,
                    idx_s2=idx_s2,
                    idx_s3=idx_s3,
                    f_match=f_m,
                    f_cand=f_c,
                    max_cands_per_source=15,
                    min_name_similarity=0.35,
                    batch_size=5000
                )

                total_test_s1_processed += c_proc
                total_cands += c_cands
                total_matches += c_matches
                singletons += c_singletons
                print(f"      Country {country} done in {time.time()-tc0:.2f}s: Processed={c_proc:,}, Candidates={c_cands:,}, Matches={c_matches:,}, Singletons={c_singletons:,}")

                del prep_c_s2, prep_c_s3, idx_s2, idx_s3
                gc.collect()

    infer_time = time.time() - t2
    print(f"\n  Test Inference finished in {infer_time:.2f}s ({infer_time/60:.2f} min)")
    print(f"  Total Test S1 Processed : {total_test_s1_processed:,}")
    print(f"  Total Test Candidates   : {total_cands:,}")
    print(f"  Total Predicted Matches : {total_matches:,}")
    print(f"  Source 1 Singletons     : {singletons:,} ({singletons/total_test_s1_processed*100:.2f}%)")

    cartesian_space = total_test_s1_processed * 10000000
    reduction_ratio = 1.0 - (total_cands / cartesian_space) if cartesian_space > 0 else 1.0

    # ---------------------------------------------------------
    # 4. SUBMISSION VALIDATION
    # ---------------------------------------------------------
    print(f"\n[4/5] Validating Submission Files with utils/validate_submission.py...")
    if validate_script_path and os.path.exists(validate_script_path):
        val_cmd = [
            sys.executable,
            validate_script_path,
            "--matching", matching_tsv,
            "--candidate", candidate_tsv,
            "--test-dir", test_dir
        ]
        val_res = subprocess.run(
            val_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
        print("  Validator Output:")
        print("  " + "\n  ".join(val_res.stdout.splitlines()))
        if val_res.stderr:
            print("  Validator Stderr:\n  " + "\n  ".join(val_res.stderr.splitlines()))
        if val_res.returncode == 0:
            print("  ==> VALIDATION STATUS: PASS (Exit Code 0)")
        else:
            print(f"  ==> VALIDATION STATUS: CODE {val_res.returncode}")
    else:
        print("  Validator script not specified or not found.")

    # ---------------------------------------------------------
    # 5. SUMMARY
    # ---------------------------------------------------------
    total_elapsed = time.time() - total_start_time
    print(f"\n[5/5] Pipeline Run Complete in {total_elapsed:.2f}s ({total_elapsed/60:.2f} min)")

    return {
        "prep_time": prep_time,
        "training_time": training_time,
        "inference_time": infer_time,
        "total_runtime": total_elapsed,
        "candidate_reduction_ratio": reduction_ratio,
        "train_positives": train_stats["positive_pairs"],
        "train_negatives": train_stats["negative_pairs"],
        "val_f05": val_metrics["macro_f05"],
        "val_precision": val_metrics["macro_precision"],
        "val_recall": val_metrics["macro_recall"],
        "selected_threshold": best_threshold,
        "test_candidates": total_cands,
        "predicted_matches": total_matches,
        "test_singletons": singletons,
        "matching_tsv": matching_tsv,
        "candidate_tsv": candidate_tsv
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ML Challenge 2026 - Business Entity Resolution Pipeline")
    parser.add_argument("--data-dir", default=r"c:\Users\Admin\Downloads\6ab10eb3b23ba_student_resource\student_resource\dataset")
    parser.add_argument("--output-dir", default=r"c:\Users\Admin\Downloads\6ab10eb3b23ba_student_resource\student_resource\output")
    parser.add_argument("--train-sample", type=int, default=25000, help="Number of S1 training records (default: 25000)")
    parser.add_argument("--test-sample", type=int, default=None, help="Number of S1 test records (default: None for all)")
    parser.add_argument("--sample", action="store_true", help="Run fast verification sample")
    args = parser.parse_args()

    train_n = 5000 if args.sample else args.train_sample
    test_n = 5000 if args.sample else args.test_sample

    val_script = os.path.join(
        os.path.dirname(os.path.abspath(args.data_dir)), "utils", "validate_submission.py"
    )
    model_path = os.path.join(args.output_dir, "models", "baseline_hgb.joblib")

    run_pipeline(
        data_dir=args.data_dir,
        output_dir=args.output_dir,
        train_sample_size=train_n,
        test_sample_size=test_n,
        model_save_path=model_path,
        validate_script_path=val_script
    )
