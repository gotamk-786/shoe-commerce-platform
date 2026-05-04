import random


# Standard deck of cards
suits = ["Hearts", "Diamonds", "Clubs", "Spades"]
ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"]
deck = [(rank, suit) for suit in suits for rank in ranks]

# Only face cards
face_cards = [card for card in deck if card[0] in ["Jack", "Queen", "King"]]

trials = 100000
king_count = 0

for _ in range(trials):
    card = random.choice(face_cards)
    if card[0] == "King":
        king_count += 1

theoretical_probability = 4 / 12
simulated_probability = king_count / trials

print("Face cards:", face_cards)
print("Theoretical P(King | Face card):", round(theoretical_probability, 3))
print("Simulated P(King | Face card):", round(simulated_probability, 3))
