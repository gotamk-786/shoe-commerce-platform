from __future__ import annotations

import re
import textwrap
from pathlib import Path

import nbformat
import pandas as pd
from nbclient import NotebookClient


RAW_PATH = Path(r"C:\Users\Al-Barakah\Desktop\daatasc#2\23k0503_raw.html")
TARGET_DIR = Path(r"C:\Users\Al-Barakah\Desktop\daatasc#2")
CSV_NAME = "23k_0503_DS_quiz2.csv"
NOTEBOOK_NAME = "23k_0503_DS_quiz2.ipynb"


def parse_noaa_text(raw_path: Path) -> tuple[pd.DataFrame, str]:
    text = raw_path.read_text(encoding="utf-8")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    title = lines[0]
    match = re.search(r"Province=\s*(\d+):\s*([^,]+)", title)
    region = match.group(2).strip() if match else "Unknown Region"

    rows: list[list[float]] = []
    for line in lines[2:]:
        if not re.match(r"^\d{4},", line):
            continue
        parts = [part.strip() for part in line.rstrip(",").split(",")]
        if len(parts) != 7:
            continue
        year, week = int(parts[0]), int(parts[1])
        values = list(map(float, parts[2:]))
        if year <= 2025:
            rows.append([year, week, *values])

    df = pd.DataFrame(rows, columns=["year", "week", "SMN", "SMT", "VCI", "TCI", "VHI"])
    df["Date"] = pd.to_datetime(
        df["year"].astype(str) + df["week"].astype(str).str.zfill(2) + "1",
        format="%G%V%u",
        errors="coerce",
    )
    return df, region


