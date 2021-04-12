#  Blocking queue

__ 发表于 2021-02-13 __ 更新于 2021-02-22

## 场景

本质：作为任务存放的容器。

多线程的环境下，一个任务过来，不是立即执行的。一个路由thread进行分发，一些worker
thread来取。那worker从哪里取呢？典型的就是『先进先出』的队列。

一个典型的过程：

    1  
    2  
    3  
    4  
    5  
    1. 任务过来  
    2. 分发线程将任务存到queue中  
    3. 如果有线程闲置，就会去取  
        3.1. queue会将task传递给线程  
        3.2. queue会同时将task pop掉（4、5过程原子性）  

但是这个队列既然是在并发环境，就得防止**竞争**，哪个环节会出现竞争？『存』、『取』操作。

  * 存，可能多个任务同时存放，导致抢占queue，需要对queue进行加锁。
  * 取，多个线程同时取task，这就需要对queue进行加锁，每次只能让单个线程进来

## how to use

#### 单个线程

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
    """  
    The queue module implements multi-producer, multi-consumer queues. It is especially useful in threaded programming when information must be exchanged safely between multiple threads. The Queue class in this module implements all the required locking semantics.  
    """  
    import threading, queue  
    import time  
    q = queue.Queue()  
    def worker():  
        while True:  
            item = q.get()  
            print(f'Working on {item}')  
            print(f'Finished {item}')  
            time.sleep(0.5)  
            q.task_done()  
    # turn-on the worker thread  
    threading.Thread(target=worker, daemon=True).start()  
    # send thirty task requests to the worker  
    for item in range(30):  
        q.put(item)  
    print('All task requests sent\n', end='')  
    # block until all tasks are done  
    q.join()  
    print('All work completed')  

#### 多线程配合队列

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
    44  
    45  
    46  
    47  
    48  
    49  
    50  
    51  
    52  
    53  
    54  
    55  
    56  
    57  
    58  
    59  
    60  
    61  
    62  
    import queue   
    import threading   
    import time   
    thread_exit_Flag = 0  
    class sample_Thread (threading.Thread):   
        def __init__(self, threadID, name, q):   
            threading.Thread.__init__(self)   
            self.threadID = threadID   
            self.name = name   
            self.q = q   
        def run(self):   
            print ("initializing " + self.name)   
            process_data(self.name, self.q)   
            print ("Exiting " + self.name)   
    # helper function to process data  
    def process_data(threadName, q):   
        while not thread_exit_Flag: # 如果有任务，就一直获取任务  
            queueLock.acquire()   
            if not workQueue.empty():   
                data = q.get_nowait()   
                queueLock.release()   
                print ("% s processing % s" % (threadName, data))   
                workQueue.task_done() # 如果要使用queue.join，就必须每次标记task_done  
            else:   
                queueLock.release()   
                time.sleep(1)   
    thread_list = ["Thread-1", "Thread-2", "Thread-3"]   
    name_list = ["A", "B", "C", "D", "E"]   
    queueLock = threading.Lock()   
    workQueue = queue.Queue(10)   
    threads = []   
    threadID = 1  
    # Create new threads   
    for thread_name in thread_list:   
        thread = sample_Thread(threadID, thread_name, workQueue)   
        thread.start()   
        threads.append(thread)   
        threadID += 1  
    # Fill the queue   
    queueLock.acquire()   
    for items in name_list:   
        workQueue.put(items)   
    queueLock.release()   
    # Wait for the queue to empty   
    workQueue.join() # 需要在每个任务完成的时候加上task_done  
    # Notify threads it's time to exit   
    thread_exit_Flag = 1  
    # Wait for all threads to complete   
    for t in threads:   
        t.join()   
    print ("Exit Main Thread")   

## Where should you use BlockingQueue Implementations instead of Simple Queue
Implementations?

【问】当你碰见什么样的场景，你需要使用『阻塞队列』？

显然，当我需要某种场合**阻塞/等待**的时候需要阻塞队列，扩展开就是当：

  1. 希望队列中元素到达一定数量停止放入（put），等消费者先消费完现有的。（BoundedBlockingQueue特有）。
  2. 希望队列中没有元素时，消费者**等待**再次出现元素，此时应该是生产者忙碌的时候。

典型的，普通queue也可以完成『等待』的操作，但是需要『busy wait』，这样太消耗CPU。

## DIFF normal blocking queue and bounded blocking queue

这两种容器各是什么场景下使用？

> In a pooling application, a blocking “put” is **not appropriate**.
Controlling the maximum size of the queue is the job of the pool manager—it
decides when to create or destroy resources for the pool. Clients of the pool
borrow and return resources from the pool. Adding a new object, or returning a
previously borrowed object to the pool should be fast, non-blocking
operations. So, a bounded capacity queue is not a good choice for pools.

如果作为『池』的属性，一般是不适合有『容量』的限制，也就是『满』的概念（这个是pool
manager的责任）。池仅仅作为仓库。这种情况，使用BlockingQueue更好。

另一种情况，如果是一个web server。某个用户发出请求太多，此时生产数量将远远超过消费数量，消费者需要一定的时间去消化，导致**延迟**会特别高。在*
*业务层面**，消费者也不希望等待太长的时间，另可request丢失。这种情况，使用BoundedBlockingQueue更好。

# how to implement a blocking queue

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
    44  
    45  
    46  
    47  
    48  
    49  
    50  
    51  
    52  
    53  
    54  
    55  
    56  
    57  
    58  
    59  
    60  
    61  
    62  
    63  
    64  
    65  
    66  
    67  
    68  
    69  
    70  
    71  
    72  
    73  
    74  
    75  
    76  
    77  
    78  
    79  
    80  
    81  
    82  
    83  
    import threading  
    import queue  
    import time  
    import os   
    class BoundedBlockQueue(object):  
        def __init__(self, max_size):  
            self.max_size = max_size  
            self.lock = threading.Lock()  
            self.not_empty = threading.Condition(self.lock)  
            self.not_full = threading.Condition(self.lock)  
            self.queue = []  
        def qsize(self):  
            return len(self.queue)  
        def full(self):  
            return len(self.queue) == self.max_size  
        def empty(self):  
            return len(self.queue) == 0  
        def take(self):  
            self.not_empty.acquire()  
            while self.empty(): # always use a while-loop, due to spurious wakeup  
                self.not_empty.wait()  
            assert not self.empty()  
            item = self.queue[0]  
            self.queue.remove(item)  
            self.not_full.notify()  
            self.not_empty.release()  
            return item  
        def put(self, item):  
            self.not_full.acquire()  
            while self.full(): # always use a while-loop, due to spurious wakeup  
                self.not_full.wait()  
            assert not self.full()  
            self.queue.append(item)  
            print(self.queue)  
            self.not_empty.notify()  
            self.not_full.release()  
        def join(self):  
            # TODO too simple to implement  
            while not self.empty():  
                pass  
    q = BoundedBlockQueue(10)  
    def worker():  
        while True:  
            item = q.take()  
            print(f'Working on {item}')  
            print(f'Finished {item}')  
            time.sleep(0.1)  
    # turn-on the worker thread  
    threading.Thread(target=worker, daemon=False).start()  
    # send thirty task requests to the worker  
    for item in range(30):  
        print(item)  
        q.put(item)  
    print('All task requests sent\n', end='')  
    # block until all tasks are done  
    q.join()# Error implement?  
    print('All work completed')  
    os._exit(0)  
