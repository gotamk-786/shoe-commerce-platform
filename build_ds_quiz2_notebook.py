from __future__ import annotations

import re
import textwrap
from pathlib import Path

import nbformat
import pandas as pd
from nbclient import NotebookClient


RAW_PATH = Path(r"C:\Users\Al-Barakah\Desktop\ds quiz2\gotam_kumar_noaa_raw.html")
TARGET_DIR = Path(r"C:\Users\Al-Barakah\Desktop\ds quiz2")
CSV_NAME = "quiz2_23k0860.csv"
NOTEBOOK_NAME = "quiz2_23k0860.ipynb"


def parse_raw_dataset(raw_path: Path) -> tuple[pd.DataFrame, str]:
    text = raw_path.read_text(encoding="utf-8")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    title = lines[0]

    province_match = re.search(r"Province=\s*(\d+):\s*([^,]+)", title)
    region = province_match.group(2).strip() if province_match else "Unknown Region"

    records: list[list[float]] = []
    for line in lines[2:]:
        if not re.match(r"^\d{4},", line):
            continue
        parts = [part.strip() for part in line.rstrip(",").split(",")]
        if len(parts) != 7:
            continue
        year, week = int(parts[0]), int(parts[1])
        smn, smt, vci, tci, vhi = map(float, parts[2:])
        if year <= 2025:
            records.append([year, week, smn, smt, vci, tci, vhi])

    df = pd.DataFrame(records, columns=["year", "week", "SMN", "SMT", "VCI", "TCI", "VHI"])
    df["Date"] = pd.to_datetime(
        df["year"].astype(str) + df["week"].astype(str).str.zfill(2) + "1",
        format="%G%V%u",
        errors="coerce",
    )
    return df, region