def build_cells(csv_name: str, region: str, min_year: int, max_year: int) -> list:
    intro = textwrap.dedent(
        f"""
        # DS Quiz 2 Analysis

        **Dataset overview**

        This notebook analyzes the **NOAA STAR Vegetation Health** weekly dataset assigned to roll number **23K-0503**. The series belongs to **{region}, Pakistan** and covers the period **{min_year} to {max_year}**, with every record from **2026 excluded** before analysis. The available variables are:

        - `year`
        - `week`
        - `SMN` for soil moisture related signal
        - `SMT` for surface temperature
        - `VCI` for Vegetation Condition Index
        - `TCI` for Temperature Condition Index
        - `VHI` for Vegetation Health Index

        **Target variable for classification**

        A categorical variable named **VHI_Class** is created from `VHI`:

        - `0 <= VHI < 10` -> Extreme Drought
        - `10 <= VHI < 20` -> Severe Drought
        - `20 <= VHI < 30` -> Moderate Drought
        - `30 <= VHI < 40` -> Mild Drought
        - `VHI >= 40` -> No Drought Condition
        """
    ).strip()

    imports = textwrap.dedent(
        f"""
        import warnings
        warnings.filterwarnings("ignore")

        import numpy as np
        import pandas as pd
        import matplotlib.pyplot as plt
        import seaborn as sns

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
        from sklearn.naive_bayes import GaussianNB
        from sklearn.neighbors import KNeighborsClassifier
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import LabelEncoder, StandardScaler, label_binarize

        sns.set_theme(style="ticks", palette="deep")
        plt.rcParams["figure.figsize"] = (11, 5)

        CSV_PATH = r"{csv_name}"
        """
    ).strip()

    load_and_prep = textwrap.dedent(
        """
        df = pd.read_csv(CSV_PATH, parse_dates=["Date"])
        numeric_cols = ["SMN", "SMT", "VCI", "TCI", "VHI"]

        print("Original shape:", df.shape)
        print("Year span:", int(df["year"].min()), "to", int(df["year"].max()))
        print("Sentinel -1 counts before cleaning:")
        display((df[numeric_cols] == -1).sum().to_frame("count").T)

        df[numeric_cols] = df[numeric_cols].replace(-1, np.nan)
        df[numeric_cols] = df[numeric_cols].interpolate(method="linear", limit_direction="both")
        df = df.drop_duplicates().copy()

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

        print("Missing values after cleaning:")
        display(df.isna().sum().to_frame("missing_count").T)
        display(df.sample(5, random_state=42))
        """
    ).strip()

    eda_summary = textwrap.dedent(
        """
        summary_stats = df[["SMN", "SMT", "VCI", "TCI", "VHI"]].describe().round(3)
        drought_counts = df["VHI_Class"].value_counts().reindex(
            ["Extreme Drought", "Severe Drought", "Moderate Drought", "Mild Drought", "No Drought Condition"]
        )

        print("Summary statistics")
        display(summary_stats)
        print("Class distribution")
        display(drought_counts.to_frame("count"))

        yearly_summary = df.groupby("year")[["VCI", "TCI", "VHI"]].mean().round(2)
        display(yearly_summary.tail(10))
        """
    ).strip()

    eda_plots = textwrap.dedent(
        """
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))

        sns.lineplot(data=df, x="Date", y="VHI", ax=axes[0, 0], color="#264653", linewidth=1)
        axes[0, 0].set_title("Full Weekly VHI Time Series")

        recent = df[df["year"] >= 2010]
        sns.lineplot(data=recent, x="Date", y="VCI", ax=axes[0, 1], color="#2a9d8f", linewidth=1.2)
        sns.lineplot(data=recent, x="Date", y="TCI", ax=axes[0, 1], color="#e76f51", linewidth=1.2)
        axes[0, 1].set_title("VCI and TCI Since 2010")

        sns.violinplot(data=df[["SMN", "SMT", "VCI", "TCI", "VHI"]], ax=axes[1, 0], inner="quartile")
        axes[1, 0].set_title("Feature Distribution Overview")
        axes[1, 0].tick_params(axis="x", rotation=20)

        sns.heatmap(df[["year", "week", "SMN", "SMT", "VCI", "TCI", "VHI"]].corr(), annot=True, fmt=".2f", cmap="YlGnBu", ax=axes[1, 1])
        axes[1, 1].set_title("Correlation Matrix")

        plt.tight_layout()
        plt.show()

        plt.figure(figsize=(12, 5))
        drought_counts.plot(kind="bar", color=["#9b2226", "#ca6702", "#ee9b00", "#bb9457", "#0a9396"])
        plt.title("Drought Category Frequency")
        plt.ylabel("Count")
        plt.xticks(rotation=20)
        plt.tight_layout()
        plt.show()

        yearly_vhi = df.groupby("year")["VHI"].mean()
        plt.figure(figsize=(12, 5))
        plt.plot(yearly_vhi.index, yearly_vhi.values, marker="o", color="#3a86ff")
        plt.title("Average Yearly VHI")
        plt.xlabel("Year")
        plt.ylabel("Mean VHI")
        plt.tight_layout()
        plt.show()
        """
    ).strip()

    supervised = textwrap.dedent(
        """
        feature_cols = ["year", "week", "SMN", "SMT", "VCI", "TCI"]
        X = df[feature_cols]
        y = df["VHI_Class"].astype(str)

        class_order = ["Extreme Drought", "Severe Drought", "Moderate Drought", "Mild Drought", "No Drought Condition"]
        encoder = LabelEncoder()
        encoder.fit(class_order)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=7, stratify=y
        )

        def run_classifier(name, model):
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            accuracy = accuracy_score(y_test, preds)
            precision = precision_score(y_test, preds, average="weighted", zero_division=0)
            recall = recall_score(y_test, preds, average="weighted", zero_division=0)
            f1 = f1_score(y_test, preds, average="weighted", zero_division=0)
            rmse = mean_squared_error(encoder.transform(y_test), encoder.transform(preds)) ** 0.5

            print(f"\\n{name}")
            print(classification_report(y_test, preds, zero_division=0))

            fig, axes = plt.subplots(1, 2, figsize=(14, 5))
            cm = confusion_matrix(y_test, preds, labels=class_order)
            ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_order).plot(
                ax=axes[0], xticks_rotation=20, colorbar=False
            )
            axes[0].set_title(f"{name} Confusion Matrix")

            probas = model.predict_proba(X_test)
            proba_df = pd.DataFrame(probas, columns=model.classes_).reindex(columns=class_order, fill_value=0)
            y_test_bin = label_binarize(y_test, classes=class_order)

            for idx, label in enumerate(class_order):
                y_true = y_test_bin[:, idx]
                if y_true.min() == y_true.max():
                    continue
                fpr, tpr, _ = roc_curve(y_true, proba_df.iloc[:, idx])
                auc = roc_auc_score(y_true, proba_df.iloc[:, idx])
                axes[1].plot(fpr, tpr, label=f"{label} (AUC={auc:.2f})")

            axes[1].plot([0, 1], [0, 1], linestyle="--", color="black", linewidth=1)
            axes[1].set_title(f"{name} ROC Curves")
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

        knn = Pipeline([
            ("scaler", StandardScaler()),
            ("knn", KNeighborsClassifier(n_neighbors=7)),
        ])
        nb = Pipeline([
            ("scaler", StandardScaler()),
            ("nb", GaussianNB()),
        ])

        model_results = [
            run_classifier("KNN", knn),
            run_classifier("Naive Bayes", nb),
        ]

        model_results_df = pd.DataFrame(model_results).sort_values(by="F1 Score", ascending=False)
        display(model_results_df)
        """
    ).strip()

    clustering = textwrap.dedent(
        """
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        candidate_k = list(range(2, 10))
        inertia = []
        silhouette_values = []

        for k in candidate_k:
            km = KMeans(n_clusters=k, n_init=25, random_state=7)
            labels = km.fit_predict(X_scaled)
            inertia.append(km.inertia_)
            silhouette_values.append(silhouette_score(X_scaled, labels))

        elbow_df = pd.DataFrame({"K": candidate_k, "Inertia": inertia, "Silhouette": silhouette_values})
        display(elbow_df)

        x = np.array(candidate_k)
        y_inertia = np.array(inertia)
        line = np.array([x[-1] - x[0], y_inertia[-1] - y_inertia[0]], dtype=float)
        line = line / np.linalg.norm(line)
        start = np.array([x[0], y_inertia[0]], dtype=float)
        distances = []
        for xi, yi in zip(x, y_inertia):
            point = np.array([xi, yi], dtype=float)
            offset = point - start
            projection = start + np.dot(offset, line) * line
            distances.append(np.linalg.norm(point - projection))
        optimal_k = int(x[np.argmax(distances)])

        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        axes[0].plot(candidate_k, inertia, marker="o", color="#1d3557")
        axes[0].axvline(optimal_k, linestyle="--", color="#d62828", label=f"Optimal K = {optimal_k}")
        axes[0].set_title("Elbow Method")
        axes[0].set_xlabel("K")
        axes[0].set_ylabel("Inertia")
        axes[0].legend()

        axes[1].plot(candidate_k, silhouette_values, marker="s", color="#2a9d8f")
        axes[1].set_title("Silhouette Score by K")
        axes[1].set_xlabel("K")
        axes[1].set_ylabel("Silhouette Score")
        plt.tight_layout()
        plt.show()

        kmeans = KMeans(n_clusters=optimal_k, n_init=25, random_state=7)
        kmeans_labels = kmeans.fit_predict(X_scaled)
        kmeans_silhouette = silhouette_score(X_scaled, kmeans_labels)

        agglomerative = AgglomerativeClustering(n_clusters=optimal_k, linkage="ward")
        agg_labels = agglomerative.fit_predict(X_scaled)
        agg_silhouette = silhouette_score(X_scaled, agg_labels)

        cluster_metrics = pd.DataFrame(
            {
                "Technique": ["K-Means", "Agglomerative Clustering"],
                "Chosen K": [optimal_k, optimal_k],
                "Silhouette Score": [kmeans_silhouette, agg_silhouette],
            }
        )
        display(cluster_metrics)

        plt.figure(figsize=(15, 6))
        linkage_matrix = linkage(X_scaled, method="ward")
        dendrogram(linkage_matrix, truncate_mode="lastp", p=25, leaf_rotation=35, leaf_font_size=9)
        plt.title("Hierarchical Clustering Dendrogram")
        plt.xlabel("Merged Groups")
        plt.ylabel("Ward Distance")
        plt.tight_layout()
        plt.show()
        """
    ).strip()

    pca = textwrap.dedent(
        """
        pca_model = PCA(n_components=2)
        pca_components = pca_model.fit_transform(X_scaled)

        pca_plot_df = pd.DataFrame(pca_components, columns=["PC1", "PC2"])
        pca_plot_df["KMeans"] = kmeans_labels
        pca_plot_df["Agglomerative"] = agg_labels
        pca_plot_df["VHI_Class"] = y.reset_index(drop=True)

        explained = pd.DataFrame(
            {
                "Component": ["PC1", "PC2"],
                "Explained Variance Ratio": pca_model.explained_variance_ratio_,
            }
        )
        display(explained)

        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        sns.scatterplot(data=pca_plot_df, x="PC1", y="PC2", hue="VHI_Class", ax=axes[0], s=35, palette="Set2")
        axes[0].set_title("PCA Colored by Drought Class")

        sns.scatterplot(data=pca_plot_df, x="PC1", y="PC2", hue="KMeans", ax=axes[1], s=35, palette="tab10")
        axes[1].set_title("PCA with K-Means Clusters")

        sns.scatterplot(data=pca_plot_df, x="PC1", y="PC2", hue="Agglomerative", ax=axes[2], s=35, palette="tab10")
        axes[2].set_title("PCA with Agglomerative Clusters")

        for ax in axes:
            ax.legend(loc="best", fontsize=7)
        plt.tight_layout()
        plt.show()

        loading_df = pd.DataFrame(
            pca_model.components_.T,
            index=feature_cols,
            columns=["PC1 Loading", "PC2 Loading"],
        ).round(4)
        display(loading_df)
        """
    ).strip()

    closing = textwrap.dedent(
        """
        print("Final model comparison")
        display(model_results_df.reset_index(drop=True))
        print("Final clustering comparison")
        display(cluster_metrics.sort_values(by="Silhouette Score", ascending=False).reset_index(drop=True))
        """
    ).strip()

    return [
        nbformat.v4.new_markdown_cell(intro),
        nbformat.v4.new_code_cell(imports),
        nbformat.v4.new_code_cell(load_and_prep),
        nbformat.v4.new_code_cell(eda_summary),
        nbformat.v4.new_code_cell(eda_plots),
        nbformat.v4.new_code_cell(supervised),
        nbformat.v4.new_code_cell(clustering),
        nbformat.v4.new_code_cell(pca),
        nbformat.v4.new_code_cell(closing),
    ]


def main() -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    df, region = parse_noaa_text(RAW_PATH)
    csv_path = TARGET_DIR / CSV_NAME
    nb_path = TARGET_DIR / NOTEBOOK_NAME
    df.to_csv(csv_path, index=False)

    notebook = nbformat.v4.new_notebook()
    notebook["cells"] = build_cells(CSV_NAME, region, int(df["year"].min()), int(df["year"].max()))
    notebook["metadata"]["kernelspec"] = {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3",
    }
    notebook["metadata"]["language_info"] = {"name": "python", "version": "3.x"}
    nbformat.write(notebook, nb_path)

    client = NotebookClient(notebook, timeout=600, kernel_name="python3", resources={"metadata": {"path": str(TARGET_DIR)}})
    executed = client.execute()
    nbformat.write(executed, nb_path)

    print(f"Created CSV: {csv_path}")
    print(f"Created notebook: {nb_path}")
    print(f"Rows saved: {len(df)}")


if __name__ == "__main__":
    main()
