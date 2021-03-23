# 索引


## 从索引本身的特性

1. 关键值索引（一级索引）
    - 唯一性
2. 二级索引
    - 通过 `CREATE INDEX`
    - 不唯一，比如 join 之后产生同一个`user_id`对应多行数据

### 场景

主键适用于最常见的查询，一般设置为`id`（设置为id的底层逻辑是B-Tree适合读不适合写，由于其有序性，如果需要insert record，情况好会直接插到某个节点上，情况不好则需要堆一个节点进行split）
二级索引适用于`join`方式，典型的各种转发

## 不同的索引策略

1. 聚簇
    保存行（或者记录（nosql））**所有**值
2. 非聚簇（转发）
    具体转发到哪里，是不同数据库产品的抉择（trade off）
    - 堆文件
        - append only（比如LSM Tree），写更快
        - update/delete（比如B Tree），读更快（有序）
3. 覆盖（聚簇/非聚簇的中间状态）
    比如查询SQL只涉及到指定字段的值，则无需转发，这个过程称为**索引覆盖（cover）了查询**
    - 单列
    - 多列（符合一些策略，比如“最左匹配原则”）

## 索引的底层实现

1. hash
    - 作为最初的索引形式，如果索引函数设计的好，性能达到O(1)，比树的O(logN)快。
    - Mysql 中索引也可以设置为 Hash
        - 作为主键的使用场景其实不多，O(logN)性能与O(1)相差不多
        - 作为二级索引的时候，由于不唯一性，可能需要加入区别符，比如{user_id}_1/2/3...
    - 【缺点】但是 Hash 的特点是**只能维护在内存中**
2. B tree family
    - 一般用于一级索引，更好排序查找。
3. LSM tree（按下不表，append-only，levelDB会用到）

### 关于 B-Tree 与 LSM-Tree 的对比

主要是两种思维方式，各自有自己适合的场景

TODO LSM Tree

## 从数据库的角度

1. primary key
    关键字索引，在 Mysql-innoDB 中实现为聚簇，底层数据结构是 B+Tree
    
2. unique key
    [注：unique key 是另一层面的东西](https://stackoverflow.com/questions/9565996/difference-between-primary-key-and-unique-key)

3. index，二级索引
    - 在 Mysql-innoDB 中可以升级为覆盖索引，覆盖失败**回表**通过二次转发到关键字索引上。
    - 在 Mysql-Myisam 中都被实现为转发形式的索引（没有聚簇索引），具体的行数据存在指定文件中。好处是具体行记录只维护在一个地方，空间换时间。


### RDBMS

1. 关键值索引在这里被称为“主键”
2. 二级索引在这里主要作为一种普通的索引形式，设置多个，可以有多列（Mysql）


## QA
1. 
https://stackoverflow.com/questions/9565996/difference-between-primary-key-and-unique-key

2. B-Tree 对比 Hash
    1. hash快
    2. hash 只能在内存
    3. 如果hash效果不好会O(n)

3. B-Tree 对于 LSM-Tree
    值得一篇blog来说明