def notebook_cells(csv_name: str, region: str, min_year: int, max_year: int) -> list:
    intro_md = textwrap.dedent(
        f"""
        # Drought Analysis Notebook

        **Dataset description:** This dataset is the NOAA STAR weekly Vegetation Health Index (VHI) time-series for **{region}, Pakistan**. The analysis uses records from **{min_year} to {max_year}** only, with all **2026** entries excluded. Variables available in the dataset are **year**, **week**, **SMN** (soil moisture proxy), **SMT** (surface temperature), **VCI** (Vegetation Condition Index), **TCI** (Temperature Condition Index), and **VHI** (Vegetation Health Index).

        **Target construction:** A new categorical target variable named **VHI_Class** is created from VHI using these ranges:

        - `0 <= VHI < 10`: Extreme Drought
        - `10 <= VHI < 20`: Severe Drought
        - `20 <= VHI < 30`: Moderate Drought
        - `30 <= VHI < 40`: Mild Drought
        - `VHI >= 40`: No Drought Condition
        """
    ).strip()

    imports_code = textwrap.dedent(
        f"""
        import warnings
        warnings.filterwarnings("ignore")

        import numpy as np
        import pandas as pd
        import seaborn as sns
        import matplotlib.pyplot as plt

        from IPython.display import display
        from scipy.cluster.hierarchy import dendrogram, linkage
        from sklearn.cluster import AgglomerativeClustering, KMeans
        from sklearn.decomposition import PCA
        from sklearn.metrics import (
            ConfusionMatrixDisplay,
            accuracy_score,
            classification_report,
            confusion_matrix,
            f1_score,
            mean_squared_error,
            precision_score,
            recall_score,
            roc_auc_score,
            roc_curve,
            silhouette_score,
        )
        from sklearn.model_selection import train_test_split
        from sklearn.multiclass import OneVsRestClassifier
        from sklearn.naive_bayes import GaussianNB
        from sklearn.neighbors import KNeighborsClassifier
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import LabelEncoder, StandardScaler, label_binarize

        sns.set_theme(style="whitegrid", context="notebook")
        plt.rcParams["figure.figsize"] = (10, 5)

        CSV_PATH = r"{csv_name}"
        """
    ).strip()

    load_code = textwrap.dedent(
        """
        df = pd.read_csv(CSV_PATH, parse_dates=["Date"])
        climate_cols = ["SMN", "SMT", "VCI", "TCI", "VHI"]
        sentinel_counts = (df[climate_cols] == -1).sum()

        print("Raw shape:", df.shape)
        print("Years covered:", int(df["year"].min()), "to", int(df["year"].max()))
        print("Sentinel -1 counts before preprocessing:")
        display(sentinel_counts.to_frame("count").T)

        df[climate_cols] = df[climate_cols].replace(-1, np.nan)
        df[climate_cols] = df[climate_cols].interpolate(method="linear", limit_direction="both")
        df["VHI_Class"] = pd.cut(
            df["VHI"],
            bins=[-np.inf, 10, 20, 30, 40, np.inf],
            labels=[
                "Extreme Drought",
                "Severe Drought",
                "Moderate Drought",
                "Mild Drought",
                "No Drought Condition",
            ],
            right=False,
        )

        print("Missing values after preprocessing:")
        display(df.isna().sum().to_frame("missing_count").T)
        display(df.head())
        """
    ).strip()

    eda_code = textwrap.dedent(
        """
        display(df.describe(include="all").T)

        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        sns.histplot(df["VHI"], bins=30, kde=True, ax=axes[0, 0], color="#2a9d8f")
        axes[0, 0].set_title("VHI Distribution")

        sns.boxplot(data=df[["SMN", "SMT", "VCI", "TCI", "VHI"]], ax=axes[0, 1], palette="Set2")
        axes[0, 1].set_title("Feature Boxplots")
        axes[0, 1].tick_params(axis="x", rotation=20)

        class_counts = df["VHI_Class"].value_counts().reindex(
            ["Extreme Drought", "Severe Drought", "Moderate Drought", "Mild Drought", "No Drought Condition"]
        )
        class_counts.plot(kind="bar", ax=axes[1, 0], color=["#b22222", "#ff7f0e", "#f4d35e", "#d4a373", "#2a9d8f"])
        axes[1, 0].set_title("VHI Class Distribution")
        axes[1, 0].set_ylabel("Count")
        axes[1, 0].tick_params(axis="x", rotation=20)

        corr = df[["year", "week", "SMN", "SMT", "VCI", "TCI", "VHI"]].corr()
        sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f", ax=axes[1, 1])
        axes[1, 1].set_title("Correlation Heatmap")

        plt.tight_layout()
        plt.show()

        yearly_vhi = df.groupby("year")["VHI"].mean()
        yearly_vci = df.groupby("year")["VCI"].mean()
        yearly_tci = df.groupby("year")["TCI"].mean()

        fig, axes = plt.subplots(3, 1, figsize=(14, 12), sharex=True)
        yearly_vhi.plot(ax=axes[0], color="#1d3557", title="Average Yearly VHI")
        yearly_vci.plot(ax=axes[1], color="#2a9d8f", title="Average Yearly VCI")
        yearly_tci.plot(ax=axes[2], color="#e76f51", title="Average Yearly TCI")
        axes[2].set_xlabel("Year")
        plt.tight_layout()
        plt.show()

        recent_subset = df[df["year"] >= 2015].copy()
        plt.figure(figsize=(14, 5))
        plt.plot(recent_subset["Date"], recent_subset["VHI"], color="#6a4c93")
        plt.title("Weekly VHI Time Series (2015-2025)")
        plt.xlabel("Date")
        plt.ylabel("VHI")
        plt.tight_layout()
        plt.show()
        """
    ).strip()

    preprocess_code = textwrap.dedent(
        """
        model_df = df.dropna().drop_duplicates().copy()
        feature_cols = ["year", "week", "SMN", "SMT", "VCI", "TCI"]
        X = model_df[feature_cols]
        y = model_df["VHI_Class"].astype(str)

        label_order = [
            "Extreme Drought",
            "Severe Drought",
            "Moderate Drought",
            "Mild Drought",
            "No Drought Condition",
        ]
        label_encoder = LabelEncoder()
        label_encoder.fit(label_order)
        y_encoded = label_encoder.transform(y)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        print("Modeling shape:", model_df.shape)
        print("Training samples:", len(X_train), "Testing samples:", len(X_test))
        print("Feature columns:", feature_cols)
        """
    ).strip()

    model_code = textwrap.dedent(
        """
        def evaluate_model(name, model, X_train, X_test, y_train, y_test, class_order):
            model.fit(X_train, y_train)
            preds = model.predict(X_test)

            precision = precision_score(y_test, preds, average="weighted", zero_division=0)
            recall = recall_score(y_test, preds, average="weighted", zero_division=0)
            f1 = f1_score(y_test, preds, average="weighted", zero_division=0)
            accuracy = accuracy_score(y_test, preds)

            y_test_num = label_encoder.transform(y_test)
            preds_num = label_encoder.transform(preds)
            rmse = mean_squared_error(y_test_num, preds_num) ** 0.5

            print(f"\\n{name} Metrics")
            print("-" * (len(name) + 8))
            print(f"Accuracy : {accuracy:.4f}")
            print(f"Precision: {precision:.4f}")
            print(f"Recall   : {recall:.4f}")
            print(f"F1-score : {f1:.4f}")
            print(f"RMSE     : {rmse:.4f}")
            print("\\nClassification Report")
            print(classification_report(y_test, preds, zero_division=0))

            fig, axes = plt.subplots(1, 2, figsize=(14, 5))

            cm = confusion_matrix(y_test, preds, labels=class_order)
            ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_order).plot(
                ax=axes[0], xticks_rotation=25, colorbar=False
            )
            axes[0].set_title(f"{name} Confusion Matrix")

            if hasattr(model, "predict_proba"):
                probas = model.predict_proba(X_test)
            else:
                ovr_model = OneVsRestClassifier(model)
                ovr_model.fit(X_train, y_train)
                probas = ovr_model.predict_proba(X_test)

            proba_df = pd.DataFrame(probas, columns=model.classes_).reindex(columns=class_order, fill_value=0)
            y_test_bin = label_binarize(y_test, classes=class_order)

            for idx, class_name in enumerate(class_order):
                y_true = y_test_bin[:, idx]
                if y_true.min() == y_true.max():
                    continue
                fpr, tpr, _ = roc_curve(y_true, proba_df.iloc[:, idx])
                auc = roc_auc_score(y_true, proba_df.iloc[:, idx])
                axes[1].plot(fpr, tpr, label=f"{class_name} (AUC={auc:.2f})")

            axes[1].plot([0, 1], [0, 1], "k--", linewidth=1)
            axes[1].set_title(f"{name} ROC Curve")
            axes[1].set_xlabel("False Positive Rate")
            axes[1].set_ylabel("True Positive Rate")
            axes[1].legend(loc="lower right", fontsize=8)

            plt.tight_layout()
            plt.show()

            return {
                "Model": name,
                "Accuracy": accuracy,
                "Precision": precision,
                "Recall": recall,
                "F1 Score": f1,
                "RMSE": rmse,
            }


        knn_model = Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("knn", KNeighborsClassifier(n_neighbors=5)),
            ]
        )
        nb_model = Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("nb", GaussianNB()),
            ]
        )

        results = []
        results.append(evaluate_model("KNN", knn_model, X_train, X_test, y_train, y_test, label_order))
        results.append(evaluate_model("Naive Bayes", nb_model, X_train, X_test, y_train, y_test, label_order))

        display(pd.DataFrame(results).sort_values(by="F1 Score", ascending=False))
        """
    ).strip()

    clustering_code = textwrap.dedent(
        """
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        k_values = list(range(2, 11))
        inertias = []
        silhouettes = []

        for k in k_values:
            km = KMeans(n_clusters=k, n_init=20, random_state=42)
            labels = km.fit_predict(X_scaled)
            inertias.append(km.inertia_)
            silhouettes.append(silhouette_score(X_scaled, labels))

        x = np.array(k_values)
        y_inertia = np.array(inertias)
        line_vec = np.array([x[-1] - x[0], y_inertia[-1] - y_inertia[0]], dtype=float)
        line_vec = line_vec / np.linalg.norm(line_vec)
        start = np.array([x[0], y_inertia[0]], dtype=float)
        distances = []
        for xi, yi in zip(x, y_inertia):
            point = np.array([xi, yi], dtype=float)
            vec = point - start
            projection = start + np.dot(vec, line_vec) * line_vec
            distances.append(np.linalg.norm(point - projection))
        optimal_k = int(x[np.argmax(distances)])

        plt.figure(figsize=(10, 5))
        plt.plot(k_values, inertias, marker="o", color="#1d3557")
        plt.axvline(optimal_k, color="#e63946", linestyle="--", label=f"Optimal K = {optimal_k}")
        plt.title("Elbow Method for K-Means")
        plt.xlabel("Number of Clusters (K)")
        plt.ylabel("Inertia")
        plt.legend()
        plt.tight_layout()
        plt.show()

        kmeans = KMeans(n_clusters=optimal_k, n_init=20, random_state=42)
        kmeans_labels = kmeans.fit_predict(X_scaled)
        kmeans_silhouette = silhouette_score(X_scaled, kmeans_labels)

        agg = AgglomerativeClustering(n_clusters=optimal_k, linkage="ward")
        agg_labels = agg.fit_predict(X_scaled)
        agg_silhouette = silhouette_score(X_scaled, agg_labels)

        cluster_compare = pd.DataFrame(
            {
                "Technique": ["K-Means", "Agglomerative Clustering"],
                "Clusters": [optimal_k, optimal_k],
                "Silhouette Score": [kmeans_silhouette, agg_silhouette],
            }
        )
        display(cluster_compare)

        linkage_matrix = linkage(X_scaled, method="ward")
        plt.figure(figsize=(16, 6))
        dendrogram(linkage_matrix, truncate_mode="lastp", p=30, leaf_rotation=45, leaf_font_size=10)
        plt.title("Agglomerative Clustering Dendrogram")
        plt.xlabel("Cluster Group")
        plt.ylabel("Distance")
        plt.tight_layout()
        plt.show()
        """
    ).strip()

    pca_code = textwrap.dedent(
        """
        pca = PCA()
        pca_all = pca.fit_transform(X_scaled)
        explained = pca.explained_variance_ratio_

        plt.figure(figsize=(10, 5))
        plt.bar(range(1, len(explained) + 1), explained, color="#457b9d")
        plt.plot(range(1, len(explained) + 1), np.cumsum(explained), marker="o", color="#e76f51")
        plt.title("PCA Explained Variance")
        plt.xlabel("Principal Component")
        plt.ylabel("Explained Variance Ratio")
        plt.tight_layout()
        plt.show()

        pca_2 = PCA(n_components=2)
        components = pca_2.fit_transform(X_scaled)
        pca_df = pd.DataFrame(components, columns=["PC1", "PC2"])
        pca_df["VHI_Class"] = y.reset_index(drop=True)
        pca_df["KMeans_Cluster"] = kmeans_labels
        pca_df["Agg_Cluster"] = agg_labels

        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        sns.scatterplot(data=pca_df, x="PC1", y="PC2", hue="VHI_Class", palette="Set2", ax=axes[0], s=40)
        axes[0].set_title("PCA Projection by VHI Class")

        sns.scatterplot(data=pca_df, x="PC1", y="PC2", hue="KMeans_Cluster", palette="tab10", ax=axes[1], s=40)
        axes[1].set_title("K-Means Clusters in PCA Space")

        sns.scatterplot(data=pca_df, x="PC1", y="PC2", hue="Agg_Cluster", palette="tab10", ax=axes[2], s=40)
        axes[2].set_title("Agglomerative Clusters in PCA Space")

        for ax in axes:
            ax.legend(loc="best", fontsize=8)
        plt.tight_layout()
        plt.show()

        loadings = pd.DataFrame(
            pca_2.components_.T,
            index=feature_cols,
            columns=["PC1 Loading", "PC2 Loading"],
        )
        display(loadings)
        """
    ).strip()

    summary_code = textwrap.dedent(
        """
        summary = pd.DataFrame(results).sort_values(by="F1 Score", ascending=False).reset_index(drop=True)
        print("Final supervised model comparison:")
        display(summary)
        print("Clustering comparison:")
        display(cluster_compare.sort_values(by="Silhouette Score", ascending=False).reset_index(drop=True))
        """
    ).strip()

    return [
        nbformat.v4.new_markdown_cell(intro_md),
        nbformat.v4.new_code_cell(imports_code),
        nbformat.v4.new_markdown_cell("## Data Loading And Target Creation"),
        nbformat.v4.new_code_cell(load_code),
        nbformat.v4.new_markdown_cell("## Exploratory Data Analysis (EDA)"),
        nbformat.v4.new_code_cell(eda_code),
        nbformat.v4.new_markdown_cell("## Data Preprocessing"),
        nbformat.v4.new_code_cell(preprocess_code),
        nbformat.v4.new_markdown_cell("## KNN And Naive Bayes"),
        nbformat.v4.new_code_cell(model_code),
        nbformat.v4.new_markdown_cell("## K-Means And Hierarchical Clustering"),
        nbformat.v4.new_code_cell(clustering_code),
        nbformat.v4.new_markdown_cell("## PCA"),
        nbformat.v4.new_code_cell(pca_code),
        nbformat.v4.new_markdown_cell("## Final Comparison"),
        nbformat.v4.new_code_cell(summary_code),
    ]


def build_notebook(csv_name: str, region: str, min_year: int, max_year: int) -> nbformat.NotebookNode:
    nb = nbformat.v4.new_notebook()
    nb["cells"] = notebook_cells(csv_name, region, min_year, max_year)
    nb["metadata"]["kernelspec"] = {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3",
    }
    nb["metadata"]["language_info"] = {"name": "python", "version": "3.x"}
    return nb


def main() -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    df, region = parse_raw_dataset(RAW_PATH)
    csv_path = TARGET_DIR / CSV_NAME
    notebook_path = TARGET_DIR / NOTEBOOK_NAME

    df.to_csv(csv_path, index=False)

    notebook = build_notebook(CSV_NAME, region, int(df["year"].min()), int(df["year"].max()))
    nbformat.write(notebook, notebook_path)

    client = NotebookClient(notebook, timeout=600, kernel_name="python3", resources={"metadata": {"path": str(TARGET_DIR)}})
    executed = client.execute()
    nbformat.write(executed, notebook_path)

    print(f"Created CSV: {csv_path}")
    print(f"Created notebook: {notebook_path}")
    print(f"Rows saved: {len(df)}")


if __name__ == "__main__":
    main()
