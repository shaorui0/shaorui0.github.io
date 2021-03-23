#  Basic knowledge of web development

__ 发表于 2021-02-16 __ 更新于 2021-03-05

## get and post

TODO

## put and post

#### put

  * PUT puts a file or resource at a specific URI, and exactly at that URI.  
没有任何其他的功能，只作『创建』和『替换』功能

  * **幂等**的（多次执行，效果相同）

  * 只作用于指定uri，理解为upload file，将数据存到指定uri的资源中

  * but paradoxically PUT responses are not cacheable.

场景

One benefit of REST ROA vs SOAP is that when using HTTP REST ROA, it
encourages the proper usage of the HTTP verbs/methods. So **for example you
would only use PUT when you want to create a resource at that exact
location.** And you would never use GET to create or modify a resource.

#### post

  * POST sends data to a specific URI and expects the resource at that URI to **handle the request.**web server at this point can determine what to do with the data in the context of the specified resource.（会有后端逻辑） 
  * 非幂等
  * create场景比put应用**更加广阔、通用**，不仅作用于**某个**uri，甚至可以作用到其他uri或其他行为（不单单是保存request body）  
比如，创建图书的场景：

    * `PUT bookstore/book/4`。创建了id=4的图书的信息（可能是replace existed info），仅作用于此uri
    * `POST boolstore/book`。可能会id递增创建多个『对象』，是『危险』的（非幂等），作用到了1/2/3/4/5…

### DIFF put and post

> The fundamental difference between the POST and PUT requests is reflected in
the different meaning of the Request-URI. The URI in a **POST** request
identifies the resource that will **handle the enclosed entity**. That
resource might be a data-accepting process, a gateway to some other protocol,
or a separate entity that accepts annotations. In contrast, the URI in a
**PUT** request identifies the entity enclosed with the request – the user
agent knows **what URI is intended and the server MUST NOT attempt to apply
the request to some other resource**. If the server desires that the request
be applied to a **different URI**, it MUST send a 301 (Moved Permanently)
response; the user agent MAY then make its own decision regarding whether or
not to redirect the request.

Only **semantics**.

An HTTP PUT is supposed to accept the body of the request, and then **store
that at the resource** identified by the URI.

An HTTP POST is more **general**. It is supposed to **initiate an action on
the server**. That action could be to **store the request body** at the
resource identified by the URI, or it could be a **different URI**, or it
could be a **different action**.

PUT is like a file upload. A put to a URI affects exactly that URI. A POST to
a URI could have any effect at all.

### 工作实践中的场景

    1  
    2  
    $api->post('{table}/_tagset/{tagId}/_update', 'MetaController@updateTag');  
    $api->put('{table}/_tagset/{tagId}', 'MetaController@upsertTag');  

曾经理解错误，因为put=create+replace，post=create。我错误的以为，在一个资源上增加某个属性（json增加一个k-v），使用put
，结果导致数据从多个k-v，变成了指定的唯一k-v（直接被替换）。

## http

### 常用状态码

### https 过程

## ref

  * [whats-the-difference-between-a-post-and-a-put-http-request](https://stackoverflow.com/questions/107390/whats-the-difference-between-a-post-and-a-put-http-request)

[# web](/tags/web/)

[ __ why stack can overflow but heap cannot? ](/2021/02/16/why-stack-can-
overflow-but-heap/)

[ What is Protobuf? __ ](/2021/02/16/what-is-protobuf/)

  * 文章目录 
  * 站点概览 

  1. 1. get and post
  2. 2. put and post
    1. 2.0.1. put
    2. 2.0.2. post
  3. 2.1. DIFF put and post
  4. 2.2. 工作实践中的场景
* 3. http

  1. 3.1. 常用状态码
  2. 3.2. https 过程
* 4. ref

