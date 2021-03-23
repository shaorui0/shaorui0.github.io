#  what is reactor

__ 发表于 2021-03-03 __ 更新于 2021-03-11

本质是事件驱动 + 事件回调，通过 IO 复用 + 非阻塞 IO（它们为什么必须搭配使用？）的形式，利用可以执行多个 loop（多线程，IO
线程），可以加入线程池做计算资源。（one loop per thread）

由于 IO reuse 是通过监测事件（TCP 的三个半事件：）来完成的，如果用阻塞 IO，一次只能 serve 一个连接，浪费了时间，IO
复用的性能得不到体现

## 架构图

![](/2021/03/03/what-is-reactor/reactor_patterns.png)

#### C10K, C100K…

TODO [http://scotdoyle.com/python-epoll-
howto.html](http://scotdoyle.com/python-epoll-howto.html)

### 有没有可能阻塞IO更好？

  0. 直观，整体流程非常明显，更适用于短链接
  1. 当线程比较 cheap（比如 go 中的 goroutine 、python 中的gevent等，可以用每个线程去处理一个链接（阻塞 IO ）），而线程 expensive 的时候（`pthread_create`）最好还是用 reactor（事件驱动 + 事件回调）

## select、poll和epoll的区别

### 为什么epoll

要理解，整个select -> poll -> epoll 的进化过程，实际上是为了不断加快事件响应时间。

毕竟响应越快，处理越快，处理完丢掉减小`len_fd_list`，从而增加系统的吞吐。

## ET和LT的区别

  1. 一般意义上，我们说 ET 好，是指 edge-trigger 模式能够减少（只在两个极端事件） epoll 相关**系统调用**（系统调用总是 expensive 的（TODO 用户态陷入内核会发生什么？））
  2. 【问】如果是电平触发，那么什么时候关注 EPOLLOUT 事件？会不会造成 busy-loop？如果是边沿触发，如何防止漏读造成的饥饿？
    * LT 可能导致 busy loop（比如 1byte 1 byte 的传输过来，应用层的 buffer 解决）
      * 比如 `EPOLLOUT` ，什么时候关注？是等应用层的缓冲区管理好所有的写数据，能够写了，才 register EPOLLOUT。
    * ET 可能导致 hungry（漏掉事件，ready_list 非空都是 epoll_wait 无法返回）（每次 while True 处理完 ready_list 所有事件）

### 为什么会出现两种模式？

[为什么会产生 ET](https://stackoverflow.com/questions/9162712/what-is-the-purpose-
of-epolls-edge-triggered-option)

[这里讨论了ET是不是一定好？](https://developer.aliyun.com/article/229224)

epoll 之前的的 IO-reuse 底层通过顺序表迭代找到某个 fd（O(n)），epoll则是引入了红黑树，将时间复杂度减小到了 O(logn)。

  1. LT 是一直以来的标准，为什么会产生 ET ？
    * 相比于 LT ， ET 更为惰性，不会频繁的对某个事件进行读写。至少从设计上，作者是希望能够降低单个 fd 的性能消耗从而提升整个系统的吞吐率。
    * 本质上， epoll_wait 关心哪些 event，就返回哪些。ET 只关心 buffer 状态发生变化的，那么理论上，每次返回的 fd 会少很多。
  2. 那么效果是否达到了？
    * 回想之前读的《CSAPP》，里面使用了 select 作为 system call。里面有两个变量：`read_list` 和 `ready_list`。这里的 epoll_wait 每次返回的就是 `ready_list` 。**在 LT 和 ET 的实现区别就是 ET 每次执行完 fd 的事件会从 `ready_list` 中删掉这个 fd**。
    * 但是，在某些场景下，应用层需要自己维护 `ready_list` ，**避免某个 cold data 迟迟无法被处理导致饿死**（通过迭代应用层的 ready_list ）。这样一来，反而增加了应用程序员**心智负担**。甚至可能由于程序员水平不过关，性能可能比 kernel 的实现更差，导致负载降低。

> Receiving an event from epoll_wait(2) should suggest to you

that such file descriptor is ready for the requested I/O

operation. You must consider it ready until the next

(nonblocking) read/write yields EAGAIN. When and how you

will use the file descriptor is entirely up to you.

[man page: epoll](https://man7.org/linux/man-pages/man7/epoll.7.html)建议我们读到
EAGAIN 再退出，原因是什么？

### epoll ET 存在的问题

考虑**新建连接**与**读写数据**两种不同的场景。

考虑这种情况：多个连接同时到达，服务器的TCP就绪队列瞬间积累多个就绪连接，由于是边缘触发模式，epoll只会通知一次，accept只处理一个连接，导致TC
P就绪队列中剩下的连接都得不到处理。— 导致**饥饿**

解决办法是：

  * 一次性处理完所有事件。用 **while 循环**抱住accept调用，处理完TCP就绪队列中的所有连接后再退出循环。如何知道是否处理完就绪队列中的所有连接呢？accept返回-1并且errno设置为EAGAIN就表示所有连接都处理完。
  * 缓存所有事件。或者设计一个应用层的 cache 保存这些事件（一个 list）

> The difference is only visible when you use long-lived sessions and you’re
forced to constantly stop/start because of buffers full/empty (typically with
a proxy). When you’re doing this, you most often need an event cache, and when
your event cache is processing events, you can use ET and avoid all the
epoll_ctl(DEL)+epoll_ctl(ADD) dance. For short-lived sessions, the savings are
less obvious, because for ET you’ll need at least one epoll_ctl(ADD) call to
enable polling on the FD, and if you don’t expect to have more of them during
the session’s life (eg: exchanges are smaller than buffers most of the time),
then you shouldn’t expect any difference. Most of your savings will generally
come from using an event cache only since you can often perform a lot of
operations (eg: writes) without polling thanks to kernel buffers.

[https://stackoverflow.com/questions/13848143/is-level-triggered-or-edge-
triggered-more-performant](https://stackoverflow.com/questions/13848143/is-
level-triggered-or-edge-triggered-more-performant)

思考以下场景：

  0. 【init】
  * server 启动 et （必须在应用代码层面读完所有数据），
  * client 启动 lt （一次能发完 MAXSIZE=8）
  1. 【场景一】
  * client 发送 ‘aabbcc’
  * server 只能收到 ‘aa’, 
    * 如果此时关闭 client, server 还能收到’bb’，但是’cc’丢失
    * 如果此时发送 ‘dd’, server 继续接收 ‘bb’ …
  2. 【场景二】
  * client 发送 ‘a’，server 接收到 ‘a’
  * client 发送 ‘bcd’，server 接收到 ‘bc’ （**发送端**（理解这里） buffer 里面还有 ‘c’）
  * client 断开链接，server 接收到 ‘d’ 

上面的例子中，server 端有三个事件是 **epoll_ET 关心的**：

  * 发送端建立链接
  * 接收端 buffer 从 empty => non-empty
  * 发送端断开链接

【问】

连续『回车』以后，为什么写不出去了？因为没东西写，fd会在代码中被删除，避免**频繁唤醒**。

所以，如果 server 无法一次读完所有的数据（一直读到 `EAGAIN` ），可能会造成数据的丢失。

进一步推出，选用 ET 还是 LT ，应用层的代码设计区别还是很明显的。

[> 看再多的资料，不如写个代码跑一下](https://github.com/Manistein/test_epoll_lt_and_et)

#### 总结

本质是 system call (epoll_wait) 对事件的关心程度不同。

  * ET 是消极的，LT 是积极的
  * ET 只关心 空 => 非空 ， 满 => 非满 两个极端。这里的关心是指是否选择从（往） buffer 读（写）数据。从代码层面来看，是 `recv`/`send`返回 `EAGAIN`
  * ET 需要手动积极管理 buffer，LT 需要手动积极管理 fd 的返回与否（ready_list）
  1. server read 中，
    * 如果 server 为 ET，receiver buffer 会保存 server 读不完的数据，直到下一次有**新的数据包**发送过来。所以应用层面需要在应用层代码中**手动添加读完 buffer 的逻辑**。好处是不删的话，下次作为 cache ，适合长链接。
    * 如果 server 为 LT，receiver buffer 会保存 server 读不完的数据，然后server 不断的读完 buffer 里面所有的数据。所以应用层面需要在**读完以后删掉fd**。适合短链接。
  2. 同上，client write 中，
    * 如果 client 为 ET，需要手动在应用层加上读完 buffer 的逻辑
    * 如果 client 为 LT，需要判断写返回值为 EAGAIN 之后删掉fd。

### 基本的EPOLL架构是怎样的？

### buffer

注意，这里所有 low level 级别的代码（1. 什么时候 epoll_wait 退出？ 2. read 多少数据？…）都是应用层与 TCP
层的纠葛，本质是 buffer 在起作用。所以，设计一个好用的、性能强大的『应用层 buffer 』是非常有必要的。

[ __ what is load balancer ](/2021/03/02/what-is-load-balancer/)

[ Double buffer asynchronous log __ ](/2021/03/07/Double-buffer-asynchronous-
log/)

  * 文章目录 
  * 站点概览 

  1. 1. 架构图
    1. 1.0.1. C10K, C100K…
  2. 1.1. 有没有可能阻塞IO更好？
* 2. select、poll和epoll的区别

  1. 2.1. 为什么epoll
* 3. ET和LT的区别

  1. 3.1. 为什么会出现两种模式？
  2. 3.2. epoll ET 存在的问题
    1. 3.2.1. 总结
  3. 3.3. 基本的EPOLL架构是怎样的？
  4. 3.4. buffer

