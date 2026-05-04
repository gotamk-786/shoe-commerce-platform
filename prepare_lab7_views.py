import contextlib
import io
import json
from pathlib import Path


ROOT = Path.cwd()
NB_PATH = ROOT / "lab7_student_decision_tree_comparison.ipynb"
CODE_PATH = ROOT / "lab7_code_view.py"
OUTPUT_PATH = ROOT / "lab7_output_view.txt"


def main():
    nb = json.loads(NB_PATH.read_text(encoding="utf-8"))
    code_cells = [cell for cell in nb["cells"] if cell["cell_type"] == "code"]

    code_parts = []
    for cell in code_cells:
        src = "".join(cell["source"]).strip()
        if src:
            code_parts.append(src)
    code_text = "\n\n".join(code_parts) + "\n"
    CODE_PATH.write_text(code_text, encoding="utf-8")

    namespace = {"__name__": "__main__"}
    captured = io.StringIO()
    with contextlib.redirect_stdout(captured):
        exec(compile(code_text, str(CODE_PATH), "exec"), namespace)

    OUTPUT_PATH.write_text(captured.getvalue(), encoding="utf-8")
    print(f"Created: {CODE_PATH}")
    print(f"Created: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
