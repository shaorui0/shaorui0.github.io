#  Redis - LRU

__ 发表于 2021-02-16 __ 更新于 2021-02-22

# LRU algorithm and LRU implementation of Redis

### 【问】如何设计一个redis的内存淘汰机制？

面试过程的遇到过这个问题。

  0. 典型的内存淘汰机制是LRU
  1. LRU的常规实现是双向链表

但问题并不只是这么简单。一个典型的面试场景是这样的：

  * 如果一个key在里面，再次访问需要拿到前面来，那么如何拿？
    * 基于目前的情况，只能是**遍历**。
  * 遍历是不是太慢了？
    * 脱口而出 排序 + 二分
  * 那么排序后，『优先级』的信息是不是丢失了？
    * 排序肯定是错误的。说到优先级，这个时候我又想到了优先队列（基于堆）。但其实这个就不是双向链表的实现了，以及整个过程有点偏离正确答案了。
    * 想到维护一个树的话，查找速度从 n => logn，这是一个进步。
  * 什么样的树呢？
    * 为了保证树不会退化到链表，需要维护**平衡**，这里想到了**红黑树**
  * 那么一开始为什么不使用红黑树而要使用双向链表？
    * 其实是两个数据结构联合实现的
      * 【index 解决 search 的问题】查找的速度通过红黑树解决（也可以使用unsorted_map，也就是索引解决）
      * 【双向链表解决 write 的问题】维护优先级的问题通过双向链表解决

解决方案：

  * (key, addr) 在 hash table 中，
  * (key, value) 在 two-way chain table 中。

TODO 实现

### 真正到工业级的redis的实现，又和严格LRU的有一些出入

  1. 维护严格的LRU比较耗费空间（大量的前后指针）。

    * 能想到怎么优化吗？将n减少到常数级别，只对少量的kv进行维护。
    * 这里涉及到一个『采样』的问题。有什么比较好的采样策略，能够使每次的最终结果接近于严格LRU？`maxmemory-samples 5 `
  2. redis提供了多种驱逐策略，应该怎么选用？

业务中的使用场景有关

TODO 更深入的接触到redis后，进行进一步的了解。

[LRU cache](https://redis.io/topics/lru-cache)

[如何实现一个kv形式的严格LRU策略](https://programmer.help/blogs/redis-lru-algorithm-and-
lru-implementation-of-redis.html)

[# redis](/tags/redis/)

[ __ Redis - data structure ](/2021/02/16/redis-data-structure-in-action/)

[ memory management __ ](/2021/02/16/python-memory-management/)

  * 文章目录 
  * 站点概览 

  1. 1. LRU algorithm and LRU implementation of Redis
    1. 1.0.1. 【问】如何设计一个redis的内存淘汰机制？
    2. 1.0.2. 真正到工业级的redis的实现，又和严格LRU的有一些出入

