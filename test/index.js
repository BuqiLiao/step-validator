import URL from 'url-parse'
import { isIP, inRange } from "range_check";
import { isValidString } from "../dist/index.js";

// // 示例 URL 和配置
// const url = "http://example.com/";
// const config = {
//   protocol_config: {
//     required: false
//   },
//   host_config: {
//     required: false,
//     blacklist: {
//       contains: [".."],
//       end_with: ["/"]
//     }
//   },
//   query_key_config: {
//     allowed: false
//   },
//   fragment_config: {
//     allowed: false
//   }
// };

// const result = isValidUrl(url, config);
// console.log(
//   isValidString("123", {
//     required: true,
//     whitelist: {
//       values: ["1233", "456"]
//     },
//     error_label: "String1",
//     error_messages: {
//       typeError: "Type error message"
//     }
//   })
// );
// console.log(result);

console.log(new URL("http://example.com/?a=1&b=2&c=3",true));

console.log(inRange('192.168.1.1', ['10.0.0.0/0', '193.0.0.0/0']))
console.log(inRange('192.14.1.1',['10.0.0.0/0','192.14.1.1/6']))


