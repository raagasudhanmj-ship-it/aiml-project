"""
ML Challenge 2026 - Business Entity Resolution
Preprocessing Module: Unicode normalization, cleaning, legal suffix handling,
and token extraction for business names, addresses, and open-set countries.
"""

import re
import unicodedata

# Common business/legal suffixes across US, India, France, and international jurisdictions
LEGAL_SUFFIXES = [
    "private limited", "pvt ltd", "pvt. ltd.", "p ltd", "p. ltd.",
    "public limited", "pub ltd", "ltd", "limited",
    "incorporated", "inc", "corp", "corporation",
    "limited liability company", "llc", "l.l.c.",
    "limited liability partnership", "llp", "l.l.p.",
    "societe a responsabilite limitee", "sarl", "s.a.r.l.",
    "societe anonyme", "sa", "s.a.",
    "societe par actions simplifiee", "sas", "s.a.s.",
    "societe civile immobiliere", "sci",
    "gmbh", "ag", "co", "company", "cie",
    "enterprise", "enterprises", "ventures", "holdings", "group", "groupe"
]
LEGAL_SUFFIXES_SET = set(LEGAL_SUFFIXES)

# Patterns for 'formerly known as', 'doing business as'
DBA_PATTERNS = [
    r"\bf/k/a\b", r"\bd/b/a\b", r"\bformerly known as\b",
    r"\bformerly\b", r"\btrading as\b", r"\bt/a\b", r"\baka\b"
]

# Common address abbreviations
ADDRESS_ABBREVIATIONS = {
    "rd": "road", "rd.": "road",
    "st": "street", "st.": "street",
    "ave": "avenue", "ave.": "avenue",
    "av": "avenue", "av.": "avenue",
    "dr": "drive", "dr.": "drive",
    "blvd": "boulevard", "blvd.": "boulevard",
    "ln": "lane", "ln.": "lane",
    "ct": "court", "ct.": "court",
    "pl": "place", "pl.": "place",
    "sq": "square", "sq.": "square",
    "flr": "floor", "fl": "floor", "fl.": "floor",
    "ste": "suite", "ste.": "suite",
    "apt": "apartment", "apt.": "apartment",
    "no": "number", "no.": "number",
    "opp": "opposite", "opp.": "opposite",
    "nr": "near", "nr.": "near",
    "bldg": "building", "bldg.": "building",
    "pkwy": "parkway", "pkwy.": "parkway",
    "hwy": "highway", "hwy.": "highway",
    "p.o. box": "pobox", "po box": "pobox", "p.o.box": "pobox",
    "tq": "taluk", "dist": "district", "dist.": "district",
    "ngr": "nagar", "col": "colony"
}

# Precompile regular expressions
RE_MULTI_SPACE = re.compile(r"\s+")
RE_PUNCT = re.compile(r"[^\w\s]")
RE_DIGITS = re.compile(r"\b\d+\b")
RE_POSTAL_CODE = re.compile(r"\b\d{5,6}\b")  # 5-digit US/FR zip, 6-digit India PIN


def unicode_clean(text: str) -> str:
    """Normalize Unicode characters (NFKD) and convert to lowercase."""
    if not text:
        return ""
    norm = unicodedata.normalize("NFKD", text)
    return norm.lower()


def normalize_business_name(raw_name: str):
    """
    Normalizes a business name:
    - Lowercase & Unicode normalization
    - Replace '&' with 'and'
    - Handle DBA / formerly prefixes
    - Remove noisy punctuation while retaining alphanumeric tokens
    - Safely strip known legal suffixes without leaving an empty string
    
    Returns:
        (clean_name, core_name, tokens_tuple)
    """
    if not raw_name:
        return "", "", ()

    s = unicode_clean(raw_name)

    # Standardize separators
    s = s.replace("&", " and ")
    s = s.replace("@", " at ")
    s = s.replace("+", " plus ")
    s = s.replace("/", " ")
    s = s.replace("-", " ")

    # Normalize DBA/formerly patterns
    for pat in DBA_PATTERNS:
        s = re.sub(pat, " ", s)

    # Strip punctuation except alphanumeric and space
    s = RE_PUNCT.sub(" ", s)
    tokens = tuple(s.split())
    if not tokens:
        return "", "", ()

    clean_name = " ".join(tokens)

    # Core name: remove legal suffixes from ends using fast set lookups
    start_idx = 0
    end_idx = len(tokens)
    while end_idx - start_idx > 1:
        if end_idx - start_idx >= 2:
            tail_2 = " ".join(tokens[end_idx - 2 : end_idx])
            if tail_2 in LEGAL_SUFFIXES_SET:
                end_idx -= 2
                continue
        tail_1 = tokens[end_idx - 1]
        if tail_1 in LEGAL_SUFFIXES_SET:
            end_idx -= 1
            continue
        if end_idx - start_idx >= 2:
            head_2 = " ".join(tokens[start_idx : start_idx + 2])
            if head_2 in LEGAL_SUFFIXES_SET:
                start_idx += 2
                continue
        head_1 = tokens[start_idx]
        if head_1 in LEGAL_SUFFIXES_SET:
            start_idx += 1
            continue
        break

    core_tokens = tokens[start_idx:end_idx]
    core_name = " ".join(core_tokens) if core_tokens else clean_name
    return clean_name, core_name, tokens


