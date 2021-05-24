#  What is map reduce

__ 发表于 2021-02-16 __ 更新于 2021-02-22

  * [good pictures of parse](https://www.yiibai.com/hadoop/intro-mapreduce.html)
  * [最佳实践：mapper/filter/reducer](https://book.pythontips.com/en/latest/map_filter.html)
  * [hadoop教程，mapreduce](https://www.tutorialspoint.com/hadoop/hadoop_mapreduce.htm)
  1. map是将函数作用在list的每一个元素上（比迭代更抽象）。  
`map(str, [1, 2, 3, 4, 5, 6, 7, 8, 9])`

  2. reduce是将所有结果进行一个merge  
`reduce(f, [x1, x2, x3, x4]) = f(f(f(x1, x2), x3), x4)`

## example

```
    print(map(str, [1, 2, 3, 4, 5, 6, 7, 8, 9]))  
    def fn(x, y):  
        return x * 10 + y  
    print(reduce(fn, [1, 2, 3, 4, 5, 6, 7, 8, 9]))  
```
```
    def char2num(s):  
        return {'0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9}[s]  
    def str2int(s):  
        return reduce(lambda x,y: x*10+y, map(char2num, s))  
```
## mr任务

##### mapper

> 读取上游数据，对每行按自己的方式进行组织
```
    if __name__ == "__main__":  
        data_type = int(sys.argv[1])  
        # 上游数据过来，是标准输入  
        for eachline in sys.stdin:  
            my_obj = MyClass()  
            my_obj.init_from_json(eachline.strip("\n"))  
            print "\t".join([my_obj.id, eachline.strip("\n")])  
```
##### reducer

> 读取到mapper产生的数据，『遍历』对所有行进行一个『**汇总**』
```
    if __name__ == "__main__":  
        old_info = {}  
        check_result = []  
        # 汇集mapreduce所有的输出（保存在list里面）  
        for eachline in sys.stdin:  
            line = eachline.strip("\n").split("\t")  
            key_id = line[0]  
            value_json_data = json.loads(line[1])  
            check_result += json_data.get("check_result", [])  
            old_info["check_result"] = check_result  
            print json.dumps(old_info)  
```
mapreduce为了什么？更好的并发，一切为了效率？它是一种编程框架/模型，为的是更好的抽象，在不同层面上做不同的事情。

## WHY

> 更好的并发，一切为了效率

# relationship-between-hive-and-hadoop-mapreduce

**Map Reduce** is the framework used to process the data which is stored in the HDFS, here java native language is used to writing Map Reduce programs.  
Hive is a **batch processing framework**. This component process the data
using a language called Hive Query Language(HQL). Hive prevents writing
MapReduce programs in Java. Instead one can use SQL like language to do their
daily tasks.

For HIVE there is **no process to communicate Map/Reduce tasks directly**.

After the Hive finishes the **query execution**, the result is submitted to
the **JobTracker**, which resides on YARN. The JobTracker consists of
Map/Reduce tasks which runs the mapper and reducer job to store the final
result in the **HDFS**. The Map task deserializes(reading) the data from the
HDFS and the Reduce task serializes(writing) the data as the result of the
Hive query.

![](/2021/02/16/what-is-map-reduce/hive_procecss_detail.png)
