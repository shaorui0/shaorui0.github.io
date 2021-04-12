#  iterator, generator and decorator

__ 发表于 2020-12-16 __ 更新于 2021-02-22

## 装饰器

### What is ?

  1. 一种语法糖，能够使得修改函数变得容易
  2. 典型的实现是通过使用闭包  
def foo(x):

def bar(y):

     # do something to y

return bar(x) * x

### why need?

其实就是为了能够更好的在普通函数上增加一些额外的功能

通过在语言级别加一些语法糖，能够更方便的使用功能，一切为了简单。

### in action

日志：普通函数、扩展类成员函数

# 迭代器、生成器

为什么两个要一起说。生成器是在可迭代对象的基础上工作的。

## 可迭代对象

在python里面，能够for-in遍历的，都是可迭代对象

可迭代对象的底层是两个函数实现 `__iter__`, `__getitem__`，

显然list、dict、tuple、str都是可迭代的

### iter(iterable_obj) => iterator

[https://www.jb51.net/article/149093.htm](https://www.jb51.net/article/149093.
htm)

## 迭代器

迭代器是访问集合元素的一种方式。能通过for-in遍历，**并且能够使用next()进行迭代**

主要的不同点就是可以使用next()进行遍历，并且对长度未知，比如一个典型的fib功能可以无限迭代。

同时是惰性的，边迭代边求值。

TODO 写一个典型的迭代器class fib

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
    class Fib:  
        def __init__(self):  
        def __iter__self):  
            return self  
        def __next__self):  

`next(obj) => obj.__next__()`

基础的数据类型（list等）都不是迭代器，因为没有next()方法

## 闭包

> Objects are data with methods attached, closures are functions with data
attached.

[closure-in-python](https://stackoverflow.com/questions/18274051/closure-in-
python)

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
    def make_counter():  
        i = 0  
        def counter(): # counter() is a closure  
            nonlocal i # python3  
            i += 1  
            return i  
        return counter  
    c1 = make_counter()  
    c2 = make_counter()  
    print (c1(), c1(), c2(), c2())  
    # -> 1 2 1 2  

## 生成器

yield相当于提供了一个语言层面的功能来帮助实现生成器

> A generator is simply a function which returns an object on which you can
call next, such that for every call it returns some value, until it raises a
StopIteration exception, signaling that all values have been generated. Such
an object is called an iterator.

[generators-in-
python](https://stackoverflow.com/questions/1756096/understanding-generators-
in-python)

其实本质就是建立在迭代器之上，但是这个迭代器是一个对象，通过yield对这个对象进行迭代，直到`StopIteration` exception
