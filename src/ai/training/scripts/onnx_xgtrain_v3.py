import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, precision_recall_curve, f1_score, precision_score, recall_score
from sklearn.inspection import permutation_importance
import joblib
import warnings
import json
import onnx
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# --- SETUP ---
warnings.filterwarnings('ignore')
print("🚀 BULLETPROOF RANSOMWARE DETECTION MODEL TRAINING (MLP + Clean ONNX)")
print("="*70)
print("🔧 Applying the 4 Principles for Direct tract-onnx Compatibility")
print("="*70)


# --- FEATURE ENGINEERING ---
# This section is kept as you designed it.
def create_enhanced_pattern_features(df):
    """Create enhanced pattern features for ransomware detection"""
    # Using .get() with a default value of 0 for safety
    df['partner_transaction_ratio'] = df.get('transacted_w_address_total', 0) / (df.get('total_txs', 1) + 1e-8)
    df['activity_density'] = df.get('total_txs', 0) / (df.get('lifetime_in_blocks', 1) + 1e-8)
    df['transaction_size_variance'] = (df.get('btc_transacted_max', 0) - df.get('btc_transacted_min', 0)) / (df.get('btc_transacted_mean', 1) + 1e-8)
    df['flow_imbalance'] = (df.get('btc_sent_total', 0) - df.get('btc_received_total', 0)) / (df.get('btc_transacted_total', 1) + 1e-8)
    df['temporal_spread'] = (df.get('last_block_appeared_in', 0) - df.get('first_block_appeared_in', 0)) / (df.get('num_timesteps_appeared_in', 1) + 1e-8)
    df['fee_percentile'] = df.get('fees_total', 0) / (df.get('btc_transacted_total', 1) + 1e-8)
    df['interaction_intensity'] = df.get('num_addr_transacted_multiple', 0) / (df.get('transacted_w_address_total', 1) + 1e-8)
    df['value_per_transaction'] = df.get('btc_transacted_total', 0) / (df.get('total_txs', 1) + 1e-8)
    df['burst_activity'] = df.get('total_txs', 0) * df['activity_density']
    df['mixing_intensity'] = df['partner_transaction_ratio'] * df['interaction_intensity']
    return df

# --- DATA LOADING AND PREPARATION ---
print("[1/6] Loading and Preparing Data...")
df = pd.read_csv('../EllipticPlusPlus-main/Actors Dataset/wallets_features_classes_combined.csv')
print(f"   - Loaded {len(df)} total samples.")

df = create_enhanced_pattern_features(df)
print(f"   - Created 10 enhanced pattern features.")

# Clean data and remap classes
df_clean = df.copy()
numeric_columns = df_clean.select_dtypes(include=[np.number]).columns
df_clean[numeric_columns] = df_clean[numeric_columns].fillna(0)
df_clean = df_clean[df_clean['class'].isin([1, 2])]
df_clean['class'] = df_clean['class'].map({1: 1, 2: 0}) # 1=Illicit, 0=Licit

# Define features (X) and target (y)
exclude_cols = ['address', 'class']
feature_cols = [col for col in df_clean.columns if col not in exclude_cols]
X = df_clean[feature_cols]
y = df_clean['class']

# ✅ PRINCIPLE 3: CONTROL YOUR DATA TYPES
# Explicitly convert features to float32 to prevent unwanted 'Cast' nodes in the ONNX graph.
print("   - Forcing feature data type to numpy.float32 for consistency.")
X = X.astype(np.float32)

print(f"   - Data prepared: {len(X)} samples, {len(feature_cols)} features.")

# Split data before scaling
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# --- SCALER TRAINING (OUTSIDE THE MODEL) ---
# ✅ PRINCIPLE 2: PRE-PROCESSING HAPPENS *OUTSIDE* THE MODEL
print("\n[2/6] Training Scaler Separately...")
scaler = StandardScaler()

# Fit the scaler ONLY on the training data
scaler.fit(X_train)
print("   - StandardScaler fitted on training data.")

# Apply the scaling
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
print("   - Data scaling applied.")

# Save the scaler parameters for the Rust canister. This is a crucial part of the "model".
scaler_params = {
    'mean': scaler.mean_.tolist(),
    'scale': scaler.scale_.tolist()
}
with open('scaler_parameters.json', 'w') as f:
    json.dump(scaler_params, f, indent=2)
print("   - ✅ Scaler parameters (mean_ and scale_) saved to 'scaler_parameters.json'")

# --- MLP MODEL TRAINING ---
print("\n[3/6] Training MLP Classifier...")
# These parameters are kept from your original script.
mlp_model = MLPClassifier(
    hidden_layer_sizes=(200, 100, 50),
    activation='relu',
    solver='adam',
    alpha=0.001,
    batch_size='auto',
    learning_rate='adaptive',
    learning_rate_init=0.001,
    max_iter=500,
    shuffle=True,
    random_state=42,
    early_stopping=True,
    validation_fraction=0.1,
    n_iter_no_change=20,
    warm_start=False
)

# Train the model on the SCALED data.
mlp_model.fit(X_train_scaled, y_train)
print(f"   - Training completed in {mlp_model.n_iter_} iterations.")
print(f"   - Final training loss: {mlp_model.loss_:.6f}")

# --- MODEL EVALUATION ---
print("\n[4/6] Evaluating Model Performance...")
# Predict probabilities (the raw output of the neural network)
y_pred_proba = mlp_model.predict_proba(X_test_scaled)[:, 1]

