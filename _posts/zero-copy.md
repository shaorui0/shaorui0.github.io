#  what is zero copy

__ 发表于 2021-03-11 __ 更新于 2021-03-12

## zero copy

> sendfile() copies data between one file descriptor and another. Because this
copying is done within the kernel, sendfile() is more efficient than the
combination of read(2) and write(2), which would require transferring data to
and from user space.

### 场景是什么？

> Many **Web applications** serve a significant amount of **static content**,
which amounts to reading data off of a disk and writing the exact same data
back to the response socket. This activity might appear to require relatively
little CPU activity, but it’s somewhat **inefficient**: the kernel reads the
data off of disk and pushes it across the kernel-user boundary to the
application, and then the application pushes it back across the **kernel-user
boundary** to be written out to the socket. In effect, the application serves
as an inefficient intermediary that gets the data from the disk file to the
socket.

典型的场景： web app 处理大量的 static pages/files。跨机器的 IPC 一般是 socket。

过程一般是： fd(local file) -> socket(networking)。

具体细节见下图，会涉及到四次 system call 和四次内容复制

![](/2021/03/11/zero-copy/original_serve_static_file.png)
![](/2021/03/11/zero-copy/original_switch_context.png)

#### 可能减少 switch context 次数或者 copy 次数吗？

可以，原因是内容从文件到内核到用户态再发出去这个过程并没有对数据有什么操作，完全可以**不经过用户态**。

那如果需要在用户态处理数据有没有什么办法减少上下文转换或者复制次数呢？也会一些解决办法，不过注意 trade off。

### 为什么使用 zero copy?

> Each time data traverses the user-kernel boundary, it must be copied, which
consumes **CPU cycles and memory bandwidth**. Fortunately, you can eliminate
these copies through a technique called — appropriately enough —zero copy.
Applications that use zero copy request that the kernel copy the data directly
from the disk file to the socket, without going through the application. Zero
copy greatly improves application performance and reduces the number of
context switches between kernel and user mode.

首先搞清楚概念，zero copy 是指不需要 user mode 与 kernel mode
之间进行数据复制，一些真正的复制过程由硬件自身（DMA）完成（**不占用 CPU 的循环和 Memory 的带宽**）。

zero 是从 OS 的角度来看的。

### 怎么使用 zero copy

经过上面的分析，如何能够不经过用户态与内核态的复制呢？

  1. sendfile。核心思想是直接从 fd1 复制内容到 fd2。
  2. mmap。核心思想是利用虚拟内存技术（页对齐），将文件内容直接映射到进程地址空间（用户态，介于 stack 和 heap 之间），可以对数据进行逻辑处理。但是有 setup 和 teardown 的开销。

> However, nothing comes for free - while mmap does avoid that extra copy, it
doesn’t guarantee the code will always be faster - depending on the OS
implementation, there may be quite a bit of setup and teardown overhead (since
it needs to find the space and maintain it in the TLB and make sure to flush
it after unmapping) and page fault gets much more expensive since kernel now
needs to read from hardware (like disk) to update the memory space and TLB.
Hence, if performance is this critical, benchmark is always needed as abusing
mmap() may yield worse performance than simply doing the copy.

#### sendfile

    1  
    2  
    #include <sys/socket.h>  
    ssize_t sendfile(int out_fd, int in_fd, off_t *offset, size_t count);  

![](/2021/03/11/zero-copy/sendfile1_serve_static_file.png)
![](/2021/03/11/zero-copy/sendfile_switch_context.png)

从上图看到，sendfile 又需要两次上下文转换（一次系统调用），也只有一次复制涉及到 CPU（read buffer -> socket
buffer，还有两次复制让 DMA 操作）。那连这次复制也要节省？

##### sendfile 的升级

![](/2021/03/11/zero-copy/sendfile2_getter_n_setter_serve_static_file.png)

scatter-n-gather。其思想是不直接复制数据，然后指定 fd + offset + length 等基本信息。

这里的升级主要是内核方面的实现。看 java NIO 的一下实现描述：

> In Linux kernels 2.4 and later, the socket buffer descriptor was modified to
accommodate this requirement. This approach not only reduces multiple context
switches but also eliminates the duplicated data copies that require CPU
involvement. The user-side usage still remains the same, but the intrinsics
have changed:

  1. The transferTo() method causes the file contents to be copied into a kernel buffer by the DMA engine.
  2. **No data** is copied into the socket buffer. Instead, **only descriptors with information about the location and length of the data** are appended to the socket buffer. The DMA engine passes data directly from the kernel buffer to the protocol engine, thus eliminating the remaining final CPU copy.

#### mmap

![](/2021/03/11/zero-copy/mmap.png)

zero copy 的本质是没有 user mode
参与，也就是无法对数据进行逻辑处理。那么，我需要处理的情况下，有没有什么提升性能的方法？`mmap()`。

