#  Redis - persistence

__ 发表于 2021-03-01 __ 更新于 2021-03-10

Redis trades data safety versus performance, like most NoSQL-DBs do.

  1. 两种持久化的缩写

    * redis database
    * append only file  
概念上还是非常清晰，一个是定时备份快照，适合那些时效性不强的，丢了也没关系的数据，比如缓存，一个小时备份一次，一些冷数据没必要继续留着。另一个是实时的（当然
，无法精确一致性到单条数据的恢复级别（事务）），每执行一次server，备份一条数据

  2. 大概的实现方式

  3. 有什么区别？各自的优势、劣势？trade-offs 

    * fork 可能会影响效率
      * 为什么AOF也是fork大事影响小？
        * 从之前学得 LSM tree 来回答，only append 的效率，肯定是比一大坨数据在内存中进行处理，然后写入到disk效率更高
        * so there are no seeks, 
    * append only 
      * redis-check-aof tool
    * 如何进行 roll 的？切换文件的过程是怎么做的？
      * mi’nimal set, switch
    * flush all 了也有办法恢复，只要没有 rewrite
    * Using AOF Redis is much more durable
    * RDB 因为是一坨数据 ， 处理完以后再加进去， 所以数据encode会更加『紧致』，空间占用更小
    * RDB 保证极限可控， AOF 可能在极端情况下，写数据比较慢（很多客户端都在往 process 进行写）
    * RDB 是每次都创建所有内容（一个serevr里面de ）
      * RDB 基本是不会丢失数据（那个point而言）
      * 但是 AOF可能丢失某些数据
        * 然后，每次rewrite是从 AOF file里面读取，而不是从内存？
        * 应该注意的是，每次Redis重写AOF时，都会从数据集中包含的实际数据开始从头开始重新创建AOF，与始终附加AOF文件相比，对错误的抵抗力更强  
【问】AOF的rewriten是怎么工作的？

one rewritten reading the old AOF instead of reading the data in memory

  4. 为什么这么设计，各有什么使用场景
    * 缓存，有冷热数据的时候，通常每小时备份一下就可以了？
    * 除了缓存，还有什么使用场景？
  5. 配置上有什么需要注意的？
  6. 底层实现上有什么不同导致这两种不同的结果？
  7. 分布式的场景下，持久化如何工作？

* * *

有件好玩的事，学 redis 时我想起来之前学过 LSM（log structure merge） tree，这个数据结构设计本质上是专门针对 write
优化的。但是我好奇 redis 的持久化 aof（append only file） 是否用了 LSM tree ，通过搜索我发现有这个疑问的不止我一个：

> LSM is AOF that you want to actually read sometimes. You do some overhead
work so you can read it faster later. Redis is designed so you never or only
in a special case read it. On the other hand, Cassandra often reads it to
serve requests. [here](https://stackoverflow.com/questions/50478674/redis-aof-
fsync-always-vs-lsm-tree)

其结论很简单，redis 没有用 LSM tree，因为它根本没想过**更新**这个持久化文件，更多的功能是用来错误恢复。

[# data](/tags/data/) [# redis](/tags/redis/)

[ __ Redis - why redis fast? ](/2021/03/01/why-redis-fast/)

[ what is load balancer __ ](/2021/03/02/what-is-load-balancer/)

  * 文章目录 
  * 站点概览 

