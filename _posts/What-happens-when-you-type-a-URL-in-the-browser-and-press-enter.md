#  What happens when you type a URL in the browser and press enter

__ 发表于 2021-03-08 __ 更新于 2021-03-14

## oversimplified sketch

  1. [translate URL] URL -> DNS -> IP addr
  2. [find server] IP addr -> router -> server addr
  3. [build link] client -> TCP -> server (TCP/IP three-way handshake.)
  4. [static and dynamic] HTTP requests -> server (handles the request and sends back a response.)
  5. [displays] The browser displays the HTML content 

## detail

### DNS

#### cache

> The DNS layer can help direct clients to different servers based on
geographical location to help with load balancing and latency minimization,
and one server can respond to requests from many different DNS names.

  1. browser cache.
  2. OS cache, a system call like `gethostname()`
  3. router cache
  4. ISP cache. (Internet Service Provider (ISP, such as Verizon, AOL, Earthlink, etc.)) 

#### recursive search

> **recursive search** since the search will repeatedly continue from a DNS
server to a DNS server until it either finds the IP address we need or returns
an error response saying it was unable to find it.

  1. based on third-level domain
  2. These requests are sent using **small data packets** that contain information such as the content of the request and the IP address it is destined for (IP address of the DNS recursor). 
  3. This equipment use **routing tables** to figure out which way is the fastest possible way for the packet to reach its’ destination.
![](/2021/03/08/What-happens-when-you-type-a-URL-in-the-browser-and-press-enter/dns.png)

### HTTP

#### request header

![](/2021/03/08/What-happens-when-you-type-a-URL-in-the-browser-and-press-
enter/http_request.png)

#### response header

![](/2021/03/08/What-happens-when-you-type-a-URL-in-the-browser-and-press-
enter/http_response.png)

#### code

[wiki](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#cite_note-66)

  * 1xx indicates an informational message only
    * 100 Continue  
The server has received the request headers and the client should proceed to
send the request body (in the case of a request for which a body needs to be
sent; for example, a POST request).

  * 2xx indicates success of some kind
    * 200 OK  
Standard response for successful HTTP requests. The actual response will
depend on the request method used. In a GET request, the response will contain
an entity corresponding to the requested resource. In a POST request, the
response will contain an entity describing or containing the result of the
action.[8]

    * 201 Created  
The request has been fulfilled, resulting in the creation of a new
resource.[9]

    * 202 Accepted  
The request has been accepted for processing, but the processing has not been
completed. The request might or might not be eventually acted upon, and may be
disallowed when processing occurs.[10]

  * 3xx **redirects** the client to another URL
    * 300 Multiple Choices  
Indicates multiple options for the resource from which the client may choose
(via agent-driven content negotiation). For example, this code could be used
to present multiple video format options, to list files with different
filename extensions, or to suggest word-sense disambiguation.[19]

    * 303 See Other (since HTTP/1.1)  
The response to the request can be found under another URI using the GET
method. When received in response to a POST (or PUT/DELETE), the client should
presume that the server has received the data and should issue a new GET
request to the given URI.[24]

    * 307 Temporary Redirect (since HTTP/1.1)  
In this case, the request should be repeated with another URI; however, future
requests should still use the original URI. In contrast to how 302 was
historically implemented, the request method is not allowed to be changed when
reissuing the original request. For example, a POST request should be repeated
using another POST request.[28]

  * 4xx indicates an error on the client’s part
    * 400 Bad Request  
The server cannot or will not process the request due to an apparent client
error (e.g., malformed request syntax, size too large, invalid request message
framing, or deceptive request routing).[31]

    * 401 Unauthorized (RFC 7235)  
  Similar to 403 Forbidden, but specifically for use when authentication is
  required and has failed or has not yet been provided. The response must
  include a WWW-Authenticate header field containing a challenge applicable to
  the requested resource. See Basic access authentication and Digest access
  authentication.[32] 401 semantically means “unauthorised”,[33] the user does
  not have valid authentication credentials for the target resource.
  Note: Some sites incorrectly issue HTTP 401 when an IP address is banned from
  the website (usually the website domain) and that specific address is refused
  permission to access a website.[citation needed]

     * 402 Payment Required  
Reserved for future use. The original intention was that this code might be
used as part of some form of digital cash or micropayment scheme, as proposed,
for example, by GNU Taler,[34] but that has not yet happened, and this code is
not widely used. Google Developers API uses this status if a particular
developer has exceeded the daily limit on requests.[35] Sipgate uses this code
if an account does not have sufficient funds to start a call.[36] Shopify uses
this code when the store has not paid their fees and is temporarily
disabled.[37] Stripe uses this code for failed payments where parameters were
correct, for example blocked fraudulent payments.[38]

    * 403 Forbidden  
The request contained valid data and was understood by the server, but the
server is refusing action. This may be due to the user not having the
necessary permissions for a resource or needing an account of some sort, or
attempting a prohibited action (e.g. creating a duplicate record where only
one is allowed). This code is also typically used if the request provided
authentication by answering the WWW-Authenticate header field challenge, but
the server did not accept that authentication. The request should not be
repeated.

    * 404 Not Found  
The requested resource could not be found but may be available in the future.
Subsequent requests by the client are permissible.

    * 405 Method Not Allowed  
A request method is not supported for the requested resource; for example, a
GET request on a form that requires data to be presented via POST, or a PUT
request on a read-only resource.

    * 408 Request Timeout  
The server timed out waiting for the request. According to HTTP
specifications: “The client did not produce a request within the time that the
server was prepared to wait. The client MAY repeat the request without
modifications at any later time.”[41]

  * 5xx indicates an error on the server’s part
    * 500 Internal Server Error  
A generic error message, given when an **unexpected condition was
encountered** and no more specific message is suitable.

    * 501 Not Implemented  
The server either does **not recognize the request method**, or it **lacks the
ability to fulfil the request**. Usually this implies future availability
(e.g., a new feature of a web-service API.

    * 502 Bad Gateway  
The server was **acting as a gateway or proxy** and received an **invalid
response** from the upstream server.

    * 503 Service Unavailable  
The server cannot handle the request (because it is overloaded or down for
maintenance). Generally, this is a **temporary** state.

    * 504 Gateway Timeout  
The server was acting as a gateway or proxy and did not receive a timely
response from the upstream server.

    * 505 HTTP Version Not Supported  
The server does not support the HTTP protocol version used in the request.[

## ref

[https://medium.com/@maneesha.wijesinghe1/what-happens-when-you-type-an-url-
in-the-browser-and-press-enter-
bb0aa2449c1a](https://medium.com/@maneesha.wijesinghe1/what-happens-when-you-
type-an-url-in-the-browser-and-press-enter-bb0aa2449c1a)

[https://stackoverflow.com/questions/2092527/what-happens-when-you-type-in-a-
url-in-browser](https://stackoverflow.com/questions/2092527/what-happens-when-
you-type-in-a-url-in-browser)

[https://stackoverflow.com/questions/5165310/what-is-the-complete-process-
from-entering-a-url-to-the-browsers-address-bar-
to](https://stackoverflow.com/questions/5165310/what-is-the-complete-process-
from-entering-a-url-to-the-browsers-address-bar-to)

[https://geekhost.ca/supp/knowledgebase.php?action=displayarticle&id=90](https://geekhost.ca/supp/knowledgebase.php?action=displayarticle&id=90)
