#  Waitpid usage

__ 发表于 2021-02-16 __ 更新于 2021-02-17

## WNOHANG

> If a child **died**, its pid will be returned by wait()/waitpid() and your
process can act on that. If nothing died, then the returned pid is 0.

  * 非阻塞，做其他事情
  * 检查children是否为zoobie（CTRL+C），让内核去回收（waitpid collect the status）

## WUNTRACED

> WUNTRACED allows your parent to be returned from wait()/waitpid() if a child
gets stopped as well as exiting or being killed.

> your parent has a chance to send it a SIGCONT to continue it, kill it,
assign its tasks to another child, whatever.

  * parent不想做其他事，仅等待进程执行终止。
  * 但，当STOP发生的时候，一般的行为不会通知到wait/waitpid，该函数也就无法返回，此时会产生『死锁』，除非重新执行（continued）
  * 所以需要有一个机制防止这种情况。其场景是，当`SIGSTOP`发生，也能退出wait/waitpid，未来也就能执行`CONTINUE`.

[# OS](/tags/OS/)

[ __ What is DNS ](/2021/02/16/what-is-dns/)

[ Redis - TTL __ ](/2021/02/16/redis-ttl/)

  * 文章目录 
  * 站点概览 

  1. 1. WNOHANG
  2. 2. WUNTRACED

