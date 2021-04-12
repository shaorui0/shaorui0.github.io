#  What is Callback

__ 发表于 2021-02-20 __ 更新于 2021-03-03

> A callback is a function provided by the consumer of an API that the API can
then turn around and invoke (calling you back). If I setup a Dr.’s
appointment, I can give them my phone number, so they can call me the day
before to confirm the appointment. A callback is like that, except instead of
just being a phone number, it can be arbitrary instructions like “send me an
email at this address, and also call my secretary and have her put it in my
calendar.

> Callbacks are often used in situations where an action is asynchronous. If
you need to call a function, and immediately continue working, you can’t sit
there wait for its return value to let you know what happened, so you provide
a callback. When the function is done completely its asynchronous work it will
then invoke your callback with some predetermined arguments (usually some you
supply, and some about the status and result of the asynchronous action you
requested).

If the Dr. is out of the office, or they are still working on the schedule,
rather than having me wait on hold until he gets back, which could be several
hours, we hang up, and once the appointment has been scheduled, they call me.

In this specific case, Parallel Python’s submit function will invoke your
callback with any arguments you supply and the result of func, once func has
finished executing.

[parallel-python-what-is-a-
callback](https://stackoverflow.com/questions/1319074/parallel-python-what-is-
a-callback)

## comprehend callback

### why callback

callback 的意义是说，当某个（同步或异步）事件发生以后，通过调用 callback 执行响应操作。

这里的消息传递是通过**逻辑流**完成的。可以想象成生产者-消费者模型。调用 callback 之前是『生产者』的控制权，调用 callback
时是消费者的控制权。本质是两个不同的『对象』之间控制权的转移。

『事件』的含义，陈硕（《muduo》）将事件响应逻辑与 fd 绑定，意思是**当某个 fd 被激活/某个事件发生，就会调用这个
callback**，这是典型的 calback **使用场景**。

### implement

    1  
    2  
    3  
    def foo(a, b, callback):  
        if a and b:  
            callback(a, b)  

### asyn callback

  * 异步的目的是为了**提升性能**，让『消息通知』决定callback的时机，而不是一致阻塞在IO（`sleep()`/`requests`）处。
  * 一般场景是如果有多个可以并发的IO任务，使用异步是一个很好的提升性能的方式。

### callback or coroutine?

一个是指定逻辑流的函数调用，一个是指定逻辑流的协程调用。性能上有一定的差异，但是本质都是制定好程序的逻辑流，与并发编程中多线程不一样（逻辑流顺序由 OS
管理）。

## Example

执行流程：

  * 老师布置作业
  * 学生写
  * （asyn: 老师回家）
  * 学生写完
  * 老师检查
  * （syn: 老师回家）

思考：

  * callback是触发的？ 学生
  * callback是谁执行的？ 老师，callback在这里意义是『检查』
  * 我一直以来的错误是，把callback看成『做作业』这个过程，其实是，作业做完以后（1. 事件：作业做完；2. 可异步任务：做作业），才进行callback

函数设计

    1  
    2  
    3  
    4  
    5  
    teacher.set_hw()  
    teacher.check_hw()  
    teacher.go_home()  
    student.do_hw()  
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
    15  
    16  
    17  
    18  
    19  
    20  
    21  
    22  
    23  
    24  
    25  
    26  
    27  
    28  
    29  
    30  
    31  
    32  
    33  
    34  
    35  
    36  
    37  
    38  
    39  
    40  
    41  
    42  
    43  
    # https://cloud.tencent.com/developer/article/1373683  
    import time  
    import threading  
    class Teacher(object):  
        def __init__(self, student):  
            self.student = student  
        def assign_hw(self, is_asyn=False):  
            print('teacher assign homework.')  
            if is_asyn:  
                self.student.asyn_do_hw(self.check_hw)  
            else:  
                self.student.do_hw(self.check_hw)   
            self.go_home()  
        def check_hw(self):  
            print('teacher check homework.')  
        def go_home(self):  
            print('go home.')  
    class Student(object):  
        def do_hw(self, callback):  
            print('begin to do hw.')  
            time.sleep(2)  
            print('hw done.')  
            callback() # check  
        def asyn_do_hw(self, callback):  
            def do_homework():  
                print('begin to do hw.')  
                time.sleep(1)  
                print('hw done.')  
                callback() # logic  
            x = threading.Thread(target=do_homework)  
            x.start()  
    s = Student()  
    t = Teacher(s)  
    t.assign_hw()  
    print("\nwaiting for notified.\n")  
    t.assign_hw(True)  

[twisted 的 deferred 是典型的 calback-style](https://twistedmatrix.com/documents/10
.1.0/core/howto/deferredindepth.html)

## 延伸

### gevent

> What is gevent?

Gevent is the use of simple, sequential programming in python to achieve
scalability provided by asynchronous IO and lightweight multi-threading (as
opposed to the callback-style of programming using Twisted’s Deferred).

([https://learn-gevent-
socketio.readthedocs.io/en/latest/gevent.html](https://learn-gevent-
socketio.readthedocs.io/en/latest/gevent.html))

理解协程，场景是有一些IO任务，如果同步获取，则比较浪费时间，因为时间都用在了等待网络上（阻塞）。这个情况下，如果有一些任务不依赖这个IO任务的结果，我可以
并发执行他们，通过协程，能够**快速释放控制权**，等结果获取到之后，才**重新获取控制权**。

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
    15  
    16  
    17  
    18  
    19  
    # https://www.liaoxuefeng.com/wiki/897692888725344/966405998508320  
    from gevent import monkey; monkey.patch_all()  
    import gevent  
    import urllib2  
    def handler_result(url, data):  
        print('%d bytes received from %s.' % (len(data), url))  
    def f(url, callback):  
        print('GET: %s' % url)  
        resp = urllib2.urlopen(url)  
        data = resp.read()  
        callback(url, data) # callback 是这样使用的，在同一个 logic 内部。  
    gevent.joinall([  
            gevent.spawn(f, 'https://www.python.org/', handler_result),  
            gevent.spawn(f, 'https://www.yahoo.com/', handler_result),  
            gevent.spawn(f, 'https://github.com/', handler_result),  
    ])  
