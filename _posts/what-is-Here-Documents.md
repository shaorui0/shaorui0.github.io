#  what is Here Documents

__ 发表于 2021-03-13

## 背景

在百度实习的时候做了一个 ETL 框架，构建原因是为了更好的配置化之前的各种写在 Shell 脚本中的数据处理任务。

框架的核心是通过 Pythonn 运转 Shell 脚本，借鉴 Airflow Shell_operator 实现方式，通过创建临时文件直接运行多行
Shell 命令，运行完删除，这样避免了各种管道实现带来的麻烦，一开始我还想逐行创建进程，通过管道连接，太天真了 :( 。

框架需要适配各种数据平台，典型的包括 ftp、mysql、hadoop、hive 等，这些平台之前也是通过 Shell 的交互式/批量执行的。比如
`mysql -u someuser -p test -e "select * from offices"`。

这些平台的批量命令使用虽然都大同小异（比如
`-e`），但是比较特殊的可能无法对潜在的`\t`进行处理。同时，由于配置（`.py`）文件不可避免的有缩进（多行脚本包含在 Pythonn 的 `"""`
里面），导致某些平台的支持不理想，比较丑陋的方法就是去除所有缩进，这显然会让代码看上去很不美观。

通过调研，找到了一个 Shell 的高级特性 — `Here Documents`，刚好应对这种场景，对于缩进也可以[比较优雅的支持去除](https://
stackoverflow.com/questions/2500436/how-does-cat-eof-work-in-bash)。

Here Documents **典型场景**就是与 remote 交互式软件/服务 进行批量命令执行。

## 常用使用方式

### cat

多行内容通过管道传递给软件（Interactive）

``` 
    cat << EOF | psql ---params  
    BEGIN;  
    `pg_dump ----something`  
    update table .... statement ...;  
    END;  
    EOF  
```
多行内容重定向到文件
```
    cat > outfile.txt <<EOF  
    Multi-line content  
    that will be written to outfile.txt  
    EOF  
```
### 典型的交互式软件

ssh
```
    ssh yote@user << EOF  
      cd tests  
      tar -xf $TARGET_TEST.tar  
      rm $TARGET_TEST.tar  
      cd $TARGET_TEST  
      *more stuff goes here*  
    EOF  
```
