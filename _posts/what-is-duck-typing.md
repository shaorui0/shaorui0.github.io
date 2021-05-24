#  What is duck typing

__ 发表于 2021-02-16 __ 更新于 2021-02-17

> Duck typing means that an operation does not formally specify the
requirements that its operands have to meet, but just **tries** it out with
What is given.

```
    def f(x):  
        x.Quack()  
```
不管x传进来的是什么，当x有`Quack`方法时，这个程序就能正常执行，当x没有这个方法，程序就会在`runtime`保报错。

静态语言其实也有类似的用法
```
    template <typename T>  
    void f(T x) { x.Quack(); }  
```
[ref: what-is-duck-typing](https://stackoverflow.com/questions/4205130/what-
is-duck-typing)
