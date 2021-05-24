#  Double buffer asynchronous log

__ 发表于 2021-03-07 __ 更新于 2021-03-09

Log 的设计仿照了 [muduo](https://github.com/chenshuo/muduo)的设计，[代码](https://github.c
om/shaorui0/tiny_web_server/blob/main/cpp/AsyncLogging)

与Log相关的类包括FileUtil、LogFile、AsyncLogging、LogStream、Logging。其中前4个类每一个类都含有一个appen
d函数，Log的设计也是主要围绕这个append函数展开的。

自顶向下

  * FileUtil 封装了Log文件的打开、写入并在类析构的时候关闭文件，底层使用了标准IO，该append函数直接向文件写。
  * LogFile进一步封装了FileUtil，并设置了一个循环次数，每过这么多次就flush一次。
  * AsyncLogging是核心，它负责启动一个log线程，专门用来将log写入LogFile，应用了“双缓冲技术”，AsyncLogging负责(定时到或被填满时)将缓冲区中的数据写入LogFile中。
  * LogStream主要用来格式化输出，重载了<<运算符，同时也有自己的一块缓冲区，这里缓冲区的存在是为了缓存一行，把多个<<的结果连成一块。
  * Logging是对外接口，Logging类内涵一个LogStream对象，主要是为了每次打log的时候在log之前和之后加上固定的格式化的信息，比如打log的行、文件名等信息。

### 日志系统的基本概念

  0. 为什么要buffer？

    * 不能每条消息都 flush disk，更不能每条都 open/close
  1. 为什么是双缓冲？

    * 这是 OS 中学习到的概念，其核心思想是 IO 两端都含有两个缓冲区，INPUT 端写数据到 buffer_1 不影响 OUTPUT 端从 buffer_2 拿满数据，拿到数据以后再把 OUTPUT 端空的 buffer 给 INPUT 这样迭代
    * TODO 这里有个优化点
      * 按正常来说，前端写满两个 buffer 就会通知后端来取，如果后端被阻塞了一会儿，前端又有数据，则需要新的 buffer（不然会导致数据 XXX TODO MUDUO）
      * 现在的做法是临时 new 一个 buffer，这样肯定有时间上的消耗
      * 更好的做法可能是多初始化一些缓冲区，然后通过两个 list 进行迭代交互，本质是空间换时间
  2. 为什么是非阻塞？如何做到的异步？

    * 这里日志一般是记录 server 服务连接中的各种信息，我希望是有一个『队列』来解耦前后端，前端只管往这个 queue 里面发数据，后端另起一个 thread 来处理这些数据
    * 这是一个典型的『多生产者 - 单消费者』问题
    * 【问】如何保证线程安全？
      * 只涉及前后端两个线程之间的信息交互
      * 一些需要加锁的操作（比如 TODO，写文件。。。）都用临界区锁好
      * 有些地方通过条件变量保证同步性（比如 TODO，buffer写满，buffer读取完成）
      * TODO 参考muduo
    * 总结一下就是
      * 抽象成多生产者-单消费者问题
      * 异步的部分包括
        * **前后端**的概念用来异步化『写日志』这个操作
        * **两个 buffer** 进一步非阻塞化前后端直接的信息通信
  3. 会有哪些特殊场景？TODO

    * 遇到了前端疯狂写后端收不到的问题（为什么会产生这个问题？后端一时唤不醒，我是怎么处理这个问题的？）

### 过去与未来

  1. 遇到了什么问题吗？有什么难点吗？

    * 多线程如果 log 没有写到文件 server 就崩了，这些未持久化的信息去哪里找？

> 多线程调试嘛，先看线程信息，info thread，找到我的异步打印线程，切换进去看bt调用栈，正常是阻塞在条件变量是wait条件中的，frame切换到
threadFunc(这个函数是我的异步log里面的循环的函数名)，剩下的就是print啦～不过，我的Buffer是用智能指针shared_ptr包裹的，直
接->不行，gdb不识别，优化完.get()不让用，可能被inline掉了，只能直接从shared_ptr源码中找到_M_ptr成员来打印。

    * 对于 coredump 文件，可以在日志消息中设置 cookie(哨兵值，sentry) —> 记录某个函数的地址 —> 分析 coredump 文件
  2. 有什么其他的方案吗？

    * 或者使用阻塞队列，每条 log 为一个消息写到 queue 中
    * 这个方案存在什么问题？
      * 前端每天消息 string 需要自己分配内存，那么后端就需要帮助释放内存，需要针对 `malloc` 进行多线程方面的优化。
  3. 有什么可能存在的比较好的改进措施吗？

    * 空间换时间，见上
    * 性能的提升，进一步的**压榨性能**可以通过减小临界区
      * 现在的临界区在哪些地方？
      * 多个前端争用全局锁（全局 logger，singleton）， current_buffer / buffers
```
    // threadFunc() 核心代码  
    while (running_) {  
        assert(newBuffer1 && newBuffer1->length() == 0);  
        assert(newBuffer2 && newBuffer2->length() == 0);  
        assert(buffersToWrite.empty());  
        {  
            MutexLockGuard lock(mutex_);  
            if (buffers_.empty())  // unusual usage!  
            {  
                cond_.waitForSeconds(flushInterval_);  
            }  
            buffers_.push_back(currentBuffer_);  
            currentBuffer_.reset();  
            currentBuffer_ = std::move(newBuffer1);  
            buffersToWrite.swap(buffers_);  
            if (!nextBuffer_) {  
                nextBuffer_ = std::move(newBuffer2);  
            }  
        }  
    }  
```
      * 典型的是多个前端线程会争抢 mutex，可以利用 hash 表，key 为 thread_id，这样每个消息打到不同的 bucket 中，能够进一步减小临界区

### 关于日志系统的压力测试

性能要求：

  1. 生产者要做到 低 CPU 开销、低延时
  2. 消费者要做到 足够大的吞吐，占用系统资源少

#### 瓶颈

  1. 磁盘的瓶颈（SATA）
    * 110 MB/s, `dd if=/dev/zero of=/dev/null bs=1M count=32768`
  2. 网络带宽（千兆网）

#### 性能需求

  1. 如果按一条 log 平均 110 byte，需要 1000,000 条/s
  2. 如果需要后端不影响前段，平均吞吐 1/10 则需要 100,000 条/s

#### 测试的方式

  1. 启动单个 / 多个线程进行测试
  2. 在程序里面测试 end - start，注意线程的初始化等不计算在里面，通常线程池初期初始化即可。
  3. 测试 /dev/null 和 /tmp/log，一般来说 /dev/null 更快

如何观察测试时的数据？

  1. 主要测试『固定条数的数据需要花多少时间』就可以了。
