import numpy as np


states = ["Red", "Blue"]

transition_matrix = np.array(
    [
        [0.5, 0.5],
        [0.5, 0.5],
    ]
)


def simulate_markov_process(initial_state, steps):
    current_state = initial_state
    sequence = [current_state]

    for _ in range(steps):
        if current_state == "Red":
            next_state = np.random.choice(states, p=transition_matrix[0])
        else:
            next_state = np.random.choice(states, p=transition_matrix[1])

        sequence.append(next_state)
        current_state = next_state

    return sequence


initial_state = "Red"
steps = 10
result = simulate_markov_process(initial_state, steps)

print("State sequence:")
print(" -> ".join(result))
