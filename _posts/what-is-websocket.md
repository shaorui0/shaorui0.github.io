#  what is websocket

__ 发表于 2021-03-11 __ 更新于 2021-03-12

## different between websocket and socket

[different between websocket and
socket](https://stackoverflow.com/questions/16945345/differences-between-tcp-
sockets-and-web-sockets-one-more-time)

### sending side

  1. TCP socket（传统的 socket 更加通用，一般基于 TCP）
    * 阻塞 IO 想要实时必须占用一个 fd ，非常珍贵的资源，不可能，同时调用也会被**阻塞**
    * 非阻塞 IO，可能导致一次 send/recv 的数据不全（TCP 基于流）
  2. WebSocket （websocket被设计出来，是为了更加**实时**的消息传输）
    * 克服了上面两个问题，既保证不阻塞，又保证消息完全（message-driven）
    * 属于一种偏方（一定好？不再基于流）

> @MarcCasavant the way you ask the question seems to imply that WebSockets is
overhead with no good reason to exist. I would flip it around and say that
WebSockets is an encapsulation of TCP that brings TCP like functionality and
performance to browsers without using a plugin and without giving up hard-won
browser security best practices (like CORS). After the hand-shake, the
overhead of the extra layering is very light (2-byte header for small frames).
– kanaka May 6 ‘14 at 18:34

One could say that WebSockets are the most standarized way of using a “RAW
TCP/IP like connection” with a browser? Within the framing, it, though, does
wait for the complete messages to be received. So it’s not really a stream,
but shouldn’t be a problem (actually quite usefull). Check games based on
WebSockets, they work in most browsers and are actually very responsive. –
Paul Jul 5 ‘16 at 19:27

### receiving side

  1. 由于 TCP 的一些缘故（比如打开了 nagel 算法），一次 TCP 传输可能包括多个连接的数据（自动合并，减少 header/body 比过大带来的低性能）

  2. websocket 可以理解成事件传输，或者说事件驱动（接收到完整的消息是一个事件 — Server Sent Event）

> [In fact](https://stackoverflow.com/questions/16945345/differences-between-
tcp-sockets-and-web-sockets-one-more-time), WebSockets is **built on normal
TCP sockets** and **uses frame headers** that contains the size of each frame
and indicate which frames are part of a message. The WebSocket API re-
assembles the TCP chunks of data into frames which are assembled into messages
before invoking the message event handler once per message.