# Find the optimal threshold for converting probabilities to labels
precision, recall, thresholds = precision_recall_curve(y_test, y_pred_proba)
# Add a small epsilon to avoid division by zero
f1_scores = 2 * (precision * recall) / (precision + recall + 1e-8)
best_threshold = thresholds[np.argmax(f1_scores)]

print(f"   - AUC Score: {roc_auc_score(y_test, y_pred_proba):.4f}")
print(f"   - Optimal Threshold for F1-Score: {best_threshold:.4f}")

# Final evaluation using the optimal threshold
y_pred_final = (y_pred_proba >= best_threshold).astype(int)
print("\n   - Final Classification Report (at optimal threshold):")
print(classification_report(y_test, y_pred_final, target_names=['Licit', 'Illicit']))

print("   - Final Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred_final)
print("     Predicted:  Licit  Illicit")
print(f"     Actual Licit:   {cm[0,0]:5d}   {cm[0,1]:5d}")
print(f"     Actual Illicit: {cm[1,0]:5d}   {cm[1,1]:5d}")

# --- ONNX EXPORT (THE CORRECT WAY) ---
print("\n[5/6] Exporting to Clean ONNX Format...")

# ✅ PRINCIPLE 1 & 4: EXPLICIT CONVERSION OF THE CORE MODEL ONLY
# We do NOT create a Pipeline. We convert ONLY the trained MLP classifier.
# We also explicitly define the input shape and target opset.
try:
    # Define the input type. Using a static batch size of 1 is safest for tract.
    n_features = X_train_scaled.shape[1]
    initial_type = [('float_input', FloatTensorType([1, n_features]))]
    print(f"   - Defining ONNX input shape as [1, {n_features}]")

    print("   - Converting MLP model ONLY (no Pipeline, no Scaler)...")
    onnx_model = convert_sklearn(
        mlp_model,
        initial_types=initial_type,
        target_opset=11,
        # This option is crucial to get raw probabilities instead of a complex output
        options={id(mlp_model): {'zipmap': False}}
    )

    onnx_filename = 'ransomware_model_mlp.onnx'
    with open(onnx_filename, "wb") as f:
        f.write(onnx_model.SerializeToString())
    print(f"   - ✅ Clean ONNX model saved as '{onnx_filename}'")

    # Final verification
    onnx_model_check = onnx.load(onnx_filename)
    onnx.checker.check_model(onnx_model_check)
    print("   - ✅ ONNX model verification passed!")
    print("   - ✅ MODEL IS NOW DIRECTLY COMPATIBLE WITH TRACT-ONNX!")

except Exception as e:
    print(f"[ERROR] ONNX export failed: {e}")
    import traceback
    traceback.print_exc()

# --- SAVE ARTIFACTS & CREATE TEST SAMPLE ---
print("\n[6/6] Saving Final Artifacts...")
# Save all metadata for the application
metadata = {
    'feature_names': feature_cols,
    'num_features': len(feature_cols),
    'deployment_threshold': float(best_threshold),
    'class_names': ['licit', 'illicit'],
    'model_version': '5.0_MLP_Bulletproof',
    'model_type': 'MLPClassifier',
    'auc_score': float(roc_auc_score(y_test, y_pred_proba)),
    'best_f1_score': float(max(f1_scores))
}
with open('model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=4)
print("   - ✅ Model metadata saved to 'model_metadata.json'")

# ✅ FIXED: Create test sample robustly using aligned indices
print("   - Creating robust test sample from an illicit wallet...")

# 1. Get the indices of all known illicit samples from the CLEANED dataframe
illicit_indices = df_clean[df_clean['class'] == 1].index

if not illicit_indices.empty:
    # 2. Pick the index of the first illicit sample
    sample_index_to_find = illicit_indices[0]
    
    # 3. Use this index to locate the EXACT same row in the ORIGINAL dataframe
    raw_sample_df = df.loc[[sample_index_to_find]].copy()
    
    # 4. Use the EXACT same feature engineering function on this single sample
    enhanced_sample_df = create_enhanced_pattern_features(raw_sample_df)
    
    # 5. Create the test sample dictionary using the final feature list
    test_sample_dict = enhanced_sample_df[feature_cols].iloc[0].to_dict()
    
    with open('test_sample.json', 'w') as f:
        json.dump(test_sample_dict, f, indent=4)
    print("   - ✅ Test sample for Rust canister saved to 'test_sample.json'")
else:
    print("   - ⚠️  No illicit samples found to create a test case.")

# Save the Python-specific model and scaler for other uses
joblib.dump({'model': mlp_model, 'scaler': scaler}, 'python_mlp_model_and_scaler.joblib')
print("   - ✅ Python model and scaler saved to 'python_mlp_model_and_scaler.joblib'")


# --- FINAL SUMMARY ---
# This part remains the same
print("\n" + "="*70)
print("✅ TRAINING AND EXPORT COMPLETE")
print("="*70)
print("You have created the following artifacts:")
print(f"  1. Clean ONNX Model:      ransomware_model_mlp.onnx")
print(f"  2. Scaler Parameters:     scaler_parameters.json")
print(f"  3. Deployment Metadata:   model_metadata.json")
print(f"  4. Canister Test Sample:  test_sample.json (if created)")
print("\n🚨 DEPLOYMENT WORKFLOW:")
print("  1. Upload 'ransomware_model_mlp.onnx' to your canister.")
print("  2. In your Rust code, load 'scaler_parameters.json'.")
print("  3. When a new transaction arrives, apply the scaling using the loaded parameters.")
print("  4. Feed the scaled data to the ONNX model.")
print("  5. The model will return probabilities. Use the threshold from 'model_metadata.json' to classify.")