def normalize_address(raw_addr: str):
    """
    Normalizes a business address:
    - Lowercase & Unicode normalization
    - Standardize common street abbreviations
    - Extract numeric house/building numbers and postal codes
    - Normalize whitespace and punctuation
    
    Returns:
        (clean_addr, tokens_tuple, numbers_frozenset, postal_code)
    """
    if not raw_addr:
        return "", (), frozenset(), ""

    s = unicode_clean(raw_addr)
    s = s.replace("-", " ")
    s = s.replace("/", " ")
    s = s.replace("#", " ")
    s = s.replace(",", " ")

    # Find postal code candidate before word stripping
    postal_matches = RE_POSTAL_CODE.findall(s)
    postal_code = postal_matches[-1] if postal_matches else ""

    # Tokenize and expand abbreviations
    raw_tokens = s.split()
    expanded_tokens = []
    for t in raw_tokens:
        clean_t = RE_PUNCT.sub("", t)
        if not clean_t:
            continue
        exp = ADDRESS_ABBREVIATIONS.get(clean_t, clean_t)
        expanded_tokens.append(exp)

    clean_addr = " ".join(expanded_tokens)
    numbers_set = frozenset(RE_DIGITS.findall(clean_addr))

    return clean_addr, tuple(expanded_tokens), numbers_set, postal_code


def normalize_country(raw_country: str) -> str:
    """
    Open-set country normalization.
    Upper cases and strips whitespace without restricting to predefined countries.
    """
    if not raw_country:
        return "UNKNOWN"
    return unicode_clean(raw_country).strip().upper()


def char_ngrams_set(s: str, n: int = 3):
    if len(s) < n:
        return frozenset([s]) if s else frozenset()
    return frozenset(s[i : i + n] for i in range(len(s) - n + 1))


class NormalizedRecord:
    """Compact normalized representation of an entity record with precomputed n-grams for 20x speedup."""
    __slots__ = (
        "entity_id", "clean_name", "core_name", "name_tokens",
        "clean_addr", "addr_tokens", "addr_numbers", "postal_code",
        "country",
        "name_3grams", "name_2grams", "name_tokens_set",
        "addr_3grams", "addr_tokens_set",
        "len_name_3", "len_name_2", "len_addr_3"
    )

    def __init__(self, entity_id: str, name: str, addr: str, country: str):
        self.entity_id = entity_id
        self.clean_name, self.core_name, self.name_tokens = normalize_business_name(name)
        self.clean_addr, self.addr_tokens, self.addr_numbers, self.postal_code = normalize_address(addr)
        self.country = normalize_country(country)

        n3 = char_ngrams_set(self.clean_name, 3)
        n2 = char_ngrams_set(self.clean_name, 2)
        a3 = char_ngrams_set(self.clean_addr, 3)

        self.name_3grams = n3
        self.name_2grams = n2
        self.name_tokens_set = frozenset(self.name_tokens)
        self.addr_3grams = a3
        self.addr_tokens_set = frozenset(self.addr_tokens)

        self.len_name_3 = len(n3)
        self.len_name_2 = len(n2)
        self.len_addr_3 = len(a3)


def preprocess_record(entity_id: str, name: str, addr: str, country: str) -> NormalizedRecord:
    """Preprocesses a single record into NormalizedRecord."""
    return NormalizedRecord(entity_id, name, addr, country)
