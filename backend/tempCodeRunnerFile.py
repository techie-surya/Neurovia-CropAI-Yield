X = df[features].values
    y = df[target].values

    scaler = models['crop_scaler']
    encoder = models['crop_label_encoder']
    model = models['crop_model']

    X_scaled = scaler.transform(X)
    y_enc = encoder.transform(y)
    preds = model.predict(X_scaled)