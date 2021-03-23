#  web server - timerfd/eventfd

__ 发表于 2021-02-10 __ 更新于 2021-03-11

## timerfd 实现定时器

> 参考《Linux多线程服务端编程》 P290

定时器的本质是：

  * 维护一个时间任务 total_event_list
  * 在某一时刻唤醒线程进行筛选，找到超时的任务 expired_event_list
  * 淘汰这些已超时的任务，得到剩下的任务 left_event_list

### 可能有哪些实现方案？

  1. 暴力实现，顺序表。查找 O(N)，插入删除 O(N)
  2. 优先队列（二叉堆，堆有 sorted 这个性质（基本有序）），同时保证了插入、删除的时间复杂度。  
基本过程是：

    * 利用 now_ts 对比所有过期时间，
    * 然后每次迭代删除所有的已过期，  
【进一步的优化】通过逻辑删除，设置延长的过期时间，这个策略基于『长链接』的特性，可能一段时间后重新『复活』

  3. 有序的树除了 HEAP， 还有什么？ —> BST（具体到语言里面是 map 和 set ）
    * 找到 lower_bound（返回一个指针/迭代器）  
【注意】相对于堆来说， BST 的 memory locality 相对差一点。插入导致不平衡进行『再平衡』，可能导致需要对树进行完全翻转。

### 处理过期的基本逻辑

  1. 优先队列
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
    typedef std::shared_ptr<TimerNode> SPTimerNode;  
    std::priority_queue<SPTimerNode, std::deque<SPTimerNode>, TimerCmp> timerNodeQueue;  
    bool TimerNode::isValid() {  
        if (Timestamp::now < expiredTime_)  
            return true;  
        else {  
            this->setDeleted();  
            return false;  
        }  
    }  
    void TimerManager::handleExpiredEvent() {  
        while (!timerNodeQueue.empty()) {  
            SPTimerNode ptimer_now = timerNodeQueue.top();  
            if (ptimer_now->isDeleted()) // 优化，第一次超时使用逻辑删除，第二次再迭代到，就物理删除（优化了可能有超时任务重新过来的情况（keep-alive））  
                timerNodeQueue.pop();  
            else if (ptimer_now->isValid() == false) // 核心  
                timerNodeQueue.pop();  
            else  
                break;  
        }  
    }  

  2. BST
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
    /*  
    https://github.com/shaorui0/recipes-1/blob/master/reactor/s02/TimerQueue.h  
    1. 使用 pair 是因为可能有两个到期时间相同的任务，增加一个timer指针用于分辨地址  
    2. 使用 set 是因为只有 key，没有 value  
    */  
    typedef std::pair<Timestamp, Timer*> Entry;  
    typedef std::set<Entry> TimerList;  
    TimerList timers_;  
    std::vector<TimerQueue::Entry> TimerQueue::getExpired(Timestamp now)  
    {  
        std::vector<Entry> expired;  
        Entry sentry = std::make_pair(now, reinterpret_cast<Timer*>(UINTPTR_MAX));  
        TimerList::iterator it = timers_.lower_bound(sentry); // lower_bound 找到二叉搜索树的到期节点  
        assert(it == timers_.end() || now < it->first);  
        std::copy(timers_.begin(), it, back_inserter(expired));  
        timers_.erase(timers_.begin(), it);  
        return expired;  
    }  

### 关于为什么用 timerfd

  1. timerfd、eventfd 与 IO 复用结构完美适配，『当定时任务/指定事件发生的那一刻，fd 变得可读（`EPOLL_READ`）』
  2. 由内核管理的 timerfd 底层是内核中的 hrtimer（高精度时钟定时器），时间的精度（纳秒）
  3. 传统的定时器实现方案，甚至不需要 timerfd 来定时，直接在 eventloop 里面每次查看 timerQueue，效率比较低，响应低到毫秒

TODO pic

### 定时器用在哪些地方？

web server 中有些典型的定时任务（依赖协议）

  1. 维护长链接，一个优化是逻辑删除超时连接 + 延迟超时物理踢出，防止未来重新活过来

## eventfd 实现消息通知

### eventfd 用在什么地方？

在 web server 里面一般的使用场景是唤醒某个线程

eventfd 核心是`wakeup()`，muduo 里面 eventfd 是用来唤醒启动线程，因为里面维护了一个
『待办事件』，但只能在特定的线程执行（线程间通信）

    1  
    2  
    3  
    4  
    5  
    6  
    7  
    8  
    9  
    void EventLoop::quit()  
    {  
      quit_ = true;  
      if (!isInLoopThread())  
      {  
        wakeup();  
      }  
    }  

  1. 向 eventfd 写 1 byte 的数据
  2. 转到指定 IO 线程
  3. 执行 IO 线程的 loop（linya 那个 web server 主要是退出 loop 时如果不是 IO 线程就转到 IO 线程）

### 关于为什么使用 eventfd

> Applications can use an eventfd file descriptor instead of a pipe in all
cases where a pipe is used simply to signal events.

  1. 同 timerfd
  2. eventfd 的快，相对 pipe 而言，其根本在于counter（计数器）和channel（数据信道）的区别。
    * open file 的数量，4: 2
    * pipe 只能在两个连接中使用（TCP socket），eventfd 则是广播式的

> 如上面的NxM的生产者-消费者例子，如果需要完成全双工的通信，需要NxMx2个的pipe，而且需要提前建立并保持打开，作为通知信号实在太奢侈了，但如果用
eventfd，只需要在发通知的时候瞬时创建、触发并关闭一个即可。[https://zhuanlan.zhihu.com/p/40572954](https
://zhuanlan.zhihu.com/p/40572954)

    * pipe 需要4次复制（process A write to file(user mode -> kernel buffer -> file), process B read from file(file -> kernel buffer -> user mode)），由于 pipe 本质是利用文件转发，所以内核还要为每个 pipe 分配至少 4K 的虚拟内存页，哪怕传输的数据长度为0。
    * best practice: 当pipe只用来发送通知（传输控制信息而不是实际数据），放弃pipe，放心地用eventfd

[linux 新的事件通知机制：eventfd/timerfd](https://zhuanlan.zhihu.com/p/40572954)

[timerfd/eventfd example](https://github.com/Pro-
YY/eventfd_examples/blob/master/src/timerfd_worker/timerfd_worker.c)

[ __ what difference between sql and nosql --- data model ](/2021/02/08/what-
difference-between-sql-and-nosql-data-model/)

[ Blocking queue __ ](/2021/02/13/how-to-use-and-implement-blocking-queue/)

  * 文章目录 
  * 站点概览 

  1. 1. timerfd 实现定时器
    1. 1.1. 可能有哪些实现方案？
    2. 1.2. 处理过期的基本逻辑
    3. 1.3. 关于为什么用 timerfd
    4. 1.4. 定时器用在哪些地方？
  2. 2. eventfd 实现消息通知
    1. 2.1. eventfd 用在什么地方？
    2. 2.2. 关于为什么使用 eventfd

