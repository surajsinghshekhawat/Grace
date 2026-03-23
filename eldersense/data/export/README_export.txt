ElderSense export: refit on 80%% train with same pipeline.
Files: model_depression.joblib, model_qol.joblib, scaler.joblib, impute_state.joblib, selected_features.json.
To predict: load X (same encoding as get_X_y), apply impute_transform(X, impute_state), scale_transform(X, scaler), then X[selected_features]; model_dep.predict(X_red), model_qol.predict(X_red).
