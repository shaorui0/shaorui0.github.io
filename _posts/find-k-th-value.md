#  top k value

__ 发表于 2021-03-12

两种方法，heap sort 和 quick select。

基本思想都是保持一个『基本有序』的状态（不是完全有序）。

quick sort 可能退化到 O(N^2)。什么情况下？数组有序，如果排正序则初始数组为倒序，反义亦然。即 `partition` 每次都找 pivot
都在边界。

能想到的优化就是每次找到一个 `pivot` 尽量处于中间，能够让**分治**正常进行。比如三等分点（比较 left/mid/right，找到中间点作为初始
`pivot`）

1. 注意我遗漏了一个点，需要**递归**对下层的数据进行操作（影响了那个 largest？）
2. heapify 注意抽取出来，这是一个频繁使用的操作

## heap sort

### 基本思想

  1. 真正的堆排序，总的思路为建堆 + 堆排序
  2. 建堆的最终结果是 root 为最值（root 后面的数无序（或者说经过建堆过程，已经基本有序了）），与 quick select 同理，每次找到一个值的 final index。
  3. 堆排序的过程则是不断找到『临时数组』的最值（每次抽取最值，剩下的数字进行排序）。一般可以另起一个list，或者将root（index=0）与 last one（`range(n-1, 0, -1)`） 进行交换。

### 需要注意的点

  1. 需要抽取出一个 `heapify` 方法，思想是临时『树』，不断找到这颗子树的最值
  2. 一定要注意递归向下一直到最底层叶子节点

### 代码

常规的堆排序：
```py
    def heapify(arr, len_arr, temp_root):  
        # get left/right child index  
        largest_index = temp_root  
        left_index = temp_root * 2 + 1  
        right_index = temp_root * 2 + 2  
        # compare with left  
        if left_index < len_arr and arr[left_index] > arr[largest_index]:  
            largest_index = left_index  
        # compare with right if right exist  
        if right_index < len_arr and arr[right_index] > arr[largest_index]:  
            largest_index = right_index  
        # compare temp largest between child and parent, if changed, recursive to child  
        if largest_index != temp_root:  
            arr[temp_root], arr[largest_index] = arr[largest_index], arr[temp_root]  
            heapify(arr, len_arr, largest_index) # down to child  
    def heap_sort(arr):  
        len_arr = len(arr)  
        # 边界检查  
        # 先简单整理一遍，基本有序，能保证得到最大的数  
        for i in range(len_arr // 2 - 1, -1, -1):  
            heapify(arr, len_arr, i)  
            # print test  
        # print(arr)  
        # 完全有序  
        for i in range(len_arr - 1, 0, -1):  
            # swap value_i and root, 不断的找到当前最大的  
            # print(arr[0])  
            arr[i], arr[0] = arr[0], arr[i]  
            heapify(arr, i, 0) # 这里注意,   
            # len不断变化，  
            # 获取第一个，把最后一个移到第一个  
            # 对第一个进行 heapify  
    arr = [12, 11, 13, 5, 6, 7]  
    arr = [12, 11, 13, 5, 6, 7, 100, 1, 202, 144]  
    heap_sort(arr)  
```
利用堆排序找到第k个节点：

```py
    def heap_sort_find_k(arr, k):  
        #  
        len_arr = len(arr)  
        # 边界检查，k 值有个基本的判断  
        # 先简单整理一遍，基本有序，能保证得到最大的数  
        for i in range(len_arr // 2 - 1, -1, -1):  
            heapify(arr, len_arr, i)  
            # print test  
        # print(arr)  
        # 完全有序  
        count = 0  
        for i in range(len_arr - 1, 0, -1):  
            count += 1  
            if count == k:  
                break  
            # swap value_i and root, 不断的找到当前最大的  
            arr[i], arr[0] = arr[0], arr[i]  
            heapify(arr, i, 0) # 【注意】  
        # print(arr[0]) # k-th  
            # len不断变化，  
            # 获取第一个，把最后一个移到第一个  
            # 对第一个进行 heapify  
    heap_sort_find_k(arr, 8)  
```
## quick select

