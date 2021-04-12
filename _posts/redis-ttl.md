#  Redis - TTL

__ 发表于 2021-02-16 __ 更新于 2021-02-22

## How Redis expires keys?

Redis keys are expired in two ways: a passive way, and an active way.

使用频繁的是passive way，典型的就是只有当反问到某个key的时候，才判断它是否过期了。

但是这样会产生一个问题。

  * 如果一个key一致不被访问到，那会一直占用空间。

解决这个问题的一个简单的思路就是：固定的时间随机找到一些key，判断这些key是否存在过期的，然后删除。

更进一步的，如果key的数量超过25%，重新执行一次上面的操作。

[how-does-redis-expire-keys](https://stackoverflow.com/questions/36172745/how-
does-redis-expire-keys)
