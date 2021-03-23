#  What is event driven model

__ 发表于 2021-02-16 __ 更新于 2021-02-22

## why need event driven model

> In a sense, this isn’t really different from what you might do with threaded
I/O, **but it has much reduced overhead in the form of memory, context
switching, and general “housekeeping”, and takes maximum advantage of what
operating systems do best** (or are supposed to, anyway): **handle I/O
quickly.**

事件驱动模型必须配合使用非阻塞IO，不然当前进程/线程会花大量的时间去等待（相比于真正的处理时间）。非阻塞io，在不可用时（包括缓冲区满、request还没
有到来），会产生`EWOULDBLOCK`，此时会出让资源（如CPU）给其他任务。

  * blocking io

![](/2021/02/16/what-is-event-driven-model/blocking_io.png)

  * non-blocking io

![](/2021/02/16/what-is-event-driven-model/non_blocking_io.png)

  * [diff multi-process / multi_thread / io_reuse](https://github.com/shaorui0/fundamental_knowledge/tree/main/operator_system/process/diff_multi-process-multi_thread-io_resue.md)

  * [stackoverflow: how-does-event-driven-i-o-allow-multiprocessing](https://stackoverflow.com/questions/3231018/how-does-event-driven-i-o-allow-multiprocessing)

## how to implement a event driven model

### a simple reactor

  * [server](./echo_server_event_driven.py)

  * [client](./echo_client.py)

[# OS](/tags/OS/)

[ __ What is high concurrency? ](/2021/02/16/what-is-high-concurrency/)

[ What is duck typing __ ](/2021/02/16/what-is-duck-typing/)

  * 文章目录 
  * 站点概览 

  1. 1. why need event driven model
  2. 2. how to implement a event driven model
    1. 2.1. a simple reactor