### quick sort

#### 基本思想

快排的过程：

  1. 每次确定一个 pivot 的最终位置
  2. 对 pivot 两边的数组进行分治处理（迭代或递归）  
基本的优化思想是 pivot 尽量往中间取。

#### 需要注意的点

  1. 抽象出一个`partition`是关键，每次确定一个值的最终位置。
  2. 为了确定最终的写法，统一一下：
    * pivot 放在 high
    * 数组下标『前闭后闭』`[low, high]`
    * i 初始为 low - 1，j 初始范围为 [low, high)
    * 所谓最终位置，完全可以通过 `i` 记录小于 `pivot` 的个数
```py
    for j in range(low , high):  
        # If current element is smaller  
        if arr[j] <= pivot:  
            # increment  
            i = i+1  
            arr[i],arr[j] = arr[j],arr[i]  
```
#### 代码

常规的快排：
```py
    # divide function  
    def partition(arr,low,high):  
       i = ( low-1 )  
       pivot = arr[high] # pivot element  
       for j in range(low , high):  
          # If current element is smaller  
            if arr[j] <= pivot:  
                # increment  
                i = i+1  
                arr[i],arr[j] = arr[j],arr[i]  
       arr[i+1],arr[high] = arr[high],arr[i+1]  
       return i+1  
    # sort  
    def quickSort(arr,low,high):  
       if low < high:  
            # index  
            # print("pre: ", arr)  
            pi = partition(arr,low,high)  
            # print("post: ", arr, "\tpivot: ", pi)  
            # sort the partitions  
            quickSort(arr, low, pi-1)  
            quickSort(arr, pi+1, high)  
    # main  
    arr = [2,5,3,8,6,5,4,7]  
    n = len(arr)  
    quickSort(arr, 0, n-1)  
    print ("Sorted array is:")  
    for i in range(n):  
       print (arr[i],end=" ")  
```
### quick select

#### 基本思想

  1. 通过 对比 pivot_index 与 k，『分而治一半』

#### 需要注意的点

  1. 如果 k 落在 pivot 右边，注意更新 k 值（`k - 1 - (pivot - l)`）
  2. `k-1`是对k实际意义进行的校正（index = 0，表示第一个数）

#### 代码
```py
    # divide function  
    def partition(arr,low,high):  
       i = ( low-1 )  
       pivot = arr[high] # pivot element  
       for j in range(low , high):  
          # If current element is smaller  
            if arr[j] <= pivot:  
                # increment  
                i = i+1  
                arr[i],arr[j] = arr[j],arr[i]  
       arr[i+1],arr[high] = arr[high],arr[i+1]  
       return i+1  
    def quickSelect(arr, l, r, k):  
        # if k is smaller than number of  
        # elements in array  
        if (k > 0 and k <= r - l + 1):  
            # Partition the array around last  
            # element and get position of pivot  
            # element in sorted array  
            index = partition(arr, l, r)  
            # if position is same as k  
            if (index - l == k - 1):  
                return arr[index]  
            # If position is more, recur   
            # for left subarray   
            if (index - l > k - 1):  
                return kthSmallest(arr, l, index - 1, k)  
            # Else recur for right subarray   
            return kthSmallest(arr, index + 1, r,   
                                k - 1 - (index - l))   
        return INT_MAX  
    # Driver Code  
    arr = [ 10, 4, 5, 8, 6, 11, 26 ]  
    n = len(arr)  
    k = 3  
    for i in range(1, n+1):  
        print(quickSelect(arr, 0, n-1, i)) # 第k个，从0开始  
```
# reference

  * [https://www.geeksforgeeks.org/heap-sort/](https://www.geeksforgeeks.org/heap-sort/)
  * [https://www.tutorialspoint.com/python-program-for-quicksort](https://www.tutorialspoint.com/python-program-for-quicksort)
  * [https://www.geeksforgeeks.org/quickselect-algorithm/](https://www.geeksforgeeks.org/quickselect-algorithm/)
