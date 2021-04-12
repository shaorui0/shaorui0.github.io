#  multi process, multi thread and IO reuse

__ 发表于 2021-02-05 __ 更新于 2021-03-05

## 进程

#### pros

虽然现在的并发模型基本采用多线程和io复用的组合了，但是多进程也有其自己的优点：

  1. 由于不『轻易』共享数据（[TODO 父子进程共享什么东西？](xxxxx)），race condition基本是很少出现的，也就是关于share resource相关的问题很少出现。比如典型的『并发计数竞争问题』。
  2. 安全性。有各自的进程地址空间，不会出现某个线程出问题（引发进程层面的问题）使得所有线程down掉

#### cons

  1. 开销：

    * 进程创建
    * 进程调度（上下文转换）
  2. 数据共享：IPC
    - 频繁的数据共享使用多进程不合适，有点掩耳盗铃。

## io复用

#### pros

  1. 【利好程序员】更好的控制。典型的场景，处理多个客户端的时候（event-drive）。（多进程并发模型需要每次close(listenfd)）TODO why？如果不close？test
  2. 同一进程的缘故，共享数据更方便。

#### cons

  1. 想要处理的事件（类型）越多，代码结构复杂
  2. partial read问题（EOF），多进程信号处理很方便。
  3. 【并发粒度】并发多少条指令（时间片）？(CSAPP)

## 多线程

#### 线程独有、共享

独有：

  1. thread_id
  2. register
  3. stack（但仍然可以访问到，毕竟都是 『内存地址』）

共享：

  1. heap
  2. code 
  3. global
  4. fd
  5. stack of process

#### pros

  1. 开销比进程小
  2. 多核上可以并行
  3. 更好的共享信息（除了thread stack各自维护，其他segment都是共享的，包括：heap、read-only(const data), read-write(global/static), code, share memory(mmap, .so)）

#### cons

  1. 由于共享的问题，潜在的并发问题都出现了：deadlock、race condition
  2. 安全性。与多进程的对比是一体两面。

#### QA

  1. 某个线程阻塞如何唤醒这个线程？
  2. [某个线程崩溃会影响所在进程吗？](https://www.zhihu.com/question/22397613)
    * 会
    * 从线程共享内存地址空间说起，线程没有自己单独的内存地址空间。当一个线程向非法地址读取或者写入，无法确认这个操作是否会影响同一进程中的其它线程，所以只能是整个进程一起崩溃。
    * 指针数据的错误可以导致任何同地址空间内其他线程的崩溃，当然也可以导致进程崩溃。一般而言，没有绝对必要的共享内存空间的需求就不要使用线程，用进程会安全很多。
  3. nginx 中，某个 worker 进程挂掉会影响整个 nginx 服务吗？
    * 不会，从进程独立性以及进程的 IPC 回答、 
    * 比如 shell ，多进程程序会写 `signal_handler`。某个进程挂掉一般会被回收，进程之间如果没有显式的 IPC 一般不会影响其他进程。
  4. [理解多个CPU与多核CPU的不同](https://www.zhihu.com/question/20998226/answer/705020723)

## 总结

工业上比较好的方式：one loop(io reuse) per thread (muduo)
