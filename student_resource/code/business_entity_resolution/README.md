# Business Entity Resolution Pipeline

This repository contains the complete, self-contained end-to-end Entity Resolution pipeline for the ML Challenge 2026.

## Architecture

The pipeline consists of six modular components:
1. **`data_loader.py`**: High-performance, memory-efficient TSV stream reader that preserves `entity_id` values and checks required columns.
2. **`preprocessing.py`**: Unicode NFKD normalizer, legal suffix cleaner, address abbreviation standardizer, and open-set country normalizer.
3. **`blocking.py`**: Multi-pass candidate generation using country partitioning, 4-gram prefixes, significant name tokens, address numbers, and postal codes.
4. **`features.py`**: Pairwise feature engineering (character 2-gram/3-gram Dice, token Jaccard, token-set ratios, sequence matcher ratios, address number overlap, country match, composite score).
5. **`train.py`**: Leakage-free Source 1 group split, controlled hard negative candidate sampling, `HistGradientBoostingClassifier` training, and F_0.5 validation optimization.
6. **`predict.py`**: Test candidate generation, batch inference, precision-focused conservative matching, and output generation for `matching_results.tsv` and `candidate_pairs.tsv`.
7. **`evaluate.py`**: Strict macro-averaged F_0.5 implementation matching the competition specification, with singleton credit handling.

## Running the Pipeline

### Fast Verification / Sample Mode:
```bash
python src/pipeline.py --sample
```

### Full Execution:
```bash
python src/pipeline.py --train-sample 25000
```

### Validation:
```bash
python utils/validate_submission.py --matching output/matching_results.tsv --candidate output/candidate_pairs.tsv --test-dir dataset/test
```
