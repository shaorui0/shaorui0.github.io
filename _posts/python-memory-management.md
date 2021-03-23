#  memory management

__ 发表于 2021-02-16 __ 更新于 2021-02-17

python怎么管理内存？

  * 引用语义  
一个对象，多个指针指向它，这也就是 is 和 == 的不同指出，检查是否是同一个对象，以及对象的值是否相同

  * GC  
python的GC，典型的ref_count=0的时候；循环引用能被释放

  * 内存池
    * 内存的垃圾回收是怎么样的？将不用的内存放到内存池而不是返回给操作系统
    * Pymalloc机制：python的内存池机制，管理小块的内存申请和释放
    * 不同python对象，都有独立的私有内存池

## GC

### 引用计数会有什么问题？

典型的循环引用问题

循环引用会导致一个应该被回收的对象无法被回收（ref_count==1）

python如何解决这个问题？（C++的智能指针shared_ptr是如何解决这个问题的？）

[https://zhuanlan.zhihu.com/p/62282961](https://zhuanlan.zhihu.com/p/62282961)

[https://www.zhihu.com/question/32373436/answer/549698608](https://www.zhihu.c
om/question/32373436/answer/549698608)

### 如何使用GC？

  1. import gc，解决循环引用的问题
    * gc.garbage，[]，保存准备回收的对象
    * gc模快有一个自动垃圾回收的阀值，即通过gc.get_threshold函数获取到的长度为3的元组，例如(700,10,10)
    * 如果对象定义了__del__，则不回收
  2. 分代回收。三代，老年代数据停留时间最长
    * 分代回收是建立在**标记清除**技术基础之上。分代回收同样作为Python的辅助垃圾收集技术处理那些容器对象
  3. 标记清除
    * 标记清除算法作为Python的辅助垃圾收集技术主要处理的是一些容器对象
    * TODO 具体怎么组织的？

[# python](/tags/python/)

[ __ Redis - LRU ](/2021/02/16/redis-lru/)

[ Coroutine __ ](/2021/02/16/coroutine/)

  * 文章目录 
  * 站点概览 

  1. 1. GC
    1. 1.1. 引用计数会有什么问题？
    2. 1.2. 如何使用GC？

