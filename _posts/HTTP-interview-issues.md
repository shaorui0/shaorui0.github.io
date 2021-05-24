#  HTTP - interview issues

__ 发表于 2021-03-08

## 什么是 Restful ？

> [用URL定位资源，用HTTP描述操作。— Ivony,
zhihu](https://www.zhihu.com/question/28557115/answer/41265890)

​

REST: REpresentational State Transfer

本质是一种思想，也就是『怎么设计 Restful API ？』

获取用户信息：`GET www.xx.com/users/1`

创建用户信息（“创建一个资源”）：`POST www.xx.com/users/` + json

  * 非幂等（REST 场景下一般不幂等，但具体是否幂等，由实现决定），原因是某些情况下，执行两次可能创建两个信息相同，id不同的用户。  
更新用户信息：`PUT www.xx.com/users/1` + json

  * 有些api是使用PUT作为创建资源的Method。

删除用户信息：`DELETE www.xx.com/users/1`

[https://www.zhihu.com/question/28557115/answer/48094438](https://www.zhihu.co
m/question/28557115/answer/48094438)

### 一定好吗？所有的场景都能用吗？

还有什么方案？ –> HTTP + json –> 那和 Restful 有什么区别？

Restful 区分了资源和操作，非 Restful那就是以前的 `get` 就是静态获取页面， `post` 就是创建表单并提交？

  1. 风格太理想化？一些业务逻辑不能用 url 作为资源呈现。

> 但实际上，很多时候都不太可能将一些业务逻辑看作资源。即使强制这么干了，也会非常非常别扭。登录就是登录，而不是“创建一个session”；播放音乐就是播放
，而不是“创建一个播放状态“。

  2. 是不是有点反其道而行之？抽象的本质是什么？封装下层，减少上层的心智负担。但是 Restful 反其道而行之，直接展示资源？
  3. Restful 只提供 CRUD 基本语义
    * 比如批量添加，批量删除，修改一个资源的一部分字段。
    * 区分“物理删除”和“标记删除”等等。
    * 复杂的查询更加不显示，对于像筛选这类的场景，REST明显就是个渣。
  4. REST建议用HTTP的status code做错误码，以便于“统一”，实际上这非常难统一。
    * 404 表示这个资源找不到还是接口没有接口找不到？
    * 400表达请求有问题，但是我想提示用户“你登录手机号输入的格式不对“，还是“你登录手机号已经被占用了“。
    * 既然201表示“created”，为啥deleted和updated没有对应的status code，只能用200或者204（no content）？
    * 错误处理是web系统里最麻烦的，最需要细心细致的地方。REST风格在这里只能添乱。
  5. web 的请求参数？url path, querystring, header, body，服务器端处理对此完全没有什么章法。客户端和服务器端的研发之间还是要做约定。
  6. 在url path上的变量会对很多其他的工作带来不良影响。比如，想对接口做流量控制的计数，本来url可以做key，因为有变量，就得多费点事才行。

[WEB开发中，使用JSON-RPC好，还是RESTful
API好？](https://www.zhihu.com/question/28570307/answer/541465581)

归根结底是上层限制太死。具体的业务场景千变万化，很难全部套上 REST 的壳。

## diff Get and Post

  1. GET/POST 分为浏览器使用的两个方法以及用 HTTP 作为接口传输协议

### 浏览器的GET和POST

> 这里特指浏览器中非Ajax的HTTP请求，即从HTML和浏览器诞生就一直使用的HTTP协议中的GET/POST。浏览器用GET请求来获取一个html页面
/图片/css/js等资源；用POST来提交一个表单，并得到一个结果的网页。

这是一种原生的、浏览器一开始就支持的两个方式。这种情况下，GET 通常是幂等的，POST 为非幂等的（上传表单）

TODO pic

之前的 POST 通常实现为非幂等，但是这种情况下，把 POST
实现为幂等有它的考量，_POST幂等能让很多业务的前后端交互更顺畅，以及避免一些因为前端bug，触控失误等带来的重复提交_。

  1. GET/POST 携带的数据格式有区别
    * 浏览器触发 GET 不能带 body （所以用 querystring，各种变量），但是 GET 方法本身不限制
  2. POST body 有两种格式
    * application/x-www-form-urlencoded用来传输简单的数据，大概就是”key1=value1&key2=value2”这样的格式。
    * 另外一种是传文件，会采用multipart/form-data格式。采用后者是因为application/x-www-form-urlencoded的编码方式对于文件这种二进制的数据非常低效。

### 用 HTTP 作为接口传输协议

> 这里是指通过浏览器的Ajax api，或者iOS/Android的App的http client，java的commons-
httpclient/okhttp或者是curl，postman之类的工具发出来的GET和POST请求。

  1. GET/POST不光能用在前端和后端的交互中，还能用在后端各个子服务的调用中（即当一种RPC协议使用）。尽管RPC有很多协议，比如thrift，grpc，但是http本身已经有大量的现成的支持工具可以使用，并且对人类很友好，容易debug。HTTP协议在微服务中的使用是相当普遍的。
  2. 所以用接口的时候，就没有浏览器那么多限制了，只需要`\r\n`(CRLF)

### 关于安全性

  1. HTTP 是明文，这个与信息在 url 上还是 body 里没关系

  2. 业界的通行做法就是https——即用SSL协议协商出的密钥加密明文的http数据。

  3. 如果是用作接口，GET实际上也可以带body，POST也可以在url上携带数据。所以实际上到底怎么传输私密数据，要看具体场景具体分析。当然，绝大多数场景，用**POST + body**里写私密数据是合理的选择。  
一个典型的例子就是“登录”：POST [http://foo.com/user/login](http://foo.com/user/login)
```
    {  
      "username": "dakuankuan",  
      "passowrd": "12345678"  
    }  
```
### 关于编码

  4. url 只支持 Ascii 的子集，不然会有 Percent Encoding — 一坨`%`

  5. 如果有中文呢？不让用户从 URL 输入中文，改为 Ajax call

  6. body 里面可以定义格式和编码（application/x-www-form-urlencoded / UTF-8），用户可以控制

#### 对 header 和 body 的分开处理

> 举个实际的例子，比如写一个上传文件的服务，请求url中包含了文件名称，请求体中是个尺寸为几百兆的压缩二进制流。服务器端接收到请求后，就可以先拿到请求头部
，查看用户是不是有权限上传，文件名是不是符合规范等。如果不符合，就不再处理请求体的数据了，直接丢弃。而不用等到整个请求都处理完了再拒绝。

【服务器的优化，100 code的使用场景】为了进一步优化，客户端可以利用HTTP的Continued协议来这样做：客户端总是先发送所有请求头给服务器，让服
务器校验。如果通过了，服务器回复`100 - Continue`，客户端再把剩下的数据发给服务器。如果请求被拒了，服务器就回复个400之类的错误，这个交互就
终止了。这样，就可以避免浪费带宽传请求体。但是代价就是会多一次Round Trip。如果刚好请求体的数据也不多，那么一次性全部发给服务器可能反而更好。

【客户端的优化】基于此，客户端就能做一些优化，比如内部设定一次POST的数据超过1KB就先只发“请求头”，否则就一次性全发。客户端甚至还可以做一些Adapt
ive的策略，统计发送成功率，如果成功率很高，就总是全部发等等。不同浏览器，不同的客户端（curl，postman）可以有各自的不同的方案。不管怎样做，优化
目的总是在提高数据吞吐和降低带宽浪费上做一个折衷。

  * 对于HTTP代理
    * 支持转发规则，比如nginx先要解析请求头，拿到URL和Header才能决定怎么做（转发proxy_pass，重定向redirect，rewrite后重新判断……）
    * 需要用请求头的信息记录log。尽管请求体里的数据也可以记录，但一般只记录请求头的部分数据。
    * 如果代理规则不涉及到请求体，那么请求体就可以不用从内核态的page cache复制一份到用户态了，可以直接zero copy转发。这对于上传文件的场景极为有效。
  * 对于HTTP服务器
    * 可以通过请求头进行ACL控制，比如看看Athorization头里的数据是否能让认证通过
    * 可以做一些拦截，比如看到Content-Length里的数太大，或者Content-Type自己不支持，或者Accept要求的格式自己无法处理，就直接返回失败了。
    * 如果body的数据很大，利用Stream API，可以方便支持一块一块的处理数据，而不是一次性全部读取出来再操作，以至于占用大量内存。

### 总结

说到底，无论 GET 还是 POST，本质是协议，是为了 client 和 server 直接比较好进行沟通。具体怎么沟通，完全看应用层开发者。

## diff Post and Put

> PUT与POST的区别在于，PUT的实际语义是 **replace**
REST规范里提到PUT的请求体应该是完整的资源，包括id在内。比如上面的创建一本书的api也可以定义为：

 
```json
PUT http://foo.com/books  
{  
  "id": "BOOK:affe001bbe0556a",  
  "title": "大宽宽的碎碎念",  
  "author": "大宽宽",  
  ...  
}  
```

> 服务器应该先根据请求提供的id进行查找，如果存在一个对应id的元素，就用请求中的数据整体替换已经存在的资源；如果没有，就用“把这个id对应的资源从【空】
替换为【请求数据】“。直观看起来就是“创建”了。与PUT相比，POST更像是一个“factory”，通过一组必要的数据创建出完整的资源。至于到底用PUT还是
POST创建资源，完全要看是不是提前可以知道资源所有的数据（尤其是id），以及是不是完整替换。比如对于AWS S3这样的对象存储服务，当想上传一个新资源时，
其id就是“ObjectName”可以提前知道；同时这个api也总是完整的replace整个资源。这时的api用PUT的语义更合适；而对于那些id是服务器端
自动生成的场景，POST更合适一些。

[https://www.zhihu.com/question/28586791/answer/767316172](https://www.zhihu.com/question/28586791/answer/767316172)
