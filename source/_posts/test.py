import os
file_list = []
for file in os.listdir("/home/blog/source/_posts"):
    if file.endswith(".md"):
        file_list.append(os.path.join("/home/blog/source/_posts", file))


for file_path in file_list:
    # list to store file lines
    lines = []
    new_lines = []
    # read file
    with open(file_path, 'r') as fp:
        # read an store all lines into list
        lines = fp.readlines()
    print(lines)
    for n, line in enumerate(lines):
        if "[ __" in line:
            new_lines = lines[:n]
    print(new_lines)
    # Write file
    with open(file_path, 'w') as fp:
        # iterate each line
        for number, line in enumerate(new_lines):
            # delete line 5 and 8. or pass any Nth line you want to remove
            # note list index starts from 0
            print(number)
            continue