import csv

source = open("perks.csv")
destination = open("perks.temp", "w")

table = csv.DictReader(source)

rows = []
names = []

groups = [
    "General",
    "Physics",
    "Stuff",
    "Spiritual",
    "Psychic",
    "Martial",
    "Alchemy",
    "Magic",
    "Eldritch",
    "Planar",
    "Powers"
]

for row in table:
    rows.append(row)
    names.append(row["Name"])

for row in rows:
    if(row['Repeatable'].lower() == "max"):
        row['Repeatable'] = "0"
    dependencies = row['Dependency'].split(";")
    while("None" in dependencies):
        dependencies.remove("None")
    dependencies = ",".join([str(names.index(dependency)) for dependency in dependencies])
    destination.write(f"new perk(\"{row['Name']}\", \"{row['Description']}\", {row['Cost']}n, {row['Repeatable']}n, [{dependencies}], {groups.index(row['Group'])})\n")
    # new perk("test 4", "test perk 4", 200n, 0n, [1], 1)

source.close()
destination.close()