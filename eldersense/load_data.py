"""
Load and merge the RV PhD dataset (6 sheets) into one dataframe.
Run from project root: python -c "from eldersense.load_data import load_sheets, get_merged; ..."
Or: python eldersense/load_data.py
"""
import os
import pandas as pd

# Path to Excel from project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
EXCEL_PATH = os.path.join(DATA_DIR, "RV PhD Data Sheet 15.03.2022 (1).xlsx")

# Sheet order: 0=Demographics, 1=CGA, 2=MSPSS, 3=GDS-15, 4=HSB, 5=WHOQOL-BREF
SHEET_NAMES = ["Sheet1", "Sheet2", "Sheet3", "Sheet4", "Sheet5", "Sheet6"]
PREFIXES = ["demo_", "cga_", "mspss_", "gds_", "hsb_", "whoqol_"]
# Header is in row 3 (0-based index 2); rows 0,1 are title/blank
HEADER_ROW = 2
# Use 601 data rows to align all sheets (Sheet2 has 603; we take first 601)
MAX_DATA_ROWS = 601


def load_sheets(path=None):
    """
    Load all 6 sheets into a dict of dataframes.
    Each sheet uses row 3 as header; data starts at row 4.
    Returns dict: sheet_name -> pd.DataFrame with 601 rows (aligned).
    """
    path = path or EXCEL_PATH
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Dataset not found: {path}")

    xl = pd.ExcelFile(path, engine="openpyxl")
    out = {}
    # Read by position (0=Demographics, 1=CGA, 2=MSPSS, 3=GDS-15, 4=HSB, 5=WHOQOL-BREF)
    for i in range(6):
        df = pd.read_excel(xl, sheet_name=i, header=HEADER_ROW)
        name = SHEET_NAMES[i]
        # Align to MAX_DATA_ROWS (drop extra rows from Sheet2 if present)
        if len(df) > MAX_DATA_ROWS:
            df = df.iloc[:MAX_DATA_ROWS].copy()
        out[SHEET_NAMES[i]] = df
        print(f"  {SHEET_NAMES[i]} ({PREFIXES[i].rstrip('_')}): {df.shape}")

    return out


def get_merged(path=None, prefix_columns=True):
    """
    Load all sheets, prefix column names, and merge into one dataframe.
    Returns: pd.DataFrame with shape (601, ~148), one row per participant.
    """
    sheets = load_sheets(path)
    dfs = []
    for i, name in enumerate(SHEET_NAMES):
        df = sheets[name].copy()
        if prefix_columns:
            df.columns = [f"{PREFIXES[i]}{c}" for c in df.columns]
        dfs.append(df)

    merged = pd.concat(dfs, axis=1)
    assert len(merged) == MAX_DATA_ROWS, f"Expected {MAX_DATA_ROWS} rows, got {len(merged)}"
    print(f"Merged shape: {merged.shape}")
    return merged


if __name__ == "__main__":
    print("Loading sheets...")
    sheets = load_sheets()
    print("\nMerging...")
    df = get_merged()
    print(f"\nColumns sample: {list(df.columns[:10])} ...")
    out_path = os.path.join(PROJECT_ROOT, "eldersense", "data", "merged.csv")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"Saved: {out_path}")
