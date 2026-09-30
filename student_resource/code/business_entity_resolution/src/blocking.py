"""
ML Challenge 2026 - Business Entity Resolution
Blocking Module: Multi-pass candidate generation across Source1 <-> Source2 and Source1 <-> Source3.
"""

from collections import defaultdict
from typing import Dict, List, Set, Tuple
from preprocessing import NormalizedRecord

# Generic terms that are too common to be useful as single-token blocking keys
GENERIC_STOPWORDS = {
    "the", "and", "for", "with", "from", "center", "centre", "services",
    "solutions", "enterprises", "trading", "company", "limited", "pvt", "ltd",
    "inc", "corp", "corporation", "llc", "sarl", "group", "groupe",
    "store", "shop", "restaurant", "hotel", "cafe", "agency", "associates",
    "india", "france", "united", "states", "american", "national",
    "consulting", "consultants", "management", "international", "global"
}


def get_record_blocking_keys(record: NormalizedRecord) -> List[str]:
    """
    Extracts multi-pass blocking keys for a record.
    All keys are prefixed with country to enforce country-level partitioning.
    """
    country = record.country
    keys = []

    # Pass 1: Country + Name Prefix (first 4 chars of core name)
    c_name = record.core_name.replace(" ", "")
    if len(c_name) >= 3:
        pref4 = c_name[:4]
        keys.append(f"{country}_p4_{pref4}")
    elif len(c_name) > 0:
        keys.append(f"{country}_p4_{c_name}")

    # Pass 2: Country + Significant Name Tokens
    # Tokens of length >= 4 that are not generic stopwords
    for t in record.name_tokens:
        if len(t) >= 4 and t not in GENERIC_STOPWORDS and not t.isdigit():
            keys.append(f"{country}_tk_{t}")

    # Pass 3: Country + Postal code + 2-char Name Prefix
    if record.postal_code and len(c_name) >= 2:
        keys.append(f"{country}_post_{record.postal_code}_{c_name[:2]}")

    # Pass 4: Country + First Address Number + 2-char Name Prefix
    if record.addr_numbers and len(c_name) >= 2:
        # Sort or pick the primary number
        first_num = sorted(record.addr_numbers, key=lambda x: (len(x), x))[0]
        keys.append(f"{country}_num_{first_num}_{c_name[:2]}")

    return keys


class BlockingIndex:
    """
    Inverted index for fast candidate retrieval.
    Maps blocking_key -> list of target entity_ids.
    Caps max posting size to avoid pathological candidate explosion on ambiguous keys.
    """
    def __init__(self, max_postings_per_key: int = 150):
        self.max_postings = max_postings_per_key
        self.index: Dict[str, List[str]] = defaultdict(list)

    def build_index(self, records: Dict[str, NormalizedRecord]):
        """Populates the inverted index with target records (Source 2 or Source 3)."""
        for ent_id, rec in records.items():
            keys = get_record_blocking_keys(rec)
            for k in keys:
                postings = self.index[k]
                if len(postings) < self.max_postings:
                    postings.append(ent_id)

    def retrieve_candidates_for_s1(self, s1_rec: NormalizedRecord, max_candidates: int = 20) -> List[str]:
        """
        Retrieves top candidate target entity_ids for a single Source 1 record.
        Uses key frequency and simple overlap heuristic to rank candidates.
        """
        keys = get_record_blocking_keys(s1_rec)
        cand_hit_counts = defaultdict(int)

        for k in keys:
            if k in self.index:
                for target_id in self.index[k]:
                    cand_hit_counts[target_id] += 1

        if not cand_hit_counts:
            return []

        # Sort candidates primarily by number of shared blocking keys
        # If candidate count exceeds max_candidates, prioritize higher hit count
        sorted_candidates = sorted(cand_hit_counts.items(), key=lambda x: x[1], reverse=True)
        return [cid for cid, _ in sorted_candidates[:max_candidates]]


def generate_candidate_pairs(
    s1_records: Dict[str, NormalizedRecord],
    s2_records: Dict[str, NormalizedRecord],
    s3_records: Dict[str, NormalizedRecord],
    max_cands_per_source: int = 15
) -> Tuple[Dict[str, List[str]], int, int]:
    """
    Generates candidate pairs for all Source 1 records against Source 2 and Source 3.
    
    Returns:
        candidate_map: dict mapping s1_id -> deduplicated list of candidate IDs [S2-..., S3-...]
        total_pairs_before_dedup: count of candidate links before deduplication
        total_pairs_after_dedup: count of unique candidate links
    """
    # Build indexes for S2 and S3
    idx_s2 = BlockingIndex(max_postings_per_key=150)
    idx_s2.build_index(s2_records)

    idx_s3 = BlockingIndex(max_postings_per_key=150)
    idx_s3.build_index(s3_records)

    candidate_map = {}
    total_before = 0
    total_after = 0

    for s1_id, s1_rec in s1_records.items():
        cands_s2 = idx_s2.retrieve_candidates_for_s1(s1_rec, max_candidates=max_cands_per_source)
        cands_s3 = idx_s3.retrieve_candidates_for_s1(s1_rec, max_candidates=max_cands_per_source)

        total_before += (len(cands_s2) + len(cands_s3))
        # Deduplicate while preserving order
        seen = set()
        deduped = []
        for cid in cands_s2 + cands_s3:
            if cid not in seen:
                seen.add(cid)
                deduped.append(cid)

        candidate_map[s1_id] = deduped
        total_after += len(deduped)

    return candidate_map, total_before, total_after
