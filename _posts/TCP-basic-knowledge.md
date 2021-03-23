#  TCP - basic knowledge

__ 发表于 2021-03-09

## TCP 有所谓的粘包？

不关心这个说法是否正确，来学学里面涉及到的网络知识。

  0. 如果是 TCP Nagle 算法导致的多个 client 端的 send 被合并在一起了，可以通过设置 `TCP_NODELAY` 来处理。注意，Nagle 算法的初衷是为了增加传输性价比，减少网络间的负载（甚至 payload 太小导致 header > payload 这种情况出现），专门将多个小的『package』进行合并发送的算法（1 * header + n * payload）。实现就是某些小的 datagram1 因为没达到一定的大小需要等待后面的 datagram2 ，然后合并起来发送，最终的影响是 datagram1 对应的 ACK 延迟（[但是 99% 的情况下都不会有问题](怎么解决TCP网络传输「粘包」问题？ - 欲三更的回答 - 知乎  
  1. tcp 面向流。API 层面，recv / send 都会返回接收数据长度，写 socket 代码时都会遇到。就**应用层**来说，一般是有应用层buffer 自动做这件事，根据自己设计的协议（一般是 header(length_of_data) + payload），对数据进行解『包』

[https://www.zhihu.com/question/20210025/answer/1096399109](https://www.zhihu.com/question/20210025/answer/1096399109)

[https://www.zhihu.com/question/20210025/answer/1744906223](https://www.zhihu.com/question/20210025/answer/1744906223)


## TCP status machine

```
    client          server  
                    LISTEN  
    SYN_SEND  
                    SYN_RCVD  
    ESTABLISHED   
                    ESTABLISHED   
    FIN_WAIT_1  
                    CLOSE_WAIT  
    FIN_WAIT_2    
                    LAST_ACK  
    TIME_WAIT( 2 MSL )  
```
## Why TIME_WAIT state need to be 2MSL long?

MSL（Maximum Segment Life）：消息的最大存活时间。

结论：
1.允许老的重复报文分组在网络中消逝。
2.保证TCP全双工连接的正确关闭。

挥手过程：

  1. client -> server, FIN
  2. server -> client, ACK
  3. server -> client, FIN
  4. client -> server, ACK

> After above 4 steps, client is TIME_WAIT, server is LAST_ACK

如果第四步丢了（client不知道自己的ACK丢了），则需要第三步重试（主动方）。

这里的2 MSL就是给一次3过程，给一次4 redo 过程。

整体就是 client 等最后一个 ACK 发过去，如果失败，再等 server 发一个 FIN 过来。

[why-time-wait-state-need-to-be-2msl-long](https://stackoverflow.com/questions/25338862/why-time-wait-state-need-to-be-2msl-long)

### what if step 4 is lost again?

> Same as with any data segment. TCP will retry the send a **certain number of times** and then reset the connection.

重试一段时间后 reset 连接（RST）。本质就是对错误接收信息的一个反馈（拒绝）。
[RST报文详解](https://blog.csdn.net/wj2555111/article/details/105387405)

[how-if-the-last-ack-is-lost-in-tcp-termination](https://stackoverflow.com/questions/40417087/how-if-the-last-ack-is-lost-in-tcp-termination)

### 会产生什么问题？

一个服务器的端口数量有限制（65535），如果大量的短链接，将导致大量的TCP进入TIME_WAIT状态。在高并发的情况下毫无疑问，这将造成**大量连接无法建立**的问题，那么有什么方法可以处理这些问题？
（资源：端口数量）

### 怎么解决？

https://zhuanlan.zhihu.com/p/99943313

1. SO_REUSEADDR，某些场景可用。典型的当有一个有相同本地地址和端口的socket1处于TIME_WAIT状态时，而你启动的程序的socket2要占用该地址和端口，你的程序就要用到该选项。
> 这个套接字选项通知内核，如果端口忙，但TCP状态处于TIME_WAIT，可以重用端口。如果端口忙，TCP状态处于其他状态，重用端口时依旧指明“地址已经在使用中”。如果你的服务程序停止后向立刻重启，而新套接字依旧使用同一个端口，此时SO_REUSEADDR选项非常有用。但是必须意识到，此时任何非期望数据到达，都可能导致服务程序反应混乱。[reference](https://blog.csdn.net/overstack/article/details/8833894)
2. 

## DIFF between TCP and UDP
> TCP is more reliable, if all data must be sent without corruption it's a better choice because it has acknowledgment system (Promising the other side received the data) UDP is for sending the data faster with the risk of losing some parts.It Has no acknowledgment system and the other side might miss some parts of the transferred data. **Common protocol for media** over the network.


1. stream / datagram 
2. connection / connection-less
2. 可信赖/不可信赖
  - ACK 机制
  -  The integrity is guaranteed only on the single datagram
4. 可能会乱序到达（TCP 重组数据流，UDP？）
  > UDP is a lightweight protocol that by design doesn't handle things like packet sequencing. TCP is a better choice if you want robust packet delivery and sequencing.
  > UDP is generally designed for applications where packet loss is acceptable or preferable to the delay which TCP incurs when it has to re-request packets. UDP is therefore commonly used for media streaming.
  > If you're limited to using UDP you would have to develop a method of identifying the out of sequence packets and resequencing them. https://stackoverflow.com/questions/3745115/ensuring-packet-order-in-udp
  - UDP 协议本身不管理数据报文的顺序（实时的场景也不需要，需要的是更快响应），如果需要顺序，可能需要自己开发一些方法来重组（是不是又丢掉了实时性的意义？）
4. 可靠性带来的一点性能上的延迟，UDP用于实时通信
  - header 大小

### UDP 的场景

1. 实时
2. 广播。需要先找到 IP 才能建立 TCP 连接，而广播显然是比单播更快捷的方式。
  - 比如 DHCP protocol（应用层，下层是UDP）
  > DHCP stands for dynamic host configuration protocol and is a network protocol used on IP networks where a DHCP server automatically assigns an IP address and other information to each host on the network so they can communicate efficiently with other endpoints.
3. [DNS(port: 53) 更多用 UDP，但也用 TCP](https://ephen.me/2017/dns_tcp/)


## TCP 如何保证消息可靠？

1. ACK 机制
2. 超时重传 
  - TAG：RTO/RTT/Adaptive retrans algo
  - 一些场景：
    - 我发的data，peer 没有收到
    - peer 收到 data 但是没有 ACK
    - peer 发送了 ACK，但是我没有收到 ACK
  - 机制：会有一个定时器（timer）
  - 一个好的RTO设置非常重要，TCP 就有一些“评估算法”来帮助估计大概的RTO（根据RTT ）
    - 底层影响的因素是
      - 因为不同的连接，延迟差别可能非常的大  
      - 业务量的负载也可能导致延迟差异
  - 怎么解决这个问题呢？
    - TCP 设计了一个自适应算法（Adaptive Retransmission Algorithm），适应分组传输延迟的变化
3. 滑动窗口
  - 解决了什么问题：1. 性能（流控）；2. 可靠性
  - 为什么需要这个东西？因为 stream 的概念，这里体现的非常明显
  - 本质是什么？--- **基于 ACK 机制**
    - 典型的一个16bit的窗口大小（可以动态变化 --- 扩大因子）
    - buffer 分为发送和接受，send buffer 里面有四种“类型”的数据
      1. 已发送 + 已确认
      2. 已发送 + 未确认
      3. 未发送（但可以
      4. 未发生（不可以
    - windows 就包含 2/3，通过滑动进行流控
    - 同时根据网络拥塞的情况扩大和缩小 window size
4. 拥塞控制