import csv
import json

tweets = {}
with open("../data/tweets2.csv", encoding='utf-8') as csvf:
    csvReader = csv.DictReader(csvf)
    for row in csvReader:
        if row["int_amount"] not in tweets:
            tweets[row["int_amount"]] = row
            tweets[row["int_amount"]]["other_tweets"] = []
        else:
            tweets[row["int_amount"]]["other_tweets"].append(row)

with open("../data/all_tweets.json", "w", encoding='utf-8') as jsonf:
    jsonString = json.dumps(list(tweets.values()), indent=4)
    jsonf.write(jsonString)