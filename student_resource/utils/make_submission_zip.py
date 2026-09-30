"""
Helper script to assemble the final submission ZIP archive.
"""

import os
import zipfile

def create_submission_zip(output_zip_path: str = "antigravity_submission.zip"):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_full_path = os.path.join(base_dir, output_zip_path)
    
    files_to_include = [
        ("output/matching_results.tsv", "output/matching_results.tsv"),
        ("output/candidate_pairs.tsv", "output/candidate_pairs.tsv"),
        ("Documentation_template.md", "Documentation_template.md"),
    ]
    
    code_dir = os.path.join(base_dir, "code", "business_entity_resolution")
    
    with zipfile.ZipFile(zip_full_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        # Add output files & documentation
        for rel_src, arcname in files_to_include:
            src_path = os.path.join(base_dir, rel_src)
            if os.path.exists(src_path):
                print(f"Adding {rel_src} -> {arcname} ({os.path.getsize(src_path)/(1024*1024):.2f} MB)...")
                zipf.write(src_path, arcname)
            else:
                print(f"WARNING: Missing {src_path}")
                
        # Add code directory
        for root, dirs, files in os.walk(code_dir):
            if "__pycache__" in root or ".git" in root:
                continue
            for file in files:
                if file.endswith(".pyc"):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, base_dir)
                print(f"Adding {rel_path} -> {rel_path}...")
                zipf.write(file_path, rel_path)
                
    print(f"\nSubmission archive created successfully at: {zip_full_path}")
    print(f"Archive Size: {os.path.getsize(zip_full_path)/(1024*1024):.2f} MB")

if __name__ == "__main__":
    create_submission_zip()
