#  how to use pdb

__ 发表于 2020-12-16 __ 更新于 2021-02-22

  * `next` 碰见子程序会直接获取到调用结果
  * `step` 会进入子程序，相当于是一个子程序扩展
  * `quit` 粗暴退出
  * `continue`跑到程序终点
  * `print`打印变量
  * `list` 打印现在在哪
  * `!a = "xxx"` 可能比较有用的：动态设置变量

# 测试代码：

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
    import pdb  
    def combine(s1,s2):      # define subroutine combine, which...  
        s3 = s1 + s2 + s1    # sandwiches s2 between copies of s1, ...  
        s3 = '"' + s3 +'"'   # encloses it in double quotes,...  
        return s3            # and returns it.  
    a = "aaa"  
    pdb.set_trace()  
    b = "bbb"  
    c = "ccc"  
    final = combine(a,b)  
    print final  

[参考](https://stackoverflow.com/questions/4228637/getting-started-with-the-
python-debugger-pdb)

[# programming language](/tags/programming-language/) [#
python](/tags/python/)

[ __ 【转】face-to-interview ](/2020/02/22/face-to-interview/)

[ iterator, generator and decorator __ ](/2020/12/16/python-generator-
iterator-decorator/)

  * 文章目录 
  * 站点概览 

  1. 1. 测试代码：

