#  database - index

__ 发表于 2021-03-14 __ 更新于 2021-03-16

# 数据库索引

> 一些阅读总结，还需要深度扩展，逻辑应该更连贯。

## 聚簇索引、非聚簇索引

### 索引底层

就 mysql innoDB 而言，索引底层主要是分为聚簇索引、非聚簇索引。

其中的区别主要是：

  1. 聚簇索引只能包含单列，在 B+Tree 上保存完整的数据行；非聚簇索引可以包含多列（符合『最左匹配原则』），在 B+Tree 上保存一个引用映射，需要二次跳转。涉及到多列的最左匹配（比如 key k_abc(a, b, c)），其底层 B+ 树上保存的索引形式是（1,2,3）…。也就是只能在 a 确定的基础上进行查找。
  2. 聚簇索引是有序的，所以 best practice 一般是对索引字段使用 range search 而不是 `!=` 之类的操作。

  3. 非聚簇索引可能导致回表（多次磁盘IO）
    * 所谓的回表，是指查询字段涉及非索引字段，比如设置 k_ab(a, b)，执行 `select d from table where a="a" and b="b" and c="c";`。由于查询涉及到 `c`，其过程是通过索引一致 search 到 B+Tree 的叶子节点，根据叶子节点定位到所有符合`a/b`的行，然后再从这些行中筛选`c`。
    * 对于某些情况，比如`select b from table where a="a" and b="b";`select 和 where 涉及的字段都被**覆盖**在索引中了，所以无需『回表』。其实很好理解，从B+Tree 的底层构成，节点上的信息就可以知道了（非聚簇索引中间节点保存索引字段的数据，叶子节点保存索引字段 - 整行数据的映射，如果只查询索引字段，就没要进行**二次跳转/回表**了）。（为什么索引和select 有关在这里也体现出来了）。所以这里的 sql 优化点在于：
      * 少使用 `select * `，能只包含索引字段就只查索引字段，尽可能使用『覆盖索引』
      * 一定要符合最左匹配（比如 k_abc 只查 b/c），不然会导致索引失效。

### innoDB 与 MyISAM

  1. innoDB 使用典型的聚簇索引 + 非聚簇索引，MyISAM只是用非聚簇索引
  2. MyISAM 具体的行数据都保存在特定文件中，主键与非主键都是通过引用地址进行二次跳转。

## DB上层

索引分为 primary index、unique index、index(single col and multiple cols)

unique index 一般设置为 not null，不然真实数据中只能有一行该列为 null。

primary index 默认为聚簇索引，可以修改表scheme，设置专门的聚簇索引。

普通 index 可以设置为单列或者多列，多列满足最左匹配，sql 语句可以乱序，优化器会优化语句的执行过程。

## reference

  * [关于 view 是否使用 index](https://stackoverflow.com/questions/13944946/how-do-i-get-mysql-to-use-an-index-for-view-query)
  * [关于一些 sql 优化策略](https://cloud.tencent.com/developer/article/1004912)
  * [关于非聚簇索引是否会回表，涉及到覆盖索引的概念](https://developer.aliyun.com/ask/281206)
  * [关于聚簇索引/非聚簇索引的基本对比](https://www.javatpoint.com/mysql-clustered-vs-non-clustered-index#:~:text=Clustered%20VS%20Non-Clustered%20Index%20%20%20%20Parameter,in%20compari%20...%20%205%20more%20rows)
  * [关于聚簇索引/非聚簇索引的基本对比2](https://cloud.tencent.com/developer/article/1541265)
  * [关于 implicit indexes，本质是最左匹配，两种引擎可能有区别](https://dba.stackexchange.com/questions/37643/are-there-implicit-indexes-in-innodb-like-myisam)
  * [一次典型的索引知识点相关的面试，涉及到的『索引下推』有点意思](https://zhuanlan.zhihu.com/p/73204847)
