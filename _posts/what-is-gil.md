#  What is the Python Global Interpreter Lock (GIL)?

__ 发表于 2021-02-16 __ 更新于 2021-02-17

> Python is multithreaded, it just doesn’t allow two threads to run Python
code concurrently.

[[from stackoverflow: a-clean-lightweight-alternative-to-pythons-
twisted](https://stackoverflow.com/questions/1824418/a-clean-lightweight-
alternative-to-pythons-twisted)]

## 聊聊python的多线程

[why-is-a-python-i-o-bound-task-not-blocked-by-the-
gil](https://stackoverflow.com/questions/29270818/why-is-a-python-i-o-bound-
task-not-blocked-by-the-gil)

> The GIL in CPython1 is only concerned with Python code being executed. A
thread-safe C extension that uses a lot of CPU might release the GIL as long
as it doesn’t need to interact with the Python runtime.

  1. 搞清楚GIL的级别（抽象在哪一层？）。GIL只是**限制多线程读取Cpython的bytecode**，一次只能有一个线程**execute python bytecode**，但是所有的线程此时都是**running**。
  2. 所以Cpython的C扩展部分，是不限制多线程的。（很多库，比如multithreading或者numpy是C扩展，这个是可以多线程的）

> Releasing the GIL around I/O (blocking or not, using CPU or not) is the same
thing - until the data is moved into Python there is no reason to acquire the
GIL.

  3. 所以关于python的IO bounding，多线程的适用场景完全合适。

本质是需要理解GIL锁了哪些东西，**瓶颈**在哪里？

## GIL解决了什么问题？

GIL本质上解决的是**内存安全**问题。

关于内存安全，一些程序语言是手工处理（c/c++），一些语言是gc（java），而python（也还有其他的）是GIL。

python中，内存对象主要通过**引用计数**管理生命周期。而引用计数需要通过锁机制来避免产生『**race
condition**』。但是锁的引入又会导致『**dead lock**』（**必须超过两把锁**）的问题。

GIL刚好从源头解决了这个问题（只有一把锁）。

### 内存安全问题

[todo 内存安全分类](xxx)

## 为什么是GIL？

存在各种处理内存安全的解决方案，为什么是GIL？

  1. GIL的实现上很简单，引入的复杂度很低（这也是一直以来python没有去掉GIL的重要原因）。
  2. python语言被设计出来的时候，并没有thread的概念，GIL的引入直接提升了语言的易用性。
  3. 许多扩展都是c，而一般的c语言系统调用都是**线程不安全**的，这些c扩展需要线程安全的内存管理措施（如GIL）。有了GIL，各种线程不安全的扩展能够轻松整合进来。
  4. 全局只有一把锁从根本上消除了产生『死锁』的可能性。

### 不是银弹

典型的问题就是cpu-bound task执行起来只能**线性执行**。如果使用并发的架构去执行，甚至消耗的时间更多（上下文转换）。
```
    import threading  
    import time  
    total = 0  
    lock = threading.Lock()  
    def increment_n_times(n):  
        global total  
        for i in range(n):  
            total += 1  
    def safe_increment_n_times(n):  
        global total  
        for i in range(n):  
            lock.acquire()  
            total += 1  
            lock.release()  
    def increment_in_x_threads(x, func, n):  
        threads = [threading.Thread(target=func, args=(n,)) for i in range(x)]  
        global total  
        total = 0  
        begin = time.time()  
        for thread in threads:  
            thread.start()  
        for thread in threads:  
            thread.join()  
        print('finished in {}s.\ntotal: {}\nexpected: {}\ndifference: {} ({} %)'  
               .format(time.time()-begin, total, n*x, n*x-total, 100-total/n/x*100))  
    print('unsafe:')  
    print(increment_in_x_threads(70, increment_n_times, 100000))  
    print('\nwith locks:')  
    print(increment_in_x_threads(70, safe_increment_n_times, 100000))  
```
### 也没有那么坏

最本质的原因就是performance。如果去掉GIL，性能会不会下降？（多线程的CPU密集型任务那没话说，但是单线程任务和多线程IO密集型的任务呢？）

#### py3为什么还是没有解决这个问题？

> py3明明已经不需要向后兼容了（没有了历史包袱），为什么没有解决这个问题？

归根结底还是**单线程任务和多线程IO密集型的任务**性能的问题。

但，python3在这方面也有**改进**。全局只有一把锁意味着不同的任务要**抢锁**，对于cpu密集型的任务，抢锁是比较『容易』的，并且持有锁的时间会比
较长（相对IO-bound
task）（在操作系统的层面中称为『长作业』，其中有一种任务调度算法称为『短作业优先调度算法』）。python解释器指定了一个『fixed
interval』（通过`sys.getcheckinterval()`获取），执行完固定长度的时间以后，其他任务有机会获取GIL。那么有没有可能导致IO-
bound task**饥饿**？python是如何处理这个问题的？

> The problem in this mechanism was that **most of the time the CPU-bound
thread would reacquire the GIL itself before other threads could acquire it.**
This was researched by David Beazley and visualizations can be found here.

> This problem was fixed in Python 3.2 in 2009 by Antoine Pitrou who added a
mechanism of looking at the number of GIL acquisition requests by other
threads that got dropped and not allowing the current thread to reacquire GIL
before other threads got a chance to run.

### 目前有什么比较好的解决方式？

  1. Multi-processing

[diff multi-process / multi_thread / io_reuse](https://github.com/shaorui0/fun
damental_knowledge/tree/main/operator_system/process/diff_multi-process-
multi_thread-io_resue.md)

  2. Alternative Python interpreters

CPython, Jython, IronPython and PyPy…

## ref

  * [what-problem-did-the-gil-solve-for-python](https://realpython.com/python-gil/#what-problem-did-the-gil-solve-for-python)

  * [pythons-gil-a-hurdle-to-multithreaded-program](https://medium.com/python-features/pythons-gil-a-hurdle-to-multithreaded-program-d04ad9c1a63#:~:text=Python%20threads%20can%27t%20run,the%20same%20time%20as%20computation)

  * [why-do-we-need-locks-for-threads-if-we-have-gil](https://stackoverflow.com/questions/40072873/why-do-we-need-locks-for-threads-if-we-have-gil)
