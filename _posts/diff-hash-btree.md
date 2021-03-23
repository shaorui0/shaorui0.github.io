#  Index

__ 发表于 2021-02-16 __ 更新于 2021-03-16

[reference](https://stackoverflow.com/questions/7306316/b-tree-vs-hash-table)

一开始的索引，就是key-value结构的。但后来，为什么会出现使用b-tree的场景？

## 从数据结构的角度

> Tree algorithms are usually easier to maintain, grow with data, scale

> The trade off for tree algorithms is small and they are suitable for almost
every use case and thus are default.

处理规模化的数据时，hash维护key会显著变慢（冲突处理）

  * hash时间复杂度可能落入到O(n)
  * b-tree更平衡，平均复杂度为O(log n)

## 从数据库的角度

> The difference between using a b-tree and a hash table is that the former
allows you to use column comparisons in expressions that use the =, >, >=, <,
<=, or BETWEEN operators, while the latter is used only for equality
comparisons that use the = or <=> operators.

就存取特征而言，hash table是离散的，只能以O(1)的时间复杂度寻找特定值，而不支持range query（**主要原因**）。

## 不同点

  1. hash 不是『磁盘友好型』数据结构，B-Tree 是。
    * hash 如果要做持久化一般是使用 append-only 的形式，修改的话只能追加，不过同样需要在内存中维护一个映射表（类似 file seek(offset)）
    * 进一步的优化涉及到新的概念 — LSM-Tree（使用 SSM-Table）
  2. hash 不支持 range search。
  3. hash 不支持多列联合索引的最左匹配规则

[# database](/tags/database/)

[ __ What is polymorphism? ](/2021/02/16/what-is-polymorphism-what-is-it-for-
and-how-is-it-used/)

[ virtual memory __ ](/2021/02/16/what-is-memory-management/)

  * 文章目录 
  * 站点概览 

  1. 1. 从数据结构的角度
  2. 2. 从数据库的角度
  3. 3. 不同点

