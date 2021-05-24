#  message broker

__ 发表于 2021-03-14 __ 更新于 2021-03-15

在 App Annie 实习用到任务队列，接触到 celery（硅谷那一套，AWS 云扩展），其底层依赖的 message broker 默认是
RabbitMQ，本机测试环境是 Redis（除了 cache 以外有一个接触到的场景）。

这里做一些 RabbitMQ 与 Redis 的对比，由于没有深度使用 MQ，先做一些简单的总结，后面注意扩展。

## 什么是 RabbitMQ

## 为什么选择它？

1. 特性
2. 优势
3. 劣势
4. 适用场景

### 相对于 redis

  1. 大消息、长消息
  2. 消息不丢，redis 的消息可能会丢
  3. message routine, run same job on a specific server （这个可能是线上使用 rabbit mq 的重要原因）
  4. SSL 加密，redis 是收费服务？
  5. 持久化，重试等操作，redis不太好支持
  6. 处理pub-sub，还有点对点之类的消息处理模式
### 相对于 kafka

  1. kafka 性能更强
  2. 但是目前celery只支持amqp协议 Advanced Message Queuing Protocol 
  3. Kafka uses a binary protocol over TCP. The protocol defines all APIs as request response message pairs. All messages are size delimited and are made up of the following primitive types.

### 场景

## 它底层是怎样的架构

## reference

[what-is-rabbitmq](https://www.educba.com/what-is-rabbitmq/)

[rabbitmq-vs-redis](https://www.educba.com/rabbitmq-vs-redis/)

[rabbitmq-architecture](https://www.educba.com/rabbitmq-architecture/)

[消息队列之间的对比](https://zhuanlan.zhihu.com/p/52773169)
