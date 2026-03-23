"""
Phase 3 Step 19: Scaling — StandardScaler on all numeric features.
Fit on train only in CV; transform train and test.
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


def scale_fit_transform(X):
    """
    Fit StandardScaler on X and transform X.
    Returns (X_scaled, scaler). Use scaler in scale_transform(X_test, scaler) for test in CV.
    """
    X = X.copy()
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(
        scaler.fit_transform(X),
        columns=X.columns,
        index=X.index,
    )
    return X_scaled, scaler


def scale_transform(X, scaler):
    """Transform X using a fitted scaler (e.g. from scale_fit_transform on train)."""
    X = X.copy()
    X_scaled = pd.DataFrame(
        scaler.transform(X),
        columns=X.columns,
        index=X.index,
    )
    return X_scaled
