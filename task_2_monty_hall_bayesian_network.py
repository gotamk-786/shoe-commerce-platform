from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
from pgmpy.models import DiscreteBayesianNetwork


# Guest chooses a door, prize is behind a door, and Monty opens one door.
model = DiscreteBayesianNetwork(
    [
        ("Guest", "Monty"),
        ("Prize", "Monty"),
    ]
)

cpd_guest = TabularCPD(
    variable="Guest",
    variable_card=3,
    values=[[1 / 3], [1 / 3], [1 / 3]],
    state_names={"Guest": [1, 2, 3]},
)

cpd_prize = TabularCPD(
    variable="Prize",
    variable_card=3,
    values=[[1 / 3], [1 / 3], [1 / 3]],
    state_names={"Prize": [1, 2, 3]},
)

cpd_monty = TabularCPD(
    variable="Monty",
    variable_card=3,
    values=[
        [0, 0, 0, 0, 1, 0.5, 0, 0.5, 1],
        [0.5, 0, 1, 0, 0, 0, 1, 0.5, 0],
        [0.5, 1, 0, 1, 0, 0.5, 0, 0, 0],
    ],
    evidence=["Guest", "Prize"],
    evidence_card=[3, 3],
    state_names={
        "Monty": [1, 2, 3],
        "Guest": [1, 2, 3],
        "Prize": [1, 2, 3],
    },
)

model.add_cpds(cpd_guest, cpd_prize, cpd_monty)
assert model.check_model()

infer = VariableElimination(model)
result = infer.query(variables=["Prize"], evidence={"Guest": 1, "Monty": 3})

print("Prize probabilities when Guest=1 and Monty=3:")
print(result)
print()
print("Probability of winning by sticking with door 1:", result.values[0])
print("Probability of winning by switching to door 2:", result.values[1])
