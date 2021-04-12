#  What is static link and dynamic link

__ 发表于 2021-02-16 __ 更新于 2021-02-25

## 对比的角度

  1. 快（performance），加载过程的时间不同
  2. 编译兼容性（mantainable）
  3. 底层用到的工具不同：linker(.a)/loader(.so)。

### 静态编译：

高级语言 => 汇编语言 => 机器语言（.o）===> 合并多个（本质是一个扩充声明为定义的过程，静态连接器）=> 加载到OS => 执行

##### 静态的好处：

  1. 更快，本质上是一起工作的，可预期编译时长（但代码会显著扩展，所有的外部函数调用都扩展成相应的代码）
  2. 不会有版本问题，一起编译。

### 动态编译：

动态文件/库一般是在**运行时**通过加载到OS中（进程地址空间的**共享内存**中）

##### 动态的好处：

> Additionally dynamic libraries aren’t necessarily loaded – they’re usually
loaded when first called – and can be shared among components that use the
same library (multiple data loads, one code load).

  1. 可独自升级（debug）
  2. **占用资源更少**，多个进程可以**共享**（**共享内存**）。而静态module则都需要copy到最终的可执行文件

### 结论

动态库是一种更让人倾向的方案，但之前出过问题 (google DLL hell)

![](/2021/02/16/diff-static-link-and-dynamic-link/static_link.png)
![](/2021/02/16/diff-static-link-and-dynamic-
link/%E5%86%85%E5%AD%98%E5%9C%B0%E5%9D%80%E7%A9%BA%E9%97%B4.jpeg)

## ref

  * [diff 1](https://stackoverflow.com/questions/47116485/differences-between-static-libraries-and-dynamic-libraries-ignoring-how-they-are)
  * [diff 2](https://www.quora.com/What-is-the-difference-between-static-and-dynamic-linking)
  * [diff 3](https://stackoverflow.com/questions/61553723/whats-the-difference-between-statically-linked-and-not-a-dynamic-executable)
