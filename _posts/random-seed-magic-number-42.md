#  random - seed - magic number 42

__ 发表于 2021-03-09

### seed 是干什么的？

  1. 注意 random 是不是真正的『随机』，而是伪随机，计算机会根据某个值进行随机数生成，生成的方式在 python 里面是通过 generator
  2. 在这个基础上才有为什么需要 `seed`
  3. `seed`在实践中一个重要的作用就是『可重现性』，用于测试 
    1  
    2  
    3  
    4  
    5  
    6  
    7  
    8  
    9  
    10  
    11  
    12  
    13  
    14  
    import random   
    random.seed(3)   
    # print a random number between 1 and 1000.   
    print(random.randint(1, 1000))   
    # if you want to get the same random number again then,   
    random.seed(3)    
    print(random.randint(1, 1000))   
    # If seed function is not used   
    # Gives totally unpredictable responses.   
    print(random.randint(1, 1000))   

  4. [`seed`值设置为`42`是一件比较 geek 风情的事](https://medium.com/@leticia.b/the-story-of-seed-42-874953452b94)

PS1: 如果不标注 random 的范围， 值区间在 (0, 1)

PS2: 如果不标注 seed ，seed 默认当前时间戳
