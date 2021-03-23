#  consistent-cache-RDBMS

__ 发表于 2021-02-22 __ 更新于 2021-03-16

一致性的问题，只有在 **huge traffic and high concurrency** 时，才会产生重要的影响。一般的场景使用简单的『Cache
Expiry』和『Cache Aside』就可以了。

## 1. Cache Expiry

> naive solutions.

关于一致性，设置TTL核心问题是『你能承受多长时间读脏数据

  1. 30 mins? 可能时间过长
  2. 1 min? 仍然可能时间过长。（huge traffic and high concurrency）
  3. 5 seconds? 时间设置的太短有失去了设置 cache 的意义。（造成过多的 cache miss ）

## 2. Cache Aside

> mostly work for common use cases.

The algorithm for cache aside pattern is:

  * For immutable operations (read):

    * Cache hit: return data from Redis directly, with no query to MySQL;
    * Cache miss: query MySQL to get the data (can use read replicas to improve performance), save the returned data to Redis, return the result to client.
  * For mutable operations (create, update, delete):

    * Create, update or delete the data to MySQL;
    * Delete the entry in Redis (always delete rather than update the cache, the new value will be inserted when next cache miss).

### corner case

  1. 【保证最终一致性】场景一  
假设命令都能正确执行

    * (A - 1) A update new value to mysql
    * (B) B read old value from redis, and return
    * (A - 2) A delete redis key  
此时 B 读到了脏数据（但能保证最终一致性）

  2. 【不保证最终一致性】场景二  
如果场景一的（A - 2）执行失败 => old value in redis and new value in mysql => 无法保证最终一致性

  3. 【不保证最终一致性】场景三（可能性极低）
    * (A - 1) A read value from redis missed, and read from mysql, A process suspend (OS dispatch issue)
    * (B - 1) B update new value to mysql, and delete redis key
    * (A - 2) A write new value to redis  
此时 cache 中的数据与 mysql 中的数据不一致。为什么可能性低？

    1. 如果 B 尝试更新 new value, 按正确的顺序 Redis 中应该存在该条目（同时具有一个读取请求和一个更新请求，read(cache hit) -> update(mysql) -> delete(cache)）。如果 A 获得缓存命中，则不会发生这种情况。
    2. 为了使这种情况发生，该条目必须**已过期**并且已从 Redis 中删除。
    3. 但是，如果该条目“非常热”（即，其上的读取流量很大），则应在过期后不久将其再次保存到 Redis 中。
    4. 如果这属于“冷数据”，则其一致性应较低，因此很少有对此条目同时具有一个读取请求和一个更新请求的情况。
    5. 通常，写 Redis 比写 MySQL 要快得多。实际上，A 对 Redis 的写操作应该比 D 对 Redis 的删除操作早得多。

## 3. Cache Aside - Variant 1

The algorithm for the 1st variant of cache aside pattern is:

  * For immutable operations (read):

    * Cache hit: return data from Redis directly, with no query to MySQL;
    * Cache miss: query MySQL to get the data (can use read replicas to improve performance), save the returned data to Redis, return the result to client.
  * For mutable operations (create, update, delete):

    * Delete the entry in Redis.
    * Create, update or delete the data to MySQL;

与原始 Cache Aside 的区别在于先删 Redis 数据，但这样的修改带来了更多问题

  1. 【不保证最终一致性】场景
    * (A - 1) A delete redis entry
    * (B - 1) B read value from redis missed, and read from mysql
    * (A - 2) A update new value to mysql
    * (B - 2) B update new value to redis  
此时 redis 里面是 old value, mysql 里面是 new value。同样是保证操作不出错，与** Cache Aside
的场景三**相比，这种极端情况的概率高得多。

## 4. Cache Aside - Variant 2

