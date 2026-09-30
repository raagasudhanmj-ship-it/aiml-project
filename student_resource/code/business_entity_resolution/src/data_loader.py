"""
ML Challenge 2026 - Business Entity Resolution
Data Loader Module: Memory-efficient streaming and loading of TSV dataset files.
Supports country-partitioned streaming to guarantee minimal RAM usage.
"""

import os
import sys
from typing import Dict, Set, Tuple

DELIM = "\t"
REQUIRED_SOURCE_COLS = ["entity_id", "business_name", "business_address", "country"]
REQUIRED_GT_COLS = ["source1_entity_id", "matched_entity_ids"]


def load_source_records(filepath: str, max_rows: int = None, country_filter: str = None) -> Dict[str, Tuple[str, str, str]]:
    """
    Loads source records into a dictionary: entity_id -> (business_name, business_address, country)
    Preserves exact original entity_id.
    """
    records = {}
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        header_line = f.readline()
        if not header_line:
            return records
        header = [c.strip() for c in header_line.rstrip("\r\n").split(DELIM)]

        id_idx = header.index("entity_id")
        name_idx = header.index("business_name")
        addr_idx = header.index("business_address")
        country_idx = header.index("country")

        count = 0
        for line in f:
            if not line.strip():
                continue
            parts = line.rstrip("\r\n").split(DELIM)
            while len(parts) < len(header):
                parts.append("")

            country_val = parts[country_idx].strip()
            if country_filter and country_val.upper() != country_filter.upper():
                continue

            ent_id = parts[id_idx].strip()
            b_name = parts[name_idx].strip()
            b_addr = parts[addr_idx].strip()
            records[ent_id] = (b_name, b_addr, country_val)

            count += 1
            if max_rows is not None and count >= max_rows:
                break

    return records


def load_ground_truth(filepath: str, max_rows: int = None, s1_id_filter: Set[str] = None) -> Dict[str, list]:
    """
    Loads ground truth mapping: source1_entity_id -> list of matched_entity_ids (can be empty).
    """
    gt = {}
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        header_line = f.readline()
        if not header_line:
            return gt
        header = [c.strip() for c in header_line.rstrip("\r\n").split(DELIM)]

        id_idx = header.index("source1_entity_id")
        match_idx = header.index("matched_entity_ids")

        count = 0
        for line in f:
            if not line.strip():
                continue
            parts = line.rstrip("\r\n").split(DELIM)
            while len(parts) < len(header):
                parts.append("")

            s1_id = parts[id_idx].strip()
            if s1_id_filter is not None and s1_id not in s1_id_filter:
                continue

            matched_str = parts[match_idx].strip()
            if not matched_str:
                matched_ids = []
            else:
                matched_ids = [m.strip() for m in matched_str.split(",") if m.strip()]

            gt[s1_id] = matched_ids
            count += 1
            if max_rows is not None and count >= max_rows:
                break

    return gt


def load_target_records_with_required_ids(
    filepath: str,
    required_ids: Set[str],
    max_additional_rows: int = 150000
) -> Dict[str, Tuple[str, str, str]]:
    """
    Streams through a target file (Source 2 or 3) and loads:
    1. Every record whose entity_id is in required_ids (ground truth matches).
    2. Up to max_additional_rows non-matched records to serve as hard negatives/distractors.
    """
    records = {}
    additional_count = 0

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        header_line = f.readline()
        if not header_line:
            return records
        header = [c.strip() for c in header_line.rstrip("\r\n").split(DELIM)]

        id_idx = header.index("entity_id")
        name_idx = header.index("business_name")
        addr_idx = header.index("business_address")
        country_idx = header.index("country")

        for line in f:
            if not line.strip():
                continue
            parts = line.rstrip("\r\n").split(DELIM)
            while len(parts) < len(header):
                parts.append("")

            ent_id = parts[id_idx].strip()
            is_required = ent_id in required_ids

            if is_required:
                records[ent_id] = (parts[name_idx].strip(), parts[addr_idx].strip(), parts[country_idx].strip())
            elif additional_count < max_additional_rows:
                records[ent_id] = (parts[name_idx].strip(), parts[addr_idx].strip(), parts[country_idx].strip())
                additional_count += 1

    return records


def stream_source_records(filepath: str, country_filter: str = None, batch_size: int = 5000):
    """
    Yields batches of raw records [(entity_id, business_name, business_address, country), ...]
    directly from a source TSV file without loading the entire dataset into memory.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        header_line = f.readline()
        if not header_line:
            return
        header = [c.strip() for c in header_line.rstrip("\r\n").split(DELIM)]

        id_idx = header.index("entity_id")
        name_idx = header.index("business_name")
        addr_idx = header.index("business_address")
        country_idx = header.index("country")

        batch = []
        for line in f:
            if not line.strip():
                continue
            parts = line.rstrip("\r\n").split(DELIM)
            while len(parts) < len(header):
                parts.append("")

            country_val = parts[country_idx].strip()
            if country_filter and country_val.upper() != country_filter.upper():
                continue

            ent_id = parts[id_idx].strip()
            b_name = parts[name_idx].strip()
            b_addr = parts[addr_idx].strip()
            batch.append((ent_id, b_name, b_addr, country_val))

            if len(batch) >= batch_size:
                yield batch
                batch = []

        if batch:
            yield batch


def get_distinct_countries(filepath: str) -> List[str]:
    """Scans a source file and returns the set of distinct country strings."""
    countries = set()
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        header_line = f.readline()
        if not header_line:
            return []
        header = [c.strip() for c in header_line.rstrip("\r\n").split(DELIM)]
        c_idx = header.index("country")
        for line in f:
            if not line.strip():
                continue
            parts = line.rstrip("\r\n").split(DELIM)
            if len(parts) > c_idx:
                c_val = parts[c_idx].strip()
                if c_val:
                    countries.add(c_val)
    return sorted(list(countries))
