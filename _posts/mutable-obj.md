#  mutable object

__ 发表于 2021-02-16 __ 更新于 2021-02-22


# 不可变对象  
```py
i = 77  
j = 77  
i is j # True  
# check id(like addr)  
print(id(i), id(j))  
j += 1  
print(id(i), id(j))  
# 可变对象  
a_list = [1,2,3]  
b_list = a_list  
print(id(a_list), id(b_list))  
a_list[2] = 5  
print(id(a_list), id(b_list))  
```

不可变对象，当i修改，i、j此时就指向不同的地方了。

而可变对象，由于底层一些引用计数的关系，还是指向同一个地址的数据。