The algorithm for the 1st variant of cache aside pattern is:

  * For immutable operations (read):

    * Cache hit: return data from Redis directly, with no query to MySQL;
    * Cache miss: query MySQL to get the data (can use read replicas to improve performance), save the returned data to Redis, return the result to client.
  * For mutable operations (create, update, delete):

    * Create, update or delete the data to MySQL;
    * Create, update or delete the entry in Redis.
  1. 【不保证最终一致性】场景
    * (A - 1) B update value 1 to mysql
    * (B - 1) B update value 2 to mysql
    * (B - 2) B update value 2 to redis
    * (B - 2) B update value 1 to redis

## 5. Read Through

The algorithm for read through pattern is:

  * For immutable operations (read):
    * Client will always simply read from cache. Either cache hit or cache miss is transparent to the client. If it is a cache miss, the cache should have the ability to automatically fetch from the database.
  1. 对于客户端透明
  2. if cache miss, cache 层自动从 storage 层获取数据

### cons:

许多缓存层可能不支持它。例如，Redis将无法自动从MySQL获取（除非您为Redis编写插件）。

## 6. Write Through

  * For mutable operations (create, update, delete):
    * The client only needs to create, update or delete the entry in Redis. The cache layer has to atomically synchronize this change to MySQL.

与 cache 的功能理念相违背，这种方式是把 redis 当做 storage 了，即使 redis 有持久化技术（RDB and
AOF），仍然不推荐使用

## 7. Write Behind

  * For mutable operations (create, update, delete):
    * The client only needs to create, update or delete the entry in Redis. The cache layer saves the change into a message queue and returns success to the client. The change is replicated to MySQL asynchronously and may happen after Redis sends success response to the client.

### pros

  1. 它**异步**地将更改复制到MySQL。因为客户端不必等待复制发生，所以它**提高了吞吐量**。具有**高持久性**的消息队列可能是一种实现，Redis stream 可能是一个不错的选择。
  2. 为了进一步提高性能，可以合并更改并批量更新MySQL（以节省查询数量）。

### cons

  1. 许多缓存层本身不支持此功能。
  2. 其次，使用的消息队列必须是**FIFO**。否则，对MySQL的更新可能会混乱，因此最终结果可能不正确。

## 8. Double Delete

> 原始的 cache aside 的变体。

The algorithm for double delete pattern is:

  * For immutable operations (read):
    * Cache hit: return data from Redis directly, with no query to MySQL;
    * Cache miss: query MySQL to get the data (can use read replicas to improve performance), save the returned data to Redis, return the result to client.
  * For mutable operations (create, update, delete):
    * Delete the entry in Redis;
    * Create, update or delete the data to MySQL;
    * Sleep for a while (such as 500ms);
    * Delete the entry in Redis again.

通过将**进程暂停500毫秒**，该算法假定所有并发读取进程已将旧值保存到Redis中，因此对Redis的第二次删除操作将清除所有脏数据。

解决了 cache aside 的什么问题？

  1. 这里遵循的宗旨是 cache 宁愿不存数据，也不存脏数据（无法保证**最终一致性**）

# ref doc

[https://www.programmersought.com/article/11164925218/](https://www.programmer
sought.com/article/11164925218/)

[https://danielw.cn/cache-consistency-with-database](https://danielw.cn/cache-
consistency-with-database)

[https://yunpengn.github.io/blog/2019/05/04/consistent-redis-
sql/](https://yunpengn.github.io/blog/2019/05/04/consistent-redis-sql/)

[https://github.com/alibaba/canal](https://github.com/alibaba/canal)

[# data](/tags/data/) [# redis](/tags/redis/) [# database](/tags/database/)

[ __ What is Callback ](/2021/02/20/callback/)

[ Redis - why redis fast? __ ](/2021/03/01/why-redis-fast/)

  * 文章目录 
  * 站点概览 

  1. 1. 1. Cache Expiry
  2. 2. 2. Cache Aside
    1. 2.1. corner case
  3. 3. 3. Cache Aside - Variant 1
  4. 4. 4. Cache Aside - Variant 2
  5. 5. 5. Read Through
    1. 5.1. cons:
  6. 6. 6. Write Through
  7. 7. 7. Write Behind
    1. 7.1. pros
    2. 7.2. cons
  8. 8. 8. Double Delete
* ref doc

