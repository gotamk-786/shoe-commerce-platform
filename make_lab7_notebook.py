import json
import textwrap
from pathlib import Path


def md_cell(text: str):
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in textwrap.dedent(text).strip().splitlines()],
    }


def code_cell(code: str):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in textwrap.dedent(code).strip().splitlines()],
    }


cells = [
    md_cell(
        """
        # DS Lab Task 7

        This notebook uses:

        - Decision Tree with `entropy`
        - Decision Tree with `gini`
        - KNN

        The given student dataset is used first.  
        The `Iris` dataset is used as the second dataset for comparison.
        """
    ),
    code_cell(
        """
        import math
        import pandas as pd
        from sklearn.compose import ColumnTransformer
        from sklearn.impute import SimpleImputer
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
        from sklearn.model_selection import train_test_split
        from sklearn.neighbors import KNeighborsClassifier
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import OneHotEncoder, LabelEncoder, StandardScaler
        from sklearn.tree import DecisionTreeClassifier
        from sklearn.datasets import load_iris
        """
    ),
    md_cell(
        """
        ## Dataset 1: Student Performance

        This is the dataset given in the task.  
        `Attendance (%)` has text and number, so it is split into two parts.
        """
    ),
    code_cell(
        """
        student_data = [
            [1, "High", "High 90", "Good", "Yes", "P"],
            [2, "Medium", "High 85", "Average", "Yes", "P"],
            [3, "Medium", "Low 40", "Poor", "No", "F"],
            [4, "Low", "Low 60", "Poor", "No", "F"],
            [5, "High", "High 82", "Average", "Yes", "P"],
            [6, "Low", "High 80", "Poor", "No", "F"],
            [7, "High", "Low 60", "Good", "Yes", "P"],
            [8, "Medium", "High 85", "Good", "Yes", "P"],
            [9, "Low", "Low 55", "Poor", "No", "F"],
            [10, "High", "High 95", "Good", "No", "P"],
        ]

        student_df = pd.DataFrame(
            student_data,
            columns=[
                "ID",
                "Study Hours",
                "Attendance",
                "Previous Grades",
                "Assignments Completed",
                "Class",
            ],
        )

        student_df["Attendance Level"] = student_df["Attendance"].str.split().str[0]
        student_df["Attendance Percent"] = student_df["Attendance"].str.split().str[1].astype(int)
        student_df = student_df.drop(columns=["Attendance"])
        student_df
        """
    ),
    md_cell(
        """
        ## Entropy and Gini

        This part calculates entropy, information gain, gini index, and gini gain.
        """
    ),
    code_cell(
        """
        def entropy(values):
            total = len(values)
            counts = pd.Series(values).value_counts()
            return -sum((count / total) * math.log2(count / total) for count in counts)


        def gini_index(values):
            total = len(values)
            counts = pd.Series(values).value_counts()
            return 1 - sum((count / total) ** 2 for count in counts)


        def weighted_impurity(df, feature, target, impurity_func):
            total = len(df)
            score = 0
            for _, subset in df.groupby(feature):
                score += (len(subset) / total) * impurity_func(subset[target])
            return score


        def feature_scores(df, features, target):
            base_entropy = entropy(df[target])
            base_gini = gini_index(df[target])
            rows = []

            for feature in features:
                feature_entropy = weighted_impurity(df, feature, target, entropy)
                feature_gini = weighted_impurity(df, feature, target, gini_index)
                rows.append(
                    {
                        "Feature": feature,
                        "Entropy After Split": round(feature_entropy, 4),
                        "Information Gain": round(base_entropy - feature_entropy, 4),
                        "Gini After Split": round(feature_gini, 4),
                        "Gini Gain": round(base_gini - feature_gini, 4),
                    }
                )

            return pd.DataFrame(rows).sort_values(
                by=["Information Gain", "Gini Gain"], ascending=False
            )


        target_col = "Class"
        feature_cols = [
            "Study Hours",
            "Attendance Level",
            "Attendance Percent",
            "Previous Grades",
            "Assignments Completed",
        ]

        print("Base Entropy:", round(entropy(student_df[target_col]), 4))
        print("Base Gini Index:", round(gini_index(student_df[target_col]), 4))
        score_table = feature_scores(student_df, feature_cols, target_col)
        score_table
        """
    ),
    md_cell(
        """
        ## Compare Models on Dataset 1

        Here we compare Decision Tree (`gini` and `entropy`) and KNN on the given dataset.
        """
    ),
    code_cell(
        """
        X_student = student_df[feature_cols]
        y_student = student_df[target_col]

        categorical_cols = ["Study Hours", "Attendance Level", "Previous Grades", "Assignments Completed"]
        numeric_cols = ["Attendance Percent"]

        preprocessor = ColumnTransformer(
            transformers=[
                (
                    "cat",
                    Pipeline(
                        steps=[
                            ("imputer", SimpleImputer(strategy="most_frequent")),
                            ("encoder", OneHotEncoder(handle_unknown="ignore")),
                        ]
                    ),
                    categorical_cols,
                ),
                (
                    "num",
                    Pipeline(
                        steps=[
                            ("imputer", SimpleImputer(strategy="median")),
                            ("scaler", StandardScaler()),
                        ]
                    ),
                    numeric_cols,
                ),
            ]
        )

        X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(
            X_student, y_student, test_size=0.3, random_state=42, stratify=y_student
        )

        student_models = {
            "Decision Tree (Gini)": Pipeline(
                steps=[
                    ("prep", preprocessor),
                    ("model", DecisionTreeClassifier(criterion="gini", random_state=42, max_depth=3)),
                ]
            ),
            "Decision Tree (Entropy)": Pipeline(
                steps=[
                    ("prep", preprocessor),
                    ("model", DecisionTreeClassifier(criterion="entropy", random_state=42, max_depth=3)),
                ]
            ),
            "KNN": Pipeline(
                steps=[
                    ("prep", preprocessor),
                    ("model", KNeighborsClassifier(n_neighbors=3)),
                ]
            ),
        }

        student_results = []
        for name, model in student_models.items():
            model.fit(X_train_s, y_train_s)
            preds = model.predict(X_test_s)
            student_results.append(
                {
                    "Model": name,
                    "Accuracy": round(accuracy_score(y_test_s, preds), 4),
                    "Confusion Matrix": confusion_matrix(y_test_s, preds).tolist(),
                }
            )
            print(f"\\n{name}")
            print("Accuracy:", round(accuracy_score(y_test_s, preds), 4))
            print("Confusion Matrix:\\n", confusion_matrix(y_test_s, preds))
            print(classification_report(y_test_s, preds, zero_division=0))

        pd.DataFrame(student_results).sort_values(by="Accuracy", ascending=False)
        """
    ),
    md_cell(
        """
        ## Dataset 2: Iris

        This is the second dataset used for comparison.
        """
    ),
    code_cell(
        """
        iris = load_iris(as_frame=True)
        iris_df = iris.frame.copy()
        iris_df["target_name"] = iris_df["target"].map(dict(enumerate(iris.target_names)))
        iris_df.head()
        """
    ),
    code_cell(
        """
        X_iris = iris.data
        y_iris = iris.target

        X_train_i, X_test_i, y_train_i, y_test_i = train_test_split(
            X_iris, y_iris, test_size=0.3, random_state=42, stratify=y_iris
        )

        iris_models = {
            "Decision Tree (Gini)": DecisionTreeClassifier(criterion="gini", random_state=42, max_depth=3),
            "Decision Tree (Entropy)": DecisionTreeClassifier(criterion="entropy", random_state=42, max_depth=3),
            "KNN": Pipeline(
                steps=[
                    ("scaler", StandardScaler()),
                    ("model", KNeighborsClassifier(n_neighbors=5)),
                ]
            ),
        }

        iris_results = []
        for name, model in iris_models.items():
            model.fit(X_train_i, y_train_i)
            preds = model.predict(X_test_i)
            iris_results.append(
                {
                    "Model": name,
                    "Accuracy": round(accuracy_score(y_test_i, preds), 4),
                    "Confusion Matrix": confusion_matrix(y_test_i, preds).tolist(),
                }
            )
            print(f"\\n{name}")
            print("Accuracy:", round(accuracy_score(y_test_i, preds), 4))
            print("Confusion Matrix:\\n", confusion_matrix(y_test_i, preds))
            print(classification_report(y_test_i, preds, zero_division=0))

        pd.DataFrame(iris_results).sort_values(by="Accuracy", ascending=False)
        """
    ),
    md_cell(
        """
        ## Summary

        - Dataset 1 is the student dataset.
        - Dataset 2 is the Iris dataset.
        - Entropy and gini are calculated for dataset 1.
        - Decision Tree and KNN are compared on both datasets.
        """
    ),
]

notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.11",
        },
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

Path("lab7_student_decision_tree_comparison.ipynb").write_text(
    json.dumps(notebook, indent=2),
    encoding="utf-8",
)
