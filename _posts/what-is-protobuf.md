#  What is Protobuf?

__ 发表于 2021-02-16 __ 更新于 2021-03-11

NOTICE: the protobuf **is not for humans**, serialized data is compiled bytes
and hard for the human reading. There are two ways to solve it:

  1. read strcture of proto by watching the .proto file, pay attention to keywords ‘optional’(not in **pb3**).

  2. MessageToJson
    1  
    2  
    from google.protobuf.json_format import MessageToJson  
    jsonObj = MessageToJson(pb)  

# why protobuf?

Some scenarios require **schema** (Define once, use everywhere).

【速度】

  * 编解码的方式和传统的二进制不太一样，
  * 三个部分分别是长度、key_num、value（这样编解码起来快了很多），主要节省的地方就在key不用使用字符串，同时长度是固定的，直接读就行，而不需要通过解析，比如遇到括号或者逗号这样
  * float在json中的编解码也慢（not designed for numbers）

【schema带来的】

  * easier to bind to objects；json是典型的string。

【可读性】

  * json更可读

【普适性】

pb基本使用量级是赶不上json的

[https://www.bizety.com/2018/11/12/protocol-buffers-vs-json/#:~:text=Protobuf%
20is%20easier%20to%20bind,is%20not%20designed%20for%20numbers.&text=The%20libr
ary%20implementation%20for%20Protobuf,be%20a%20faster%20format%20overall](http
s://www.bizety.com/2018/11/12/protocol-buffers-vs-json/#:~:text=Protobuf%20is%
20easier%20to%20bind,is%20not%20designed%20for%20numbers.&text=The%20library%2
0implementation%20for%20Protobuf,be%20a%20faster%20format%20overall)

### pros

