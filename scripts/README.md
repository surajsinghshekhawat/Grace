# Scripts

Utility scripts for data inspection and preprocessing. Run from **project root**.

```bash
# Inspect Excel sheets (row/column counts, headers)
python scripts/read_xlsx.py
```

- **read_xlsx.py** — Loads `data/raw/RV PhD Data Sheet 15.03.2022 (1).xlsx` and prints per-sheet structure. Requires `openpyxl` (`pip install openpyxl`).