> Mmap allows code to map file to kernel memory and access that directly as if
it were in the application user space, thus avoiding the unnecessary copy. As
a tradeoff, that will still involve 4 context switches. But since OS maps
certain chunk of file into memory, you get all benefits from OS virtual memory
management - hot content can be intelligently cached efficiently, and all data
are page-aligned thus no buffer copying is needed to write stuff back.

  1. 使用 mmap 本质上也需要四次上下文转换（两次系统调用，`mmap`/`mmumap`）。但是，由于OS将某些文件映射到内存中，因此你可以从OS虚拟内存管理中获得所有好处 — 可以智能地有效地**缓存热点内容**，并且所有数据都是**页面对齐**的，**因此不需要缓冲区复制就可以将内容写回**（如何节省缓冲区复制的？）。

  2. while mmap does avoid that extra copy, it doesn’t guarantee the code will always be faster - depending on the OS implementation, there may be quite a bit of **setup and teardown overhead**。它需要查找空间并保存在TLB中，并确保在取消映射后将其刷新。并且由于内核现在需要从硬件（如磁盘）中读取数据来更新内存空间和TLB，因此**页面错误**的代价要大得多。— 注意，真正使用的时候以 benchmark 为准。

[关于 mmap 与 shm_open（共享内存）
的区别](https://stackoverflow.com/questions/21311080/linux-shared-memory-shmget-
vs-mmap)

总体区别不大，其核心思想是一致的。

##### 如何使用 mmap

    1  
    2  
    3  
    4  
    5  
    6  
    7  
    8  
    9  
    10  
    11  
    12  
    13  
    14  
    15  
    16  
    17  
    18  
    19  
    20  
    21  
    22  
    23  
    24  
    25  
    26  
    27  
    28  
    29  
    30  
    31  
    32  
    33  
    34  
    35  
    36  
    37  
    38  
    39  
    40  
    41  
    42  
    43  
    44  
    45  
    46  
    47  
    48  
    49  
    50  
    51  
    52  
    53  
    54  
    55  
    56  
    57  
    58  
    59  
    60  
    61  
    62  
    63  
    64  
    65  
    66  
    67  
    68  
    69  
    70  
    71  
    72  
    // https://www.man7.org/linux/man-pages/man2/mmap.2.html  
    // notice core code  
    #include <sys/mman.h>  
    #include <sys/stat.h>  
    #include <fcntl.h>  
    #include <stdio.h>  
    #include <stdlib.h>  
    #include <unistd.h>  
    #define handle_error(msg) \  
        do { perror(msg); exit(EXIT_FAILURE); } while (0)  
    int  
    main(int argc, char *argv[])  
    {  
        char *addr;  
        int fd;  
        struct stat sb;  
        off_t offset, pa_offset;  
        size_t length;  
        ssize_t s;  
        if (argc < 3 || argc > 4) {  
            fprintf(stderr, "%s file offset [length]\n", argv[0]);  
            exit(EXIT_FAILURE);  
        }  
        fd = open(argv[1], O_RDONLY);  
        if (fd == -1)  
            handle_error("open");  
        if (fstat(fd, &sb) == -1)           /* To obtain file size */  
            handle_error("fstat");  
        offset = atoi(argv[2]);  
        pa_offset = offset & ~(sysconf(_SC_PAGE_SIZE) - 1);  
            /* core code: offset for mmap() must be page aligned */  
        if (offset >= sb.st_size) {  
            fprintf(stderr, "offset is past end of file\n");  
            exit(EXIT_FAILURE);  
        }  
        if (argc == 4) {  
            length = atoi(argv[3]);  
            if (offset + length > sb.st_size)  
                length = sb.st_size - offset;  
                    /* Can't display bytes past end of file */  
        } else {    /* No length arg ==> display to end of file */  
            length = sb.st_size - offset;  
        }  
        addr = mmap(NULL, length + offset - pa_offset, PROT_READ,  
                    MAP_PRIVATE, fd, pa_offset); // core code  
        if (addr == MAP_FAILED)  
            handle_error("mmap");  
        s = write(STDOUT_FILENO, addr + offset - pa_offset, length); // core code  
        if (s != length) {  
            if (s == -1)  
                handle_error("write");  
            fprintf(stderr, "partial write");  
            exit(EXIT_FAILURE);  
        }  
        munmap(addr, length + offset - pa_offset);// core code  
        close(fd);  
        exit(EXIT_SUCCESS);  
    }  

## reference

  * [https://stackoverflow.com/questions/18343365/zero-copy-networking-vs-kernel-bypass](https://stackoverflow.com/questions/18343365/zero-copy-networking-vs-kernel-bypass)
  * [https://xunnanxu.github.io/2016/09/10/It-s-all-about-buffers-zero-copy-mmap-and-Java-NIO/](https://xunnanxu.github.io/2016/09/10/It-s-all-about-buffers-zero-copy-mmap-and-Java-NIO/)
  * [https://developer.ibm.com/articles/j-zerocopy/](https://developer.ibm.com/articles/j-zerocopy/)
  * [https://www.man7.org/linux/man-pages/man2/mmap.2.html](https://www.man7.org/linux/man-pages/man2/mmap.2.html)

[# OS](/tags/OS/)

[ __ web server - presure test ](/2021/03/11/web-server-presure-test/)

[ top k value __ ](/2021/03/12/find-k-th-value/)

  * 文章目录 
  * 站点概览 

  1. 1. zero copy
    1. 1.1. 场景是什么？
      1. 1.1.1. 可能减少 switch context 次数或者 copy 次数吗？
    2. 1.2. 为什么使用 zero copy?
    3. 1.3. 怎么使用 zero copy
      1. 1.3.1. sendfile
        1. 1.3.1.1. sendfile 的升级
      2. 1.3.2. mmap
        1. 1.3.2.1. 如何使用 mmap
  2. 2. reference

