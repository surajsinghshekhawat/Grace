"""
Phase 4 Step 20: Stratified 5-fold CV for the depression task.
Same fold indices are used for QoL. Split indices only (no data files).
"""
import numpy as np
from sklearn.model_selection import StratifiedKFold


def get_fold_indices(y_depression, n_splits=5, shuffle=True, random_state=42):
    """
    Return list of (train_idx, test_idx) for stratified k-fold CV.
    Stratified on y_depression so each fold has similar class proportion.
    Same indices can be used for X and y_qol (same row order).
    """
    y = np.asarray(y_depression)
    skf = StratifiedKFold(n_splits=n_splits, shuffle=shuffle, random_state=random_state)
    folds = list(skf.split(np.zeros(len(y)), y))  # X dummy; split uses only y for stratification
    return folds


def print_fold_summary(folds, y_depression, y_qol=None):
    """Print class balance and size for each fold (for sanity check)."""
    y_dep = np.asarray(y_depression)
    for i, (train_idx, test_idx) in enumerate(folds):
        train_pos = y_dep[train_idx].sum()
        test_pos = y_dep[test_idx].sum()
        print(f"  Fold {i+1}: train n={len(train_idx)} (pos={int(train_pos)}, prev={100*train_pos/len(train_idx):.1f}%) | "
              f"test n={len(test_idx)} (pos={int(test_pos)}, prev={100*test_pos/len(test_idx):.1f}%)")
    print(f"Total folds: {len(folds)}")
