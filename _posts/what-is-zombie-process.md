#  Zombie process

__ 发表于 2021-02-16 __ 更新于 2021-03-13

### linux关于进程的部分，最初是如何设计的？

Linux 允许进程查询内核以获得其父进程的 PID，或者其任何子进程的执行状态。

例如，进程可以创建一个子进程来执行特定的任务，然后调用诸如 wait()
这样的一些库函数检查子进程是否终止。如果子进程已经终止，那么，它的终止代号将告诉父进程这个任务是否已成功地完成。

为了遵循这些设计原则，不允许 Linux 内核在进程一终止后就丢弃包含在进程描述符字段中的数据。只有父进程发出了与被终止的进程相关的 wait()
类系统调用之后，才允许这样做。这就是引入僵死状态的原因：尽管从技术上来说进程已死，但必须保存它的描述符，直到父进程得到通知。

如果一个进程已经终止，但是它的父进程尚未调用 wait() 或 waitpid() 对它进行清理，这时的进程状态称为僵死状态，处于僵死状态的进程称为僵尸进程(zombie
process)。任何进程在刚终止时都是僵尸进程，正常情况下，僵尸进程都立刻被父进程清理了。

### 什么是僵尸进程？僵尸进程是如何产生的？会有什么问题？

1. 每个进程的回收都由父进程去执行，系统调用是`wait/waitpid`。子进程退出时父进程都调用`wait/waitpid`，会导致 zombie。
2. 如果一个父进程没有调用`wait`，而子进程结束，父进程继续执行，子进程的资源将没办法回收。此时，子进程变成了一个zombie。
3. 通常情况下，父进程被显式杀掉的时候，子进程将会（成为**孤儿进程**）被分派给init process，这样由它进行托管然后回收。

进程终止，一些基本的资源（open file, memory, etc）会被内核回收。

会占用进程表一个entry，**表的容量是有限的，占用多了肯定是会出问题的**

### 如何预防不产生僵尸？

1. waitpid  
waitpid的返回值是**子进程的退出状态**，根据这个状态能够表示是否需要回收数据

2. [Perform double fork()](https://stackoverflow.com/questions/10932592/why-fork-twice)
grandchild exits, no zombie (adopted by init)
这里的逻辑是：
      - 如果只创建一次，父子互不干预做自己的事情，会导致 parent 没有及时回收 child 的资源。
      - double fork 之后，child 的功能是简单的创建 gradechild + exit，此时parent 和 gradechild 的 父进程都变成了 init procss。
**这个方案处理了`wait`同步阻塞的问题**。

3. 忽略SIGCHLD,  
why? 能够让内核知道，可以立即回收，因为父进程表示不管它了

[why-zombie-processes-exist](https://stackoverflow.com/questions/16078985/why-zombie-processes-exist)

### 如何处理

僵尸进程一直停留的原因是父进程的“不作为”（比如：sleep），唯一的外部介入的方法就是 Kill 掉父进程。zombie process 会自动将回收权限交给 Init process。

### 僵尸进程会占用其他资源吗？

在进程退出的时候，内核释放该进程所有的资源，包括打开的文件，占用的内存等。**但是仍然为其保留一定的信息**(包括进程号 PID，退出状态 the
termination status of the process，运行时间 the amount of CPU time taken by the
process 等)。直到父进程通过 wait / waitpid 来取时才释放。

zombie 测试代码，运行时产生`Z+`，结束父进程，僵尸进程也会被回收（`init_process`）。
```c
  #include <stdio.h>  
  #include <unistd.h>  
  #include <stdlib.h>  
  int main()  
  {  
      pid_t pid, ppid;  
      printf("Hello World1\n");  
      pid=fork();  
      if(pid==0)  
      {  
          exit(0);      
      }  
      else  
      {  
          while(1)  
          {  
          printf("I am the parent\n");  
          printf("The PID of parent is %d\n",getpid());  
          printf("The PID of parent of parent is %d\n",getppid());          
          sleep(2);  
          }  
      }  
  }  
```
### 什么是孤儿进程？
diff with zombie

很明显，父进程先于子进程死亡。
一个父进程在子进程前面死亡，子进程被init process 接管，虽然能够自动调用`wait`。

### 进程状态

[https://stackoverflow.com/questions/33979231/status-of-process-on-linux](https://stackoverflow.com/questions/33979231/status-of-process-on-linux)
```

  PROCESS STATE CODES  
      Here are the different values that the s, stat and state output   
      specifiers (header "STAT" or "S") will display to describe the  
      state of a process:  
          D    uninterruptible sleep (usually IO)  
          S    interruptible sleep (waiting for an event to complete)  
          R    running or runnable (on run queue)  
          T    stopped by job control **signal**  
          t    stopped by **debugger** during the tracing  
          W    paging (not valid since the 2.6.xx kernel)  
          X    dead (should never be seen)  
          Z    defunct ("zombie") process, terminated but not reaped by its parent  
```