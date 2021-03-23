#  What is IPC

__ 发表于 2021-01-15 __ 更新于 2021-03-05

###### > 如何选择，以什么作为考量？

[Message Boundary issue](https://stackoverflow.com/questions/404604/comparing-
unix-linux-ipc):

  1. bytes stream: 抽象成`file stream` or `stdin/stdout`（linux的核心概念）, 需要知道**消息长度**
  2. discrete protocols like **UDP** or **message queues**

Benchmark and Message Boundary:

  * **Pipe** I/O is the fastest but needs a **parent/child relationship** to work.
  * Sysv IPC has a defined message boundary and can connect disparate processes locally, for example, **MQ**
  * UNIX sockets can connect disparate processes **locally** and has **higher bandwidth** but no inherent message boundaries.
  * TCP/IP sockets can connect any processes, even over the **network** but has **higher overhead** and no inherent message boundaries.

###### > ipc分类

  * anonymous pipe:  
管道的实质是一个内核缓冲区，进程以先进先出的方式从缓冲区存取数据，管道一端的进程顺序的将数据写入缓冲区，另一端的进程则顺序的读出数据。该缓冲区可以看做是一个
循环队列，读和写的位置都是自动增长的，不能随意改变，一个数据只能被读一次，读出来以后在缓冲区就不复存在了。当缓冲区读空或者写满时，有一定的规则控制相应的读进
程或者写进程进入等待队列，当空的缓冲区有新数据写入或者满的缓冲区有数据读出来时，就唤醒等待队列中的进程继续读写。

    * usage: cat file | grep word
    * 单向
    * [implement](https://github.com/shaorui0/tiny_shell/blob/master/pipe_demo.c).
    * 缺陷
      * 单向数据流
      * 亲缘关系进程
      * 没有名字
      * 缓冲区是有限的（管道制存在于内存中，在管道创建时，为缓冲区分配一个页面大小）；
      * 管道所传送的是『无格式字节流』，这就要求管道的读出方和写入方必须事先约定好数据的格式，比如多少字节算作一个消息（或命令、或记录）等等；
  * named pipe: 

![](/2021/01/15/diff-ipc/fifo.png)

    * 半双工
    * [some examples](http://beej.us/guide/bgipc/html/multi/fifos.html#fifonew)
  * signal

    * fork + signal
    * [implement: tiny shell](https://github.com/shaorui0/tiny_shell)
  * file lock

  * Semaphores

    * 某种同步原语，当需要锁功能或者生产消费一定数量的资源时
  * socket

    * 全双工，本机或网络
    * TODO web server
  * mmap

    * [What is mmap?](https://github.com/shaorui0/fundamental_knowledge/tree/main/operator_system/memory/mmap)
      * mmap是什么？
      * 为什么需要mmap()
      * pros and cons
      * 一些可以运行的例子
  * shared memory

    * [共享内存也可以实现『跨主机IPC』](https://www.jianshu.com/p/c1015f5ffa74)

## ref

[ref docs](http://beej.us/guide/bgipc/html/multi/index.html)

[comparing-unix-linux-
ipc](https://stackoverflow.com/questions/404604/comparing-unix-linux-ipc)

[# OS](/tags/OS/)

[ __ iterator, generator and decorator ](/2020/12/16/python-generator-
iterator-decorator/)

[ (ES) hot and cold data architecture __ ](/2021/01/20/Elasticsearch-cold-
warm/)

  * 文章目录 
  * 站点概览 

  1. 1. > 如何选择，以什么作为考量？
  2. 2. > ipc分类

* ref

