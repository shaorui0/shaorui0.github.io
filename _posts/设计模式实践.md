# 单例模式
## C++写单例模式

1. 针对面试而言：饿汉（Eager）、饱汉（lazy）、DCL
    https://zhuanlan.zhihu.com/p/232319083
    - 所谓饱汉调用时才创建
    ```cpp
    // ...
    static T& GetInstance()
    ```
    - 所谓饿汉类加载时就创建
    ```cpp
    // Class defination

    // Init
    template<typename T>
    T* EagerSingleton<T>::t_ = new (std::nothrow) T;
    ```
    - DCL（双重锁判断），是对 lazy Init 的线程安全改进，通过两次判断创建成功
        > 但似乎 DCL 也是靠不住的。（《Linux 多线程服务端编程》 2.5 章）

2. 一个比较现代的单例模式写法，通过 `pthread_once` 保证
https://github.com/shaorui0/recipes-1/blob/master/thread/Singleton.h#L44

```cpp
template
class Singleton : noncopyable
{
public:
    static T& instance()
    {
        pthread_once(&ponce_, &Singleton::init);
        return *value_;
    }

private:
    // constructor / destructor
    static void init()
    {
        value_ = new T();
    }
private:
    static pthread_once_t ponce_;
    static T* value_;
}

// header file 中定义
template...
pthread_once_t Singleton<T>::ponce_ = PTHREAD_ONCE_INIT; // 通过这个参数传进来

template...
T* Singleton<T>::value_ = NULL;


//使用
Foo& foo = Singleton<Foo>::instance();
```

## Python 写单例模式
https://www.stackabuse.com/creational-design-patterns-in-python/#singleton
```py
from typing import Optional

class MetaSingleton(type):
    _instance : Optional[type] = None
    def __call__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(MetaSingleton, cls).__call__(*args, **kwargs)
        return cls._instance

class Foo:
    field = 5

class FooSingleton(Foo, metaclass=MetaSingleton):
    pass

a = FooSingleton()
b = FooSingleton()

a == b
```
