#  why stack can overflow but heap cannot?

__ 发表于 2021-02-16 __ 更新于 2021-02-17

## stack

![进程地址空间](https://github.com/shaorui0/fundamental_knowledge/blob/main/operator
_system/memory/mmap/%E5%86%85%E5%AD%98%E5%9C%B0%E5%9D%80%E7%A9%BA%E9%97%B4.jpe
g)

一个32bit字长OS，进程栈大小通常是8MB。一些比较危险的操作（`gets()`，分配一个指定大小的buffer，通过`while(gets(buf)
!= 0)`，可以一直读下去。）输入过多会导致栈溢出，甚至直接覆盖栈其他部分。比如**ret
addr**，这样可能导致跳转到不可控的一个函数上—-著名的『**缓冲区溢出攻击**』。

## heap

heap内存的申请，C语言中通过`malloc`完成。底层的实现大致为，一个链表维护所有空闲碎片，通过某种迭代算法去寻找可用的内存。如果找到，则返回内存，并
把多余的碎片继续用链表维护。一般迭代一次找不到后，会对碎片进行一个整理。如果还是不行，则返回NULL。（现代操作系统malloc申请大小大于`MMAP_TH
RESHOLD`时，会直接调用`mmap`）。

> Normally, malloc() allocates memory from the heap, and adjusts the size of
the heap as required, using sbrk(2). When allocating blocks of memory larger
than MMAP_THRESHOLD bytes, the glibc malloc() implementation allocates the
memory as a private anonymous mapping using mmap(2). MMAP_THRESHOLD is 128 kB
by default, but is adjustable using mallopt(3). Allocations performed using
mmap(2) are unaffected by the RLIMIT_DATA resource limit (see getrlimit(2)).
[why-does-malloc-rely-on-mmap-starting-from-a-certain-
threshold](https://stackoverflow.com/questions/33128587/why-does-malloc-rely-
on-mmap-starting-from-a-certain-threshold)

#### 关于sbrk和mmap的对比

  * 用`sbrk`，`free`释放后，内存还为当前进程所有。
  * 用`mmap`，`munmap`释放后，就释放给了全局，毕竟是从磁盘直接映射的。调用时不会阻塞（应该），而第一次使用时，才会真正的执行
    * zero set是为了防止泄露数据给其他进程。

> **mmap does not actually allocate the pages; it just manipulates the page
map for your process**. That should typically be a **non-blocking operation.**
(Although I admit I am not 100% sure about this.)

[# OS](/tags/OS/)

[ __ why need type system? ](/2021/02/16/why-need-type-system/)

[ Basic knowledge of web development __ ](/2021/02/16/diff-between-post-and-
put/)

  * 文章目录 
  * 站点概览 

  1. 1. stack
  2. 2. heap
    1. 2.0.1. 关于sbrk和mmap的对比

