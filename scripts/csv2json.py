import csv
import json

tweets = []
with open("../data/tweets.csv", encoding='utf-8') as csvf:
    csvReader = csv.DictReader(csvf)
    for row in csvReader:
        tweets.append(row)

with open("../data/tweets.json", "w", encoding='utf-8') as jsonf:
    jsonString = json.dumps(tweets, indent=4)
    jsonf.write(jsonString)