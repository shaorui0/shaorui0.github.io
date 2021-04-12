# 关于排序

实际应用中需要知道的排序：插入、快排、堆排、归并


## 关于堆排序、快速排序的对比

1. [为什么快排的使用场景广泛的多？](https://stackoverflow.com/questions/2467751/quicksort-vs-heapsort)
    - 更快，为什么？
        - 从上层来看，quick sort 的 **swap** 的次数少的多，只做必要的 swap。而堆排对每个结点都要做 swap。
        - 从 architecture 层面看，quick sort **局部性(locality)**更强，而堆排则是需要 parent(i) 与 left child(2*i + 1) / right child(2*i + 2) 进行比较。
        > Well if you go to architecture level...we use queue data structure in cache memory.so what ever is available in queue will get sorted.As in quick sort we have no issue dividing the array into any lenght...but in heap sort(by using array) it may so happen that the parent may not be present in the sub array available in cache and then it has to bring it in cache memory ...which is time consuming. That's quicksort is best!!😀
    - 堆排有其自己的场景
        - 优先队列
        - 能够保证O(NlogN)的时间复杂度，但是快排可能会退化到O(N^2)（会有一些解决方案。比如记录 swap 的数量，如果为0可能是有序的，退化为**插入排序**）
        TODO insert pic 

2. top k 问题的一些实现
    [find-k-th-value](find-k-th-value.md)

## 关于堆排序、归并排序的对比

https://stackoverflow.com/questions/53269004/heap-sort-vs-merge-sort-in-speed

1. 时间复杂度相同。同样的，还是因为 heap sort 的 swap 次数太多，性能比归并排序慢。
> Although time complexity is the same, the constant factors are not. Generally merge sort will be significantly faster on a **typical system with a 4 or greater way cache**, since merge sort will perform sequential reads from two runs and sequential writes to a single merged run.  
2. 空间复杂度上会不同，不过相对于空间问题，现代计算机还是更注重时间的节省。