#  what difference between sql and nosql --- data model

__ 发表于 2021-02-08 __ 更新于 2021-03-08

对《[ddia](https://vonng.gitbooks.io/ddia-cn/content/ch2.html)》的一些笔记

## sql 与 nosql **数据模型**上的不同

  1. 数据模型本身影响软件架构、代码编写。  
典型的 `1: n` 关系 与 『阻抗不一致』。（什么是阻抗失协？）

    * **模型-对象**之间转换的不连贯性 –> ORM（object-relational mapping, like Hibernate） 可以在一定程度上解决问题，但是它不能完全隐藏这两个模型之间的差异。
    * 比如一个最大深度为9层的 json，如果用 sql 存储是多么的酸爽。
    * 当然，现代 sql 数据库（比如 postgreSQL）支持了 json（json 的**局部性**更好）。
  2. 一些功能比如『事务』、『join』，关系型数据库支持的更好。
    * join 用在什么场景？典型的 1: n 是文档的优势
    * n: 1 呢？n: m 呢？
      * region_id 和 industry_id是以 ID，而不是纯字符串“Greater Seattle Area”和“Philanthropy”的形式给出的。多个不同的 ID 可能代表的意思（对人类）相同。去除此类重复是数据库 **规范化**（normalization） 的关键思想。
      * 比如 blog 页面的友情链接，多个实体之间相互串联  
其实没有本质区别，关系型中有`外键`，文档型中有`文档引用`

  3. 具体到架构上呢？
    * locality 带来了架构的灵活性，性能可能也更好，更接近应用程序使用的数据结构
    * 关系模型通过为连接提供更好的支持以及支持多对一和多对多的关系来反击。

# 不同方面，关系型与文档型的对比：

## 更方便写代码？

  1. 如果一次加载整个『树』，文档
  2. 如果引用嵌套过深的某个 item，关系
  3. 如果不需要多对多引用，文档

> 文档数据库对连接的糟糕支持也许或也许不是一个问题，这取决于应用程序。

  4. 如果需要多对多关系，关系，或图？

> 通过反规范化可以减少对连接的需求，但是应用程序代码需要做额外的工作来保持数据的一致性。通过向数据库发出多个请求，可以在应用程序代码中模拟连接，但是这也将
复杂性转移到应用程序中，并且通常比由数据库内的专用代码执行的连接慢。

## 架构的灵活性

本质是 scheme 与 non-scheme（处理 json、关系型，后面还有类似 protobuffer 的数据协议）

关系型，migration

    1  
    2  
    3  
    ALTER TABLE users ADD COLUMN first_name text;  
    UPDATE users SET first_name = split_part(name, ' ', 1);         -- PostgreSQL  
    UPDATE users SET first_name = substring_index(name, ' ', 1);     -- MySQL  

[ __ (Non)blocking / (A)synchrony ](/2021/02/06/DIFF-blocking-non-blocking-
synchronism-asynchronism/)

[ web server - timerfd/eventfd __ ](/2021/02/10/web-server-timer/)

  * 文章目录 
  * 站点概览 

  1. 1. sql 与 nosql 数据模型上的不同
* 不同方面，关系型与文档型的对比：

  1. 1. 更方便写代码？
  2. 2. 架构的灵活性