think XML, but smaller, faster, and simpler(really?).

  * Performance:
    * **easier to bind to objects** and faster.
    * As JSON is textual, its **integers** and **floats** can be slow to encode and decode.
  * Smaller size(_why faster than Json?_):
    * Protobuf binary format Serialization
    * Benchmark see [faster than json - Benchmark](https://blog.usejournal.com/what-the-hell-is-protobuf-4aff084c5db4)）
  * Others:
    * RPC support

### cons(JSON can solve it)

  * JSON is widely accepted by almost all programming languages and highly popular.
  * Non-human readability
  * Data from the service is directly consumed by a web browser
  * Your server side application is written in JavaScript
  * You aren’t prepared to tie the data model to a schema
  * You don’t have the bandwidth to add another tool to your arsenal
  * The operational burden of running a different kind of network service is too great

### 优势 TODO

# protobuf有什么优势？

  0. JSON没有紧凑的动作，单个pack数据量也比较大

  1. PB编解码速度快，有schema，二进制过程进行了“紧凑”（典型就是

  2. 向前兼容（旧代码也能读新数据），当然，这需要在修改schema定义的时候，有注意事项。比如数字不能瞎改、不能删除required等  
field_tag(replace key_content) + type + length + value_content

这就意味着：

    * 可以更改key的名称（field_tag只记录了数字），那显然的，数字不能修改
    * 添加字段只能是可选的，或者具有默认值
    * repeated的设计思想在于“前后兼容性”
      * optional => repeated
      * 旧代码看新数据，只能看到最后一个元素
      * 新代码看旧数据，看到的是0/1个元素的list
  3. 向后兼容（代码通常更新最快，数据可能也会跟着更新，但是会不会有旧数据过来？比如说上游，比如说协调还没有完全一致）

  4. 支持的数据格式也比较多，JSON对数字（整数、浮点数）支持不好，编解码速度也会比较慢

[https://www.bizety.com/2018/11/12/protocol-buffers-vs-json/#:~:text=Protobuf%
20is%20easier%20to%20bind,is%20not%20designed%20for%20numbers.&text=The%20libr
ary%20implementation%20for%20Protobuf,be%20a%20faster%20format%20overall](http
s://www.bizety.com/2018/11/12/protocol-buffers-vs-json/#:~:text=Protobuf%20is%
20easier%20to%20bind,is%20not%20designed%20for%20numbers.&text=The%20library%2
0implementation%20for%20Protobuf,be%20a%20faster%20format%20overall)

[https://vonng.gitbooks.io/ddia-
cn/content/ch4.html](https://vonng.gitbooks.io/ddia-cn/content/ch4.html)

# how to use

    1  
    ls *.proto | awk '{print "protoc -I=. --python_out=. ./"$0}' | sh  

## proto message parse

### recursive resolution based on DESCRIPTOR.fields

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
    def dump_object(obj):  
        for descriptor in obj.DESCRIPTOR.fields:  
            value = getattr(obj, descriptor.name)  
            if descriptor.type == descriptor.TYPE_MESSAGE:  
                if descriptor.label == descriptor.LABEL_REPEATED:  
                    map(dump_object, value)  
                else:  
                    dump_object(value)  
            elif descriptor.type == descriptor.TYPE_ENUM:  
                pass  
            else:  
                if descriptor.type == descriptor.TYPE_BYTES:  
                    # TODO 转码  
                    pass  
                else:  
                    pass  

### iterative resolution based on proto schema

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
    def parse_general_field(pb):  
        if len(pb.general_ad_field.ad_packs) == 0:  
            return []  
        product_id = pb.product_id  
        sub_app_id = pb.sub_app_id  
        arr_material = []  
        for ad_pack in pb.general_ad_field.ad_packs:  
            user_id = str(get_user_id(ad_pack))  
            for ad_elem in ad_pack.ad_elems_array:  
                # 过滤非增量  
                if ad_elem.element_result.audit_channel_type != ad_review_util_pb2.kAd_AutoIncreaseAudit:  
                   continue  
                # 过滤非通过  
                if ad_elem.element_result.review_result == ad_review_util_pb2.kAd_APPROVED:  
                   continue  
                ad_id = get_ad_id(ad_elem)  
                # 遍历不同类型的广告内容  
                ad_content_fields = [  
                    "word_text_cont_array", "idea_text_cont_array",  
                ]  
                for ad_content_field in ad_content_fields:  
                    ad_contents = getattr(ad_elem, ad_content_field)  
                    # 遍历广告内容  
                    text_cont_list = []  
                    text_type = None  
                    for ad_content in ad_contents:  
                        (ad_type, ad_cont) = get_ad_type_and_cont(ad_content, is_general=True)  
                        if ad_type in ('word', 'idea'):  
                            text_cont_list.append(ad_cont)  
                            text_type = ad_type  
                    if len(text_cont_list) != 0:  
                        arr_material.append((product_id, user_id, text_type, '  '.join(text_cont_list)))  
        return arr_material  

### run demo

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
    # -*- coding: utf-8 -*-  
    import sys  
    from proto_pb import ad_review_service_pb2  
    from proto_pb import ad_review_util_pb2  
    import hdfs_seq_file_reader  
    def do_item(key, value):  
        """ do_item  
            key: pipelet-point-seq, value:...  
            return: pb  
        """  
        ads = ad_review_service_pb2.AdReviewService()  
        ads.ParseFromString(value)  
        print("{}".format(ads))  
        return ads  
    if __name__ == '__main__':  
        input_path = sys.argv[1]  
        fin = hdfs_seq_file_reader.HdfsSeqfileReader(input_path)  
        while (True):  
            key, value = fin.get_next()  
            if (key is None and value is None):  
                break  
            try:  
                ret = do_item(key, value)  
            except Exception as ex:  
                print("key:{}, ex:{}".format(key, ex))  

### parse HdfsSeqfile

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
    # -*- coding: utf-8 -*-  
    import sys  
    import struct  
    class HdfsSeqfileReader(object):  
        """ HdfsSeqfileReader  
        """  
        def __init__(self, fpath):  
            self.fn = fpath  
            self.fin = open(self.fn)  
        def get_next(self):  
            """ get_next  
                Return:  
                    (Key, Value)  
            """  
            key_len_byte = self.fin.read(4)  
            if not key_len_byte:  
                return (None, None)  
            key_len = struct.unpack('<I', key_len_byte)[0]  
            key_byte = self.fin.read(key_len)  
            key_fm = '>%ds' % (key_len)  
            key = struct.unpack(key_fm, key_byte)[0]  
            val_len_byte = self.fin.read(4)  
            val_len = struct.unpack('<I', val_len_byte)[0]  
            val_byte = self.fin.read(val_len)  
            val_fm = '>%ds' % (val_len)  
            val = struct.unpack(val_fm, val_byte)[0]  
            return (key, val)  

### a example of .proto

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
    73  
    74  
    75  
    76  
    77  
    78  
    79  
    80  
    81  
    82  
    83  
    84  
    85  
    86  
    87  
    88  
    89  
    90  
    91  
    92  
    93  
    94  
    95  
    96  
    97  
    98  
    99  
    100  
    101  
    102  
    103  
    104  
    105  
    106  
    107  
    108  
    109  
    110  
    111  
    112  
    113  
    114  
    115  
    116  
    117  
    118  
    119  
    120  
    121  
    122  
    123  
    124  
    125  
    126  
    127  
    128  
    129  
    130  
    131  
    132  
    133  
    134  
    135  
    136  
    137  
    138  
    139  
    140  
    141  
    142  
    143  
    144  
    145  
    146  
    147  
    148  
    149  
    150  
    151  
    152  
    153  
    154  
    155  
    156  
    157  
    158  
    159  
    160  
    161  
    162  
    163  
    164  
    165  
    166  
    167  
    168  
    169  
    170  
    171  
    172  
    173  
    174  
    175  
    176  
    177  
    178  
    179  
    180  
    181  
    182  
    183  
    184  
    185  
    186  
    187  
    188  
    189  
    190  
    191  
    192  
    193  
    194  
    195  
    196  
    197  
    198  
    199  
    200  
    201  
    202  
    203  
    204  
    205  
    206  
    207  
    208  
    209  
    210  
    211  
    212  
    213  
    214  
    215  
    216  
    217  
    218  
    219  
    220  
    221  
    222  
    223  
    224  
    225  
    226  
    227  
    228  
    229  
    230  
    231  
    232  
    233  
    234  
    235  
    236  
    237  
    238  
    239  
    240  
    241  
    242  
    // @brief 物料接口   
    package aka;  
    import "audit_exclusive_field.proto";  
    import "ad_review_util.proto";  
    // 风控使用java包  
    option cc_generic_services = true;  
    option py_generic_services = true;  
    option java_multiple_files = false;  
    option java_package = "com.baidu.fengkong.proto";  
    option java_outer_classname = "GeneralAdFieldClass";  
    // 物料域  
    message GeneralAdField {  
        repeated GeneralAdPack ad_packs                = 1;   // 审核广告体包，审核结果在相应result字段中  
    }  
    // @brief 广告包体  
    message GeneralAdPack {  
        optional uint64 action_id                          = 1;   // 本次审核请求唯一标识，相当于logid，应用方提供  
        repeated IdInfo id_infos                           = 2;   // 广告级以上的id信息  
        repeated AdElem ad_elems_array                     = 3;   // 广告元素列表  
        optional bytes app_pack_trans_field                = 4;   // 应用方透传的域，审核方无需关心直接透传  
        optional AuditPackExclusiveField audit_pack_field  = 5;   // 审核专用内部字段,应用方无需关注   
        optional uint32 data_stream_type                   = 6[default = 0];  // 参考ad_review_util下的DataStreamType  
    }  
    // @brief id类型  
    enum IdType {   
        kPlanid                                         = 0;  
        kGroupid                                        = 1;  
        kUnitid                                         = 2;  
        kWinfoid                                        = 3;  
        kIdeaid                                         = 4;  
        kUserid                                         = 5;  
        kMcid                                           = 6;  
        kProviderid                                     = 7;  
        kBrandid                                        = 8;  
        kMtid                                           = 9;//展现样式id，若无展现样式id，填0  
    }  
    // @brief id包信息  
    message IdInfo {  
        required IdType id_type                         = 1;   // id的类型  
        required uint64 id                              = 2;   // 具体的id值  
        optional bytes id_content                       = 3;   // id描述或字段信息  
    }   
    // @brief 具体广告元素  
    message AdElem {  
        optional uint32 ad_version                      = 1;   // 广告版本，防止审核结果覆盖  
        optional AdType ad_type                         = 2;  // 广告类型  
        repeated IdInfo ad_ids                          = 3;   // 唯一标示一条广告的id组合  
        optional ElemResult element_result              = 4;   // 广告元素审核结果   
        // 具体的广告内容,审核优先级word > idea > url > media  
        repeated AdContent word_text_cont_array         = 5; // 因为审核策略可能不同,关键词和创意分开  
        repeated AdContent idea_text_cont_array         = 6;  
        repeated AdContent url_cont_array               = 7;  
        repeated BdMediaCont bdmedia_cont               = 8;   // 北斗/BES广告媒体内容  
        optional uint32 ad_add_time                     = 9;   // 广告添加时间   
        optional uint32 ad_mod_time                     = 10;   // 广告修改时间  
        optional bytes app_elem_trans_field             = 11;   // 应用方透传的域，审核方无需关注  
        optional AuditElemExclusiveField audit_elem_excl_field = 12;   // 审核专属域,应用方无需关注   
        repeated QsMediaCont qsmedia_cont               = 13;   // 移动DSP(秋实)广告媒体内容  
        optional QsCreativeCont qscreative_cont         = 14;   // 移动DSP(秋实)广告创意内容  
        repeated MediaCont media_cont                   = 15;   // 通用广告媒体内容(除秋实北斗特定产品线,多媒体内容都此字段)  
        optional CreativeAttribute creative_attr        = 16;   // 0-DSP creative属性信息  
        optional uint32 restrict_tag                    = 17;  // 医疗限制标签，枚举RestrictTagType  
        optional bool is_new_reason                        = 18[default = false]; // 业务方是否使用新拒绝理由  
    }   
    // @brief 单个广告元素内容  
    message AdContent {  
        required bytes cont                             = 1;   // 广告元素内容  
        optional bool is_need_audit                     = 2[default = true]; // 是否需要审核，  
                                                                             // 默认为均需要审核  
        optional uint64 rev_options                     = 3;  // 审核选项,选填  
        optional AdElemType type                        = 4;  // 元素内容类型,选填    
        optional bool is_sublink                        = 5[default = false];  // 元素内容是否属于子链  
        optional uint32 sublink_id                      = 6;  // 所属的子链id  
        optional bool is_need_human_audit               = 7[default = true]; // 是否需要人工审核，若为false，人工审核无需审核  
                                                                             // 默认为均需要人工审核  
        optional bytes cont_add_info                    = 8;  // 广告元素内容附加信息  
        optional uint32 ad_cont_id                      = 9;  // 广告元素内容id  
        optional bytes detail_info                      = 10; // 审核内部附加信息，如url pattern id.   
        optional uint32 ad_cont_level                   = 11; // URL类目级别，主要针对电商类物料，落地页审参照对该字段进行审核流量控制  
        optional bytes cont_desc                        = 12; // 业务方字段名描述，例如"标题"  
    }  
    message BdMediaCont {  
        optional bytes cont                             = 1;   // 广告元素内容  
        optional bool is_need_audit                     = 2[default = true];  
        optional AdElemType type                        = 3;  // 元素内容类型    
        optional uint32 width                           = 4;  // 图片等的宽    
        optional uint32 height                          = 5;  //    
        optional bool is_smart                          = 6;  // 是否为智能创意   
        optional uint64 template_id                     = 7;  //   
        optional uint32 promotion_type                  = 8;  //   
        optional uint64 advertiser_id                   = 9;  //   
        optional uint64 ori_advertiser_id               = 10; //   
        optional uint64 mc_media_id                     = 11; //   
        optional uint64 mc_version_id                   = 12; //    
        optional uint32 category_id                     = 13; //   
        optional uint32 dsp_type                        = 14; //   
        optional uint64 unit_tag                        = 15; // 标注  
        optional uint32 trade_id                        = 16; // 行业id  
        optional bool trade_modified                    = 17[default = false]; // 行业id是否修改  
        optional bool tag_modified                      = 18[default = false]; // 标注是否修改  
        optional bytes media_src_url                    = 19; // 媒体的url  
        optional bytes media_detail_infos               = 20; //flash解析json串  
        optional uint64 creative_id                     = 21; //   
        optional uint64 ori_creative_id                 = 22; //   
        optional uint64 admaker_template_id             = 23 [default = 0]; // admaker模板id  
        optional uint64 mc_id                           = 24; // BES物料mcid  
        optional bytes media_murmur64                   = 25; // murmur64十进制数的定长字符串(20个字符)  
    }  
    message QsMediaCont {  
        optional bytes cont                             = 1;  // 广告元素内容  
        optional bool is_need_audit                     = 2[default = true];  
        optional AdElemType type                        = 3;  // 元素内容类型  
        optional bytes media_src_url                    = 4;  // 媒体的url  
        optional uint32 width                           = 5;  // 图片、视频、富媒体等的宽度  
        optional uint32 height                          = 6;  // 图片、视频、富媒体等的高度  
        optional bytes media_murmur64                   = 7; // murmur64十进制数的定长字符串(20个字符)  
    }  
    message QsCreativeCont {  
        optional uint32 promotion_type                  = 1;  // 广告推广类型，取值AdPromotionType  
        optional uint32 trade_id                        = 2;  // 行业id  
        optional bytes logo_url                         = 3;  // logo访问链接  
        optional bytes app_url                          = 4;  // app下载链接  
        optional bool has_indicator_btn                 = 5;  // 是否有指示按钮  
        optional bytes task_desc                        = 6;  // 积分墙下载任务描述  
        optional bytes name                             = 7;  // 名称（只有信息流使用了）  
        optional bytes app_data                         = 8;  // app信息json串  
        optional bytes other_data                       = 9;  // 创意其他信息json串  
        optional uint32 ad_flow_type                    = 10; // 广告流量类型，取值AdFlowType  
    }  
    message MediaCont {  
        optional bytes cont                             = 1;  // 广告元素内容  
        optional bool is_need_audit                     = 2[default = true];  
        optional AdElemType type                        = 3;  // 元素内容类型  
        optional bytes media_src_url                    = 4;  // 媒体的url  
        optional uint32 width                           = 5;  // 图片、视频、富媒体等的宽度  
        optional uint32 height                          = 6;  // 图片、视频、富媒体等的高度  
        optional bool is_sublink                        = 7[default = false];  // 元素内容是否属于子链  
        optional uint32 sublink_id                      = 8;  // 所属的子链id  
        optional bytes cont_add_info                    = 9;  // 广告元素内容附加信息  
        optional uint32 ad_cont_id                      = 10; // 广告元素内容id  
        optional uint64 media_id                        = 11; // ubmc多媒体id  
        enum MediaSourceType {  
            kSource_LOCAL     = 1;  // 本地上传  
            kSource_RAINBOW   = 2;  // 霓裳导入  
            kSource_MIGRATION = 3;  // 数据迁移  
            kSource_SMART     = 4;  // 智能创意  
        }  
        optional MediaSourceType media_src              = 12; // 多媒体来源  
        optional bytes media_detail_infos               = 13; // media解析json串  
        optional bytes media_md5value                   = 14; // media的md5值  
        optional bytes media_murmur64                   = 15; // murmur64十进制数的定长字符串(20个字符)  
        optional bytes video_detail_infos               = 16; // video解析信息  
        repeated Frame video_keyframe                   = 17; // 抽取的视频帧信息  
        optional bool is_gif                            = 18[default = false];  // 该图片是否是gif图  
        optional bytes video_des_info                   = 19;  // 视频综合性描述  
        optional bytes audio_risk_info                  = 20;  // 音频风险信息  
        optional bytes cont_desc                        = 21; // 业务方字段名描述,例如"封面图"  
    }  
    message CreativeAttribute {  
        enum DeviceType {  
            kDevice_PC        = 1;  // PC  
            kDevice_MOBILE    = 2;  // 移动  
            kDevice_PC_MOBILE = 3;  // 整合营销  
        }  
        enum ActionType {  
            kAction_NONE      = 1;  // 无交互动作  
            kAction_MESSAGE   = 2;  // 短信  
            kAction_FORWORD   = 3;  // 跳转  
            kAction_PHONE     = 4;  // 电话  
        }  
        optional uint32 creative_template_id            = 1;  // 创意模板id  
        optional DeviceType device_type                 = 2;  // 设备类型  
        optional ActionType action_type                 = 3;  // 交互动作类型  
        optional bytes pc_click_link                    = 4;  // pc点击链接（设备类型为移动时无效，为PC或整合营销时必填）  
        optional bytes mobile_click_link                = 5;  // 移动点击链接（设备类型为PC时无效，为移动时必填，为整合营销时选填）  
        optional bytes phone_number                     = 6;  // 电话号码  
        optional bytes message_number                   = 7;  // 短信号码  
        optional bytes message_content                  = 8;  // 短信内容  
        optional uint64 mc_id                           = 9;  // 物料mcid  
        optional uint64 mc_version                      = 10; // 物料version  
        optional uint32 trade_id                        = 11; // 行业id  
    }  
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++  
    // @brief 审核结果接口  
    // @brief 广告元素审核结果  
    message ElemResult {  
        optional ReviewResult review_result             = 1[default = kAd_APPROVED];   // 审核结果  
        repeated ResAttribute res_attribute             = 2;   // 结果属性  
        optional uint32 audit_time                      = 3;   // 审核时间  
        optional uint64 audit_user                      = 4;   // 审核员id  
        // 下面字段应用方无需关注  
        optional AuditElemResExclusiveField audit_elem_res_field = 5;  
        optional AuditType audit_type                   = 6;   // 区分网盟物料一审二审  
        optional bool result_modified                   = 7[default = true];   // 网盟审核结果是否修改(一审:true 二审:true/false)  
        optional uint32 trade_id                        = 8;   // 行业id（若行业id修改，填写该字段为新值）  
        optional bool is_need_write                     = 9[default = true];   // 审核结果是否需要写库  
        optional AuditChannelType audit_channel_type    = 10[default = kAd_AutoIncreaseAudit]; //审核通道    
        optional uint32 lp_rsnid_mask                   = 11[default = 0];   // lp db rsnid mask  
        optional uint32 text_rsnid_mask                 = 12[default = 0];  // text db rsnid mask,包含机器文本与人工(文本)  
        optional uint32 guidance_result                 = 13[default = 2]; // 审核建议结果, 2:通过;4:违规;3:打不开;9:关联违规;  
        optional bytes guidance_msg                     = 14; // 审核建议操作(可传json)  
        // @brief 审核员账户体系类型  
        enum AuditUserType {  
            kUc            = 1;  // uc账户体系  
            kUuap          = 2;  // uuap账户体系  
            kPassport      = 3;  // passport账户体系  
        }  
        optional AuditUserType audit_user_type          = 15[default = kUc]; // 审核员id所属账户体系类型, 1:uc;2:uuap;3:passport;  
        optional bytes risk_infos                       = 16; // 风险信息(json格式)  
        repeated StrategyAttribute strategy_attribute   = 17; // 策略属性  
        optional uint64 dep_sevice_code                 = 18[default = 0]; //附加外部服务状态  
        optional bool is_secure                         = 19; // 是否为安全库物料  
        optional bytes whole_reason                     = 20; // 风控拼接的拒绝理由  
        optional uint32 audit_piling                    = 21[default = 0]; // 默认为0，审核打桩为1  
    }  
    // @brief 审核结果属性    
    message ResAttribute {  
        optional uint32 rsnid                                = 1;   // 拒绝理由id  
        optional bytes reason                                = 2;   // 拒绝理由字面  
        optional uint32 ad_cont_id                           = 3;   // 拒绝理由对应的广告元素内容id  
        optional AdDisapproveReasonIdCategory rsnid_category = 4;   // 拒绝理由类别  
        optional uint32 auditor_rsnid                        = 5;   // 审核内部拒绝理由id，取值AdDisapproveReasonId  
        repeated RiskTag risk_tag                            = 6;  
        optional bytes label                                 = 7;  // 人工标结果    
        optional bytes remark                                = 8;  // 人工备注  
        optional AdElemType type                             = 9;  // 拒绝元素内容类型,选填  
        optional uint64 ad_id                                = 10;  // 拒绝物料id,(废弃)  
    }  
    // @brief 策略属性  
    message StrategyAttribute {  
        optional uint32 ad_cont_id                = 1; // 策略属性对应的广告元素内容id  
        repeated RiskTag risk_tag                 = 2;  
    }  
    //@brief 视频帧属性，业务方无需关注  
    message Frame {  
        required bytes frame_url               = 1; //视频帧url  
        optional bytes image_tag               = 2; //视频单帧标签，人工显示  
        optional bytes cont_add_info           = 3; //附加字段  
        optional uint64 pts                    = 4; //Presentation Time Stamp, 展现时间戳(ms)  
        optional bytes reason                  = 5; //视频单帧拒绝理由  

# References

  * [https://codeclimate.com/blog/choose-protocol-buffers/](https://codeclimate.com/blog/choose-protocol-buffers/)