## different between websocket and http

  1. [<del>websocket 基于 http 1.1</del>（说法有问题）](https://www.zhihu.com/question/32039008)，能够支持长链接（connection: keep-alive in header），同时自身的协议特性保证消息完整接受和识别。

> 1.7. Relationship to TCP and HTTP

>

>      _This section is non-normative._

>      The WebSocket Protocol is an independent TCP-based protocol.  Its

>      only relationship to HTTP is that its handshake is interpreted by

>      HTTP servers as an Upgrade request.

>      By default, the WebSocket Protocol uses port 80 for regular WebSocket

>      connections and port 443 for WebSocket connections tunneled over

>      Transport Layer Security (TLS) [RFC2818].

>

    * [websocket 属于应用层还是传输层](https://tools.ietf.org/html/rfc8857)

> The WebSocket (WS) protocol [RFC6455] enables two-way message exchange
between clients and servers on top of a persistent TCP connection, optionally
secured with Transport Layer Security (TLS) [RFC8446]. The initial protocol
handshake makes use of Hypertext Transfer Protocol (HTTP) [RFC7230] semantics,
allowing the WebSocket protocol to reuse existing HTTP infrastructure.

  2. [HTTP header 过大](https://stackoverflow.com/questions/14703627/websockets-protocol-vs-http)

[https://www.zhihu.com/question/32039008/answer/1127422609](https://www.zhihu.
com/question/32039008/answer/1127422609)

### 应用场景的区别

  * HTTP 主要用来**一问一答**的方式交付信息；WebSocket 让通信双方都可以**主动**去交换信息。
  * HTTP2 虽然支持服务器推送资源到客户端，但那不是应用程序可以感知的，主要是让浏览器（用户代理）提前缓存静态资源，所以我们不能指望 HTTP2 可以像 WebSocket 建立双向实时通信。

## WebSocket 协议有哪些缺点？

[一个协议的好处这么明显的情况下，缺点是什么？](https://www.zhihu.com/question/20155314)

增加了代码的复杂度

  * 由于维护实时的特性，要保证 ws 连接一致有效，后端代码稳定
  * 推送消息相对复杂
  * 成熟的生态？

## HTTP 一路升级有什么提升？

[https://stackoverflow.com/questions/14703627/websockets-protocol-vs-
http](https://stackoverflow.com/questions/14703627/websockets-protocol-vs-
http)

  1. HTTP 1.0

    * 短链接（用完就关）
    * 有确定的事务性质request-response 一对一
    * 只支持三个函数 GETT/POST/HEAD
  2. HTTP 1.1

    * 增加了长连接，能够复用一个 TCP 连接
    * 增加了函数（OPTIONS, PUT, DELETE, TRACE, CONNECT

> HTTP 1.1 **pipelining** is not widely deployed so this greatly limits the
utility of HTTP 1.1 to solve **latency** between browsers and servers.

  3. HTTP 2.0

> HTTP 2.0: has similar goals to SPDY: reduce HTTP latency and overhead while
preserving HTTP semantics. The current draft is derived from SPDY and defines
an upgrade handshake and data framing that is very similar the the WebSocket
standard for handshake and framing. An alternate HTTP 2.0 draft proposal
(httpbis-speed-mobility) actually uses WebSockets for the transport layer and
adds the SPDY multiplexing and HTTP mapping as an WebSocket extension
(WebSocket extensions are negotiated during the handshake).

    * 主要是降低了延时和负载（reduce HTTP latency and overhead）
    * upgrade handshake and data framing that is very similar the the WebSocket standard for handshake and framing.

【注】 HTTPS

  * 明文 / 加密（安全性），多一个 SSL(Secure Socket Layer ) 握手，协商加密对称密钥（多一次握手带来的效率损失）
  * 从服务器申请证书，浏览器安装对应根证书（服务器就是 chalar 那个，然后手机端和PC都安装）
    * 部署成本，还要买 CA 证书
  * 80 / 443

## References

  * [https://tools.ietf.org/html/rfc8857](https://tools.ietf.org/html/rfc8857)
  * [https://stackoverflow.com/questions/16945345/differences-between-tcp-sockets-and-web-sockets-one-more-time](https://stackoverflow.com/questions/16945345/differences-between-tcp-sockets-and-web-sockets-one-more-time)
  * [https://stackoverflow.com/questions/16945345/differences-between-tcp-sockets-and-web-sockets-one-more-time](https://stackoverflow.com/questions/16945345/differences-between-tcp-sockets-and-web-sockets-one-more-time)
  * [https://www.zhihu.com/question/32039008/answer/1127422609](https://www.zhihu.com/question/32039008/answer/1127422609)
  * [https://www.zhihu.com/question/20155314](https://www.zhihu.com/question/20155314)
  * [https://stackoverflow.com/questions/14703627/websockets-protocol-vs-http](https://stackoverflow.com/questions/14703627/websockets-protocol-vs-http)

[ __ TCP - basic knowledge ](/2021/03/09/TCP-basic-knowledge/)

[ web server - presure test __ ](/2021/03/11/web-server-presure-test/)

  * 文章目录 
  * 站点概览 

  1. 1. different between websocket and socket
    1. 1.1. sending side
    2. 1.2. receiving side
  2. 2. different between websocket and http
    1. 2.1. 应用场景的区别
  3. 3. WebSocket 协议有哪些缺点？
  4. 4. HTTP 一路升级有什么提升？
  5. 5. References

