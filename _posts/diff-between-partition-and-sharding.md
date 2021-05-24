#  partition and sharding

__ 发表于 2021-02-17 __ 更新于 2021-03-16

#### why need sharding？

When the amount of **data** starts to grow and **performance** starts to
become a **bottleneck**, **horizontal scaling** and **distributed** processing
is a good approach.

#### diff partition and sharding

`partition` and `sharding`很多语境下区别微乎其微，真正细研究起来：

  * partition is more a **generic** term for dividing data across tables or databases.
  * sharding is one **specific** type of partitioning, part of What is called **horizontal partitioning** (increase more instances、services).

#### What is sharding?

  * Replicate the schema across (typically) **multiple instances** or servers

#### how to shard?

数据操作的**本质**就是：**存、取**。使用某种Schema在这些机器上实行，然后使用一些逻辑or标识符通过schema去某些机器上查找。（_分布式带来
的复杂度，**去哪台机器上找数据？**_）

  * 最初的identifiers就是RDBMS中的自增id了，这种标识符称为**Shard Key**
  * 最常用的一种key-less logic是通过字母序来决定的
  * 还有些是使用key-synchronizition system ===> zookeeper（管理分布式系统）

## Instagram instance

  1. 开始不给系统带来太大的复杂度，比如引进分布式系统
  2. 讨论方案的时候，典型的**优缺点**要罗列清楚（pros and cons），这样才好更容易做决策。
  3. **sharding**的本质就是**数据存放好之后（将数据分到很多桶里）我如何取的问题**
  4. 典型的就要对id这个东西非常上心

### 需求：

  * id要以时间有序的方式排序（即使没有其他信息，也能够排序）
  * id最理想的长度应该是64bits（更小的索引，更好的存储（比如适配redis））
  * 系统应该引入比较少的、新的’moving parts’（复杂度）

### 可能的解法（pros and cons）：

  1. 通过代码而非数据库的自增id（mongoDB’s Object）

    * 好处
      * application thread generates IDs independently
      * 使用时间戳作为第一部分，自动排序
    * 坏处
      * 保证独立需要很多storage space（为什么？线程控制，全局独立，随着id足够多…）
      * UUID？也没有一个很好的natural sort，而且128bits长度
  2. 某种服务专门用来产生id  
twitter的snowflake，apache zookeeper，64-bits unique IDs

    * 好处
      * 64-bits
      * time作为第一部分
      * 分布式系统，更加可用、某些节点死了的情况下
    * 坏处
      * 引入了复杂度
  3. DB自动增加的能力（two ticket DBs 避免单节点失败）

    * 好处
      * 很好理解，很好的预期扩展性
    * 坏处
      * 写会有瓶颈（事务带来）
      * 需要一些机器专门来管理（比如EC2）
      * 单节点可能失效，多节点可能不保证随时间的有序性（考虑两个节点交叉写的情况）

### 对比

> 现代RDBMS（PostgreSQL）提供了**逻辑上的sharding**，在很少的机器情况下，仍然能进行分片

以上一些方案，分布式的方法更适合。但是，会引入复杂度。

逻辑分片，粒度：DB => schema => table，而不是传统的DB => schema（public）
```
    # Postgre有内置的语言，通过位运算处理三部分的id  
    41bits（微秒） ===> 41年  
    13bits（逻辑shard）  
    10bits（取模）  
    # 每微秒每个shard产生1024个ID  
```
[database-sharding-vs-
partitionin](https://stackoverflow.com/questions/20771435/database-sharding-
vs-partitioning)

[EXAMPLE: handle instagram id](https://instagram-engineering.com/sharding-ids-
at-instagram-1cf5a71e5a5c)
