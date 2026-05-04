from pgmpy.factors.discrete import TabularCPD
from pgmpy.inference import VariableElimination
from pgmpy.models import DiscreteBayesianNetwork


model = DiscreteBayesianNetwork(
    [
        ("Burglary", "Alarm"),
        ("Earthquake", "Alarm"),
        ("Alarm", "David_calls"),
        ("Alarm", "Sophia_calls"),
    ]
)

cpd_burglary = TabularCPD(
    variable="Burglary",
    variable_card=2,
    values=[[0.999], [0.001]],
    state_names={"Burglary": ["False", "True"]},
)

cpd_earthquake = TabularCPD(
    variable="Earthquake",
    variable_card=2,
    values=[[0.998], [0.002]],
    state_names={"Earthquake": ["False", "True"]},
)

cpd_alarm = TabularCPD(
    variable="Alarm",
    variable_card=2,
    values=[
        [0.999, 0.71, 0.06, 0.05],
        [0.001, 0.29, 0.94, 0.95],
    ],
    evidence=["Burglary", "Earthquake"],
    evidence_card=[2, 2],
    state_names={
        "Alarm": ["False", "True"],
        "Burglary": ["False", "True"],
        "Earthquake": ["False", "True"],
    },
)

cpd_david = TabularCPD(
    variable="David_calls",
    variable_card=2,
    values=[[0.95, 0.1], [0.05, 0.9]],
    evidence=["Alarm"],
    evidence_card=[2],
    state_names={
        "David_calls": ["False", "True"],
        "Alarm": ["False", "True"],
    },
)

cpd_sophia = TabularCPD(
    variable="Sophia_calls",
    variable_card=2,
    values=[[0.99, 0.3], [0.01, 0.7]],
    evidence=["Alarm"],
    evidence_card=[2],
    state_names={
        "Sophia_calls": ["False", "True"],
        "Alarm": ["False", "True"],
    },
)

model.add_cpds(cpd_burglary, cpd_earthquake, cpd_alarm, cpd_david, cpd_sophia)
assert model.check_model()

infer = VariableElimination(model)

alarm_given_burglary_true = infer.query(variables=["Alarm"], evidence={"Burglary": "True"})
alarm_given_burglary_false = infer.query(variables=["Alarm"], evidence={"Burglary": "False"})
burglary_given_alarm_true = infer.query(variables=["Burglary"], evidence={"Alarm": "True"})

print("P(Alarm=True | Burglary=True):", alarm_given_burglary_true.values[1])
print("P(Alarm=True | Burglary=False):", alarm_given_burglary_false.values[1])
print("P(Burglary=True | Alarm=True):", burglary_given_alarm_true.values[1])
